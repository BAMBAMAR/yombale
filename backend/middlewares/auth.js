const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../models/db');

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
    req.user = jwt.verify(token, process.env.JWT_SECRET);
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
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
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

// Protège par ADMIN_SECRET (variable d'env Railway/Render) — header X-Admin-Secret ou cookie nopalou_admin
// SÉCURITÉ P0 : FAIL-CLOSED strict. Si ADMIN_SECRET n'est pas configuré, rejet immédiat 500 (pas de bypass).
function adminSecretOnly(req, res, next) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || adminSecret.trim().length === 0) {
    console.error('[CRITICAL SECURITY CONFIG] ADMIN_SECRET is not configured on server.');
    return res.status(500).json({ error: 'Configuration de sécurité serveur incomplète (ADMIN_SECRET non défini).' });
  }

  let secret = req.headers['x-admin-secret'];

  // Fallback si cookie admin présent (nopalou_admin)
  if (!secret && req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map(c => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    const raw = cookies['nopalou_admin'];
    if (raw) {
      try { secret = decodeURIComponent(raw); } catch { secret = raw; }
    }
  }

  if (!secret || !secretsMatch(secret, adminSecret)) {
    return res.status(401).json({ error: 'Secret admin invalide ou absent. Header X-Admin-Secret requis.' });
  }
  next();
}

module.exports = { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie, secretsMatch };