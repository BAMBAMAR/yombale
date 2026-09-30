// AUD-048 / AUD-013 — signature Stripe sur le corps brut (Buffer) et conversion de montant partagée
process.env.NODE_ENV = 'test';
const crypto = require('crypto');
const { verifyWebhookSignature, montantEnUnitesStripe } = require('../../backend/services/stripe');

const SECRET = 'whsec_unit_test_secret';
const sign = (body, t = Math.floor(Date.now() / 1000)) =>
  `t=${t},v1=${crypto.createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex')}`;

describe('verifyWebhookSignature', () => {
  const body = JSON.stringify({ type: 'checkout.session.completed', data: { object: { amount_total: 10000 } } });

  test('accepte une signature valide quand le corps est une chaîne', () => {
    expect(verifyWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });

  test('accepte une signature valide quand le corps est un Buffer (req.rawBody d\'Express)', () => {
    expect(verifyWebhookSignature(Buffer.from(body, 'utf8'), sign(body), SECRET)).toBe(true);
  });

  test('refuse un corps modifié, une signature fausse, un en-tête absent, un secret absent', () => {
    expect(verifyWebhookSignature(Buffer.from(body.replace('10000', '1'), 'utf8'), sign(body), SECRET)).toBe(false);
    expect(verifyWebhookSignature(body, `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}`, SECRET)).toBe(false);
    expect(verifyWebhookSignature(body, undefined, SECRET)).toBe(false);
    expect(verifyWebhookSignature(body, sign(body), '')).toBe(false);
  });

  test('refuse une signature trop ancienne (rejeu)', () => {
    const vieux = Math.floor(Date.now() / 1000) - 3600;
    expect(verifyWebhookSignature(body, sign(body, vieux), SECRET)).toBe(false);
  });
});

describe('montantEnUnitesStripe', () => {
  test('XOF : montant inchangé (devise sans décimale)', () => {
    expect(montantEnUnitesStripe(18500, 'xof')).toBe(18500);
    expect(montantEnUnitesStripe(18500, 'XOF')).toBe(18500);
  });
  test('EUR et USD : conversion en centimes aux taux de la boutique', () => {
    expect(montantEnUnitesStripe(655957, 'eur')).toBe(100000);
    expect(montantEnUnitesStripe(600000, 'usd')).toBe(100000);
  });
});
