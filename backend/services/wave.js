const axios = require('axios');
const crypto = require('crypto');

const WAVE_BASE_URL = process.env.WAVE_BASE_URL || 'https://api.wave.com';

/**
 * Génère le header Wave-Signature (HMAC-SHA256) pour la signature de requêtes sortantes.
 * Format officiel Wave : t={timestamp},v1={signature}
 */
function generateWaveSignature(signingSecret, bodyObj) {
  const timestamp = Math.floor(Date.now() / 1000);
  const rawBody = bodyObj ? (typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj)) : '';
  const payload = `${timestamp}${rawBody}`;
  const signature = crypto
    .createHmac('sha256', signingSecret.trim())
    .update(payload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Initialise une session de paiement Wave Checkout
 */
async function createCheckoutSession({ amount, currency = 'XOF', success_url, error_url, client_reference }) {
  const apiKey = process.env.WAVE_API_KEY;
  const signingSecret = process.env.WAVE_SIGNING_SECRET || process.env.WAVE_WEBHOOK_SECRET;

  if (!apiKey || apiKey.includes('xxxxxxxx')) {
    throw new Error('Clé API Wave non configurée. Veuillez ajouter WAVE_API_KEY dans votre fichier .env ou variables d\'environnement.');
  }

  const payload = {
    amount: Math.round(Number(amount)),
    currency,
    success_url,
    error_url,
    client_reference,
  };

  const headers = {
    Authorization: `Bearer ${apiKey.trim()}`,
    'Content-Type': 'application/json',
  };

  // Si le Request Signing est activé (secret renseigné)
  if (signingSecret && !signingSecret.includes('xxxxxxxx')) {
    headers['Wave-Signature'] = generateWaveSignature(signingSecret, payload);
  }

  const response = await axios.post(`${WAVE_BASE_URL}/v1/checkout/sessions`, payload, {
    headers,
    timeout: 10000,
  });

  return {
    wave_url: response.data.wave_launch_url,
    session_id: response.data.id,
    data: response.data,
  };
}

/**
 * Valide la signature d'un Webhook entrant envoyé par Wave.
 * Gère le format officiel Wave (Wave-Signature: t=...,v1=...) avec contrôle d'expiration
 * et le format hérité (x-wave-signature).
 */
function verifyWebhookSignature(req) {
  const webhookSecret = process.env.WAVE_WEBHOOK_SECRET || process.env.WAVE_SIGNING_SECRET;

  if (!webhookSecret || webhookSecret.includes('xxxxxxxx')) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[WAVE WEBHOOK] ❌ Refusé : WAVE_WEBHOOK_SECRET non configuré en production.');
      return false;
    }
    console.warn('[WAVE WEBHOOK] ⚠️ Validation signature ignorée en environnement de test (aucun secret configuré).');
    return true;
  }

  const sigHeader = req.headers['wave-signature'] || req.headers['x-wave-signature'] || '';
  if (!sigHeader) {
    console.error('[WAVE WEBHOOK] ❌ Refusé : En-tête Wave-Signature / x-wave-signature manquant.');
    return false;
  }

  const rawBody = req.rawBody
    ? req.rawBody.toString('utf8')
    : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  // Format officiel Wave : t=1639081943,v1=942119aedf9fa377844cf010785fe14ef8478c72af0b73d62ea3941335b526a8
  if (sigHeader.includes('t=') && sigHeader.includes('v1=')) {
    const parts = {};
    sigHeader.split(',').forEach((part) => {
      const [k, v] = part.split('=');
      if (k && v) parts[k.trim()] = v.trim();
    });

    const timestamp = parseInt(parts.t, 10);
    const signature = parts.v1;

    if (!timestamp || isNaN(timestamp) || !signature) {
      console.error('[WAVE WEBHOOK] ❌ Refusé : Structure de signature Wave invalide.');
      return false;
    }

    // Validation fenêtre temporelle (prévention des attaques par rejeu)
    // Timestamp ne doit pas dater de plus de 5 min (300s) ni être à plus de 30s dans le futur
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > 300 || timestamp - now > 30) {
      console.error(`[WAVE WEBHOOK] ❌ Refusé : Horodatage expiré (t=${timestamp}, actuel=${now}).`);
      return false;
    }

    const payload = `${timestamp}${rawBody}`;
    const expected = crypto
      .createHmac('sha256', webhookSecret.trim())
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.error('[WAVE WEBHOOK] ❌ Refusé : Signature HMAC non correspondante.');
      return false;
    }

    return true;
  }

  // Format hérité : hash brut dans l'en-tête
  const expectedLegacy = crypto
    .createHmac('sha256', webhookSecret.trim())
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(sigHeader, 'hex');
  const expBuf = Buffer.from(expectedLegacy, 'hex');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    console.error('[WAVE WEBHOOK] ❌ Refusé : Signature hérité HMAC non correspondante.');
    return false;
  }

  return true;
}

module.exports = {
  createCheckoutSession,
  verifyWebhookSignature,
  generateWaveSignature,
};
