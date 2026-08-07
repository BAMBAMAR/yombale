// Tests unitaires — Spec 04 : Pixels de Tracking & Mesure ROAS
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

describe('PUT /api/boutiques/:id/pixels (Spec 04)', () => {
  test('sauvegarde les Pixel IDs Meta, TikTok et GA4 avec succès (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] }) // checkBoutiqueAccess
      .mockResolvedValueOnce({ rows: [] }); // UPDATE boutiques

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/pixels`)
      .set('Authorization', auth)
      .send({
        meta_pixel_id: '1234567890',
        tiktok_pixel_id: 'C12345678',
        ga4_id: 'G-XYZ99999'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pixels.meta_pixel_id).toBe('1234567890');
    expect(res.body.pixels.tiktok_pixel_id).toBe('C12345678');
    expect(res.body.pixels.ga4_id).toBe('G-XYZ99999');
  });

  test('refuse la mise à jour pour une boutique non autorisée (HTTP 403)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // Access denied

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/pixels`)
      .set('Authorization', auth)
      .send({ meta_pixel_id: '9999999' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Accès refusé/);
  });
});

describe('GET /api/boutiques/:id/pixels/public (Spec 04)', () => {
  test('retourne les Pixel IDs publics pour la vitrine (HTTP 200)', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        meta_pixel_id: '1234567890',
        tiktok_pixel_id: 'C12345678',
        ga4_id: 'G-XYZ99999'
      }]
    });

    const res = await request(app).get(`/api/boutiques/${boutiqueId}/pixels/public`);

    expect(res.status).toBe(200);
    expect(res.body.meta_pixel_id).toBe('1234567890');
    expect(res.body.tiktok_pixel_id).toBe('C12345678');
    expect(res.body.ga4_id).toBe('G-XYZ99999');
  });

  test('renvoie 404 si la boutique est introuvable', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get(`/api/boutiques/${boutiqueId}/pixels/public`);

    expect(res.status).toBe(404);
  });
});
