process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const request = require('supertest');
const app = require('../../backend/app');
const { pool } = require('../../backend/models/db');

describe('SUITE EXHAUSTIVE DE TESTS — EXPÉRIENCE ACHETEUR NOPALOU', () => {
  let boutiqueId = '11111111-2222-3333-4444-555555555555';
  let boutiqueSlug = 'dievo-style';
  let produitId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  let testCmdRef = 'CMD-2026-TEST-ACHETEUR';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SPEC ACHETEUR 01 & 02 — Avis Clients & Notes Étoilées (1 à 5 ⭐)', () => {
    test('1.1 Publication d\'un avis client certifié (HTTP 201)', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: boutiqueId }] }); // resolution slug
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'avis-1', boutique_id: boutiqueId, produit_id: produitId,
          client_nom: 'Fatou Ndiaye', note: 5, commentaire: 'Superbe maillot', commande_ref: testCmdRef
        }]
      });

      const res = await request(app)
        .post(`/api/boutiques/${boutiqueSlug}/produits/${produitId}/avis`)
        .send({
          client_nom: 'Fatou Ndiaye',
          note: 5,
          commentaire: 'Superbe maillot',
          commande_ref: testCmdRef
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.avis.note).toBe(5);
    });

    test('1.2 Consultation des avis publics et calcul de la moyenne (HTTP 200)', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: boutiqueId }] }); // resolution slug
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 'avis-1', client_nom: 'Fatou Ndiaye', note: 5, commentaire: 'Parfait', created_at: new Date() },
          { id: 'avis-2', client_nom: 'Moussa Diop', note: 4, commentaire: 'Très bon', created_at: new Date() }
        ]
      });

      const res = await request(app)
        .get(`/api/boutiques/${boutiqueSlug}/produits/${produitId}/avis`);

      expect(res.statusCode).toBe(200);
      expect(res.body.total_avis).toBe(2);
      expect(res.body.note_moyenne).toBe(4.5);
      expect(Array.isArray(res.body.avis)).toBe(true);
    });

    test('1.3 Rejet si le nom ou le commentaire est manquant (HTTP 400)', async () => {
      const res = await request(app)
        .post(`/api/boutiques/${boutiqueSlug}/produits/${produitId}/avis`)
        .send({
          client_nom: '',
          note: 5,
          commentaire: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('SPEC ACHETEUR 04 — Suivi de Commande en Temps Réel (/suivi-commande)', () => {
    test('2.1 Recherche du statut de commande par référence (HTTP 200)', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'cmd-1', reference: testCmdRef, client_nom: 'Fatou Ndiaye',
          client_telephone: '770000000', statut: 'en_preparation', montant_total: 16500,
          methode_paiement: 'wave', boutique_nom: 'Dievo Style'
        }]
      });

      const res = await request(app)
        .get('/api/boutiques/commandes/suivi')
        .query({ ref: testCmdRef });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.commandes.length).toBe(1);
      expect(res.body.commandes[0].client_nom).toBe('Fatou Ndiaye');
      expect(res.body.commandes[0].statut).toBe('en_preparation');
    });

    test('2.2 Recherche du suivi par numéro de téléphone (HTTP 200)', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'cmd-1', reference: testCmdRef, client_nom: 'Fatou Ndiaye',
          client_telephone: '770000000', statut: 'en_preparation', montant_total: 16500,
          methode_paiement: 'wave', boutique_nom: 'Dievo Style'
        }]
      });

      const res = await request(app)
        .get('/api/boutiques/commandes/suivi')
        .query({ tel: '770000000' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.commandes.length).toBe(1);
    });

    test('2.3 Rejet si ni la référence ni le téléphone ne sont fournis (HTTP 400)', async () => {
      const res = await request(app)
        .get('/api/boutiques/commandes/suivi');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});
