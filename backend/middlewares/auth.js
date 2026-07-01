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
  const token = authHeader && authHeader.split(' ')[1];
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

// Protège par ADMIN_SECRET (variable d'env Railway) — header X-Admin-Secret ou ?secret=
function adminSecretOnly(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (process.env.ADMIN_SECRET && !secretsMatch(secret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Secret admin requis. Envoyez le header X-Admin-Secret.' });
  }
  next();
}

module.exports = { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie, secretsMatch };