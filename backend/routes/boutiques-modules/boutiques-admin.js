// backend/routes/boutiques-modules/boutiques-admin.js
const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../../middlewares/auth');
const { checkAbonnement, requireAbonnement, requireBusiness } = require('../../middlewares/checkAbonnement');
const { limiterPublication, limiterImport } = require('../../middlewares/rateLimit');
const { uploadBuffer } = require('../../services/cloudinary');
const { scrapeProductFromUrl } = require('../../services/magic-import');
const { syncProduit, deleteProduit } = require('../../services/whatsapp-catalog');
const cfg = require('../../lib/settingsCache');
const { enregistrerAuditLog } = require('../../lib/auditLogger');
const { normalizeSocialUrl } = require('../../services/social-parser');
const {
  checkBoutiqueAccess,
  checkBoutiqueQuotas,
  upload,
  uploadProduitPhotos,
  CATS,
  MAX_BOUTIQUES,
  QUOTA_PRODUITS,
  slugify,
  uniqueSlug,
} = require('./helpers');
router.get('/admin/toutes', adminSecretOnly, async (req, res) => {
  try {
    const { page, limit: queryLimit, q, plan, actif } = req.query;
    const limit = queryLimit ? Math.min(2000, Math.max(1, parseInt(queryLimit))) : 1000;
    const offset = page ? (Math.max(1, parseInt(page)) - 1) * limit : 0;

    const conditions = [];
    const values = [];
    let i = 1;

    if (q && q.trim()) {
      conditions.push(`(b.nom ILIKE $${i} OR b.slug ILIKE $${i} OR b.telephone ILIKE $${i} OR u.nom ILIKE $${i} OR u.email ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }

    if (actif !== undefined && actif !== '') {
      conditions.push(`b.actif = $${i}`);
      values.push(actif === 'true' || actif === '1');
      i++;
    }

    if (plan && plan !== 'tous') {
      conditions.push(`a.plan = $${i}`);
      values.push(plan);
      i++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM boutiques b
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       LEFT JOIN LATERAL (
         SELECT plan, fin FROM abonnements
         WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
         ORDER BY fin DESC LIMIT 1
       ) a ON true
       ${whereClause}`,
      values
    );
    const total = countRes.rows[0]?.count || 0;

    const { rows } = await pool.query(
      `SELECT b.id, b.nom, b.slug, b.description, b.categorie, b.telephone, b.whatsapp, b.adresse, b.ville,
              b.logo_url, b.actif, b.sponsorise, b.sponsor_jusqu_au, b.created_at,
              b.derniere_relance_catalogue_at, COALESCE(b.nb_relances_catalogue, 0) AS nb_relances_catalogue,
              (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) AS nb_produits,
              u.nom AS proprietaire_nom, split_part(u.nom, ' ', 1) AS proprietaire_prenom, u.email AS proprietaire_email,
              u.telephone AS proprietaire_telephone,
              a.plan AS plan_actif, a.fin AS plan_fin
       FROM boutiques b
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       LEFT JOIN LATERAL (
         SELECT plan, fin FROM abonnements
         WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
         ORDER BY fin DESC LIMIT 1
       ) a ON true
       ${whereClause}
       ORDER BY
         CASE a.plan WHEN 'business' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END ASC,
         b.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset]
    );
    res.json({ boutiques: rows, total, page: page ? parseInt(page) : 1, limit });
  } catch (err) {
    console.error('[GET_BOUTIQUES_ADMIN_TOUTES_ERR]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/admin/relance-catalogue — Envoi unitaire ou par lot de relances catalogue (admin)
router.post('/admin/relance-catalogue', adminSecretOnly, async (req, res) => {
  try {
    const { boutiqueId, boutiqueIds, messageCustom, titreCustom } = req.body || {};
    const { envoyerRelanceCatalogueBoutique, batchRelancerCatalogueBoutiques } = require('../../services/relance-catalogue');

    if (boutiqueId) {
      const result = await envoyerRelanceCatalogueBoutique(boutiqueId, { messageCustom, titreCustom });
      return res.json({ success: true, result });
    }

    if (Array.isArray(boutiqueIds) && boutiqueIds.length > 0) {
      const result = await batchRelancerCatalogueBoutiques(boutiqueIds, { messageCustom, titreCustom });
      return res.json({ success: true, ...result });
    }

    return res.status(400).json({ error: 'boutiqueId ou boutiqueIds (tableau) requis' });
  } catch (err) {
    console.error('[POST /api/boutiques/admin/relance-catalogue]', err.message);
    res.status(500).json({ error: err.message || 'Erreur lors de l\'envoi de la relance catalogue' });
  }
});

// ── GET /api/boutiques/admin/relance-catalogue/config — Configuration et statistiques de relance (admin)
router.get('/admin/relance-catalogue/config', adminSecretOnly, async (req, res) => {
  try {
    const actif = await cfg.getBool('relance_catalogue_actif', false);
    const seuil = await cfg.getNum('relance_catalogue_seuil', 1);
    const delaiHeures = await cfg.getNum('relance_catalogue_delai_heures', 24);
    const intervalleJours = await cfg.getNum('relance_catalogue_intervalle_jours', 7);
    const titre = await cfg.get('relance_catalogue_titre');
    const template = await cfg.get('relance_catalogue_template');

    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE nb_prods = 0) AS count_0,
        COUNT(*) FILTER (WHERE nb_prods = 1) AS count_1,
        COUNT(*) FILTER (WHERE nb_prods = 2) AS count_2,
        COUNT(*) FILTER (WHERE nb_prods = 3) AS count_3,
        COUNT(*) FILTER (WHERE nb_prods BETWEEN 4 AND 5) AS count_4_5,
        COUNT(*) FILTER (WHERE nb_prods > 5) AS count_plus_5,
        COUNT(*) AS total_boutiques
      FROM (
        SELECT b.id, (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) AS nb_prods
        FROM boutiques b
        WHERE b.actif = true
      ) sub
    `);

    const { recupererBoutiquesEligiblesRelance } = require('../../services/relance-catalogue');
    let boutiquesEligibles = [];
    try {
      boutiquesEligibles = await recupererBoutiquesEligiblesRelance();
    } catch (eRel) {
      console.warn('[CONFIG RELANCE] Impossible de récupérer les boutiques éligibles:', eRel.message);
    }

    res.json({
      config: {
        actif,
        seuil,
        delai_heures: delaiHeures,
        intervalle_jours: intervalleJours,
        titre,
        template,
      },
      stats: statsRes.rows[0] || {},
      boutiquesEligibles: boutiquesEligibles.map(b => ({
        id: b.id,
        nom: b.nom,
        slug: b.slug,
        nb_produits: b.nb_produits || 0,
        telephone: b.whatsapp || b.telephone || b.proprietaire_telephone || '',
        created_at: b.created_at,
        derniere_relance_catalogue_at: b.derniere_relance_catalogue_at,
        nb_relances_catalogue: b.nb_relances_catalogue || 0,
      })),
    });
  } catch (err) {
    console.error('[GET /api/boutiques/admin/relance-catalogue/config]', err.message);
    res.status(500).json({ error: 'Erreur chargement configuration relance' });
  }
});

// ── POST /api/boutiques/admin/relance-catalogue/executer-cron — Exécution manuelle immédiate du cron de relance
router.post('/admin/relance-catalogue/executer-cron', adminSecretOnly, async (req, res) => {
  try {
    const { recupererBoutiquesEligiblesRelance, batchRelancerCatalogueBoutiques } = require('../../services/relance-catalogue');
    const boutiques = await recupererBoutiquesEligiblesRelance();
    if (boutiques.length === 0) {
      return res.json({ success: true, count: 0, message: 'Aucune boutique éligible pour le moment.' });
    }
    const ids = boutiques.map(b => b.id);
    const result = await batchRelancerCatalogueBoutiques(ids);
    res.json({ success: true, count: boutiques.length, ...result });
  } catch (err) {
    console.error('[POST /api/boutiques/admin/relance-catalogue/executer-cron]', err.message);
    res.status(500).json({ error: err.message || 'Erreur lors de l\'exécution manuelle du cron' });
  }
});

// ── PUT /api/boutiques/admin/relance-catalogue/config — Mise à jour de la configuration relance (admin)
router.put('/admin/relance-catalogue/config', adminSecretOnly, async (req, res) => {
  try {
    const { actif, seuil, delai_heures, intervalle_jours, titre, template } = req.body || {};

    const updates = {};
    if (typeof actif !== 'undefined') updates.relance_catalogue_actif = String(Boolean(actif));
    if (typeof seuil !== 'undefined') updates.relance_catalogue_seuil = String(Math.max(0, parseInt(seuil, 10) || 0));
    if (typeof delai_heures !== 'undefined') updates.relance_catalogue_delai_heures = String(Math.max(1, parseInt(delai_heures, 10) || 24));
    if (typeof intervalle_jours !== 'undefined') updates.relance_catalogue_intervalle_jours = String(Math.max(1, parseInt(intervalle_jours, 10) || 7));
    if (typeof titre === 'string') updates.relance_catalogue_titre = titre.trim();
    if (typeof template === 'string') updates.relance_catalogue_template = template.trim();

    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
      await cfg.set(key, value);
    }

    res.json({ success: true, message: 'Configuration de relance catalogue mise à jour avec succès', updates });
  } catch (err) {
    console.error('[PUT /api/boutiques/admin/relance-catalogue/config]', err.message);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde de la configuration' });
  }
});

// ── GET /api/boutiques/admin/promotions — toutes les promotions de toutes les boutiques (admin)
router.get('/admin/promotions', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT bp.*, b.nom AS boutique_nom, b.slug AS boutique_slug
       FROM boutique_promotions bp
       JOIN boutiques b ON b.id = bp.boutique_id
       ORDER BY bp.created_at DESC
       LIMIT 200`
    );
    res.json({ promotions: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur chargement des promotions' });
  }
});

// ── GET /api/boutiques/admin/developer-portal — Supervision des Clés API & Webhooks (Admin)
router.get('/admin/developer-portal', adminSecretOnly, async (req, res) => {
  try {
    const keysRes = await pool.query(
      `SELECT ak.id, ak.nom, ak.key_prefix, ak.created_at, ak.last_used_at, b.id as boutique_id, b.nom as boutique_nom, b.slug as boutique_slug
       FROM boutique_api_keys ak
       JOIN boutiques b ON b.id = ak.boutique_id
       ORDER BY ak.created_at DESC
       LIMIT 200`
    );
    const webhooksRes = await pool.query(
      `SELECT wh.id, wh.url, wh.events, wh.actif, wh.created_at, b.id as boutique_id, b.nom as boutique_nom, b.slug as boutique_slug
       FROM boutique_webhooks wh
       JOIN boutiques b ON b.id = wh.boutique_id
       ORDER BY wh.created_at DESC
       LIMIT 200`
    );
    res.json({ keys: keysRes.rows, webhooks: webhooksRes.rows });
  } catch (err) {
    console.error('[GET ADMIN DEV PORTAL ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement du portail développeur admin' });
  }
});

// ── DELETE /api/boutiques/admin/api-keys/:keyId — Révocation Admin d'une clé API
router.delete('/admin/api-keys/:keyId', adminSecretOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM boutique_api_keys WHERE id = $1', [req.params.keyId]);
    res.json({ success: true, message: 'Clé API révoquée avec succès par le Superadmin.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la révocation de la clé API' });
  }
});

// ── DELETE /api/boutiques/admin/webhooks/:webhookId — Suppression Admin d'un Webhook
router.delete('/admin/webhooks/:webhookId', adminSecretOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM boutique_webhooks WHERE id = $1', [req.params.webhookId]);
    res.json({ success: true, message: 'Webhook supprimé avec succès par le Superadmin.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du webhook' });
  }
});

// ── DELETE /api/boutiques/admin/:id — Supprimer définitivement une boutique (Admin)
router.delete('/admin/:id', adminSecretOnly, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const r = await pool.query('DELETE FROM boutiques WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    res.json({ success: true, message: 'Boutique supprimée par l\'admin avec succès.' });
  } catch (err) {
    console.error('[ADMIN DELETE BOUTIQUE ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de la boutique' });
  }
});

// ── POST /api/boutiques/admin/sync-catalog — sync initiale tous les produits → Meta Commerce
router.post('/admin/sync-catalog', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT bp.*, b.slug AS boutique_slug
       FROM boutique_produits bp
       JOIN boutiques b ON b.id = bp.boutique_id
       WHERE b.actif = true`
    );
    res.json({ message: `Sync lancée pour ${rows.length} produit(s)`, total: rows.length });
    // Après la réponse, on sync sans bloquer le client
    setImmediate(async () => {
      let ok = 0, ko = 0;
      for (const p of rows) {
        try { await syncProduit(p); ok++; }
        catch { ko++; }
      }
      console.log(`[CATALOG] Sync initiale terminée — ${ok} OK, ${ko} erreurs`);
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/admin/:id — activer/désactiver/sponsoriser (admin)
router.put('/admin/:id', adminSecretOnly, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { actif, sponsorise, sponsor_jusqu_au, whatsapp_catalog_id } = req.body;
    // Build dynamic SET clause
    const sets = ['updated_at=NOW()'];
    const vals = [];
    if (actif !== undefined) { vals.push(Boolean(actif)); sets.push(`actif=$${vals.length}`); }
    if (sponsorise !== undefined) { vals.push(Boolean(sponsorise)); sets.push(`sponsorise=$${vals.length}`); }
    if (sponsor_jusqu_au !== undefined) { vals.push(sponsor_jusqu_au); sets.push(`sponsor_jusqu_au=$${vals.length}`); }
    if (whatsapp_catalog_id !== undefined) { vals.push(whatsapp_catalog_id || null); sets.push(`whatsapp_catalog_id=$${vals.length}`); }
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE boutiques SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING id`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Boutique introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/boutiques/taf-taf - Création ultra-rapide (Dropshipping / Taf Taf)
module.exports = router;
