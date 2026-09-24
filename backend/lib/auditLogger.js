// backend/lib/auditLogger.js — Journalisation d'audit des actions boutique
const { pool } = require('../models/db');
const { extraireIp, resoudreAuteur } = require('./auditHelper');

async function enregistrerAuditLog(boutiqueId, utilisateurId, auteurNom, typeAction, description, metadonnees = {}, req = null) {
  if (!boutiqueId) return;
  try {
    const { uid, nom } = await resoudreAuteur(utilisateurId, auteurNom, req, 'Marchand');
    const ip = extraireIp(req);

    await pool.query(
      `INSERT INTO boutique_logs (boutique_id, utilisateur_id, auteur_nom, type_action, description, metadonnees, ip_adresse)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [boutiqueId, uid, nom, typeAction, description, JSON.stringify(metadonnees), ip]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERR]', err);
  }
}

module.exports = { enregistrerAuditLog };
