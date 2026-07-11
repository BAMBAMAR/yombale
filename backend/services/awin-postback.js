// backend/services/awin-postback.js
// Service Awin postback — envoie événements de conversion à Awin API
// Usage : await sendAwinPostback({ clickRef, boutique, abonnement, commission })

const https = require('https');
const { pool } = require('../models/db');

const AWIN_API_HOST = 'https://awin.com/events/api/v1/tracking/commission';
const AWIN_MERCHANT_ID = process.env.AWIN_MERCHANT_ID || null;
const AWIN_AFFILIATE_PASSWORD = process.env.AWIN_AFFILIATE_PASSWORD || null;

async function sendAwinPostback({ clickRef, boutique, abonnement, commission }) {
  if (!AWIN_MERCHANT_ID || !AWIN_AFFILIATE_PASSWORD) {
    console.log('[AWIN] ⚠️  Postback désactivé (clés manquantes)');
    return false;
  }

  try {
    const payload = {
      clickRef: clickRef || abonnement?.commande_ref,
      commissionAmount: commission?.montant || 0,
      commissionCurrency: 'XOF',
      eventDate: new Date().toISOString(),
      eventType: 'subscription_new', // ou 'subscription_renewal', 'purchase'
      merchant_id: AWIN_MERCHANT_ID,
      saleAmount: abonnement?.prix_mensuel || 0,
      saleCurrency: 'XOF',
      orderRef: abonnement?.id,
      customData: {
        boutique_nom: boutique?.nom,
        plan: abonnement?.plan,
        utilisateur_email: boutique?.utilisateur?.email,
      },
    };

    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'awin.com',
      port: 443,
      path: '/events/api/v1/tracking/commission',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${AWIN_AFFILIATE_PASSWORD}`,
      },
      timeout: 5000,
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[AWIN] ✅ Postback ${abonnement?.id} envoyé (${commission?.montant} XOF)`);
            resolve(true);
          } else {
            console.warn(`[AWIN] ⚠️  Réponse ${res.statusCode}:`, data.substring(0, 200));
            resolve(false); // Pas de retry ici, Awin stocke les webhoiks
          }
        });
      });

      req.on('timeout', () => {
        console.warn('[AWIN] ⏱ Timeout 5s');
        req.destroy();
        resolve(false);
      });

      req.on('error', (e) => {
        console.error('[AWIN] ❌', e.message);
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  } catch (err) {
    console.error('[AWIN postback]', err.message);
    return false;
  }
}

module.exports = { sendAwinPostback };
