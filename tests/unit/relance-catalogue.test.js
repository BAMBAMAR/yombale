// tests/unit/relance-catalogue.test.js — Tests unitaires du module de relance catalogue marchands
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_SECRET = 'test-admin-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppNotification: jest.fn().mockResolvedValue({ success: true, messageId: 'wa-mock-123' }),
  normalisePhone: jest.fn(p => String(p).replace(/\D/g, '')),
}));
jest.mock('../../backend/lib/settingsCache', () => {
  const store = {
    relance_catalogue_actif: 'true',
    relance_catalogue_seuil: '1',
    relance_catalogue_delai_heures: '24',
    relance_catalogue_intervalle_jours: '7',
    relance_catalogue_titre: '🛍️ Nopalou — Ajoutez vos produits',
    relance_catalogue_template: 'Bonjour {prenom}, votre boutique {boutique_nom} a {nb_produits} produit(s). Lien : {lien_boutique}',
  };
  return {
    get: jest.fn(async k => store[k] || ''),
    getNum: jest.fn(async (k, def) => (store[k] !== undefined ? Number(store[k]) : def)),
    getBool: jest.fn(async (k, def) => (store[k] !== undefined ? store[k] === 'true' : def)),
    set: jest.fn(async (k, v) => { store[k] = String(v); }),
  };
});

const request = require('supertest');
const express = require('express');
const { pool } = require('../../backend/models/db');
const { sendWhatsAppNotification } = require('../../backend/services/whatsapp');
const {
  genererMessageRelance,
  envoyerRelanceCatalogueBoutique,
  batchRelancerCatalogueBoutiques,
  recupererBoutiquesEligiblesRelance,
  executerCronRelanceCatalogue,
} = require('../../backend/services/relance-catalogue');

const boutiquesRouter = require('../../backend/routes/boutiques');
const app = express();
app.use(express.json());
app.use('/api/boutiques', boutiquesRouter);

beforeEach(() => {
  pool.query.mockReset();
  sendWhatsAppNotification.mockClear();
});

describe('Module de Relance & Onboarding Catalogue Marchands', () => {
  describe('1. Compilation des Templates et Variables Dynamiques', () => {
    test('remplace correctement {prenom}, {boutique_nom}, {nb_produits} et {lien_boutique}', () => {
      const boutique = {
        id: 'b-123-uuid',
        nom: 'Al Amine Tech',
        proprietaire_prenom: 'Moussa',
        proprietaire_nom: 'Diop',
      };

      const result = genererMessageRelance({
        boutique,
        nbProduits: 0,
        template: 'Salut {prenom} ({nom}), ta boutique {boutique_nom} compte {nb_produits} article. Lien: {lien_boutique} et POS: {lien_caisse}',
        titre: 'Ajout de produits',
      });

      expect(result.textMessage).toContain('Salut Moussa (Diop), ta boutique Al Amine Tech compte 0 article.');
      expect(result.textMessage).toContain('/boutique?tab=produits&id=b-123-uuid');
      expect(result.textMessage).toContain('/boutique/caisse?manage=b-123-uuid');
      expect(result.title).toBe('Ajout de produits');
      expect(result.buttonParam).toBe('boutique?tab=produits&id=b-123-uuid');
    });

    test('utilise le premier mot du nom si prenom absent', () => {
      const boutique = {
        id: 'b-456-uuid',
        nom: 'Fatou Couture',
        proprietaire_nom: 'Fatoumata Binetou Ndiaye',
      };

      const result = genererMessageRelance({
        boutique,
        nbProduits: 2,
        template: 'Bonjour {prenom} de {boutique_nom}',
      });

      expect(result.textMessage).toBe('Bonjour Fatoumata de Fatou Couture');
    });
  });

  describe('2. Envoi de Relance Unitaire et Batch (Service)', () => {
    test('envoie la notification WhatsApp et met à jour l\'historique en DB', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'b-123',
              nom: 'Boutique Test',
              slug: 'boutique-test',
              telephone: '771234567',
              whatsapp: '771234567',
              proprietaire_prenom: 'Ibrahima',
              proprietaire_nom: 'Sow',
              nb_produits: 0,
            },
          ],
        }) // SELECT boutique
        .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE boutiques

      const res = await envoyerRelanceCatalogueBoutique('b-123', {
        messageCustom: 'Message personnalisé pour {boutique_nom}',
      });

      expect(res.success).toBe(true);
      expect(res.boutiqueId).toBe('b-123');
      expect(sendWhatsAppNotification).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE boutiques'),
        ['b-123']
      );
    });

    test('traite un lot de boutiques (batch)', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'b1', nom: 'B1', whatsapp: '770000001', proprietaire_nom: 'P1', nb_produits: 0 }],
        })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ id: 'b2', nom: 'B2', telephone: '770000002', proprietaire_nom: 'P2', nb_produits: 1 }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      const res = await batchRelancerCatalogueBoutiques(['b1', 'b2']);
      expect(res.successCount).toBe(2);
      expect(res.errorCount).toBe(0);
      expect(sendWhatsAppNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Requête des Boutiques Éligibles au Cron', () => {
    test('filtre par seuil de produits et respecte l\'intervalle anti-harcèlement', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 'b1', nom: 'Boutique Vide', nb_produits: 0, whatsapp: '771112233' },
          { id: 'b2', nom: 'Boutique 1 Prod', nb_produits: 1, whatsapp: '774445566' },
        ],
      });

      const list = await recupererBoutiquesEligiblesRelance();
      expect(list.length).toBe(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) <= $3'),
        [24, 7, 1]
      );
    });
  });

  describe('4. Routes API Admin', () => {
    test('POST /api/boutiques/admin/relance-catalogue rejette sans secret admin', async () => {
      const res = await request(app)
        .post('/api/boutiques/admin/relance-catalogue')
        .send({ boutiqueId: 'b-123' });

      expect(res.status).toBe(401);
    });

    test('POST /api/boutiques/admin/relance-catalogue exécute la relance avec le header secret', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'b-test',
              nom: 'Boutique API',
              whatsapp: '778889900',
              proprietaire_prenom: 'Awa',
              nb_produits: 0,
            },
          ],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post('/api/boutiques/admin/relance-catalogue')
        .set('X-Admin-Secret', 'test-admin-secret')
        .send({ boutiqueId: 'b-test' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /api/boutiques/admin/relance-catalogue/config renvoie la config et les stats', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            count_0: '5',
            count_1: '3',
            count_2: '2',
            count_3: '1',
            count_4_5: '4',
            count_plus_5: '12',
            total_boutiques: '27',
          },
        ],
      });

      const res = await request(app)
        .get('/api/boutiques/admin/relance-catalogue/config')
        .set('X-Admin-Secret', 'test-admin-secret');

      expect(res.status).toBe(200);
      expect(res.body.config).toBeDefined();
      expect(res.body.config.seuil).toBe(1);
      expect(res.body.stats.count_0).toBe('5');
    });

    test('PUT /api/boutiques/admin/relance-catalogue/config met à jour les paramètres', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const res = await request(app)
        .put('/api/boutiques/admin/relance-catalogue/config')
        .set('X-Admin-Secret', 'test-admin-secret')
        .send({
          actif: true,
          seuil: 2,
          delai_heures: 48,
          intervalle_jours: 14,
          titre: 'Nouveau titre relance',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updates.relance_catalogue_actif).toBe('true');
      expect(res.body.updates.relance_catalogue_seuil).toBe('2');
      expect(res.body.updates.relance_catalogue_delai_heures).toBe('48');
    });
  });
});
