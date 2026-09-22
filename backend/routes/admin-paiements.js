// backend/routes/admin-paiements.js
// Centre de supervision unifié des paiements, passerelles Wave/Orange Money et reversements

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');

router.use(requireAdminAuth);

// ── GET /api/admin/paiements/stats — Synthèse globale des paiements
router.get('/stats', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
    if (period === 'today') dateFilter = "created_at::date = CURRENT_DATE";
    else if (period === '7d') dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
    else if (period === 'all') dateFilter = "1=1";

    const [pmRes, abmtRes, ventesRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total_manuels_historique,
          COUNT(*) FILTER (WHERE ${dateFilter}) AS total_manuels,
          COUNT(*) FILTER (WHERE statut = 'en_attente') AS manuels_en_attente,
          COUNT(*) FILTER (WHERE statut = 'valide' AND ${dateFilter}) AS manuels_valides,
          COALESCE(SUM(montant) FILTER (WHERE statut = 'valide' AND ${dateFilter}), 0) AS montant_valide
        FROM paiements_manuels
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE statut = 'actif' AND fin > NOW() AND is_trial = FALSE) AS abonnements_payes_periode,
          COUNT(*) FILTER (WHERE statut = 'actif' AND fin > NOW() AND is_trial = TRUE) AS abonnements_trial_periode,
          COALESCE(SUM(prix_mensuel) FILTER (WHERE statut = 'actif' AND fin > NOW() AND is_trial = FALSE), 0) AS ca_abonnements_periode
        FROM abonnements
        WHERE statut = 'actif' AND fin > NOW() AND ${dateFilter}
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement = 'wave'), 0) AS total_wave,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement IN ('orange', 'orange_money')), 0) AS total_orange,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement IN ('cash', 'especes')), 0) AS total_cash,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement NOT IN ('wave', 'orange', 'orange_money', 'cash', 'especes')), 0) AS total_autres
        FROM ventes
        WHERE archivee IS NOT TRUE AND ${dateFilter}
      `),
    ]);

    res.json({
      success: true,
      stats: {
        manuels: pmRes.rows[0],
        abonnements: abmtRes.rows[0],
        methodesVolume: ventesRes.rows[0],
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/paiements/flux — Journal consolidé des transactions financières
router.get('/flux', async (req, res) => {
  try {
    const { q, statut, methode, page = 1, limit = 40 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const conditions = [];
    const values = [];
    let i = 1;

    if (statut && statut !== 'tous') {
      conditions.push(`pm.statut = $${i++}`);
      values.push(statut);
    }
    if (methode && methode !== 'tous') {
      conditions.push(`pm.methode = $${i++}`);
      values.push(methode);
    }
    if (q && q.trim()) {
      conditions.push(`(pm.reference ILIKE $${i} OR pm.telephone_expediteur ILIKE $${i} OR u.nom ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM paiements_manuels pm JOIN utilisateurs u ON u.id = pm.utilisateur_id ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const { rows: transactions } = await pool.query(
      `SELECT pm.*, u.nom AS utilisateur_nom, u.email AS utilisateur_email
       FROM paiements_manuels pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       ${whereClause}
       ORDER BY pm.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, parseInt(limit, 10), offset]
    );

    res.json({ success: true, transactions, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
