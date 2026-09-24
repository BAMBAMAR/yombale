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

    const [pmRes, abmtRes, ventesRes, cmdRes] = await Promise.all([
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
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE ${dateFilter}) AS total_commandes,
          COUNT(*) FILTER (WHERE paiement_recu = TRUE AND ${dateFilter}) AS commandes_payees,
          COALESCE(SUM(montant_total) FILTER (WHERE paiement_recu = TRUE AND ${dateFilter}), 0) AS montant_commandes_payees,
          COALESCE(SUM(montant_total) FILTER (WHERE (paiement_recu = TRUE OR statut IN ('payee', 'livree')) AND methode_paiement ILIKE '%wave%' AND ${dateFilter}), 0) AS en_ligne_wave,
          COALESCE(SUM(montant_total) FILTER (WHERE (paiement_recu = TRUE OR statut IN ('payee', 'livree')) AND methode_paiement ILIKE '%orange%' AND ${dateFilter}), 0) AS en_ligne_orange,
          COALESCE(SUM(montant_total) FILTER (WHERE (paiement_recu = TRUE OR statut IN ('payee', 'livree')) AND (methode_paiement ILIKE '%stripe%' OR methode_paiement ILIKE '%carte%') AND ${dateFilter}), 0) AS en_ligne_carte
        FROM commandes_boutique
      `).catch(() => ({ rows: [{}] })),
    ]);

    const vVolume = ventesRes.rows[0] || {};
    const cVolume = cmdRes.rows[0] || {};

    const combinedMethodes = {
      total_wave: Number(vVolume.total_wave || 0) + Number(cVolume.en_ligne_wave || 0),
      total_orange: Number(vVolume.total_orange || 0) + Number(cVolume.en_ligne_orange || 0),
      total_cash: Number(vVolume.total_cash || 0),
      total_autres: Number(vVolume.total_autres || 0) + Number(cVolume.en_ligne_carte || 0),
      pos_wave: Number(vVolume.total_wave || 0),
      en_ligne_wave: Number(cVolume.en_ligne_wave || 0),
      pos_orange: Number(vVolume.total_orange || 0),
      en_ligne_orange: Number(cVolume.en_ligne_orange || 0),
    };

    res.json({
      success: true,
      stats: {
        manuels: pmRes.rows[0],
        abonnements: abmtRes.rows[0],
        methodesVolume: combinedMethodes,
        commandesEnLigne: cVolume,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/paiements/flux — Journal consolidé des transactions financières
router.get('/flux', async (req, res) => {
  try {
    const { q, statut, methode, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const conditions = [];
    const values = [];
    let i = 1;

    if (statut && statut !== 'tous') {
      conditions.push(`statut = $${i++}`);
      values.push(statut);
    }
    if (methode && methode !== 'tous') {
      conditions.push(`methode = $${i++}`);
      values.push(methode);
    }
    if (q && q.trim()) {
      conditions.push(`(reference ILIKE $${i} OR client ILIKE $${i} OR source ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const baseUnionSql = `
      SELECT 
        'manuel_' || pm.id::text AS id,
        pm.reference,
        pm.created_at AS date,
        LOWER(pm.methode) AS methode,
        'Abonnement SaaS' AS source,
        pm.montant::numeric AS montant,
        pm.statut,
        COALESCE(u.nom, pm.telephone_expediteur, 'Utilisateur') AS client
      FROM paiements_manuels pm
      LEFT JOIN utilisateurs u ON u.id = pm.utilisateur_id

      UNION ALL

      SELECT
        'cmd_' || cb.id::text AS id,
        cb.reference,
        cb.created_at AS date,
        CASE 
          WHEN cb.methode_paiement ILIKE '%wave%' THEN 'wave'
          WHEN cb.methode_paiement ILIKE '%orange%' THEN 'orange'
          WHEN cb.methode_paiement IN ('cash', 'especes') THEN 'cash'
          ELSE COALESCE(cb.methode_paiement, 'en_ligne')
        END AS methode,
        COALESCE(b.nom, 'Boutique en ligne') AS source,
        cb.montant_total::numeric AS montant,
        CASE WHEN cb.paiement_recu = TRUE OR cb.statut IN ('payee', 'livree') THEN 'succes' ELSE cb.statut END AS statut,
        COALESCE(cb.client_nom, cb.client_telephone, 'Client Web') AS client
      FROM commandes_boutique cb
      LEFT JOIN boutiques b ON b.id = cb.boutique_id
      WHERE cb.montant_total > 0
    `;

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM (${baseUnionSql}) AS all_flux ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const { rows: flux } = await pool.query(
      `SELECT * FROM (${baseUnionSql}) AS all_flux
       ${whereClause}
       ORDER BY date DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, parseInt(limit, 10), offset]
    );

    // Retourne à la fois 'flux' (pour le frontend Next.js) et 'transactions' (compatibilité)
    res.json({
      success: true,
      flux,
      transactions: flux,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
