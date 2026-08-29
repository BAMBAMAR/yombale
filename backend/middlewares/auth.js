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
  const token = req.headers['authorization']?.split(' ')[1];
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

// Protège par ADMIN_SECRET (variable d'env Railway/Render) — header X-Admin-Secret, query ?secret= ou cookie nopalou_admin
function adminSecretOnly(req, res, next) {
  let secret = req.headers['x-admin-secret'] || req.query.secret;

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

  if (process.env.ADMIN_SECRET && !secretsMatch(secret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Secret admin requis. Envoyez le header X-Admin-Secret ou le cookie nopalou_admin.' });
  }
  next();
}

module.exports = { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie, secretsMatch };