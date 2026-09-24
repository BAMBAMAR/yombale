// backend/lib/auditHelper.js
// Helpers partagés pour les loggers d'audit (résolution utilisateur & extraction IP)

'use strict';

const { pool } = require('../models/db');

/**
 * Extrait l'adresse IP du client depuis la requête Express.
 * @param {object} req - Objet requête Express
 * @returns {string|null}
 */
function extraireIp(req) {
  if (!req) return null;
  const forwarded = req.headers ? req.headers['x-forwarded-for'] : null;
  const rawIp = forwarded || req.ip || req.socket?.remoteAddress || '';
  return rawIp ? rawIp.split(',')[0].trim() : null;
}

/**
 * Résout l'identifiant et le nom affichable de l'utilisateur effectuant l'action.
 * @param {string} [utilisateurId] - ID explicite de l'utilisateur
 * @param {string} [auteurNom] - Nom explicite fourni
 * @param {object} [req] - Objet requête Express
 * @param {string} [defaultNom='Utilisateur'] - Nom de repli
 * @returns {Promise<{ uid: string|null, nom: string }>}
 */
async function resoudreAuteur(utilisateurId, auteurNom, req = null, defaultNom = 'Utilisateur') {
  const uid = utilisateurId || req?.user?.userId || req?.user?.id || null;
  const isGeneric = !auteurNom || ['Marchand', 'Agent', 'Système', 'Admin', 'Utilisateur'].includes(auteurNom);
  let nom = !isGeneric ? auteurNom : null;

  if (uid && !nom) {
    try {
      const { rows } = await pool.query(
        'SELECT nom, prenom, email FROM utilisateurs WHERE id = $1',
        [uid]
      );
      if (rows[0]) {
        const u = rows[0];
        const nomComplet = [u.prenom, u.nom].filter(Boolean).join(' ').trim();
        nom = nomComplet || u.email || defaultNom;
      }
    } catch (err) {
      console.warn('[AUDIT USER LOOKUP WARN]', err.message);
    }
  }

  return {
    uid,
    nom: nom || defaultNom,
  };
}

module.exports = {
  extraireIp,
  resoudreAuteur,
};
