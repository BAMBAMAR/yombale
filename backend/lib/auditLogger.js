const { pool } = require('../models/db');

async function enregistrerAuditLog(boutiqueId, utilisateurId, auteurNom, typeAction, description, metadonnees = {}, req = null) {
  if (!boutiqueId) return;
  try {
    const uid = utilisateurId || (req?.user?.userId) || null;
    let nom = auteurNom;

    // Si le nom est générique ou non renseigné et qu'on a un ID utilisateur, récupérer le vrai nom/email dans la BDD
    if ((!nom || nom === 'Marchand' || nom === 'Système' || nom === 'Admin') && uid) {
      try {
        const uRes = await pool.query(
          `SELECT prenom, nom, email FROM utilisateurs WHERE id = $1`,
          [uid]
        );
        if (uRes.rows[0]) {
          const u = uRes.rows[0];
          const nomComplet = `${u.prenom || ''} ${u.nom || ''}`.trim();
          nom = nomComplet || u.email || 'Marchand';
        }
      } catch (uErr) {}
    }

    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() : null;

    await pool.query(
      `INSERT INTO boutique_logs (boutique_id, utilisateur_id, auteur_nom, type_action, description, metadonnees, ip_adresse)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [boutiqueId, uid, nom || 'Système', typeAction, description, JSON.stringify(metadonnees), ip]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERR]', err);
  }
}

module.exports = { enregistrerAuditLog };
