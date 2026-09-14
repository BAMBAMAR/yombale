// Tests unitaires — Analytics : Filtres ad-hoc date début / date fin & produit spécifique
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const { pool } = require('../../backend/models/db');
const analyticsRouter = require('../../backend/routes/analytics');

const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRouter);

const token = jwt.sign({ userId: 'user-analytics-1' }, process.env.JWT_SECRET);
const auth = `Bearer ${token}`;
const boutiqueId = '11111111-2222-3333-4444-555555555555';

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /api/analytics/boutique/:id avec filtres ad-hoc', () => {
  test('accepte des filtres de date personnalisés et retourne top_produits (HTTP 200)', async () => {
    // 1. check ownership
    pool.query.mockResolvedValueOnce({ rows: [{ id: boutiqueId }] });
    // 2. events count
    pool.query.mockResolvedValueOnce({
      rows: [{
        vues_total: '120',
        vues_ce_mois: '45',
        vues_7j: '12',
        clics_tel_total: '15',
        clics_tel_mois: '6',
        commandes_web_total: '8',
        vues_annonces_total: '0',
        vues_annonces_mois: '0',
      }]
    });
    // 3. cmdRows
    pool.query.mockResolvedValueOnce({
      rows: [{ total_ventes_web: '150000', panier_moyen_web: '18750', nb_commandes_web: '8' }]
    });
    // 4. comptaRows (ventes)
    pool.query.mockResolvedValueOnce({
      rows: [{ ca_global_total: '350000', panier_moyen_global: '25000', nb_ventes_global: '14' }]
    });
    // 5. promoRows
    pool.query.mockResolvedValueOnce({ rows: [{ nb_promotions: 2, utilisations_promo: 5 }] });
    // 6. bqRows
    pool.query.mockResolvedValueOnce({
      rows: [{ mode_fonctionnement: 'hybride_pos', meta_pixel_id: null, tiktok_pixel_id: null, ga4_id: null }]
    });
    // 7. historique
    pool.query.mockResolvedValueOnce({
      rows: [
        { jour: '2026-09-01', vues: '20', clics_tel: '2' },
        { jour: '2026-09-02', vues: '35', clics_tel: '5' },
      ]
    });
    // 8. topProduits
    pool.query.mockResolvedValueOnce({
      rows: [
        { produit_id: 'prod-1', nom_produit: 'Robe Bazin Riche', quantite_vendue: '5', ca_total: '125000' },
        { produit_id: 'prod-2', nom_produit: 'Sandale Cuir Touba', quantite_vendue: '8', ca_total: '80000' },
      ]
    });
    // 9. attributionRows
    pool.query.mockResolvedValueOnce({
      rows: [{ canal: 'instagram', nb_commandes: 5, montant_total: 95000 }]
    });

    const res = await request(app)
      .get(`/api/analytics/boutique/${boutiqueId}?date_debut=2026-09-01&date_fin=2026-09-10`)
      .set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.filtres.date_debut).toBe('2026-09-01');
    expect(res.body.filtres.date_fin).toBe('2026-09-10');
    expect(res.body.top_produits).toHaveLength(2);
    expect(res.body.top_produits[0].nom_produit).toBe('Robe Bazin Riche');
    expect(res.body.top_produits[0].ca_total).toBe(125000);
  });

  test('refuse l accès si l utilisateur n est pas propriétaire (HTTP 403)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get(`/api/analytics/boutique/${boutiqueId}`)
      .set('Authorization', auth);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Accès refusé/);
  });
});
