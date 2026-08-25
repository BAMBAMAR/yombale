// backend/routes/whatsapp.js
const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

// ── Vérification signature HMAC-SHA256 Meta ──────────────────────────────────
function verifyHmac(req, res, next) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return next(); // Pas de secret configuré = dev local, on passe

  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return res.status(403).json({ error: 'Signature manquante' });

  // req.rawBody est alimenté par le middleware express.json avec verify (voir app.js)
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex');

  if (sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return res.status(403).json({ error: 'Signature invalide' });
  }
  next();
}

// ── GET /api/whatsapp/webhook — handshake Meta ───────────────────────────────
router.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WHATSAPP] Webhook vérifié ✓');
    return res.status(200).send(challenge);
  }
  res.status(403).json({ error: 'Vérification échouée' });
});

// ── POST /api/whatsapp/webhook — messages entrants ───────────────────────────
router.post('/webhook', verifyHmac, async (req, res) => {
  res.sendStatus(200); // Toujours 200 immédiatement (Meta timeout = 20s)

  const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
  if (!entry) return;

  if (entry.messages && Array.isArray(entry.messages)) {
    // Vérifier que WhatsApp et le chatbot sont activés dans les settings
    const [waEnabled, botEnabled] = await Promise.all([
      cfg.getBool('whatsapp_enabled').catch(() => true),
      cfg.getBool('whatsapp_chatbot').catch(() => true),
    ]);
    if (!waEnabled || !botEnabled) return;

    for (const msg of entry.messages) {
      require('../services/whatsapp-chatbot').handleIncoming(msg).catch(err =>
        console.error('[WHATSAPP CHATBOT]', err.message)
      );
    }
  }

  if (entry.statuses) {
    console.log('[WHATSAPP] Statut livraison:', entry.statuses[0].status);
    if (entry.statuses[0].errors) {
      console.log('[WHATSAPP] Erreur de livraison:', JSON.stringify(entry.statuses[0].errors, null, 2));
    }
  }
});

// ── POST /api/whatsapp/send — envoi manuel (bouton frontend) ─────────────────
const { tokenOptional } = require('../middlewares/auth');

router.post('/send', tokenOptional, async (req, res) => {
  try {
    const { type, id, phone } = req.body;
    if (!type || !id) return res.status(400).json({ error: 'type et id requis' });

    // Récupérer le numéro : depuis le compte connecté ou depuis le body
    let tel = phone;
    if (req.user?.userId && !tel) {
      const { pool } = require('../models/db');
      const u = await pool.query('SELECT telephone FROM utilisateurs WHERE id=$1', [req.user.userId]);
      tel = u.rows[0]?.telephone;
    }
    if (!tel) return res.status(400).json({ error: 'Numéro de téléphone requis' });

    await require('../services/whatsapp').sendFiche(type, id, tel);
    res.json({ success: true });
  } catch (err) {
    console.error('[WHATSAPP SEND]', err.message);
    res.status(500).json({ error: 'Erreur envoi' });
  }
});

// ── Routes admin WhatsApp ────────────────────────────────────────────────────
const { adminSecretOnly } = require('../middlewares/auth');
const { pool } = require('../models/db');
const cfg = require('../lib/settingsCache');

// GET /api/whatsapp/admin/status — état de la configuration WhatsApp
router.get('/admin/status', adminSecretOnly, async (req, res) => {
  try {
    const phoneId  = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token    = process.env.WHATSAPP_API_TOKEN;
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    const catalogId = process.env.WHATSAPP_CATALOG_ID;

    // Stats sessions
    const [sessions, processed] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL \'1 hour\') AS actives FROM whatsapp_sessions'),
      pool.query('SELECT COUNT(*) AS total FROM whatsapp_processed_messages WHERE processed_at > NOW() - INTERVAL \'24 hours\''),
    ]);

    const enabled = await cfg.getBool('whatsapp_enabled');
    const chatbot = await cfg.getBool('whatsapp_chatbot');

    // Test connexion API Meta (appel léger)
    let apiStatus = 'non_configure';
    if (phoneId && token) {
      try {
        const axios = require('axios');
        await axios.get(`https://graph.facebook.com/v19.0/${phoneId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });
        apiStatus = 'ok';
      } catch (e) {
        apiStatus = e.response?.status === 401 ? 'token_invalide' : 'erreur_reseau';
      }
    }

    res.json({
      config: {
        phone_number_id: phoneId ? '***' + phoneId.slice(-4) : null,
        token_present:   !!token,
        app_secret:      !!appSecret,
        verify_token:    !!verifyToken,
        catalog_id:      catalogId || null,
        webhook_url:     `${process.env.BACKEND_URL}/api/whatsapp/webhook`,
      },
      api_status: apiStatus,
      enabled,
      chatbot,
      stats: {
        sessions_total:  parseInt(sessions.rows[0].total),
        sessions_actives: parseInt(sessions.rows[0].actives),
        messages_24h:    parseInt(processed.rows[0].total),
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/whatsapp/admin/toggle — activer/désactiver WhatsApp ou chatbot
router.post('/admin/toggle', adminSecretOnly, async (req, res) => {
  try {
    const { key } = req.body; // 'whatsapp_enabled' ou 'whatsapp_chatbot'
    if (!['whatsapp_enabled', 'whatsapp_chatbot'].includes(key)) {
      return res.status(400).json({ error: 'key invalide' });
    }
    const current = await cfg.getBool(key);
    await cfg.set(key, !current);
    cfg.invalidate();
    res.json({ [key]: !current });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/whatsapp/admin/test — envoyer un message de test (admin)
router.post('/admin/test', adminSecretOnly, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'phone et message requis' });
    const { sendWhatsAppText } = require('../services/whatsapp');
    await sendWhatsAppText(phone, `[TEST ADMIN] ${message}`);
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/whatsapp/admin/sessions — vider toutes les sessions chatbot
router.delete('/admin/sessions', adminSecretOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM whatsapp_sessions');
    res.json({ deleted: rowCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/whatsapp/admin/sessions — liste des sessions actives
router.get('/admin/sessions', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT phone, state, context, updated_at
       FROM whatsapp_sessions
       ORDER BY updated_at DESC LIMIT 50`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/whatsapp/admin/support — liste des demandes de rappel / support
router.get('/admin/support', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, telephone, nom, sujet, message, statut, canal, contexte_session, notes_admin, created_at, updated_at
       FROM support_demandes
       ORDER BY created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/whatsapp/admin/support/:id — mise à jour du statut d'une demande de support
router.patch('/admin/support/:id', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, notes_admin } = req.body;
    const { rows } = await pool.query(
      `UPDATE support_demandes
       SET statut = COALESCE($1, statut),
           notes_admin = COALESCE($2, notes_admin),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [statut, notes_admin, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Demande introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
