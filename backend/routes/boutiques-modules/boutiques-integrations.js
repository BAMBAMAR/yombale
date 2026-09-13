// backend/routes/boutiques-modules/boutiques-integrations.js
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
router.put('/:id/pixels', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { meta_pixel_id, tiktok_pixel_id, ga4_id } = req.body;

    await pool.query(
      `UPDATE boutiques
       SET meta_pixel_id = $1, tiktok_pixel_id = $2, ga4_id = $3, updated_at = NOW()
       WHERE id = $4`,
      [
        meta_pixel_id?.trim() || null,
        tiktok_pixel_id?.trim() || null,
        ga4_id?.trim() || null,
        bq.id
      ]
    );

    res.json({
      success: true,
      pixels: {
        meta_pixel_id: meta_pixel_id?.trim() || null,
        tiktok_pixel_id: tiktok_pixel_id?.trim() || null,
        ga4_id: ga4_id?.trim() || null
      }
    });
  } catch (err) {
    console.error('[PUT PIXELS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde des pixels' });
  }
});

// ── Spec 04 : GET /api/boutiques/:id/pixels/public — Lecture publique des pixels
router.get('/:id/pixels/public', async (req, res) => {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id);
    const r = await pool.query(
      `SELECT meta_pixel_id, tiktok_pixel_id, ga4_id FROM boutiques WHERE ${isUUID ? 'id = $1' : 'slug = $1'}`,
      [req.params.id]
    );

    if (!r.rows[0]) {
      return res.status(404).json({ error: 'Boutique introuvable' });
    }

    res.json({
      meta_pixel_id: r.rows[0].meta_pixel_id || null,
      tiktok_pixel_id: r.rows[0].tiktok_pixel_id || null,
      ga4_id: r.rows[0].ga4_id || null
    });
  } catch (err) {
    console.error('[GET PIXELS PUBLIC ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Spec 05 : GET /api/boutiques/:id/api-keys — Liste des clés API marchand (Business VIP uniquement)
router.get('/:id/api-keys', verifierToken, param('id').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      `SELECT id, nom, key_prefix, created_at, last_used_at FROM boutique_api_keys WHERE boutique_id = $1 ORDER BY created_at DESC`,
      [bq.id]
    );
    res.json({ keys: r.rows });
  } catch (err) {
    console.error('[GET API KEYS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des clés API' });
  }
});

// ── Spec 05 : POST /api/boutiques/:id/api-keys — Générer une clé API marchand (Business VIP uniquement)
router.post('/:id/api-keys', verifierToken, param('id').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { nom } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({ error: 'Le nom de la clé API est requis.' });
    }

    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const apiKey = `nopalou_sk_live_${randomBytes}`;
    const keyPrefix = apiKey.substring(0, 19); // "nopalou_sk_live_123"
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const r = await pool.query(
      `INSERT INTO boutique_api_keys (boutique_id, nom, key_prefix, key_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nom, key_prefix, created_at`,
      [bq.id, nom.trim(), keyPrefix, keyHash]
    );

    res.status(201).json({
      success: true,
      key_id: r.rows[0].id,
      api_key: apiKey,
      message: 'Conservez cette clé en lieu sûr. Elle ne sera plus affichée.'
    });
  } catch (err) {
    console.error('[POST API KEY ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la génération de la clé API' });
  }
});

// ── Spec 05 : DELETE /api/boutiques/:id/api-keys/:keyId — Révoker une clé API marchand (Business VIP uniquement)
router.delete('/:id/api-keys/:keyId', verifierToken, param('id').isUUID(), param('keyId').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    await pool.query(
      `DELETE FROM boutique_api_keys WHERE id = $1 AND boutique_id = $2`,
      [req.params.keyId, bq.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE API KEY ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la révocation de la clé API' });
  }
});

// ── Spec 05 : GET /api/boutiques/:id/webhooks — Liste des webhooks (Business VIP uniquement)
router.get('/:id/webhooks', verifierToken, param('id').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      `SELECT id, url, secret, events, actif, created_at FROM boutique_webhooks WHERE boutique_id = $1 ORDER BY created_at DESC`,
      [bq.id]
    );
    res.json({ webhooks: r.rows });
  } catch (err) {
    console.error('[GET WEBHOOKS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des webhooks' });
  }
});

// ── Spec 05 : POST /api/boutiques/:id/webhooks — Créer un webhook endpoint (Business VIP uniquement)
router.post('/:id/webhooks', verifierToken, param('id').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { url, events } = req.body;
    if (!url || !url.trim() || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return res.status(400).json({ error: 'Une URL de webhook valide (http:// ou https://) est requise.' });
    }

    const eventsList = Array.isArray(events) && events.length > 0 ? events : ['order.created'];
    const crypto = require('crypto');
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const r = await pool.query(
      `INSERT INTO boutique_webhooks (boutique_id, url, secret, events)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bq.id, url.trim(), secret, eventsList]
    );

    res.status(201).json({
      success: true,
      webhook: r.rows[0]
    });
  } catch (err) {
    console.error('[POST WEBHOOK ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du webhook' });
  }
});

// ── Spec 05 : DELETE /api/boutiques/:id/webhooks/:webhookId — Supprimer un webhook (Business VIP uniquement)
router.delete('/:id/webhooks/:webhookId', verifierToken, param('id').isUUID(), param('webhookId').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    await pool.query(
      `DELETE FROM boutique_webhooks WHERE id = $1 AND boutique_id = $2`,
      [req.params.webhookId, bq.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE WEBHOOK ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du webhook' });
  }
});

// ── Spec 06 : GET /api/devises/taux — Taux de conversion officiels
module.exports = router;
