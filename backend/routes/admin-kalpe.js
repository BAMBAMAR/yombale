// backend/routes/admin-kalpe.js
// Console d'administration & supervision globale Sama Xaalis
const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth } = require('../middlewares/admin-rbac');

router.use(requireAdminAuth);

// ── GET /api/admin/kalpe/stats — Métriques globales Sama Xaalis
router.get('/stats', async (req, res) => {
  try {
    const [abmtRes, opsRes, dettesRes, epargneRes] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*)::int AS total_comptes,
          COUNT(*) FILTER (WHERE statut = 'actif')::int AS comptes_actifs,
          COUNT(*) FILTER (WHERE is_trial = true)::int AS comptes_essai
        FROM kalpe_abonnements
      `),
      pool.query(`
        SELECT 
          COUNT(*)::int AS nb_operations_total,
          COALESCE(SUM(montant) FILTER (WHERE direction = 'entree'), 0) AS volume_entrees_total,
          COALESCE(SUM(montant) FILTER (WHERE direction = 'sortie'), 0) AS volume_sorties_total,
          COUNT(*) FILTER (WHERE type = 'vente_express')::int AS nb_ventes_express
        FROM kalpe_operations
      `),
      pool.query(`
        SELECT 
          COUNT(*)::int AS nb_creances_total,
          COUNT(*) FILTER (WHERE statut = 'en_cours')::int AS nb_creances_actives,
          COALESCE(SUM(montant_restant) FILTER (WHERE statut = 'en_cours'), 0) AS encours_creances_a_recevoir,
          COALESCE(SUM(montant_paye), 0) AS montant_recouvre_total
        FROM kalpe_dettes
        WHERE direction = 'a_recevoir'
      `),
      pool.query(`
        SELECT 
          COUNT(*)::int AS nb_objectifs_total,
          COALESCE(SUM(montant_cible), 0) AS volume_cible_epargne,
          COALESCE(SUM(montant_actuel), 0) AS volume_actuel_epargne
        FROM kalpe_objectifs
      `),
    ]);

    res.json({
      success: true,
      stats: {
        comptes: abmtRes.rows[0] || {},
        operations: opsRes.rows[0] || {},
        dettes: dettesRes.rows[0] || {},
        epargne: epargneRes.rows[0] || {},
      },
    });
  } catch (err) {
    console.error('[ADMIN_KALPE_STATS_ERR]', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

// ── GET /api/admin/kalpe/utilisateurs — Liste des comptes Sama Xaalis avec filtres
router.get('/utilisateurs', async (req, res) => {
  try {
    const { q, statut, limit = 50, offset = 0 } = req.query;
    const conds = [];
    const params = [];

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      conds.push(`(u.nom ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.telephone ILIKE $${params.length})`);
    }

    if (statut && ['actif', 'expire', 'suspendu'].includes(statut)) {
      params.push(statut);
      conds.push(`ka.statut = $${params.length}`);
    }

    const whereClause = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : '';

    const limitVal = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offsetVal = Math.max(0, parseInt(offset, 10) || 0);
    params.push(limitVal, offsetVal);

    const query = `
      SELECT 
        u.id,
        u.nom,
        u.email,
        u.telephone,
        u.ville,
        u.created_at AS user_created_at,
        ka.statut AS kalpe_statut,
        ka.type_acces,
        ka.is_trial,
        ka.debut AS kalpe_debut,
        ka.fin AS kalpe_fin,
        (SELECT COUNT(*) FROM kalpe_operations ko WHERE ko.utilisateur_id = u.id)::int AS nb_operations,
        (SELECT COALESCE(SUM(montant), 0) FROM kalpe_operations ko WHERE ko.utilisateur_id = u.id AND ko.direction = 'entree') AS total_entrees,
        (SELECT COALESCE(SUM(montant), 0) FROM kalpe_operations ko WHERE ko.utilisateur_id = u.id AND ko.direction = 'sortie') AS total_sorties,
        (SELECT COUNT(*) FROM kalpe_dettes kd WHERE kd.utilisateur_id = u.id AND kd.statut = 'en_cours')::int AS nb_dettes_actives,
        (SELECT COALESCE(SUM(montant_restant), 0) FROM kalpe_dettes kd WHERE kd.utilisateur_id = u.id AND kd.direction = 'a_recevoir' AND kd.statut = 'en_cours') AS encours_a_recevoir,
        (SELECT COUNT(*) FROM kalpe_objectifs kog WHERE kog.utilisateur_id = u.id)::int AS nb_objectifs,
        (SELECT COALESCE(SUM(montant_actuel), 0) FROM kalpe_objectifs kog WHERE kog.utilisateur_id = u.id) AS epargne_totale
      FROM utilisateurs u
      LEFT JOIN kalpe_abonnements ka ON ka.utilisateur_id = u.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM utilisateurs u
      LEFT JOIN kalpe_abonnements ka ON ka.utilisateur_id = u.id
      ${whereClause}
    `;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      success: true,
      total: parseInt(countRes.rows[0]?.total || 0, 10),
      utilisateurs: rowsRes.rows,
    });
  } catch (err) {
    console.error('[ADMIN_KALPE_USERS_ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PATCH /api/admin/kalpe/utilisateurs/:id/statut — Gérer le statut d'accès
router.patch('/utilisateurs/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, prolonger_jours } = req.body;

    if (!['actif', 'suspendu', 'expire'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const jours = Number(prolonger_jours) || 0;

    const query = `
      INSERT INTO kalpe_abonnements (utilisateur_id, statut, fin, is_trial, updated_at)
      VALUES ($1, $2, NOW() + ($3 || ' days')::interval, false, NOW())
      ON CONFLICT (utilisateur_id) DO UPDATE SET
        statut = EXCLUDED.statut,
        fin = CASE 
          WHEN $3 > 0 THEN GREATEST(kalpe_abonnements.fin, NOW()) + ($3 || ' days')::interval
          ELSE kalpe_abonnements.fin
        END,
        updated_at = NOW()
      RETURNING *
    `;

    const r = await pool.query(query, [id, statut, jours > 0 ? jours : 30]);

    res.json({ success: true, abonnement: r.rows[0] });
  } catch (err) {
    console.error('[ADMIN_KALPE_PATCH_STATUS_ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
