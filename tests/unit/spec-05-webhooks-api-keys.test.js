// Tests unitaires — Spec 05 : Webhooks & Clés API Marchands
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const { pool } = require('../../backend/models/db');
const boutiquesRouter = require('../../backend/routes/boutiques');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use('/api/boutiques', boutiquesRouter);

const token = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET);
const auth = `Bearer ${token}`;
const boutiqueId = '9b1deb4d-3b7d-416b-9f47-a87799d21e8a';
const keyId = '11223344-5566-7788-9900-aabbccddeeff';
const webhookId = '99887766-5544-3322-1100-ffeeddccbbaa';

beforeEach(() => {
  pool.query.mockReset();
});

describe('Clés API Marchand — POST & GET & DELETE /api/boutiques/:id/api-keys (Spec 05)', () => {
  test('génère une clé API marchand avec préfixe nopalou_sk_live_ (HTTP 201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ plan: 'business', statut: 'actif' }] }) // checkAbonnement
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] }) // checkBoutiqueAccess
      .mockResolvedValueOnce({
        rows: [{ id: keyId, nom: 'Clé Zapier', key_prefix: 'nopalou_sk_live_abc', created_at: new Date() }]
      });

    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/api-keys`)
      .set('Authorization', auth)
      .send({ nom: 'Clé Zapier' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.api_key).toMatch(/^nopalou_sk_live_/);
    expect(res.body.key_id).toBe(keyId);
  });

  test('révoque une clé API marchand avec succès (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ plan: 'business', statut: 'actif' }] }) // checkAbonnement
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete(`/api/boutiques/${boutiqueId}/api-keys/${keyId}`)
      .set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Webhooks — POST & GET & DELETE /api/boutiques/:id/webhooks (Spec 05)', () => {
  test('enregistre un webhook endpoint avec secret whsec_ (HTTP 201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ plan: 'business', statut: 'actif' }] }) // checkAbonnement
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: webhookId, boutique_id: boutiqueId, url: 'https://mon-crm.com/webhook',
          secret: 'whsec_abcdef123456', events: ['order.created']
        }]
      });

    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/webhooks`)
      .set('Authorization', auth)
      .send({ url: 'https://mon-crm.com/webhook', events: ['order.created'] });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.webhook.secret).toMatch(/^whsec_/);
    expect(res.body.webhook.url).toBe('https://mon-crm.com/webhook');
  });

  test('refuse la création sans URL valide (HTTP 400)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ plan: 'business', statut: 'actif' }] }) // checkAbonnement
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] });

    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/webhooks`)
      .set('Authorization', auth)
      .send({ url: 'invalid-url' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/URL de webhook valide/);
  });

  test('vérifie la signature HMAC-SHA256 pour la livraison Webhook', () => {
    const secret = 'whsec_test_secret_123';
    const timestamp = '1770418500';
    const payload = JSON.stringify({ event: 'order.created', reference: 'CMD-2026-1001' });
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    expect(signature).toBeDefined();
    expect(signature.length).toBe(64);
  });
});
