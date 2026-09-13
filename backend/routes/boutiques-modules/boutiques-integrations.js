// backend/routes/boutiques-modules/boutiques-integrations.js
const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional, adminSecretOnly } = require('../../middlewares/auth');
const { checkAbonnement, requireBusiness } = require('../../middlewares/checkAbonnement');
const { checkBoutiqueAccess } = require('./helpers');

// ── Spec 04 : PUT /api/boutiques/:id/pixels — Sauvegarde des Pixels
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
    const keyPrefix = apiKey.substring(0, 19);
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
    res.status(500).json({ error: 'Erreur lors de la suppression de la clé API' });
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

    res.status(201).json({ success: true, webhook: r.rows[0] });
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

// ── Marketing Workflows endpoints ──────────────────────────────────────────
router.get('/:id/marketing/workflows', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { rows } = await pool.query(
      `SELECT * FROM marketing_workflows WHERE boutique_id = $1 ORDER BY created_at DESC`,
      [bq.id]
    );
    res.json({ success: true, workflows: rows });
  } catch (err) {
    console.error('[GET WORKFLOWS ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/marketing/workflows', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { nom, declencheur, etapes } = req.body;
    if (!nom || !Array.isArray(etapes)) {
      return res.status(400).json({ error: 'Données invalides' });
    }

    const { rows } = await pool.query(
      `INSERT INTO marketing_workflows (boutique_id, nom, declencheur, etapes, actif)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [bq.id, nom.trim(), declencheur || 'panier_abandonne', JSON.stringify(etapes)]
    );

    res.status(201).json({ success: true, workflow: rows[0] });
  } catch (err) {
    console.error('[POST WORKFLOW ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du workflow' });
  }
});

// ── SPRINT 4 (POINT 07) : AGENT IA AUTONOME DE VENTE & NÉGOCIATION ─────────
const { processAgentNegotiation } = require('../../services/ai-agent');

// POST /api/boutiques/:id/ai-agent/chat — Endpoint public pour les acheteurs
router.post('/:id/ai-agent/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, cart } = req.body; // message: string, cart: { articles, totalFCFA }

    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    let targetId = id;
    if (!isUUID) {
      const bqRes = await pool.query('SELECT id FROM boutiques WHERE slug = $1', [id]);
      if (bqRes.rows[0]) targetId = bqRes.rows[0].id;
    }

    const result = await processAgentNegotiation(targetId, message, cart || {});
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[AI AGENT CHAT ERR]', err);
    res.status(500).json({ error: 'Erreur lors du traitement par l\'agent IA' });
  }
});

// GET /api/boutiques/:id/ai-agent — Lecture config marchand
router.get('/:id/ai-agent', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { rows } = await pool.query(
      `SELECT prompt_systeme, marge_remise_max, actif FROM boutique_ai_agents WHERE boutique_id = $1`,
      [bq.id]
    );

    res.json({
      success: true,
      agent: rows[0] || { prompt_systeme: '', marge_remise_max: 5, actif: true }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/boutiques/:id/ai-agent — Mise à jour config marchand (Anti-IDOR)
router.post('/:id/ai-agent', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { prompt_systeme, marge_remise_max, actif } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO boutique_ai_agents (boutique_id, prompt_systeme, marge_remise_max, actif, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (boutique_id) DO UPDATE SET
         prompt_systeme = EXCLUDED.prompt_systeme,
         marge_remise_max = EXCLUDED.marge_remise_max,
         actif = EXCLUDED.actif,
         updated_at = NOW()
       RETURNING *`,
      [bq.id, prompt_systeme || '', Number(marge_remise_max) || 5, actif !== false]
    );

    res.json({ success: true, agent: rows[0] });
  } catch (err) {
    console.error('[POST AI AGENT ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'agent IA' });
  }
});

module.exports = router;
