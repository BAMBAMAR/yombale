// tests/unit/immo-favoris-and-resolver.test.js
// Tests de non-régression pour IMM-001 (Résolveur Agences) et IMM-002 (Favoris multi-appareils)

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');

const entitesRouter = require('../../backend/routes/entites');
const favorisRouter = require('../../backend/routes/favoris');
const { pool } = require('../../backend/models/db');
const { infererTransaction, infererTypeBien } = require('../../backend/scripts/consolidate-immo-classifiees');

describe('IMM-001 : Résolveur Universel d\'Agences', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/api/entites', entitesRouter);
  });

  test('Doit résoudre un alias statique /agences', async () => {
    const res = await supertest(app).get('/api/entites/resoudre/agences');
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.type).toBe('alias');
    expect(res.body.url).toBe('/agences');
  });

  test('Doit résoudre le slug d\'une agence existante', async () => {
    const res = await supertest(app).get('/api/entites/resoudre/amar-immo');
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.type).toBe('agence_immo');
    expect(res.body.url).toBe('/agences/amar-immo');
  });

  test('Doit nettoyer un préfixe WhatsApp comme agenceamar-immo', async () => {
    const res = await supertest(app).get('/api/entites/resoudre/agenceamar-immo');
    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.type).toBe('agence_immo');
    expect(res.body.url).toBe('/agences/amar-immo');
  });
});

describe('IMM-002 : API Favoris Cloud Multi-Appareils', () => {
  let app;
  let testToken;
  let testUserId;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/favoris', favorisRouter);

    const { rows } = await pool.query('SELECT id, email FROM utilisateurs LIMIT 1');
    if (rows[0]) {
      testUserId = rows[0].id;
      testToken = jwt.sign({ userId: rows[0].id, email: rows[0].email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    }
  });

  afterAll(async () => {
    if (testUserId) {
      await pool.query('DELETE FROM utilisateurs_favoris WHERE utilisateur_id = $1 AND entite_id LIKE \'unit-test-%\'', [testUserId]);
    }
  });

  test('Refuse l\'accès sans token', async () => {
    const res = await supertest(app).get('/api/favoris');
    expect(res.status).toBe(401);
  });

  test('Ajoute un favori via POST /api/favoris', async () => {
    if (!testToken) return;
    const res = await supertest(app)
      .post('/api/favoris')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ id: 'unit-test-fav-1', type: 'immo' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.favori.id).toBe('unit-test-fav-1');
    expect(res.body.favori.type).toBe('immo');
  });

  test('Récupère les favoris via GET /api/favoris', async () => {
    if (!testToken) return;
    const res = await supertest(app)
      .get('/api/favoris')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.favoris)).toBe(true);
    expect(res.body.favoris.some(f => f.id === 'unit-test-fav-1')).toBe(true);
  });

  test('Effectue un bulk-sync idempotent via POST /api/favoris/bulk-sync', async () => {
    if (!testToken) return;
    const res = await supertest(app)
      .post('/api/favoris/bulk-sync')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        favoris: [
          { id: 'unit-test-fav-1', type: 'immo' },
          { id: 'unit-test-fav-2', type: 'produit' },
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.favoris.some(f => f.id === 'unit-test-fav-2')).toBe(true);
  });

  test('Supprime un favori via DELETE /api/favoris/:type/:id', async () => {
    if (!testToken) return;
    const res = await supertest(app)
      .delete('/api/favoris/immo/unit-test-fav-1')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('IMM-003 : Inférences Décloisonnement Catalogue', () => {
  test('Infère correctement la transaction selon le titre', () => {
    expect(infererTransaction('Appartement F4 à louer aux Almadies')).toBe('location');
    expect(infererTransaction('Terrain 300m2 TF à vendre à Saly')).toBe('vente');
    expect(infererTransaction('Chambre meublée climatisée')).toBe('location');
  });

  test('Infère correctement le type de bien selon le titre', () => {
    expect(infererTypeBien('Terrain agricole 1 hectare Thiès')).toBe('terrain');
    expect(infererTypeBien('Villa R+1 avec piscine')).toBe('villa');
    expect(infererTypeBien('Studio américain meublé')).toBe('studio');
    expect(infererTypeBien('Local commercial centre ville')).toBe('bureau');
    expect(infererTypeBien('Magnifique F3 vue mer')).toBe('appartement');
  });
});
