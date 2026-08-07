const router = require('express').Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { limiterGeneral } = require('../middlewares/rateLimit');

// POST /api/analytics/event — enregistrer un événement (vue, clic tel)
router.post('/event', limiterGeneral, async (req, res) => {
  const { type, boutique_id, annonce_id } = req.body;
  if (!type || !boutique_id) return res.status(400).json({ error: 'type et boutique_id requis' });

  const TYPES_AUTORISES = ['vue_boutique', 'clic_telephone', 'vue_annonce'];
  if (!TYPES_AUTORISES.includes(type)) return res.status(400).json({ error: 'Type invalide' });

  try {
    await pool.query(
      `INSERT INTO analytics_events (type, boutique_id, annonce_id) VALUES ($1,$2,$3)`,
      [type, boutique_id, annonce_id ?? null]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/boutique/:id — stats d'une boutique (propriétaire uniquement)
router.get('/boutique/:id', verifierToken, async (req, res) => {
  try {
    // Vérifier que la boutique appartient à l'utilisateur
    const check = await pool.query(
      'SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!check.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE type='vue_boutique')                                          AS vues_total,
        COUNT(*) FILTER (WHERE type='vue_boutique' AND created_at >= DATE_TRUNC('month', NOW())) AS vues_ce_mois,
        COUNT(*) FILTER (WHERE type='vue_boutique' AND created_at >= NOW() - INTERVAL '7 days')  AS vues_7j,
        COUNT(*) FILTER (WHERE type='clic_telephone')                                        AS clics_tel_total,
        COUNT(*) FILTER (WHERE type='clic_telephone' AND created_at >= DATE_TRUNC('month', NOW())) AS clics_tel_mois,
        COUNT(*) FILTER (WHERE type='commande_web')                                          AS commandes_web_total,
        COUNT(*) FILTER (WHERE type='vue_annonce')                                           AS vues_annonces_total,
        COUNT(*) FILTER (WHERE type='vue_annonce' AND created_at >= DATE_TRUNC('month', NOW()))   AS vues_annonces_mois
      FROM analytics_events
      WHERE boutique_id=$1
    `, [req.params.id]);

    // Commandes web & panier moyen
    const { rows: cmdRows } = await pool.query(`
      SELECT
        COALESCE(SUM(montant_total), 0) AS total_ventes,
        COALESCE(AVG(montant_total), 0) AS panier_moyen,
        COUNT(*) AS nb_commandes
      FROM commandes_boutique
      WHERE boutique_id=$1
    `, [req.params.id]);

    // Promotions & coupons
    const { rows: promoRows } = await pool.query(`
      SELECT
        COUNT(*) AS nb_promotions,
        COALESCE(SUM(fois_utilise), 0) AS utilisations_promo
      FROM boutique_promotions
      WHERE boutique_id=$1
    `, [req.params.id]);

    // Pixels & mode
    const { rows: bqRows } = await pool.query(`
      SELECT mode_fonctionnement, meta_pixel_id, tiktok_pixel_id, ga4_id
      FROM boutiques
      WHERE id=$1
    `, [req.params.id]);

    // Évolution sur 30 jours
    const { rows: historique } = await pool.query(`
      SELECT DATE(created_at) AS jour,
             COUNT(*) FILTER (WHERE type='vue_boutique')  AS vues,
             COUNT(*) FILTER (WHERE type='clic_telephone') AS clics_tel
      FROM analytics_events
      WHERE boutique_id=$1 AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY jour ORDER BY jour ASC
    `, [req.params.id]);

    res.json({
      stats: {
        ...rows[0],
        total_ventes: cmdRows[0]?.total_ventes || 0,
        panier_moyen: Math.round(cmdRows[0]?.panier_moyen || 0),
        nb_commandes: cmdRows[0]?.nb_commandes || 0,
        nb_promotions: promoRows[0]?.nb_promotions || 0,
        utilisations_promo: promoRows[0]?.utilisations_promo || 0,
        mode_fonctionnement: bqRows[0]?.mode_fonctionnement || 'hybride_pos',
        meta_pixel_active: !!bqRows[0]?.meta_pixel_id,
        tiktok_pixel_active: !!bqRows[0]?.tiktok_pixel_id,
        ga4_active: !!bqRows[0]?.ga4_id,
      },
      historique
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
