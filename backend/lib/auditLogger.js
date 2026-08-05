const { pool } = require('../models/db');

async function enregistrerAuditLog(boutiqueId, utilisateurId, auteurNom, typeAction, description, metadonnees = {}, req = null) {
  if (!boutiqueId) return;
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() : null;
    let nom = auteurNom;
    if ((!nom || nom === 'Système' || nom === 'Admin') && req && req.user) {
      nom = req.user.nom || req.user.prenom ? `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() : (req.user.email || 'Admin');
    }
    await pool.query(
      `INSERT INTO boutique_logs (boutique_id, utilisateur_id, auteur_nom, type_action, description, metadonnees, ip_adresse)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [boutiqueId, utilisateurId || (req?.user?.userId) || null, nom || 'Système', typeAction, description, JSON.stringify(metadonnees), ip]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERR]', err);
  }
}

module.exports = { enregistrerAuditLog };
