// tests/unit/payment-gateways-production.test.js
const orangeMoney = require('../../backend/services/orange-money');
const stripeService = require('../../backend/services/stripe');
const crypto = require('crypto');

describe('Passerelles de Paiement Production (Orange Money & Stripe)', () => {
  describe('Orange Money Web Payment (Sénégal)', () => {
    it('initialise une session de paiement avec les paramètres requis en mode résilient', async () => {
      const session = await orangeMoney.createWebPayment({
        amount: 15000,
        currency: 'XOF',
        order_id: 'CMD-TEST-OM-001',
      });

      expect(session.success).toBe(true);
      expect(session.pay_token).toBeDefined();
      expect(session.payment_url).toContain('CMD-TEST-OM-001');
      expect(session.om_url).toBe(session.payment_url);
    });

    it('vérifie le statut de transaction de manière sécurisée', async () => {
      const status = await orangeMoney.checkTransactionStatus({
        order_id: 'CMD-TEST-OM-001',
        amount: 15000,
        pay_token: 'om_sim_CMD-TEST-OM-001_12345',
      });

      expect(status.verified).toBe(true);
      expect(status.status).toBe('SUCCESS');
    });
  });

  describe('Stripe Checkout & Cartes Bancaires (International / Diaspora)', () => {
    it('gère correctement les devises EUR, USD et XOF avec conversion', async () => {
      // Devise EUR
      const sessionEur = await stripeService.createCheckoutSession({
        amount: 25000, // 25000 FCFA
        currency: 'EUR',
        client_reference: 'CMD-TEST-STRIPE-EUR',
      });
      expect(sessionEur.success).toBe(true);
      expect(sessionEur.session_id).toContain('CMD-TEST-STRIPE-EUR');
      expect(sessionEur.url).toContain('CMD-TEST-STRIPE-EUR');

      // Devise USD
      const sessionUsd = await stripeService.createCheckoutSession({
        amount: 50, // 50 USD directs
        currency: 'USD',
        client_reference: 'CMD-TEST-STRIPE-USD',
      });
      expect(sessionUsd.success).toBe(true);

      // Devise XOF
      const sessionXof = await stripeService.createCheckoutSession({
        amount: 10000,
        currency: 'XOF',
        client_reference: 'CMD-TEST-STRIPE-XOF',
      });
      expect(sessionXof.success).toBe(true);
    });

    it('vérifie la signature HMAC-SHA256 des webhooks Stripe', () => {
      const secret = 'whsec_test_secret_for_unit_tests';
      const payload = JSON.stringify({ id: 'evt_test_123', type: 'checkout.session.completed' });
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      const header = `t=${timestamp},v1=${signature}`;
      const isValid = stripeService.verifyWebhookSignature(payload, header, secret);
      expect(isValid).toBe(true);

      // Signature invalide
      const isInvalid = stripeService.verifyWebhookSignature(payload, `t=${timestamp},v1=invalidsig`, secret);
      expect(isInvalid).toBe(false);
    });
  });
});
