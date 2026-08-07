// Tests unitaires — Spec 02 : Checkout Web 1-Page Unifié & Cross-Sell
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const request = require('supertest');
const express = require('express');
const { pool } = require('../../backend/models/db');
const boutiquesRouter = require('../../backend/routes/boutiques');

const app = express();
app.use(express.json());
app.use('/api/boutiques', boutiquesRouter);

const boutiqueId = '9b1deb4d-3b7d-416b-9f47-a87799d21e8a';
const produitId = '4e4c3e49-9fe9-4557-ae16-fd54d2d2e535';

beforeEach(() => {
  pool.query.mockReset();
});

describe('POST /api/boutiques/commandes/express (Spec 02)', () => {
  test('enregistre une commande express 1-page avec succès (HTTP 201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, nom: 'Ma Boutique Tech' }] }) // Select boutique
      .mockResolvedValueOnce({ rows: [{ id: produitId, nom: 'Écouteurs sans fil', prix: 15000, stock_quantite: 10 }] }) // Select produit
      .mockResolvedValueOnce({ rows: [] }) // Update stock
      .mockResolvedValueOnce({ rows: [] }) // Insert commande
      .mockResolvedValueOnce({ rows: [] }); // Analytics event

    const res = await request(app)
      .post('/api/boutiques/commandes/express')
      .send({
        boutique_id: boutiqueId,
        client_nom: 'Moussa Ndiaye',
        client_telephone: '778009988',
        client_adresse: 'Fann Résidence',
        methode_paiement: 'wave',
        frais_livraison: 2000,
        articles: [
          { produit_id: produitId, quantite: 1, prix_unitaire: 15000 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.succes).toBe(true);
    expect(res.body.reference).toMatch(/^CMD-2026-/);
    expect(res.body.montant_total).toBe(17000); // 15000 + 2000
    expect(res.body.statut).toBe('en_attente');
  });

  test('refuse la commande si le nom ou téléphone est manquant (HTTP 400)', async () => {
    const res = await request(app)
      .post('/api/boutiques/commandes/express')
      .send({
        boutique_id: boutiqueId,
        client_nom: '',
        client_telephone: '778009988',
        articles: [{ produit_id: produitId, quantite: 1 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Nom et téléphone du client requis/);
  });

  test('refuse la commande si le panier d\'articles est vide (HTTP 400)', async () => {
    const res = await request(app)
      .post('/api/boutiques/commandes/express')
      .send({
        boutique_id: boutiqueId,
        client_nom: 'Fatou Sow',
        client_telephone: '771112233',
        articles: []
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Au moins un article est requis/);
  });

  test('refuse la commande si la boutique est introuvable (HTTP 400)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // Boutique introuvable

    const res = await request(app)
      .post('/api/boutiques/commandes/express')
      .send({
        boutique_id: boutiqueId,
        client_nom: 'Fatou Sow',
        client_telephone: '771112233',
        articles: [{ produit_id: produitId, quantite: 1, prix_unitaire: 5000 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Boutique introuvable/);
  });
});

describe('GET /api/boutiques/:id/produits/:prodId/cross-sell (Spec 02)', () => {
  test('retourne la liste des produits suggérés pour le cross-sell (HTTP 200)', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 'p2', nom: 'Coque de protection', prix: 3000, en_stock: true },
        { id: 'p3', nom: 'Film Incassable', prix: 2000, en_stock: true }
      ]
    });

    const res = await request(app).get(`/api/boutiques/${boutiqueId}/produits/${produitId}/cross-sell`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.produits)).toBe(true);
    expect(res.body.produits.length).toBe(2);
    expect(res.body.produits[0].nom).toBe('Coque de protection');
  });
});
