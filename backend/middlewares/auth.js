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

function verifierToken(req, res, next) {
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