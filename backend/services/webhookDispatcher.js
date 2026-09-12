// backend/services/webhookDispatcher.js — Dispatcher de Webhooks Marchands avec Signature HMAC SHA-256
const crypto = require('crypto');
const { pool } = require('../models/db');

const WEBHOOK_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_CANCELLED: 'order.cancelled',
  INVENTORY_ALERT: 'inventory.low_stock',
};

/**
 * Dispatch un événement webhook à tous les endpoints actifs enregistrés par la boutique.
 * @param {string} boutiqueId - ID UUID de la boutique
 * @param {string} eventType - Type d'événement (ex: 'order.created')
 * @param {object} data - Données utiles de l'événement
 */
async function dispatchBoutiqueWebhook(boutiqueId, eventType, data) {
  if (!boutiqueId) return;

  try {
    const { rows: webhooks } = await pool.query(
      `SELECT id, url, secret, events FROM boutique_webhooks WHERE boutique_id = $1 AND actif = true`,
      [boutiqueId]
    );

    if (!webhooks || webhooks.length === 0) return;

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const payload = {
      id: eventId,
      event: eventType,
      timestamp,
      boutique_id: boutiqueId,
      data: data || {},
    };

    const payloadString = JSON.stringify(payload);

    // Envoi asynchrone non-bloquant vers chaque destination
    for (const wh of webhooks) {
      const eventsSubscribed = wh.events || [];
      const isSubscribed =
        eventsSubscribed.includes('*') ||
        eventsSubscribed.includes('all') ||
        eventsSubscribed.includes(eventType);

      if (!isSubscribed) continue;

      // Calcul de la signature HMAC SHA-256
      const secret = wh.secret || 'nopalou_secret';
      const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

      // Dispatch HTTP avec timeout strict de 5s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Nopalou-Webhooks/1.0',
          'X-Nopalou-Event': eventType,
          'X-Nopalou-Delivery': eventId,
          'X-Nopalou-Signature': `t=${timestamp},v1=${signature}`,
          'X-Nopalou-Boutique-Id': boutiqueId,
        },
        body: payloadString,
        signal: controller.signal,
      })
        .then((res) => {
          clearTimeout(timeoutId);
          if (!res.ok) {
            console.warn(`[WEBHOOK DISPATCH] ⚠️ Échec statut HTTP ${res.status} pour ${wh.url}`);
          }
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          console.warn(`[WEBHOOK DISPATCH] ❌ Erreur réseau vers ${wh.url} : ${err.message}`);
        });
    }
  } catch (err) {
    console.error('[WEBHOOK DISPATCH ERR]', err);
  }
}

module.exports = {
  WEBHOOK_EVENTS,
  dispatchBoutiqueWebhook,
};
