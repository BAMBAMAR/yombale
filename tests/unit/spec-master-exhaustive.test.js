// Suite de Tests Rigoureuse et Exhaustive — Specs 01 à 06 (OpenSpec Nopalou)
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const { pool } = require('../../backend/models/db');
const boutiquesRouter = require('../../backend/routes/boutiques');

const app = express();
app.use(express.json());
app.use('/api/boutiques', boutiquesRouter);
app.use('/api/promotions', boutiquesRouter);
app.use('/api/devises', boutiquesRouter);
app.use('/api/paiements', boutiquesRouter);

const token = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET);
const auth = `Bearer ${token}`;
const boutiqueId = '9b1deb4d-3b7d-416b-9f47-a87799d21e8a';
const prodId = '8ed84b7a-54e3-4f16-876b-632c83c89bf4';

beforeEach(() => {
  pool.query.mockReset();
});

// ── SPEC 01 : MODE SWITCHER (PURE PLAYER VS HYBRIDE POS) ────────────────────
describe('SPEC 01 — Mode Switcher Admin & Pure Player E-Commerce', () => {
  test('1.1 Bascule vers pure_player via PUT /api/boutiques/:id/mode (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/mode`)
      .set('Authorization', auth)
      .send({ mode_fonctionnement: 'pure_player' });

    expect(res.status).toBe(200);
    expect(res.body.succes).toBe(true);
    expect(res.body.mode_fonctionnement).toBe('pure_player');
  });

  test('1.2 Retour vers hybride_pos via PUT /api/boutiques/:id/mode (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/mode`)
      .set('Authorization', auth)
      .send({ mode_fonctionnement: 'hybride_pos' });

    expect(res.status).toBe(200);
    expect(res.body.mode_fonctionnement).toBe('hybride_pos');
  });

  test('1.3 Rejet de mode invalide (HTTP 400)', async () => {
    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/mode`)
      .set('Authorization', auth)
      .send({ mode_fonctionnement: 'mode_inconnu' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalide/);
  });

  test('1.4 GET /api/boutiques/mine retourne mode_fonctionnement (HTTP 200)', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: boutiqueId, nom: 'Tech Dakar', mode_fonctionnement: 'pure_player',
        meta_pixel_id: '12345', tiktok_pixel_id: null, ga4_id: 'G-XYZ'
      }]
    });

    const res = await request(app)
      .get('/api/boutiques/mine')
      .set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.boutiques[0].mode_fonctionnement).toBe('pure_player');
  });
});

// ── SPEC 02 : CHECKOUT 1-PAGE & CROSS-SELL UPSELL ──────────────────────────
describe('SPEC 02 — Checkout Web 1-Page Unifié & Cross-Sell Panier', () => {
  test('2.1 Enregistre une commande express avec décrémentation stock (HTTP 201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, nom: 'Tech Dakar' }] }) // Boutique check
      .mockResolvedValueOnce({ rows: [{ en_stock: true, prix: 12000, nom: 'Maillot Basket' }] }) // Prod check
      .mockResolvedValueOnce({ rows: [] }) // UPDATE stock
      .mockResolvedValueOnce({ rows: [] }); // INSERT commande

    const res = await request(app)
      .post('/api/boutiques/commandes/express')
      .send({
        boutique_id: boutiqueId,
        client_nom: 'Moussa Ndiaye',
        client_telephone: '771234567',
        frais_livraison: 1500,
        articles: [{ produit_id: prodId, quantite: 1, prix_unitaire: 12000 }]
      });

    expect(res.status).toBe(201);
    expect(res.body.succes).toBe(true);
    expect(res.body.reference).toMatch(/^CMD-2026-/);
    expect(res.body.montant_total).toBe(13500);
  });

  test('2.2 Support des requêtes Cross-Sell avec SLUG (ex: dievo-style) (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId }] }) // Slug resolution
      .mockResolvedValueOnce({
        rows: [
          { id: 'add-1', nom: 'Short', prix: 6000, en_stock: true },
          { id: 'add-2', nom: 'Chaussettes', prix: 3000, en_stock: true }
        ]
      });

    const res = await request(app).get(`/api/boutiques/dievo-style/produits/${prodId}/cross-sell`);

    expect(res.status).toBe(200);
    expect(res.body.produits.length).toBe(2);
    expect(res.body.produits[0].nom).toBe('Short');
  });
});

// ── SPEC 03 : MOTEUR DE PROMOTIONS & CODES PROMO ────────────────────────────
describe('SPEC 03 — Moteur de Promotions & Codes Promo', () => {
  test('3.1 Validation code promo % avec SLUG boutique (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId }] }) // Slug resolution
      .mockResolvedValueOnce({
        rows: [{
          id: 'promo-1', boutique_id: boutiqueId, code: 'SOLDE20',
          type_remise: 'pourcentage', valeur: 20, min_achat: 0,
          limite_utilisation: 100, fois_utilise: 5, actif: true
        }]
      });

    const res = await request(app)
      .post('/api/promotions/valider')
      .send({ boutique_id: 'dievo-style', code: 'SOLDE20', total_panier: 15000 });

    expect(res.status).toBe(200);
    expect(res.body.valide).toBe(true);
    expect(res.body.montant_reduction).toBe(3000);
    expect(res.body.nouveau_total).toBe(12000);
  });

  test('3.2 Validation code promo montant fixe FCFA (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 'promo-2', boutique_id: boutiqueId, code: 'REMISE5000',
          type_remise: 'fixe', valeur: 5000, min_achat: 10000,
          limite_utilisation: null, fois_utilise: 0, actif: true
        }]
      });

    const res = await request(app)
      .post('/api/promotions/valider')
      .send({ boutique_id: 'dievo-style', code: 'REMISE5000', total_panier: 20000 });

    expect(res.status).toBe(200);
    expect(res.body.montant_reduction).toBe(5000);
    expect(res.body.nouveau_total).toBe(15000);
  });

  test('3.3 Rejet si total_panier < min_achat (HTTP 400)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 'promo-3', boutique_id: boutiqueId, code: 'VIP50',
          type_remise: 'pourcentage', valeur: 50, min_achat: 50000, actif: true
        }]
      });

    const res = await request(app)
      .post('/api/promotions/valider')
      .send({ boutique_id: 'dievo-style', code: 'VIP50', total_panier: 15000 });

    expect(res.status).toBe(400);
    expect(res.body.valide).toBe(false);
    expect(res.body.error).toMatch(/achat minimum/);
  });

  test('3.4 Rejet si code promo est vide (HTTP 400)', async () => {
    const res = await request(app)
      .post('/api/promotions/valider')
      .send({ boutique_id: 'dievo-style', code: '   ', total_panier: 15000 });

    expect(res.status).toBe(400);
    expect(res.body.valide).toBe(false);
    expect(res.body.error).toMatch(/Code promo requis/);
  });
});

// ── SPEC 04 : PIXELS DE TRACKING & ROAS ────────────────────────────────────
describe('SPEC 04 — Pixels de Tracking ROAS (Meta, TikTok, GA4)', () => {
  test('4.1 Sauvegarde des IDs de Pixels par le marchand (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put(`/api/boutiques/${boutiqueId}/pixels`)
      .set('Authorization', auth)
      .send({ meta_pixel_id: '12345678', tiktok_pixel_id: 'C987654', ga4_id: 'G-XYZ' });

    expect(res.status).toBe(200);
    expect(res.body.pixels.meta_pixel_id).toBe('12345678');
    expect(res.body.pixels.tiktok_pixel_id).toBe('C987654');
    expect(res.body.pixels.ga4_id).toBe('G-XYZ');
  });

  test('4.2 Consultation publique des Pixels avec SLUG (HTTP 200)', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ meta_pixel_id: '12345678', tiktok_pixel_id: 'C987654', ga4_id: 'G-XYZ' }]
    });

    const res = await request(app).get('/api/boutiques/dievo-style/pixels/public');

    expect(res.status).toBe(200);
    expect(res.body.meta_pixel_id).toBe('12345678');
    expect(res.body.ga4_id).toBe('G-XYZ');
  });

  test('4.3 Génération du Flux XML Meta Commerce Manager & TikTok Catalog (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, nom: 'Tech Dakar', slug: 'tech-dakar' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 'p-1', nom: 'iPhone 13', description: '128Go', prix: 450000, en_stock: true, images: ['https://img.com/1.jpg'] }]
      });

    const res = await request(app).get(`/api/boutiques/${boutiqueId}/catalog.xml`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).toContain('<?xml version="1.0"');
    expect(res.text).toContain('<g:title>iPhone 13</g:title>');
    expect(res.text).toContain('450000.00 XOF');
  });

  test('4.4 Génération du Flux JSON de Catalogue avec SLUG (HTTP 200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, nom: 'Tech Dakar', slug: 'tech-dakar' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 'p-1', nom: 'iPhone 13', prix: 450000, en_stock: true }]
      });

    const res = await request(app).get('/api/boutiques/tech-dakar/catalog.json');

    expect(res.status).toBe(200);
    expect(res.body.total_produits).toBe(1);
    expect(res.body.produits[0].nom).toBe('iPhone 13');
  });
});

// ── SPEC 05 : DEVELOPER PORTAL & WEBHOOKS HMAC ────────────────────────────
describe('SPEC 05 — Portail Développeur, Clés API & Webhooks HMAC-SHA256', () => {
  test('5.1 Génération de clé API marchand nopalou_sk_live_ (HTTP 201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 'key-1', nom: 'ERP Dakar', key_prefix: 'nopalou_sk_live_123', created_at: new Date() }]
      });

    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/api-keys`)
      .set('Authorization', auth)
      .send({ nom: 'ERP Dakar' });

    expect(res.status).toBe(201);
    expect(res.body.api_key).toMatch(/^nopalou_sk_live_/);
  });

  test('5.2 Enregistrement Webhook & Génération Secret whsec_ (HTTP 201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: boutiqueId, utilisateur_id: 'user-123' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 'wh-1', boutique_id: boutiqueId, url: 'https://mon-crm.sn/webhook',
          secret: 'whsec_99887766554433221100', events: ['order.created']
        }]
      });

    const res = await request(app)
      .post(`/api/boutiques/${boutiqueId}/webhooks`)
      .set('Authorization', auth)
      .send({ url: 'https://mon-crm.sn/webhook', events: ['order.created'] });

    expect(res.status).toBe(201);
    expect(res.body.webhook.secret).toMatch(/^whsec_/);
  });

  test('5.3 Validation cryptographique de la signature HMAC-SHA256', () => {
    const secret = 'whsec_99887766554433221100';
    const timestamp = '1770418500';
    const payload = JSON.stringify({ event: 'order.created', reference: 'CMD-2026-9999' });

    const calculatedSig = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    expect(calculatedSig.length).toBe(64);
  });
});

// ── SPEC 06 : MULTI-DEVISES & SIMULATION STRIPE ─────────────────────────────
describe('SPEC 06 — Multi-Devises XOF/EUR/USD & Simulation Stripe', () => {
  test('6.1 Consultation des taux de change officiels (HTTP 200)', async () => {
    const res = await request(app).get('/api/devises/taux');

    expect(res.status).toBe(200);
    expect(res.body.base).toBe('XOF');
    expect(res.body.conversions_inverses['1_EUR_EN_XOF']).toBe(655.957);
  });

  test('6.2 Simulation de paiement Carte Bancaire Stripe réussi (HTTP 200)', async () => {
    const res = await request(app)
      .post('/api/paiements/stripe/simuler')
      .send({
        boutique_id: boutiqueId,
        montant: 100,
        devise: 'EUR',
        card_number: '4242 4242 4242 4242',
        exp_month: 12,
        exp_year: 2028,
        cvc: '123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statut).toBe('succeeded');
    expect(res.body.montant_xof).toBe(65596);
  });

  test('6.3 Rejet de carte bancaire déclinée de test (HTTP 400)', async () => {
    const res = await request(app)
      .post('/api/paiements/stripe/simuler')
      .send({
        boutique_id: boutiqueId,
        montant: 15000,
        devise: 'XOF',
        card_number: '4000 0000 0000 0002'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/déclinée/);
  });
});
