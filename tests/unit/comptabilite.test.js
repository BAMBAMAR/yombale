// Tests unitaires — routes/comptabilite.js (logique vente/stock)
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const { pool } = require('../../backend/models/db');
const comptabiliteRouter = require('../../backend/routes/comptabilite');

const app = express();
app.use(express.json());
app.use('/api/comptabilite', comptabiliteRouter);

const token = jwt.sign({ userId: 'user-1' }, process.env.JWT_SECRET);
const auth = `Bearer ${token}`;
const boutiqueId = 'abe0a264-001c-4e28-9e7b-c4ee6da47e3b';
const produitId = '4e4c3e49-9fe9-4557-ae16-fd54d2d2e535';
const zoneId = '811fc99d-604d-4714-ba4f-8d1dba1d19f7';

beforeEach(() => {
  pool.query.mockReset();
});

describe('POST /api/comptabilite/:boutiqueId/ventes', () => {
  test('calcule le montant total avec frais de livraison et décrémente le stock', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, nom: 'Ma boutique' }] }) // ownsBoutique
      .mockResolvedValueOnce({ rows: [{ nom: 'iPhone 14', stock_quantite: 5 }] }) // produit
      .mockResolvedValueOnce({ rows: [{ prix: 2000 }] }) // zone
      .mockResolvedValueOnce({ rows: [{ id: 'vente-1', montant_total: 102000 }] }) // insert vente
      .mockResolvedValueOnce({ rows: [] }); // update stock

    const res = await request(app)
      .post(`/api/comptabilite/${boutiqueId}/ventes`)
      .set('Authorization', auth)
      .send({ produit_id: produitId, quantite: 2, prix_unitaire: 50000, zone_livraison_id: zoneId });

    expect(res.status).toBe(201);
    const insertCall = pool.query.mock.calls[3];
    expect(insertCall[1][8]).toBe(102000); // montant_total = 2*50000 + 2000
    const updateCall = pool.query.mock.calls[4];
    expect(updateCall[0]).toMatch(/UPDATE boutique_produits/);
  });

  test('refuse si stock insuffisant', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, nom: 'Ma boutique' }] })
      .mockResolvedValueOnce({ rows: [{ nom: 'iPhone 14', stock_quantite: 1 }] });

    const res = await request(app)
      .post(`/api/comptabilite/${boutiqueId}/ventes`)
      .set('Authorization', auth)
      .send({ produit_id: produitId, quantite: 5, prix_unitaire: 50000 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Stock insuffisant/);
  });

  test('refuse l\'accès si la boutique n\'appartient pas à l\'utilisateur', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // ownsBoutique → aucune ligne

    const res = await request(app)
      .post(`/api/comptabilite/${boutiqueId}/ventes`)
      .set('Authorization', auth)
      .send({ quantite: 1, prix_unitaire: 1000 });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/comptabilite/:boutiqueId/zones', () => {
  test('crée une zone de livraison', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId }] }) // ownsBoutique
      .mockResolvedValueOnce({ rows: [{ id: zoneId, nom: 'Dakar', prix: 1000 }] }); // insert

    const res = await request(app)
      .post(`/api/comptabilite/${boutiqueId}/zones`)
      .set('Authorization', auth)
      .send({ nom: 'Dakar', prix: 1000 });

    expect(res.status).toBe(201);
    expect(res.body.nom).toBe('Dakar');
  });
});
