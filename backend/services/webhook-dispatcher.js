// backend/services/webhook-dispatcher.js
// Service d'expédition asynchrone des Webhooks événementiels avec signature HMAC-SHA256

const crypto = require('crypto');
const axios = require('axios');
const { pool } = require('../models/db');

/**
 * Envoie un événement Webhook à tous les endpoints enregistrés pour une boutique
 * @param {string} boutiqueId - UUID de la boutique
 * @param {string} event - Nom de l'événement (ex: 'order.created', 'product.updated', 'stock.low')
 * @param {object} payload - Données transmises dans le webhook
 */
async function dispatchWebhookEvent(boutiqueId, event, payload) {
  if (!boutiqueId || !event) return;

  try {
    const { rows: webhooks } = await pool.query(
      `SELECT id, url, secret, events FROM boutique_webhooks WHERE boutique_id = $1 AND actif = true`,
      [boutiqueId]
    );

    if (webhooks.length === 0) return;

    const eventData = {
      event,
      timestamp: new Date().toISOString(),
      boutique_id: boutiqueId,
      data: payload
    };

    const rawBody = JSON.stringify(eventData);

    for (const wh of webhooks) {
      const subscribedEvents = Array.isArray(wh.events) ? wh.events : [wh.events];
      if (!subscribedEvents.includes('*') && !subscribedEvents.includes(event)) {
        continue;
      }

      // Génération de la signature HMAC SHA-256 (standard Stripe/Shopify)
      const hmacSecret = wh.secret || 'default_secret';
      const signature = crypto
        .createHmac('sha256', hmacSecret)
        .update(rawBody)
        .digest('hex');

      // Envoi de la requête HTTP POST sans bloquer le thread principal
      axios.post(wh.url, rawBody, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Nopalou-Webhook-Dispatcher/2.0',
          'X-Nopalou-Signature': signature,
          'X-Nopalou-Event': event
        },
        timeout: 5000
      }).catch(err => {
        console.warn(`[WEBHOOK DISPATCH WARN] (${wh.url}):`, err.response?.data || err.message);
      });
    }
  } catch (err) {
    console.error('[WEBHOOK DISPATCH CRITICAL ERR]:', err.message);
  }
}

module.exports = {
  dispatchWebhookEvent
};
