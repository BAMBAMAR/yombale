// Tests unitaires — Spec 09 (Club VIP mutualisé) & Spec 17 (Moteur A/B Testing)
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

const token = jwt.sign({ userId: 'user-vip-123' }, process.env.JWT_SECRET);
const auth = `Bearer ${token}`;
const boutiqueId = '9b1deb4d-3b7d-416b-9f47-a87799d21e8a';

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /api/boutiques/club-vip/statut (Spec 09)', () => {
  test('retourne le palier Bronze par défaut si téléphone absent ou invalide', async () => {
    const res = await request(app).get('/api/boutiques/club-vip/statut?telephone=123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.palier).toBe('Bronze');
    expect(res.body.reduction_livraison).toBe(0);
    expect(res.body.livraison_offerte).toBe(false);
  });

  test('calcule le palier Gold et remise 1 000 FCFA pour client avec 6 commandes', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ nb_commandes: '6', total_depense: '160000' }]
    });

    const res = await request(app).get('/api/boutiques/club-vip/statut?telephone=771234567');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.palier).toBe('Gold');
    expect(res.body.badge).toBe('Acheteur Vérifié Gold');
    expect(res.body.reduction_livraison).toBe(1000);
    expect(res.body.livraison_offerte).toBe(false);
    expect(res.body.prochain_palier.nom).toBe('Platine VIP');
  });

  test('calcule le palier Platine VIP avec livraison offerte pour grand acheteur', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ nb_commandes: '12', total_depense: '340000' }]
    });

    const res = await request(app).get('/api/boutiques/club-vip/statut?telephone=221770000000');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.palier).toBe('Platine VIP');
    expect(res.body.reduction_livraison).toBe(2500);
    expect(res.body.livraison_offerte).toBe(true);
    expect(res.body.prochain_palier).toBeNull();
  });
});

describe('Moteur A/B Testing Intégré (Spec 17)', () => {
  test('GET /api/boutiques/:id/ab-test retourne la configuration active (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // assurerTablesAbTest
      .mockResolvedValueOnce({
        rows: [{
          id: 'test-ab-1',
          boutique_id: boutiqueId,
          titre: 'Test Titre Vitrine',
          actif: true,
          repartition: 50,
          variante_a: { titre: 'Original' },
          variante_b: { titre: 'Challenger' }
        }]
      });

    const res = await request(app).get(`/api/boutiques/${boutiqueId}/ab-test`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.actif).toBe(true);
    expect(res.body.test.titre).toBe('Test Titre Vitrine');
  });

  test('POST /api/boutiques/:id/ab-test refuse sans authentification (HTTP 401)', async () => {
    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/ab-test`)
      .send({ titre: 'Test Invalide' });

    expect(res.status).toBe(401);
  });

  test('POST /api/boutiques/:id/ab-test crée le test A/B pour le marchand propriétaire (HTTP 201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-vip-123' }] }) // checkBoutiqueAccess
      .mockResolvedValueOnce({ rows: [] }) // assurerTablesAbTest
      .mockResolvedValueOnce({ rows: [] }) // update ancien test
      .mockResolvedValueOnce({
        rows: [{
          id: 'new-ab-test-id',
          boutique_id: boutiqueId,
          titre: 'Nouveau Test A/B CTA',
          actif: true,
          repartition: 50
        }]
      });

    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/ab-test`)
      .set('Authorization', auth)
      .send({
        titre: 'Nouveau Test A/B CTA',
        actif: true,
        repartition: 50,
        variante_a: { texte_cta: 'Commander' },
        variante_b: { texte_cta: 'Acheter en 1 Clic' }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.test.titre).toBe('Nouveau Test A/B CTA');
  });

  test('POST /api/boutiques/:id/ab-test/event enregistre un événement public (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // assurerTablesAbTest
      .mockResolvedValueOnce({ rows: [] }); // insert event

    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/ab-test/event`)
      .send({
        variante: 'B',
        type_evenement: 'clic_commande',
        session_id: 'sess_12345'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.enregistre).toBe(true);
  });

  test('GET /api/boutiques/:id/ab-test/results calcule les métriques de conversion', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-vip-123' }] }) // checkBoutiqueAccess
      .mockResolvedValueOnce({ rows: [] }) // assurerTablesAbTest
      .mockResolvedValueOnce({
        rows: [
          { variante: 'A', type_evenement: 'visite', total: '100' },
          { variante: 'A', type_evenement: 'achat', total: '5' },
          { variante: 'B', type_evenement: 'visite', total: '100' },
          { variante: 'B', type_evenement: 'achat', total: '12' },
        ]
      });

    const res = await request(app)
      .get(`/api/boutiques/${boutiqueId}/ab-test/results`)
      .set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resultats.variante_a.taux_conversion).toBe(5);
    expect(res.body.resultats.variante_b.taux_conversion).toBe(12);
    expect(res.body.resultats.gagnant).toBe('B');
    expect(res.body.resultats.statistiquement_significatif).toBe(true);
  });
});
