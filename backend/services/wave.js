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
  const cfg = require('../lib/settingsCache');
  const apiKey = process.env.WAVE_API_KEY || (await cfg.get('wave_api_key'));
  const signingSecret = process.env.WAVE_SIGNING_SECRET || process.env.WAVE_WEBHOOK_SECRET || (await cfg.get('wave_signing_secret'));

  if (!apiKey || !apiKey.trim() || apiKey.includes('xxxxxxxx')) {
    throw new Error('Clé API Wave non configurée. Veuillez ajouter WAVE_API_KEY dans vos variables d\'environnement Render/Vercel ou dans les paramètres admin.');
  }

  const payload = {
    amount: String(Math.round(Number(amount))),
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
    console.error('[WAVE WEBHOOK] ❌ Refusé : WAVE_WEBHOOK_SECRET non configuré dans les variables d\'environnement.');
    return false;
  }

  const sigHeader = req.headers['wave-signature'] || req.headers['x-wave-signature'] || '';
  if (!sigHeader) {
    console.error('[WAVE WEBHOOK] ❌ Refusé : En-tête Wave-Signature / x-wave-signature manquant.');
    return false;
  }

  const rawBody = req.rawBody
    ? req.rawBody.toString('utf8')
    : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  const secretClean = webhookSecret.trim();

  // Format officiel Wave : t=1639081943,v1=942119aedf9fa377844cf010785fe14ef8478c72af0b73d62ea3941335b526a8
  if (sigHeader.includes('t=') && sigHeader.includes('v1=')) {
    const parts = {};
    sigHeader.split(',').forEach((part) => {
      const [k, v] = part.split('=');
      if (k && v) parts[k.trim()] = v.trim();
    });

    const timestamp = parts.t;
    const signature = parts.v1;

    if (!signature) {
      console.error('[WAVE WEBHOOK] ❌ Refusé : Structure de signature v1 invalide.');
      return false;
    }

    // Calcul HMAC-SHA256 avec t + rawBody (spécification officielle Wave)
    const expectedWithTimestamp = crypto
      .createHmac('sha256', secretClean)
      .update(`${timestamp}${rawBody}`)
      .digest('hex');

    // Calcul HMAC-SHA256 avec rawBody seul (fallback pour les outils de test)
    const expectedBodyOnly = crypto
      .createHmac('sha256', secretClean)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBufTimestamp = Buffer.from(expectedWithTimestamp, 'hex');
    const expBufBodyOnly = Buffer.from(expectedBodyOnly, 'hex');

    const matchesTimestampPayload = sigBuf.length === expBufTimestamp.length && crypto.timingSafeEqual(sigBuf, expBufTimestamp);
    const matchesBodyOnlyPayload = sigBuf.length === expBufBodyOnly.length && crypto.timingSafeEqual(sigBuf, expBufBodyOnly);

    if (matchesTimestampPayload || matchesBodyOnlyPayload) {
      return true;
    }

    console.error('[WAVE WEBHOOK] ❌ Refusé : Signature HMAC non correspondante.');
    return false;
  }

  // Format hérité : hash brut dans l'en-tête
  const expectedLegacy = crypto
    .createHmac('sha256', secretClean)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(sigHeader, 'hex');
  const expBuf = Buffer.from(expectedLegacy, 'hex');

  if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
    return true;
  }

  console.error('[WAVE WEBHOOK] ❌ Refusé : Échec de signature hérité HMAC.');
  return false;
}

/**
 * Déclenche un reversement (Payout) depuis le compte Wave Business vers le téléphone d'un marchand.
 * Endpoint officiel Wave Payout API: POST https://api.wave.com/v1/payouts
 */
async function sendPayout({ amount, mobile, client_reference }) {
  const apiKey = process.env.WAVE_API_KEY;
  if (!apiKey || apiKey.includes('xxxxxxxx')) {
    throw new Error('Clé API Wave non configurée.');
  }

  const formattedMobile = mobile.startsWith('+')
    ? mobile
    : `+221${mobile.replace(/\D/g, '').slice(-9)}`;

  const payload = {
    amount: Math.round(Number(amount)),
    currency: 'XOF',
    mobile: formattedMobile,
    client_reference,
  };

  const signingSecret = process.env.WAVE_SIGNING_SECRET || process.env.WAVE_WEBHOOK_SECRET;
  const headers = {
    Authorization: `Bearer ${apiKey.trim()}`,
    'Content-Type': 'application/json',
  };
  if (signingSecret) {
    headers['Wave-Signature'] = generateWaveSignature(signingSecret, payload);
  }

  const response = await axios.post(`${WAVE_BASE_URL}/v1/payout`, payload, {
    headers,
    timeout: 10000,
  });

  return response.data;
}

module.exports = {
  createCheckoutSession,
  verifyWebhookSignature,
  generateWaveSignature,
  sendPayout,
};
