const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../models/db');

// T-011/012/013 : jetons à usage unique (lien e-mail, reset, 2FA en attente, lien magique)
// qui ne doivent JAMAIS servir de jeton de session pour lire/muter des ressources.
// Les vraies sessions sont signées { userId } sans champ `type`.
const TYPES_JETON_NON_SESSION = new Set(['verify', 'reset', '2fa_pending', 'magic']);

function secretsMatch(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function verifierToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Fallback si cookie présent (nopalou_session, token, session)
  if (!token && req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map(c => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    token = cookies['nopalou_session'] || cookies['token'] || cookies['session'];
  }

  // Fallback si paramètre query token (ex: ouverture de PDF dans un nouvel onglet)
  if (!token && req.query?.token) {
    token = req.query.token;
  }

  if (!token) return res.status(401).json({ error: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded && TYPES_JETON_NON_SESSION.has(decoded.type)) {
      return res.status(401).json({ error: 'Ce jeton ne peut pas être utilisé comme session' });
    }

    // AN-002 : Invalidation de session si jwt_version a été incrémenté en base (ou compte suspendu)
    if (decoded.userId) {
      try {
        const { rows } = await pool.query('SELECT jwt_version, suspendu, supprime_le, anonymise_le FROM utilisateurs WHERE id=$1', [decoded.userId]);
        if (!rows.length) {
          return res.status(401).json({ error: 'Utilisateur introuvable' });
        }
        if (rows[0].suspendu) {
          return res.status(403).json({ error: 'Compte suspendu' });
        }
        // AUD-071 : une purge RGPD (anonymise_le) doit invalider immédiatement toute session déjà
        // ouverte, indépendamment de jwt_version (qui n'est pas systématiquement incrémenté par /purger).
        if (rows[0].anonymise_le) {
          return res.status(401).json({ error: 'Ce compte a été définitivement supprimé.' });
        }
        if (decoded.jwtVersion !== undefined && rows[0].jwt_version && rows[0].jwt_version !== decoded.jwtVersion) {
          return res.status(401).json({ error: 'Session révoquée, veuillez vous reconnecter' });
        }
        req.compteEnSuppression = !!rows[0].supprime_le;
      } catch (dbErr) {
        console.error('[AUTH MIDDLEWARE DB ERROR]', dbErr.message);
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Session expirée' });
    return res.status(401).json({ error: 'Token invalide' });
  }
}

function tokenOptional(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map(c => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    token = cookies['nopalou_session'] || cookies['token'] || cookies['session'];
  }

  if (!token && req.query?.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!(decoded && TYPES_JETON_NON_SESSION.has(decoded.type))) req.user = decoded;
    } catch {}
  }
  next();
}

// Bloque les actions de publication si l'email n'est pas vérifié
async function requireEmailVerifie(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT email_verifie FROM utilisateurs WHERE id=$1', [req.user.userId]);
    if (!rows[0]?.email_verifie) {
      return res.status(403).json({ error: 'Veuillez vérifier votre adresse email avant de publier. Vérifiez votre boîte mail.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Protège par session admin JWT nominative ou par ADMIN_SECRET (break-glass technique)
// SÉCURITÉ P0 : FAIL-CLOSED strict avec support RBAC multi-utilisateurs.
async function adminSecretOnly(req, res, next) {
  const { requireAdminAuth } = require('./admin-rbac');
  return requireAdminAuth(req, res, next);
}

module.exports = { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie, secretsMatch };