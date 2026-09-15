// backend/middlewares/tenantSecurityImmo.js
// Sécurisation multi-tenant et vérification stricte des droits d'accès Agence Immobilière (Anti-IDOR)

const { pool } = require('../models/db');

/**
 * Vérifie si un utilisateur possède ou collabore sur une agence immobilière donnée (par ID UUID ou Slug).
 * @param {string} agenceIdOrSlug - Identifiant UUID ou slug de l'agence
 * @param {string} userId - Identifiant de l'utilisateur authentifié
 * @returns {Promise<{ agence: object, membre: object|null }|null>} L'objet agence et son rôle de membre si autorisé, sinon null.
 */
async function checkAgenceAccess(agenceIdOrSlug, userId) {
  if (!agenceIdOrSlug || !userId) return null;
  const isUUID = /^[0-9a-f-]{36}$/i.test(String(agenceIdOrSlug));

  try {
    const { rows } = await pool.query(
      `SELECT a.*, 
              am.id AS membre_id, 
              am.role AS membre_role, 
              am.permissions AS membre_permissions,
              am.portefeuille AS membre_portefeuille,
              am.actif AS membre_actif
       FROM agences_immo a
       LEFT JOIN agence_membres am 
         ON a.id = am.agence_id AND am.utilisateur_id = $2 AND am.actif = true
       WHERE ${isUUID ? 'a.id = $1' : 'a.slug = $1'} 
         AND (a.utilisateur_id = $2 OR am.id IS NOT NULL)`,
      [agenceIdOrSlug, userId]
    );

    if (!rows[0]) return null;

    const row = rows[0];
    const isOwner = row.utilisateur_id === userId;

    const agence = {
      id: row.id,
      utilisateur_id: row.utilisateur_id,
      nom: row.nom,
      slug: row.slug,
      description: row.description,
      logo_url: row.logo_url,
      adresse: row.adresse,
      ville: row.ville,
      quartier: row.quartier,
      telephone: row.telephone,
      whatsapp: row.whatsapp,
      email_contact: row.email_contact,
      site_web: row.site_web,
      numero_agrement: row.numero_agrement,
      statut: row.statut,
      abonnement_plan: row.abonnement_plan,
      abonnement_fin: row.abonnement_fin,
      parametres: row.parametres || {},
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    const membre = isOwner
      ? {
          id: 'owner',
          role: 'admin_agence',
          permissions: { all: true },
          portefeuille: [],
          actif: true,
          isOwner: true
        }
      : {
          id: row.membre_id,
          role: row.membre_role || 'agent',
          permissions: row.membre_permissions || {},
          portefeuille: row.membre_portefeuille || [],
          actif: !!row.membre_actif,
          isOwner: false
        };

    return { agence, membre };
  } catch (err) {
    console.error('[TENANT_SECURITY_IMMO_ERR] Erreur vérification accès agence:', err.message);
    return null;
  }
}

/**
 * Middleware Express vérifiant que l'utilisateur connecté possède un accès valide à l'agence ciblée.
 * Optionnellement, vérifie si l'utilisateur possède un rôle spécifique (ex: 'admin_agence', 'directeur', 'gestionnaire_locatif').
 * Attache `req.agence` et `req.agenceMembre` à la requête.
 */
function requireAgenceAccess(requiredRoleOrPerm = null, paramName = 'id') {
  return async (req, res, next) => {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise pour accéder à cette agence immobilière.',
        code: 'AUTH_REQUIRED'
      });
    }

    const agenceIdOrSlug =
      req.params[paramName] ||
      req.params.slugOrId ||
      req.params.agenceId ||
      req.params.agenceSlug ||
      req.params.id ||
      req.params.slug ||
      req.body?.agence_id ||
      req.query?.agence_id;

    if (!agenceIdOrSlug) {
      return res.status(400).json({
        success: false,
        error: "Identifiant ou slug d'agence manquant dans la requête.",
        code: 'MISSING_AGENCE_ID'
      });
    }

    try {
      const access = await checkAgenceAccess(agenceIdOrSlug, req.user.userId);
      if (!access) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé : vous ne disposez pas des droits d'accès à cette agence.",
          code: 'ACCESS_DENIED_AGENCE_TENANT'
        });
      }

      const { agence, membre } = access;

      // Vérifier le statut de l'agence
      if (agence.statut === 'suspendu') {
        return res.status(403).json({
          success: false,
          error: 'Cette agence immobilière est actuellement suspendue.',
          code: 'AGENCE_SUSPENDED'
        });
      }

      // Vérification du rôle ou de la permission requise si spécifiée
      if (requiredRoleOrPerm && !membre.isOwner) {
        const userRole = membre.role;
        const rolesAutorises = Array.isArray(requiredRoleOrPerm)
          ? requiredRoleOrPerm
          : [requiredRoleOrPerm];

        // admin_agence a toujours tous les droits
        const hasRole = rolesAutorises.includes(userRole) || userRole === 'admin_agence';
        const hasExplicitPerm = membre.permissions?.[requiredRoleOrPerm] === true;

        if (!hasRole && !hasExplicitPerm) {
          return res.status(403).json({
            success: false,
            error: `Accès non autorisé : cette action requiert les privilèges [${rolesAutorises.join(', ')}].`,
            code: 'INSUFFICIENT_AGENCE_PERMISSIONS'
          });
        }
      }

      req.agence = agence;
      req.agenceMembre = membre;
      next();
    } catch (err) {
      console.error('[REQUIRE_AGENCE_ACCESS_ERR]:', err);
      return res.status(500).json({
        success: false,
        error: "Erreur interne lors de la vérification des permissions de l'agence.",
        code: 'SERVER_SECURITY_ERROR'
      });
    }
  };
}

module.exports = {
  checkAgenceAccess,
  requireAgenceAccess
};
