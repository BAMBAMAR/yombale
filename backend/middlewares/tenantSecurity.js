// backend/middlewares/tenantSecurity.js
// Sécurisation multi-tenant et vérification stricte des droits d'accès boutique (Anti-IDOR)

const { pool } = require('../models/db');

/**
 * Vérifie si un utilisateur possède ou collabore sur une boutique donnée (par ID ou Slug).
 * @param {string} boutiqueIdOrSlug - Identifiant UUID ou slug de la boutique
 * @param {string|number} userId - Identifiant de l'utilisateur authentifié
 * @returns {Promise<object|null>} L'objet boutique si accès autorisé, sinon null.
 */
async function checkBoutiqueAccess(boutiqueIdOrSlug, userId) {
  if (!boutiqueIdOrSlug || !userId) return null;
  const isUUID = /^[0-9a-f-]{36}$/i.test(String(boutiqueIdOrSlug));
  try {
    const { rows } = await pool.query(
      `SELECT b.* 
       FROM boutiques b
       LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
       WHERE ${isUUID ? 'b.id = $1' : 'b.slug = $1'} AND (b.utilisateur_id = $2 OR bu.utilisateur_id = $2)`,
      [boutiqueIdOrSlug, userId]
    );
    return rows[0] || null;
  } catch (err) {
    console.error('[TENANT_SECURITY_ERR] Erreur vérification accès boutique:', err.message);
    return null;
  }
}

/**
 * Middleware Express vérifiant que l'utilisateur connecté est bien le propriétaire ou
 * un collaborateur autorisé de la boutique ciblée dans la requête.
 * Attache l'objet boutique sur `req.boutique`.
 */
function requireBoutiqueOwnership(paramName = 'id') {
  return async (req, res, next) => {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise pour gérer cette boutique.',
        code: 'AUTH_REQUIRED'
      });
    }

    const boutiqueIdOrSlug = req.params[paramName] || req.params.boutiqueId || req.params.id || req.body?.boutique_id || req.query?.boutique_id;

    if (!boutiqueIdOrSlug) {
      return res.status(400).json({
        success: false,
        error: 'Identifiant de boutique manquant dans la requête.',
        code: 'MISSING_BOUTIQUE_ID'
      });
    }

    try {
      const boutique = await checkBoutiqueAccess(boutiqueIdOrSlug, req.user.userId);
      if (!boutique) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé : vous ne disposez pas des droits requis sur cette boutique.',
          code: 'ACCESS_DENIED_TENANT'
        });
      }

      req.boutique = boutique;
      next();
    } catch (err) {
      console.error('[REQUIRE_BOUTIQUE_OWNERSHIP_ERR]:', err);
      return res.status(500).json({
        success: false,
        error: 'Erreur interne lors de la vérification des permissions boutique.',
        code: 'SERVER_SECURITY_ERROR'
      });
    }
  };
}

module.exports = {
  checkBoutiqueAccess,
  requireBoutiqueOwnership
};
