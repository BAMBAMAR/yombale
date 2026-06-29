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
router.post('/webhook', verifyHmac, (req, res) => {
  res.sendStatus(200); // Toujours 200 immédiatement (Meta timeout = 20s)

  const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
  if (!entry) return;

  if (entry.messages) {
    const msg = entry.messages[0];
    require('../services/whatsapp-chatbot').handleIncoming(msg).catch(err =>
      console.error('[WHATSAPP CHATBOT]', err.message)
    );
  }

  if (entry.statuses) {
    console.log('[WHATSAPP] Statut livraison:', entry.statuses[0].status);
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

module.exports = router;
