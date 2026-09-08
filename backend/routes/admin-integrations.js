// backend/routes/admin-integrations.js
// Centre de supervision et gestion des intégrations & réseaux sociaux (Admin Nopalou)

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

router.use(adminSecretOnly);

/**
 * GET /api/admin/integrations/stats
 * Vue d'ensemble de toutes les intégrations de la plateforme
 */
router.get('/stats', async (req, res) => {
  try {
    // 1. Répartition des comptes sociaux par plateforme
    const accountsByPlatform = await pool.query(`
      SELECT
        plateforme,
        COUNT(*)::int AS total_comptes,
        COUNT(*) FILTER (WHERE statut = 'actif')::int AS comptes_actifs,
        COUNT(*) FILTER (WHERE statut != 'actif')::int AS comptes_inactifs
      FROM social_accounts
      GROUP BY plateforme
    `);

    // 2. Volume de publications sociales
    const postsStats = await pool.query(`
      SELECT
        COUNT(*)::int AS total_publications,
        COUNT(*) FILTER (WHERE visible = TRUE)::int AS publications_visibles,
        COUNT(DISTINCT boutique_id)::int AS boutiques_avec_social
      FROM social_posts
    `);

    // 3. Statut des Pixels & Outils marketing configurés dans les boutiques
    const trackingStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE meta_pixel_id IS NOT NULL AND meta_pixel_id != '')::int AS avec_meta_pixel,
        COUNT(*) FILTER (WHERE tiktok_pixel_id IS NOT NULL AND tiktok_pixel_id != '')::int AS avec_tiktok_pixel,
        COUNT(*) FILTER (WHERE ga4_id IS NOT NULL AND ga4_id != '')::int AS avec_ga4,
        COUNT(*) FILTER (WHERE whatsapp IS NOT NULL AND whatsapp != '')::int AS avec_whatsapp
      FROM boutiques
      WHERE actif = TRUE
    `);

    // 4. Feature flags liés aux intégrations
    const flagsRes = await pool.query(`
      SELECT key, label, actif
      FROM feature_flags
      WHERE key IN ('social_shop_enabled', 'instagram_sync', 'tiktok_embed', 'whatsapp_chatbot')
    `);

    // 5. Événements récents Social Commerce
    const eventsStats = await pool.query(`
      SELECT
        COUNT(*)::int AS total_events_30j,
        COUNT(*) FILTER (WHERE event_type = 'social_content_view')::int AS vues,
        COUNT(*) FILTER (WHERE event_type = 'social_product_click')::int AS clics_produit,
        COUNT(*) FILTER (WHERE event_type = 'social_add_to_cart')::int AS ajouts_panier,
        COUNT(*) FILTER (WHERE event_type = 'social_whatsapp_click')::int AS clics_whatsapp
      FROM social_analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    res.json({
      plateformes: accountsByPlatform.rows,
      publications: postsStats.rows[0] || {},
      tracking_boutiques: trackingStats.rows[0] || {},
      flags: flagsRes.rows,
      conversion_30j: eventsStats.rows[0] || {},
    });
  } catch (err) {
    console.error('[ADMIN_INTEGRATIONS_STATS_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * GET /api/admin/integrations/accounts
 * Liste complète des comptes sociaux connectés par les marchands
 */
router.get('/accounts', async (req, res) => {
  try {
    const { plateforme, statut, q, limit = 100 } = req.query;
    const params = [];
    const conditions = [];

    if (plateforme) {
      params.push(plateforme.toLowerCase());
      conditions.push(`sa.plateforme = $${params.length}`);
    }

    if (statut) {
      params.push(statut.toLowerCase());
      conditions.push(`sa.statut = $${params.length}`);
    }

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      conditions.push(`(LOWER(sa.nom_compte) LIKE $${params.length} OR LOWER(b.nom) LIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit, 10) || 100);

    const sql = `
      SELECT
        sa.id,
        sa.plateforme,
        sa.nom_compte,
        sa.profil_url,
        sa.statut,
        sa.derniere_sync_at,
        sa.created_at,
        b.id AS boutique_id,
        b.nom AS boutique_nom,
        b.slug AS boutique_slug,
        (SELECT COUNT(*)::int FROM social_posts WHERE social_account_id = sa.id) AS nb_posts
      FROM social_accounts sa
      JOIN boutiques b ON b.id = sa.boutique_id
      ${whereClause}
      ORDER BY sa.created_at DESC
      LIMIT $${params.length}
    `;

    const { rows } = await pool.query(sql, params);
    res.json({ accounts: rows });
  } catch (err) {
    console.error('[ADMIN_INTEGRATIONS_ACCOUNTS_ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement des comptes' });
  }
});

/**
 * POST /api/admin/integrations/accounts/:id/disconnect
 * Déconnexion forcée d'un compte social par l'administrateur
 */
router.post('/accounts/:id/disconnect', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE social_accounts SET statut = 'deconnecte', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Compte introuvable' });

    try {
      await enregistrerAdminLog({
        adminEmail: req.adminEmail || 'admin',
        action: 'DISCONNECT_SOCIAL_ACCOUNT',
        targetType: 'social_account',
        targetId: req.params.id,
        details: { plateforme: rows[0].plateforme, nom_compte: rows[0].nom_compte },
      });
    } catch (_) {}

    res.json({ success: true, account: rows[0] });
  } catch (err) {
    console.error('[ADMIN_DISCONNECT_SOCIAL_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

/**
 * POST /api/admin/integrations/toggle
 * Active / désactive une intégration au niveau global
 */
router.post('/toggle', async (req, res) => {
  try {
    const { key, actif } = req.body;
    if (!key) return res.status(400).json({ error: 'Clé d\'intégration requise' });

    await pool.query(
      `INSERT INTO feature_flags (key, label, actif, updated_at)
       VALUES ($1, $1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET actif = $2, updated_at = NOW()`,
      [key, Boolean(actif)]
    );

    res.json({ success: true, key, actif: Boolean(actif) });
  } catch (err) {
    console.error('[ADMIN_TOGGLE_FLAG_ERR]', err);
    res.status(500).json({ error: 'Erreur mise à jour interrupteur' });
  }
});

module.exports = router;
