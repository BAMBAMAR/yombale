const { pool } = require('../models/db');

// Middleware — injecte req.abonnement (null si aucun plan actif)
// Usage : router.get('/route', verifierToken, checkAbonnement, handler)
async function checkAbonnement(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, plan, debut, fin, COALESCE(is_trial, false) AS is_trial,
              GREATEST(0, CEIL(EXTRACT(EPOCH FROM (fin - NOW())) / 86400))::int AS jours_restants
       FROM abonnements
       WHERE utilisateur_id=$1 AND statut='actif' AND fin > NOW()
       ORDER BY fin DESC LIMIT 1`,
      [req.user.userId]
    );
    if (rows[0]) {
      const row = rows[0];
      const isTrial = Boolean(row.is_trial);
      req.abonnement = {
        ...row,
        is_trial: isTrial,
        // Pendant le 1er mois gratuit, accès total à 100% des fonctionnalités (équivalent Business VIP)
        acces_total: isTrial || row.plan === 'business',
      };
    } else {
      req.abonnement = null;
    }
    next();
  } catch {
    req.abonnement = null;
    next();
  }
}

// Middleware — bloque si l'utilisateur n'a pas de plan actif
function requireAbonnement(req, res, next) {
  if (!req.abonnement) {
    return res.status(403).json({ error: 'Abonnement requis pour cette fonctionnalité', code: 'ABONNEMENT_REQUIS' });
  }
  next();
}

// Middleware — bloque si l'utilisateur n'a pas le plan 'business' ET n'est pas en essai 1er mois gratuit
function requireBusiness(req, res, next) {
  if (!req.abonnement) {
    return res.status(403).json({ error: 'Abonnement Business requis', code: 'BUSINESS_REQUIS' });
  }
  // RÈGLE D'OR : Durant le 1er mois gratuit (trial), accès total à toutes les fonctionnalités
  if (req.abonnement.is_trial || req.abonnement.acces_total || req.abonnement.plan === 'business') {
    return next();
  }
  return res.status(403).json({ error: 'Abonnement Business requis', code: 'BUSINESS_REQUIS' });
}

module.exports = { checkAbonnement, requireAbonnement, requireBusiness };

