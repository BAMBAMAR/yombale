// backend/routes/admin-pos.js
// Centre de supervision du réseau Point de Vente (POS), terminaux et caisses enregistreuses

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

router.use(requireAdminAuth);

// ── GET /api/admin/pos/stats — Synthèse globale du réseau POS
router.get('/stats', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let dateFilter = "v.created_at >= NOW() - INTERVAL '30 days'";
    if (period === 'today') dateFilter = "v.created_at::date = CURRENT_DATE";
    else if (period === '7d') dateFilter = "v.created_at >= NOW() - INTERVAL '7 days'";
    else if (period === 'all') dateFilter = "1=1";

    const [statsVentes, statsSessions, caissiersRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total_tickets,
          COALESCE(SUM(montant_total), 0) AS volume_pos_total,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement IN ('cash', 'especes')), 0) AS volume_especes,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement = 'wave'), 0) AS volume_wave,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement IN ('orange', 'orange_money')), 0) AS volume_om,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement = 'carte'), 0) AS volume_carte,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement = 'credit'), 0) AS volume_credit,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement = 'mixte'), 0) AS volume_mixte,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement = 'cheque'), 0) AS volume_cheque,
          COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement NOT IN ('cash', 'especes', 'wave', 'orange', 'orange_money', 'carte', 'credit', 'mixte', 'cheque')), 0) AS volume_autres,
          COUNT(DISTINCT boutique_id) AS boutiques_pos_actives
        FROM ventes v
        WHERE v.archivee IS NOT TRUE AND ${dateFilter}
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE statut = 'ouverte') AS sessions_ouvertes,
          COUNT(*) FILTER (WHERE statut = 'fermee' AND ecart != 0) AS clotures_avec_ecart,
          COALESCE(SUM(ABS(ecart)) FILTER (WHERE statut = 'fermee'), 0) AS total_ecarts_cumules
        FROM boutique_pos_sessions
      `),
      pool.query(`
        SELECT
          COUNT(*) AS total_caissiers,
          COUNT(*) FILTER (WHERE actif = TRUE) AS caissiers_actifs
        FROM boutique_caissiers
      `),
    ]);

    res.json({
      success: true,
      stats: {
        ventes: {
          totalTickets: parseInt(statsVentes.rows[0]?.total_tickets || 0, 10),
          volumeTotal: Number(statsVentes.rows[0]?.volume_pos_total || 0),
          volumeEspeces: Number(statsVentes.rows[0]?.volume_especes || 0),
          volumeWave: Number(statsVentes.rows[0]?.volume_wave || 0),
          volumeOrange: Number(statsVentes.rows[0]?.volume_om || 0),
          volumeCarte: Number(statsVentes.rows[0]?.volume_carte || 0),
          volumeCredit: Number(statsVentes.rows[0]?.volume_credit || 0),
          volumeMixte: Number(statsVentes.rows[0]?.volume_mixte || 0),
          volumeCheque: Number(statsVentes.rows[0]?.volume_cheque || 0),
          volumeAutres: Number(statsVentes.rows[0]?.volume_autres || 0),
          boutiquesActives: parseInt(statsVentes.rows[0]?.boutiques_pos_actives || 0, 10),
        },
        sessions: {
          ouvertes: parseInt(statsSessions.rows[0]?.sessions_ouvertes || 0, 10),
          cloturesAvecEcart: parseInt(statsSessions.rows[0]?.clotures_avec_ecart || 0, 10),
          totalEcartsCumules: Number(statsSessions.rows[0]?.total_ecarts_cumules || 0),
        },
        caissiers: {
          total: parseInt(caissiersRes.rows[0]?.total_caissiers || 0, 10),
          actifs: parseInt(caissiersRes.rows[0]?.caissiers_actifs || 0, 10),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/pos/sessions — Liste paginée des sessions de caisse
router.get('/sessions', async (req, res) => {
  try {
    const { statut, boutique_id, page = 1, limit = 30 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const conditions = [];
    const values = [];
    let i = 1;

    if (statut && statut !== 'tous') {
      conditions.push(`s.statut = $${i++}`);
      values.push(statut);
    }
    if (boutique_id) {
      conditions.push(`s.boutique_id = $${i++}`);
      values.push(boutique_id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM boutique_pos_sessions s ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const { rows: sessions } = await pool.query(
      `SELECT s.*, b.nom AS boutique_nom, b.slug AS boutique_slug, b.telephone AS boutique_tel
       FROM boutique_pos_sessions s
       JOIN boutiques b ON b.id = s.boutique_id
       ${whereClause}
       ORDER BY s.ouvert_le DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, parseInt(limit, 10), offset]
    );

    res.json({ success: true, sessions, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/pos/ventes — Journal transversal des tickets de caisse POS
router.get('/ventes', async (req, res) => {
  try {
    const { q, boutique_id, methode, page = 1, limit = 40 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const conditions = ['v.archivee IS NOT TRUE'];
    const values = [];
    let i = 1;

    if (q && q.trim()) {
      conditions.push(`(v.reference ILIKE $${i} OR v.nom_produit ILIKE $${i} OR v.client_nom ILIKE $${i} OR v.client_telephone ILIKE $${i} OR b.nom ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }
    if (boutique_id) {
      conditions.push(`v.boutique_id = $${i++}`);
      values.push(boutique_id);
    }
    if (methode && methode !== 'tous') {
      conditions.push(`v.methode_paiement = $${i++}`);
      values.push(methode);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM ventes v JOIN boutiques b ON b.id = v.boutique_id ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const { rows: ventes } = await pool.query(
      `SELECT v.*, b.nom AS boutique_nom, b.slug AS boutique_slug
       FROM ventes v
       JOIN boutiques b ON b.id = v.boutique_id
       ${whereClause}
       ORDER BY v.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, parseInt(limit, 10), offset]
    );

    res.json({ success: true, ventes, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
