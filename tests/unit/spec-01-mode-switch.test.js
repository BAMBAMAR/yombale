// Tests unitaires — routes/boutiques.js (Spec 01 — Mode Switcher Admin)
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

describe('PUT /api/boutiques/:id/mode (Spec 01)', () => {
  test('met à jour le mode_fonctionnement avec succes vers pure_player', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123', nom: 'Ma Boutique Test' }] }) // checkBoutiqueAccess
      .mockResolvedValueOnce({ rows: [] }); // UPDATE boutiques

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/mode`)
      .set('Authorization', auth)
      .send({ mode_fonctionnement: 'pure_player' });

    expect(res.status).toBe(200);
    expect(res.body.succes).toBe(true);
    expect(res.body.mode_fonctionnement).toBe('pure_player');
    expect(pool.query.mock.calls[1][0]).toMatch(/UPDATE boutiques SET mode_fonctionnement=\$1/);
    expect(pool.query.mock.calls[1][1][0]).toBe('pure_player');
  });

  test('met à jour le mode_fonctionnement vers hybride_pos', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123', nom: 'Ma Boutique Test' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/mode`)
      .set('Authorization', auth)
      .send({ mode_fonctionnement: 'hybride_pos' });

    expect(res.status).toBe(200);
    expect(res.body.succes).toBe(true);
    expect(res.body.mode_fonctionnement).toBe('hybride_pos');
  });

  test('refuse un mode_fonctionnement invalide avec HTTP 400', async () => {
    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/mode`)
      .set('Authorization', auth)
      .send({ mode_fonctionnement: 'invalid_mode_xyz' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Mode d'exploitation invalide/);
  });

  test('refuse l\'accès à une boutique inexistante ou non autorisée (HTTP 404)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // checkBoutiqueAccess → aucune ligne

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/mode`)
      .set('Authorization', auth)
      .send({ mode_fonctionnement: 'pure_player' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Boutique introuvable ou accès refusé/);
  });
});

describe('GET /api/boutiques/:id (Spec 01)', () => {
  test('renvoie la propriété mode_fonctionnement dans la réponse', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{
          id: boutiqueId,
          nom: 'Ma Boutique Test',
          mode_fonctionnement: 'pure_player',
          actif: true
        }]
      })
      .mockResolvedValueOnce({ rows: [] }); // INSERT INTO analytics_events

    const res = await request(app).get(`/api/boutiques/${boutiqueId}`);

    expect(res.status).toBe(200);
    expect(res.body.mode_fonctionnement).toBe('pure_player');
  });
});
