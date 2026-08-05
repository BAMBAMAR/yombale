const { pool } = require('../models/db');

async function enregistrerAuditLog(boutiqueId, utilisateurId, auteurNom, typeAction, description, metadonnees = {}, req = null) {
  if (!boutiqueId) return;
  try {
    const uid = utilisateurId || (req?.user?.userId) || null;
    let nom = (auteurNom && auteurNom !== 'Marchand' && auteurNom !== 'Système' && auteurNom !== 'Admin') ? auteurNom : null;

    // Récupérer le vrai nom ou email de l'utilisateur dans la table utilisateurs (colonnes: nom, email)
    if (uid && !nom) {
      try {
        const uRes = await pool.query(
          `SELECT nom, email FROM utilisateurs WHERE id = $1`,
          [uid]
        );
        if (uRes.rows[0]) {
          nom = uRes.rows[0].nom || uRes.rows[0].email || 'Marchand';
        }
      } catch (uErr) {
        console.error('[AUDIT USER LOOKUP ERR]', uErr.message);
      }
    }

    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() : null;

    await pool.query(
      `INSERT INTO boutique_logs (boutique_id, utilisateur_id, auteur_nom, type_action, description, metadonnees, ip_adresse)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [boutiqueId, uid, nom || 'Marchand', typeAction, description, JSON.stringify(metadonnees), ip]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERR]', err);
  }
}

module.exports = { enregistrerAuditLog };
