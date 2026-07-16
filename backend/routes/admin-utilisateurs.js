const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const { envoyerEmail } = require('../services/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// GET /api/admin/utilisateurs — liste paginée, recherche, filtres
router.get('/', adminSecretOnly, async (req, res) => {
  try {
    const { q, statut, type, tri = 'recent', page = 1 } = req.query;
    const limit = 30;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    const conditions = [];
    const values = [];
    let i = 1;

    if (q) {
      conditions.push(`(nom ILIKE $${i} OR email ILIKE $${i} OR telephone ILIKE $${i})`);
      values.push(`%${q}%`);
      i++;
    }
    if (statut === 'verifie')   conditions.push('email_verifie = TRUE');
    if (statut === 'non_verifie') conditions.push('email_verifie = FALSE');
    if (statut === 'suspendu') conditions.push('suspendu = TRUE');
    if (statut === 'en_grace') conditions.push('supprime_le IS NOT NULL');
    if (type === 'apporteur')  conditions.push('est_apporteur = TRUE');
    if (type === 'boutique')   conditions.push('EXISTS (SELECT 1 FROM boutiques b WHERE b.utilisateur_id = utilisateurs.id)');

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = tri === 'ancien' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM utilisateurs ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].count);

    const listRes = await pool.query(
      `SELECT id, nom, email, telephone, email_verifie, suspendu, supprime_le, created_at
       FROM utilisateurs ${whereClause} ${orderClause}
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset]
    );

    res.json({ utilisateurs: listRes.rows, total, page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/utilisateurs/:id — fiche détail
router.get('/:id', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const userRes = await pool.query(
      `SELECT id, nom, email, telephone, ville, email_verifie, suspendu, supprime_le, anonymise_le, est_apporteur, code_apporteur, created_at
       FROM utilisateurs WHERE id = $1`,
      [id]
    );
    if (!userRes.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const activiteRes = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM annonces_classifiees WHERE utilisateur_id=$1 AND supprimee=FALSE) AS nb_annonces,
        (SELECT COUNT(*) FROM annonces_immo        WHERE utilisateur_id=$1 AND supprimee=FALSE) AS nb_immo,
        EXISTS(SELECT 1 FROM boutiques WHERE utilisateur_id=$1) AS a_boutique`,
      [id]
    );

    const abonnementRes = await pool.query(
      `SELECT plan, fin FROM abonnements WHERE utilisateur_id=$1 AND statut='actif' AND fin > NOW() ORDER BY fin DESC LIMIT 1`,
      [id]
    );

    res.json({
      utilisateur: userRes.rows[0],
      activite: {
        nb_annonces: parseInt(activiteRes.rows[0].nb_annonces),
        nb_immo: parseInt(activiteRes.rows[0].nb_immo),
        a_boutique: activiteRes.rows[0].a_boutique,
        est_apporteur: userRes.rows[0].est_apporteur,
      },
      abonnement: abonnementRes.rows[0] || null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
