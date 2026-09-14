// backend/services/stripe.js
const axios = require('axios');
const crypto = require('crypto');

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

/**
 * Crée une session de paiement Stripe Checkout (Cartes Bancaires Visa / Mastercard)
 */
async function createCheckoutSession({
  amount,
  currency = 'XOF',
  success_url,
  cancel_url,
  client_reference,
  customer_email,
  customer_name,
  metadata = {},
}) {
  const cfg = require('../lib/settingsCache');
  const secretKey = process.env.STRIPE_SECRET_KEY || (await cfg.get('stripe_secret_key'));
  const cleanCurrency = String(currency).toLowerCase();
  const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

  const defaultSuccess = success_url || `${SITE}/paiement/succes?ref=${encodeURIComponent(client_reference)}&type=commande-express`;
  const defaultCancel = cancel_url || `${SITE}/paiement/erreur?ref=${encodeURIComponent(client_reference)}&type=commande-express`;

  // Montant selon la devise (XOF est une devise sans décimale, EUR/USD en centimes)
  let unitAmount = Math.round(Number(amount));
  if (cleanCurrency === 'eur' || cleanCurrency === 'usd') {
    // Si montant passé en FCFA et devise choisie est EUR/USD, ou si déjà converti
    if (unitAmount > 500) {
      const enDevise = cleanCurrency === 'eur' ? unitAmount / 655.957 : unitAmount / 600.0;
      unitAmount = Math.round(enDevise * 100);
    } else {
      unitAmount = Math.round(unitAmount * 100);
    }
  }

  // Si pas de clé Stripe ou clé de test/sandbox, bascule élégante en mode simulation
  if (!secretKey || secretKey.includes('xxxxxxxx') || !secretKey.startsWith('sk_')) {
    console.log(`[STRIPE SANDBOX] Commande ${client_reference} : session simulée (${unitAmount} ${cleanCurrency})`);
    return {
      success: true,
      url: defaultSuccess,
      stripe_url: defaultSuccess,
      session_id: `cs_sim_${client_reference}_${Date.now()}`,
      mode: 'sandbox_simulation',
      message: 'Session Stripe Checkout créée (Mode Sandbox).',
    };
  }

  const params = new URLSearchParams();
  params.append('payment_method_types[]', 'card');
  params.append('mode', 'payment');
  params.append('success_url', defaultSuccess);
  params.append('cancel_url', defaultCancel);
  params.append('client_reference_id', String(client_reference));

  params.append('line_items[0][price_data][currency]', cleanCurrency);
  params.append('line_items[0][price_data][product_data][name]', `Commande Nopalou ${client_reference}`);
  params.append('line_items[0][price_data][unit_amount]', String(unitAmount));
  params.append('line_items[0][quantity]', '1');

  if (customer_email) {
    params.append('customer_email', customer_email);
  }

  for (const [k, v] of Object.entries(metadata)) {
    params.append(`metadata[${k}]`, String(v));
  }

  const response = await axios.post(
    `${STRIPE_API_BASE}/checkout/sessions`,
    params.toString(),
    {
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    }
  );

  return {
    success: true,
    url: response.data.url,
    stripe_url: response.data.url,
    session_id: response.data.id,
    mode: 'production',
  };
}

/**
 * Valide la signature d'un webhook Stripe (Stripe-Signature)
 */
function verifyWebhookSignature(payload, sigHeader, webhookSecret) {
  const secret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !sigHeader) return false;

  const parts = {};
  sigHeader.split(',').forEach(item => {
    const [k, v] = item.split('=');
    if (k && v) parts[k.trim()] = v.trim();
  });

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  // Rejet si signature trop ancienne (> 5 min)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) return false;

  const signedPayload = `${timestamp}.${typeof payload === 'string' ? payload : JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret.trim())
    .update(signedPayload)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expectedSignature, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

module.exports = {
  createCheckoutSession,
  verifyWebhookSignature,
};
