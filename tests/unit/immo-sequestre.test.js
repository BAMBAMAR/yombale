// tests/unit/immo-sequestre.test.js
// Tests unitaires du module de tiers de confiance séquestre immobilier (PropTech Nopalou Pay Safe Immo)

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText: jest.fn().mockResolvedValue(true),
  normalisePhone: jest.fn((p) => p ? String(p).replace(/\D/g, '') : ''),
}));

const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const { pool } = require('../../backend/models/db');
const sequestreRouter = require('../../backend/routes/paiement-sequestre');

const app = express();
app.use(express.json());
app.use('/api/paiement-sequestre', sequestreRouter);

beforeEach(() => {
  pool.query.mockReset();
});

describe('Module Séquestre Immobilier (Nopalou Pay Safe Immo)', () => {
  test('POST /immo/reserver — crée une consignation avec référence unique et code PIN', async () => {
    // 1. Resolve agence from slug
    pool.query.mockResolvedValueOnce({ rows: [{ id: '22222222-2222-2222-2222-222222222222' }] });
    // 2. Check exist CRM contact (not found)
    pool.query.mockResolvedValueOnce({ rows: [] });
    // 3. Insert new CRM contact
    pool.query.mockResolvedValueOnce({ rows: [{ id: '33333333-3333-3333-3333-333333333333' }] });
    // 4. Insert reservations_sequestre_immo
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: '44444444-4444-4444-4444-444444444444',
          reference: 'NOP-IMM-TEST-123',
          montant: 500000,
          statut_sequestre: 'bloque',
          type_reservation: 'caution_location',
          created_at: new Date().toISOString(),
        },
      ],
    });

    const res = await request(app)
      .post('/api/paiement-sequestre/immo/reserver')
      .send({
        agenceId: 'agence-teranga',
        prospectNom: 'Fatou Diop',
        prospectTelephone: '221771234567',
        prospectEmail: 'fatou@example.com',
        montant: 500000,
        typeReservation: 'caution_location',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statut_sequestre).toBe('bloque');
    expect(res.body.reference).toBe('NOP-IMM-TEST-123');
    expect(res.body.pin).toMatch(/^\d{4}$/);
  });

  test('POST /immo/reserver — rejette si nom ou téléphone manquant ou montant invalide', async () => {
    const res1 = await request(app)
      .post('/api/paiement-sequestre/immo/reserver')
      .send({
        prospectNom: '',
        prospectTelephone: '221770000000',
        montant: 200000,
      });
    expect(res1.status).toBe(400);
    expect(res1.body.success).toBe(false);

    const res2 = await request(app)
      .post('/api/paiement-sequestre/immo/reserver')
      .send({
        prospectNom: 'Amadou Ba',
        prospectTelephone: '221770000000',
        montant: 0,
      });
    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);
  });

  test('POST /immo/debloquer — rejette un PIN invalide et décrémente les essais', async () => {
    const sel = 'test-salt';
    const correctPin = '1234';
    const hashed = crypto.createHash('sha256').update(correctPin + sel).digest('hex');

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: '55555555-5555-5555-5555-555555555555',
          reference: 'NOP-IMM-TEST-999',
          statut_sequestre: 'bloque',
          sequestre_pin_hash: hashed,
          sequestre_pin_sel: sel,
          sequestre_essais_restants: 3,
        },
      ],
    });
    pool.query.mockResolvedValueOnce({ rows: [] }); // update essais

    const res = await request(app)
      .post('/api/paiement-sequestre/immo/debloquer')
      .send({
        reference: 'NOP-IMM-TEST-999',
        codePin: '9999', // faux PIN
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Code PIN incorrect');
    expect(res.body.essaisRestants).toBe(2);
  });

  test('POST /immo/debloquer — débloque les fonds avec le bon PIN et met à jour le CRM', async () => {
    const sel = 'salt123';
    const correctPin = '4321';
    const hashed = crypto.createHash('sha256').update(correctPin + sel).digest('hex');

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: '66666666-6666-6666-6666-666666666666',
          reference: 'NOP-IMM-TEST-888',
          statut_sequestre: 'bloque',
          sequestre_pin_hash: hashed,
          sequestre_pin_sel: sel,
          sequestre_essais_restants: 3,
          contact_crm_id: '77777777-7777-7777-7777-777777777777',
        },
      ],
    });
    pool.query.mockResolvedValueOnce({ rows: [] }); // update debloque
    pool.query.mockResolvedValueOnce({ rows: [] }); // update CRM win

    const res = await request(app)
      .post('/api/paiement-sequestre/immo/debloquer')
      .send({
        reference: 'NOP-IMM-TEST-888',
        codePin: '4321',
        motif: 'Signature du bail et remise des clés effectuée',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statut_sequestre).toBe('debloque');
    expect(res.body.reference).toBe('NOP-IMM-TEST-888');
  });

  test('GET /immo/:reference/statut — renvoie l’état de transparence pour la diaspora', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          reference: 'NOP-IMM-TEST-777',
          statut_sequestre: 'bloque',
          type_reservation: 'acompte_vente',
          montant: 5000000,
          sequestre_date_deblocage: null,
          created_at: new Date().toISOString(),
          bien_titre: 'Villa R+1 Fann Résidence',
          agence_nom: 'Cabinet Prestige Immo',
          agence_slug: 'prestige-immo',
        },
      ],
    });

    const res = await request(app).get('/api/paiement-sequestre/immo/NOP-IMM-TEST-777/statut');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reference).toBe('NOP-IMM-TEST-777');
    expect(res.body.statut_sequestre).toBe('bloque');
    expect(res.body.securise_pay_safe).toBe(true);
    expect(res.body.agence_nom).toBe('Cabinet Prestige Immo');
    expect(res.body.bien_titre).toBe('Villa R+1 Fann Résidence');
  });
});
