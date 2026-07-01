const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const { limiterGeneral } = require('../middlewares/rateLimit');

// GET /api/click/:offreId — enregistre le clic et redirige vers le marchand
router.get('/:offreId', limiterGeneral, async (req, res) => {
  const { offreId } = req.params;

  try {
    const r = await pool.query(
      `SELECT o.url_achat, o.produit_id, o.marchand_id
       FROM offres o WHERE o.id=$1 AND o.stock=true`,
      [offreId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Offre introuvable' });

    const { url_achat, produit_id, marchand_id } = r.rows[0];

    // Vérifier que l'URL est bien https:// (évite les redirects vers des URLs malveillantes)
    if (!url_achat || !url_achat.startsWith('https://')) {
      return res.status(400).json({ error: 'URL de destination invalide' });
    }

    // Log async — ne bloque pas la redirection
    pool.query(
      `INSERT INTO clics_affiliation (offre_id, produit_id, marchand_id, url_cible, user_agent)
       VALUES ($1,$2,$3,$4,$5)`,
      [offreId, produit_id, marchand_id, url_achat, req.headers['user-agent'] ?? null]
    ).catch(() => {});

    res.redirect(302, url_achat);
  } catch (err) {
    console.error('[CLICK]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/click/stats/admin — stats clics par marchand (admin)
router.get('/stats/admin', adminSecretOnly, async (req, res) => {
  try {
    const { rows: parMarchand } = await pool.query(`
      SELECT m.nom AS marchand, COUNT(*) AS clics,
             COUNT(*) FILTER (WHERE c.created_at >= DATE_TRUNC('month', NOW())) AS clics_ce_mois,
             COUNT(*) FILTER (WHERE c.created_at >= NOW() - INTERVAL '7 days') AS clics_7j
      FROM clics_affiliation c
      JOIN marchands m ON m.id = c.marchand_id
      GROUP BY m.nom ORDER BY clics DESC
    `);

    const { rows: parJour } = await pool.query(`
      SELECT DATE(created_at) AS jour, COUNT(*) AS clics
      FROM clics_affiliation
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY jour ORDER BY jour DESC
    `);

    const { rows: total } = await pool.query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) AS ce_mois,
             COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  AS cette_semaine
      FROM clics_affiliation
    `);

    res.json({ total: total[0], par_marchand: parMarchand, par_jour: parJour });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
