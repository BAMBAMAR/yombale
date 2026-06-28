const { pool } = require('../models/db');

// Middleware — injecte req.abonnement (null si aucun plan actif)
// Usage : router.get('/route', verifierToken, checkAbonnement, handler)
async function checkAbonnement(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT plan FROM abonnements
       WHERE utilisateur_id=$1 AND statut='actif' AND fin > NOW()
       ORDER BY fin DESC LIMIT 1`,
      [req.user.userId]
    );
    req.abonnement = rows[0] || null;
    next();
  } catch {
    req.abonnement = null;
    next();
  }
}

// Middleware — bloque si l'utilisateur n'a pas de plan actif
function requireAbonnement(req, res, next) {
  if (!req.abonnement) {
    return res.status(403).json({ error: 'Abonnement Pro ou Business requis', code: 'ABONNEMENT_REQUIS' });
  }
  next();
}

// Middleware — bloque si l'utilisateur n'a pas le plan 'business'
function requireBusiness(req, res, next) {
  if (!req.abonnement || req.abonnement.plan !== 'business') {
    return res.status(403).json({ error: 'Abonnement Business requis', code: 'BUSINESS_REQUIS' });
  }
  next();
}

module.exports = { checkAbonnement, requireAbonnement, requireBusiness };
