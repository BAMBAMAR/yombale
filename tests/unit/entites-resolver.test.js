// Tests unitaires — routes/entites.js (Résolveur universel d'entités)
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const request = require('supertest');
const express = require('express');
const { pool } = require('../../backend/models/db');
const entitesRouter = require('../../backend/routes/entites');

const app = express();
app.use(express.json());
app.use('/api/entites', entitesRouter);

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /api/entites/resoudre/:id — Résolution universelle d\'entités', () => {
  test('résout les alias statiques sans requête DB (ex: boutique, commandes, mes-annonces)', async () => {
    const resBoutique = await request(app).get('/api/entites/resoudre/boutique');
    expect(resBoutique.status).toBe(200);
    expect(resBoutique.body).toEqual({ found: true, type: 'alias', url: '/boutique?tab=commandes' });

    const resCmd = await request(app).get('/api/entites/resoudre/commandes');
    expect(resCmd.status).toBe(200);
    expect(resCmd.body).toEqual({ found: true, type: 'alias', url: '/boutique?tab=commandes' });

    const resAnnonces = await request(app).get('/api/entites/resoudre/mes-annonces');
    expect(resAnnonces.status).toBe(200);
    expect(resAnnonces.body).toEqual({ found: true, type: 'alias', url: '/compte?tab=mes-annonces' });

    expect(pool.query).not.toHaveBeenCalled();
  });

  test('résout une référence de commande commençant par CMD- ou PAY-', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ reference: 'CMD-2026-XYZ' }] });

    const res = await request(app).get('/api/entites/resoudre/CMD-2026-XYZ');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ found: true, type: 'commande', url: '/suivi-commande?ref=CMD-2026-XYZ' });
  });

  test('résout un bien immobilier par son UUID', async () => {
    const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    pool.query.mockResolvedValueOnce({ rows: [{ id: uuid }] }); // annonces_immo

    const res = await request(app).get(`/api/entites/resoudre/${uuid}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ found: true, type: 'immo', url: `/immo/${uuid}` });
  });

  test('résout une annonce classifiée par son UUID si absente de l\'immo', async () => {
    const uuid = '11111111-2222-3333-4444-555555555555';
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // annonces_immo (non trouvé)
      .mockResolvedValueOnce({ rows: [{ id: uuid }] }); // annonces_classifiees (trouvé)

    const res = await request(app).get(`/api/entites/resoudre/${uuid}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ found: true, type: 'annonce', url: `/annonces/${uuid}` });
  });

  test('résout un produit de boutique marchande par son UUID', async () => {
    const prodUuid = '99999999-8888-7777-6666-555555555555';
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // annonces_immo
      .mockResolvedValueOnce({ rows: [] }) // annonces_classifiees
      .mockResolvedValueOnce({ rows: [{ id: prodUuid, slug: 'tech-dakar', boutique_id: 'b1' }] }); // boutique_produits

    const res = await request(app).get(`/api/entites/resoudre/${prodUuid}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      found: true,
      type: 'boutique_produit',
      url: `/boutiques/tech-dakar/produits/${prodUuid}`,
    });
  });

  test('résout une boutique par son slug textuel', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 'b-id', slug: 'dievo-style' }] }); // boutiques by slug

    const res = await request(app).get('/api/entites/resoudre/dievo-style');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      found: true,
      type: 'boutique',
      url: '/boutiques/dievo-style',
    });
  });

  test('résout un produit du comparateur par son ID numérique', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // boutiques by slug
      .mockResolvedValueOnce({ rows: [{ id: 42 }] }); // produits

    const res = await request(app).get('/api/entites/resoudre/42');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      found: true,
      type: 'produit',
      url: '/produit/42',
    });
  });

  test('renvoie found: false avec url fallback / si aucun match', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // boutiques by slug
      .mockResolvedValueOnce({ rows: [] }) // produits
      .mockResolvedValueOnce({ rows: [] }); // telecom

    const res = await request(app).get('/api/entites/resoudre/identifiant-inexistant-12345');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      found: false,
      type: 'inconnu',
      url: '/',
    });
  });
});
