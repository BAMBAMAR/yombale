// Tests unitaires — Spec 03 : Moteur de Promotions & Codes Promo
process.env.JWT_SECRET = 'test-secret';

// AUD-020 : verifierToken simulé (voir tests/helpers/mock-auth.js)
jest.mock('../../backend/middlewares/auth', () => require('../helpers/mock-auth'));

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../backend/lib/settingsCache', () => ({
  get: jest.fn().mockResolvedValue(''),
  getBool: jest.fn().mockResolvedValue(false),
  getNum: jest.fn().mockResolvedValue(0),
}));

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
const promoId = '3a2b1c0d-4e5f-6a7b-8c9d-0e1f2a3b4c5d';

beforeEach(() => {
  pool.query.mockReset();
});

describe('POST /api/boutiques/:id/promotions (Spec 03)', () => {
  test('crée un code promo valide en pourcentage (HTTP 201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] }) // checkBoutiqueAccess
      .mockResolvedValueOnce({
        rows: [{
          id: promoId, boutique_id: boutiqueId, code: 'OCTOBRE20',
          type_remise: 'pourcentage', valeur: 20, min_achat: 10000
        }]
      });

    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/promotions`)
      .set('Authorization', auth)
      .send({ code: 'OCTOBRE20', type_remise: 'pourcentage', valeur: 20, min_achat: 10000 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.promotion.code).toBe('OCTOBRE20');
  });

  test('refuse la création sans code ou avec type_remise invalide (HTTP 400)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] });

    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/promotions`)
      .set('Authorization', auth)
      .send({ code: '', type_remise: 'invalid_type', valeur: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/code promo est obligatoire/);
  });
});

describe('POST /api/boutiques/promotions/valider (Spec 03)', () => {
  test('valide un code promo 20% sur 25 000 FCFA -> réduction de 5 000 FCFA', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: promoId, boutique_id: boutiqueId, code: 'OCTOBRE20',
        type_remise: 'pourcentage', valeur: 20, min_achat: 10000,
        limite_utilisation: 50, fois_utilise: 2, actif: true
      }]
    });

    const res = await request(app)
      .post('/api/boutiques/promotions/valider')
      .send({ boutique_id: boutiqueId, code: 'octobre20', total_panier: 25000 });

    expect(res.status).toBe(200);
    expect(res.body.valide).toBe(true);
    expect(res.body.montant_reduction).toBe(5000);
    expect(res.body.nouveau_total).toBe(20000);
  });

  test('valide un code promo fixe de 3 000 FCFA sur 15 000 FCFA', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: promoId, boutique_id: boutiqueId, code: 'SOLDE3000',
        type_remise: 'fixe', valeur: 3000, min_achat: 5000,
        limite_utilisation: 100, fois_utilise: 0, actif: true
      }]
    });

    const res = await request(app)
      .post('/api/boutiques/promotions/valider')
      .send({ boutique_id: boutiqueId, code: 'SOLDE3000', total_panier: 15000 });

    expect(res.status).toBe(200);
    expect(res.body.valide).toBe(true);
    expect(res.body.montant_reduction).toBe(3000);
    expect(res.body.nouveau_total).toBe(12000);
  });

  test('refuse le code promo si total_panier < min_achat (HTTP 400)', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: promoId, boutique_id: boutiqueId, code: 'VIPVIP',
        type_remise: 'pourcentage', valeur: 15, min_achat: 50000,
        actif: true
      }]
    });

    const res = await request(app)
      .post('/api/boutiques/promotions/valider')
      .send({ boutique_id: boutiqueId, code: 'VIPVIP', total_panier: 20000 });

    expect(res.status).toBe(400);
    expect(res.body.valide).toBe(false);
    expect(res.body.error).toMatch(/achat minimum/);
  });

  test('refuse le code promo si expiré ou inexistant (HTTP 400)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/boutiques/promotions/valider')
      .send({ boutique_id: boutiqueId, code: 'EXPIRE99', total_panier: 20000 });

    expect(res.status).toBe(400);
    expect(res.body.valide).toBe(false);
    expect(res.body.error).toMatch(/Code promo expiré ou invalide/);
  });
});

describe('POST /api/comptabilite/:boutiqueId/commandes avec Code Promo (Spec 03)', () => {
  test('applique la déduction du code promo et met à jour les promotions', async () => {
    const comptabiliteRouter = require('../../backend/routes/comptabilite');
    app.use('/api/comptabilite', comptabiliteRouter);

    // AUD-073 : le prix vient de la base (produit de la boutique) ; le montant de remise envoyé par le client est ignoré.
    // Le simulateur répond selon la requête SQL (l'ordre des appels n'est plus figé).
    const produitId = '4a52f5a7-d29b-457a-b92e-67022c84c47a';
    let insertCommande = null;
    pool.query.mockImplementation(async (sql, params) => {
      const s = String(sql);
      if (/FROM boutiques/.test(s)) return { rows: [{ id: boutiqueId, nom: 'Ma Boutique', telephone: '771234567', whatsapp: '771234567', utilisateur_id: 'user-123', actif: true }] };
      if (/FROM boutique_produits/.test(s)) return { rows: [{ id: produitId, nom: 'Chaussures Sport', prix: 20000, prix_achat: 10000, stock_quantite: 5, en_stock: true, statut_moderation: 'actif' }] };
      if (/FROM boutique_promotions/.test(s)) return { rows: [{ id: promoId, code: 'SOLDE2000', type_remise: 'fixe', valeur: 2000, actif: true, limite_utilisation: null, fois_utilise: 0, min_achat: null }] };
      if (/INSERT INTO commandes_boutique\s*\(/.test(s)) {
        insertCommande = params;
        return { rows: [{ id: 'cmd-promo-1', reference: params[0], nom_produit: params[3], quantite: params[4], montant_total: params[6], note: params[10] }] };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .post(`/api/comptabilite/${boutiqueId}/commandes`)
      .send({
        client_nom: 'Moussa Diop',
        client_telephone: '770001122',
        items: [{ produit_id: produitId, quantite: 1, prix_unitaire: 1 }],
        code_promo: 'SOLDE2000',
        montant_reduction: 99999,
      });

    expect(res.status).toBe(201);
    expect(res.body.commande).toBeDefined();
    expect(res.body.commande.montant_total).toBe(18000);
    expect(insertCommande).not.toBeNull();
    expect(res.body.commande.note).toMatch(/SOLDE2000 \(-2000 FCFA\)/);
  });
});

