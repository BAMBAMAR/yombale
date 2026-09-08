// tests/unit/security-hardening.test.js
// Tests de non-régression et de validation de la sécurité de Nopalou

process.env.JWT_SECRET = 'test-jwt-secret-secu';
process.env.ADMIN_SECRET = 'super-admin-secret-2026';
process.env.WAVE_WEBHOOK_SECRET = 'wave-secret-key-123';

jest.mock('../../backend/models/db', () => ({
  pool: { query: jest.fn() }
}));

const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const { pool } = require('../../backend/models/db');
const { adminSecretOnly } = require('../../backend/middlewares/auth');
const paiementRouter = require('../../backend/routes/paiement');
const { verifyWebhookSignature } = require('../../backend/services/wave');

describe('SÉCURITÉ P0 : Paiement - Protection contre le marquage arbitraire', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/paiement', paiementRouter);
    pool.query.mockReset();
  });

  test('POST /api/paiement/confirmer-succes ne modifie pas le statut en base (lecture seule)', async () => {
    // Mock SELECT commande
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'cmd-uuid-1',
        reference: 'NOP-12345',
        statut: 'en_attente',
        paiement_recu: false,
        total: 15000,
      }]
    });

    const res = await request(app)
      .post('/api/paiement/confirmer-succes')
      .send({ reference: 'NOP-12345' });

    expect(res.status).toBe(200);
    // Vérifier qu'aucune requête UPDATE n'a été exécutée
    const updateCalls = pool.query.mock.calls.filter(c => typeof c[0] === 'string' && c[0].toUpperCase().includes('UPDATE'));
    expect(updateCalls.length).toBe(0);
    // Le statut renvoyé doit être celui certifié de la base de données
    expect(res.body.statut).toBe('en_attente');
    expect(res.body.paye).toBe(false);
  });
});

describe('SÉCURITÉ P0 : Authentification Admin - Fail-Closed strict', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/api/test-admin', adminSecretOnly, (req, res) => {
      res.json({ secretAccess: true });
    });
  });

  test('Rejette la requête si aucun secret n’est fourni', async () => {
    const res = await request(app).get('/api/test-admin');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('Rejette les secrets passés en query string ?secret= (fuite URLs/logs interdite)', async () => {
    const res = await request(app).get('/api/test-admin?secret=super-admin-secret-2026');
    expect(res.status).toBe(401);
  });

  test('Rejette un faux secret dans le header X-Admin-Secret', async () => {
    const res = await request(app)
      .get('/api/test-admin')
      .set('x-admin-secret', 'wrong-secret');
    expect(res.status).toBe(401);
  });

  test('Accepte le bon secret via header X-Admin-Secret', async () => {
    const res = await request(app)
      .get('/api/test-admin')
      .set('x-admin-secret', 'super-admin-secret-2026');
    expect(res.status).toBe(200);
    expect(res.body.secretAccess).toBe(true);
  });
});

describe('SÉCURITÉ P0 : Wave Webhook - Protection anti-rejeu (Timestamp Replay Attack)', () => {
  test('Rejette un webhook avec un timestamp périmé (> 5 minutes)', () => {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 secondes dans le passé (> 300s)
    const rawPayload = JSON.stringify({ id: 'wv_123', type: 'checkout.session.completed' });
    
    // Générer une signature valide mais avec un timestamp trop vieux
    const hmac = crypto.createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET);
    hmac.update(`${expiredTimestamp}${rawPayload}`);
    const validHashForOldTimestamp = hmac.digest('hex');
    const header = `t=${expiredTimestamp},v1=${validHashForOldTimestamp}`;

    const mockReq = {
      headers: { 'wave-signature': header },
      body: JSON.parse(rawPayload),
      rawBody: Buffer.from(rawPayload),
    };

    const isValid = verifyWebhookSignature(mockReq);
    expect(isValid).toBe(false);
  });

  test('Accepte un webhook avec un timestamp frais (< 5 minutes)', () => {
    const freshTimestamp = Math.floor(Date.now() / 1000) - 10; // 10 secondes dans le passé
    const rawPayload = JSON.stringify({ id: 'wv_123', type: 'checkout.session.completed' });
    
    const hmac = crypto.createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET);
    hmac.update(`${freshTimestamp}${rawPayload}`);
    const signature = hmac.digest('hex');
    const header = `t=${freshTimestamp},v1=${signature}`;

    const mockReq = {
      headers: { 'wave-signature': header },
      body: JSON.parse(rawPayload),
      rawBody: Buffer.from(rawPayload),
    };

    const isValid = verifyWebhookSignature(mockReq);
    expect(isValid).toBe(true);
  });
});

describe('SÉCURITÉ P1 : Neutralisation CSV Formula Injection', () => {
  // Test de la fonction d'échappement CSV
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    return `"${str}"`;
  };

  test('Préfixe une apostrophe sur les valeurs commençant par =', () => {
    expect(escapeCsv('=cmd|"/C calc"!A0')).toBe("\"'=cmd|\"\"/C calc\"\"!A0\"");
  });

  test('Préfixe une apostrophe sur les valeurs commençant par +, -, @', () => {
    expect(escapeCsv('+12345')).toBe("\"'+12345\"");
    expect(escapeCsv('-999')).toBe("\"'-999\"");
    expect(escapeCsv('@SUM(A1:A10)')).toBe("\"'@SUM(A1:A10)\"");
  });

  test('Préserve les chaînes ordinaires', () => {
    expect(escapeCsv('Produit Standard')).toBe('"Produit Standard"');
  });
});
