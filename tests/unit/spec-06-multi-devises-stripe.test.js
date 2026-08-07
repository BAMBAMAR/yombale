// Tests unitaires — Spec 06 : Multi-Devises XOF/EUR/USD & Simulation Carte Bancaire Stripe
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const { pool } = require('../../backend/models/db');
const boutiquesRouter = require('../../backend/routes/boutiques');

const app = express();
app.use(express.json());
app.use('/api/boutiques', boutiquesRouter);

const token = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET);
const auth = `Bearer ${token}`;
const boutiqueId = '9b1deb4d-3b7d-416b-9f47-a87799d21e8a';

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /api/boutiques/devises/taux (Spec 06)', () => {
  test('retourne les taux de conversion officiels (XOF, EUR, USD) (HTTP 200)', async () => {
    const res = await request(app).get('/api/boutiques/devises/taux');

    expect(res.status).toBe(200);
    expect(res.body.base).toBe('XOF');
    expect(res.body.taux.EUR).toBeDefined();
    expect(res.body.conversions_inverses['1_EUR_EN_XOF']).toBe(655.957);
  });
});

describe('PUT /api/boutiques/:id/devise (Spec 06)', () => {
  test('met à jour la devise par défaut de la boutique vers EUR (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] }) // checkBoutiqueAccess
      .mockResolvedValueOnce({ rows: [] }); // UPDATE

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/devise`)
      .set('Authorization', auth)
      .send({ devise_defaut: 'EUR' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.devise_defaut).toBe('EUR');
  });

  test('refuse une devise invalide (HTTP 400)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] });

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/devise`)
      .set('Authorization', auth)
      .send({ devise_defaut: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Devise invalide/);
  });
});

describe('POST /api/boutiques/paiements/stripe/simuler (Spec 06)', () => {
  test('simule un paiement par carte bancaire Stripe avec succès (HTTP 200)', async () => {
    const res = await request(app)
      .post('/api/boutiques/paiements/stripe/simuler')
      .send({
        boutique_id: boutiqueId,
        montant: 50,
        devise: 'EUR',
        card_number: '4242 4242 4242 4242',
        exp_month: 12,
        exp_year: 2028,
        cvc: '123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statut).toBe('succeeded');
    expect(res.body.transaction_id).toMatch(/^txn_stripe_sim_/);
    expect(res.body.montant_xof).toBe(32798); // 50 EUR * 655.957 = 32,797.85 -> 32798 XOF
  });

  test('refuse une carte bancaire déclinée de test (HTTP 400)', async () => {
    const res = await request(app)
      .post('/api/boutiques/paiements/stripe/simuler')
      .send({
        boutique_id: boutiqueId,
        montant: 10000,
        devise: 'XOF',
        card_number: '4000 0000 0000 0002'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/déclinée par l'émetteur/);
  });
});
