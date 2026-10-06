// backend/lib/vapidHelper.js
// Gestionnaire VAPID standard pour Web Push Surga & Nopalou
// Génération déterministe, persistance en DB, envoi avec rotation et purge 410

const webpush = require('web-push');
const { pool } = require('../models/db');
const cfg = require('./settingsCache');

let isVapidConfigured = false;
let currentPublicKey = null;

const DEFAULT_SUBJECT = 'mailto:contact@nopalou.com';

/**
 * Initialise et configure webpush avec les clés VAPID
 */
async function initVapid() {
  if (isVapidConfigured && currentPublicKey) {
    return { publicKey: currentPublicKey };
  }

  try {
    let publicKey = process.env.VAPID_PUBLIC_KEY;
    let privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || (await cfg.get('vapid_subject')) || DEFAULT_SUBJECT;

    if (!publicKey || !privateKey) {
      // Vérifier si présent dans la table settings
      const dbPubKey = await cfg.get('vapid_public_key');
      const dbPrivKey = await cfg.get('vapid_private_key');

      if (dbPubKey && dbPrivKey) {
        publicKey = dbPubKey;
        privateKey = dbPrivKey;
      } else {
        // Générer une paire pérenne et la stocker en DB
        const generated = webpush.generateVAPIDKeys();
        publicKey = generated.publicKey;
        privateKey = generated.privateKey;

        try {
          await pool.query(
            `INSERT INTO settings (key, value) VALUES 
              ('vapid_public_key', $1),
              ('vapid_private_key', $2),
              ('vapid_subject', $3)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
            [publicKey, privateKey, subject]
          );
          if (cfg.set) {
            cfg.set('vapid_public_key', publicKey);
            cfg.set('vapid_private_key', privateKey);
            cfg.set('vapid_subject', subject);
          }
          console.log('[VAPID]: Nouvelle paire de clés générée et persistée en base.');
        } catch (dbErr) {
          console.warn('[VAPID WARN]: Impossible de persister les clés VAPID en DB:', dbErr.message);
        }
      }
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidConfigured = true;
    currentPublicKey = publicKey;

    return { publicKey };
  } catch (err) {
    console.error('[VAPID INIT ERROR]:', err.message);
    throw err;
  }
}

/**
 * Renvoie la clé publique VAPID
 */
async function getVapidPublicKey() {
  const { publicKey } = await initVapid();
  return publicKey;
}

/**
 * Envoie une notification Web Push vers un abonnement
 * Gère automatiquement les expirations (410 Gone / 404 Not Found)
 * @param {Object} subscription { endpoint, keys: { p256dh, auth } }
 * @param {Object|string} payload Contenu de la notification
 * @returns {Promise<{ success: boolean, statusCode?: number, expired?: boolean, error?: string }>}
 */
async function sendWebPushNotification(subscription, payload) {
  try {
    await initVapid();

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys ? subscription.keys.p256dh : subscription.p256dh,
        auth: subscription.keys ? subscription.keys.auth : subscription.auth,
      },
    };

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const result = await webpush.sendNotification(pushSubscription, payloadString, {
      TTL: 60 * 60 * 24, // 24h
      urgency: 'high',
    });

    return {
      success: true,
      statusCode: result.statusCode,
    };
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const isExpired = statusCode === 404 || statusCode === 410;

    // Purge de l'abonnement expiré dans la table surga_push_subscriptions
    if (isExpired && subscription.endpoint) {
      try {
        await pool.query('DELETE FROM surga_push_subscriptions WHERE endpoint = $1', [
          subscription.endpoint,
        ]);
        console.log('[VAPID]: Abonnement expiré supprimé de la base:', subscription.endpoint.slice(0, 40));
      } catch (delErr) {
        console.warn('[VAPID DEL ERR]:', delErr.message);
      }
    }

    return {
      success: false,
      statusCode,
      expired: isExpired,
      error: err.message,
    };
  }
}

module.exports = {
  initVapid,
  getVapidPublicKey,
  sendWebPushNotification,
};
