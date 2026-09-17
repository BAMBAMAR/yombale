// backend/routes/admin-credits.js
// Centre de supervision du carnet de dettes, des crédits clients et des recouvrements multi-boutiques

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth } = require('../middlewares/admin-rbac');

router.use(requireAdminAuth);

// ── GET /api/admin/credits/stats — Synthèse globale de l'encours de crédit
router.get('/stats', async (req, res) => {
  try {
    const [clientsRes, plansRes, echeancesRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS nb_clients_endettes,
          COALESCE(SUM(solde), 0) AS encours_total_dettes,
          COUNT(DISTINCT boutique_id) AS nb_boutiques_crediteurs
        FROM caisse_clients_credits
        WHERE solde > 0
      `),
      pool.query(`
        SELECT
          COUNT(*) AS nb_plans_total,
          COUNT(*) FILTER (WHERE statut = 'en_cours') AS nb_plans_actifs,
          COUNT(*) FILTER (WHERE statut = 'solde') AS nb_plans_soldes,
          COALESCE(SUM(montant_total), 0) AS volume_finance_total,
          COALESCE(SUM(montant_restant) FILTER (WHERE statut = 'en_cours'), 0) AS encours_plans_actifs
        FROM caisse_credit_plans
      `),
      pool.query(`
        SELECT
          COUNT(*) AS nb_echeances_en_retard,
          COALESCE(SUM(montant_restant), 0) AS montant_retards_cumules
        FROM caisse_credit_echeances
        WHERE date_echeance < CURRENT_DATE AND statut NOT IN ('paye', 'solde') AND montant_restant > 0
      `),
    ]);

    res.json({
      success: true,
      stats: {
        encoursTotal: Number(clientsRes.rows[0]?.encours_total_dettes || 0),
        nbClientsEndettes: parseInt(clientsRes.rows[0]?.nb_clients_endettes || 0, 10),
        nbBoutiquesCrediteurs: parseInt(clientsRes.rows[0]?.nb_boutiques_crediteurs || 0, 10),
        plans: {
          total: parseInt(plansRes.rows[0]?.nb_plans_total || 0, 10),
          actifs: parseInt(plansRes.rows[0]?.nb_plans_actifs || 0, 10),
          soldes: parseInt(plansRes.rows[0]?.nb_plans_soldes || 0, 10),
          volumeFinance: Number(plansRes.rows[0]?.volume_finance_total || 0),
          encoursRestant: Number(plansRes.rows[0]?.encours_plans_actifs || 0),
        },
        retards: {
          nbEcheances: parseInt(echeancesRes.rows[0]?.nb_echeances_en_retard || 0, 10),
          montantTotal: Number(echeancesRes.rows[0]?.montant_retards_cumules || 0),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/credits/clients — Annuaire des clients à créance / dettes
router.get('/clients', async (req, res) => {
  try {
    const { q, boutique_id, page = 1, limit = 40 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const conditions = ['c.solde > 0'];
    const values = [];
    let i = 1;

    if (q && q.trim()) {
      conditions.push(`(c.nom ILIKE $${i} OR c.telephone ILIKE $${i} OR b.nom ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }
    if (boutique_id) {
      conditions.push(`c.boutique_id = $${i++}`);
      values.push(boutique_id);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM caisse_clients_credits c JOIN boutiques b ON b.id = c.boutique_id ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const { rows: clients } = await pool.query(
      `SELECT c.*, b.nom AS boutique_nom, b.slug AS boutique_slug, b.telephone AS boutique_tel
       FROM caisse_clients_credits c
       JOIN boutiques b ON b.id = c.boutique_id
       ${whereClause}
       ORDER BY c.solde DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, parseInt(limit, 10), offset]
    );

    res.json({ success: true, clients, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/credits/echeances-retard — Échéances impayées / en retard
router.get('/echeances-retard', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.id, e.plan_id, e.date_echeance, e.montant_prevu, e.montant_paye, e.montant_restant, e.statut,
             e.derniere_relance_whatsapp,
             (CURRENT_DATE - e.date_echeance::date) AS jours_retard,
             c.nom AS client_nom, c.telephone AS client_tel,
             b.nom AS boutique_nom, b.slug AS boutique_slug,
             p.reference AS plan_reference
      FROM caisse_credit_echeances e
      JOIN caisse_clients_credits c ON c.id = e.client_id
      JOIN boutiques b ON b.id = e.boutique_id
      JOIN caisse_credit_plans p ON p.id = e.plan_id
      WHERE e.date_echeance < CURRENT_DATE AND e.statut NOT IN ('paye', 'solde') AND e.montant_restant > 0
      ORDER BY e.date_echeance ASC
      LIMIT 100
    `);

    res.json({ success: true, retards: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
