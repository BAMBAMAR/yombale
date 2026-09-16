// tests/unit/immo-p0-lead-and-agency.test.js
// Validation des chantiers prioritaires P0 : Jointure Agence/Agent et Ingestion CRM Lead

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const request = require('supertest');
const express = require('express');
const { pool } = require('../../backend/models/db');
const immoRouter = require('../../backend/routes/immo');
const crmImmoRouter = require('../../backend/routes/crm-immo');

const app = express();
app.use(express.json());
app.use('/api/immo', immoRouter);
app.use('/api/crm-immo', crmImmoRouter);

beforeEach(() => {
  pool.query.mockReset();
});

describe('Chantier P0.1 : Jointure Annonce & Agence (GET /api/immo/:id)', () => {
  test('renvoie une annonce avec les objets imbriqués agence et agent', async () => {
    const mockAnnonce = {
      id: '11111111-1111-1111-1111-111111111111',
      titre: 'Villa de Luxe aux Almadies',
      prix: 1500000,
      transaction: 'location',
      ville: 'Dakar',
      quartier: 'Almadies',
      agence_id: '22222222-2222-2222-2222-222222222222',
      agence_nom: 'Cabinet Immobilier Teranga',
      agence_slug: 'cabinet-teranga',
      agence_logo_url: 'https://cdn.example.com/logo.png',
      agence_whatsapp: '221770000000',
      agence_sponsorisee: true,
      agent_id: '33333333-3333-3333-3333-333333333333',
      agent_nom: 'Moussa Ndiaye',
      agent_telephone: '221780000000',
    };

    pool.query.mockResolvedValueOnce({ rows: [mockAnnonce] });

    const res = await request(app).get('/api/immo/11111111-1111-1111-1111-111111111111');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(mockAnnonce.id);
    expect(res.body.agence).toBeDefined();
    expect(res.body.agence.nom).toBe('Cabinet Immobilier Teranga');
    expect(res.body.agence.slug).toBe('cabinet-teranga');
    expect(res.body.agence.sponsorise).toBe(true);
    expect(res.body.agent).toBeDefined();
    expect(res.body.agent.nom).toBe('Moussa Ndiaye');
  });

  test('renvoie agence null si l\'annonce appartient à un particulier non rattaché', async () => {
    const mockParticulier = {
      id: '44444444-4444-4444-4444-444444444444',
      titre: 'Appartement 2 pièces Ouakam',
      prix: 250000,
      transaction: 'location',
      agence_id: null,
      agent_id: null,
    };

    pool.query.mockResolvedValueOnce({ rows: [mockParticulier] });

    const res = await request(app).get('/api/immo/44444444-4444-4444-4444-444444444444');
    expect(res.status).toBe(200);
    expect(res.body.agence).toBeNull();
    expect(res.body.agent).toBeNull();
  });
});

describe('Chantier P0.3 : Ingestion Automatique de Leads CRM (POST /api/crm-immo/public/lead)', () => {
  test('rejette si ni téléphone ni nom ne sont fournis (400)', async () => {
    const res = await request(app)
      .post('/api/crm-immo/public/lead')
      .send({ agence_id: '22222222-2222-2222-2222-222222222222' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('crée un nouveau prospect dans contacts_immo lors d\'un premier contact', async () => {
    // 1. SELECT annonce (pour enrichir)
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          titre: 'Bel Appartement Mermoz',
          prix: 400000,
          quartier: 'Mermoz',
          ville: 'Dakar',
          transaction: 'location',
          type_bien: 'appartement',
          agence_id: '22222222-2222-2222-2222-222222222222',
          agent_id: '33333333-3333-3333-3333-333333333333',
        },
      ],
    });

    // 2. Déduplication : contact non existant
    pool.query.mockResolvedValueOnce({ rows: [] });

    // 3. INSERT INTO contacts_immo
    pool.query.mockResolvedValueOnce({
      rows: [{ id: '99999999-9999-9999-9999-999999999999' }],
    });

    const res = await request(app)
      .post('/api/crm-immo/public/lead')
      .send({
        annonce_id: '11111111-1111-1111-1111-111111111111',
        nom: 'Aminata Fall',
        telephone: '221775556677',
        type_action: 'whatsapp_click',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.contactId).toBe('99999999-9999-9999-9999-999999999999');

    // Vérifier l'appel INSERT
    const insertCall = pool.query.mock.calls[2];
    expect(insertCall[0]).toContain('INSERT INTO contacts_immo');
    expect(insertCall[1][0]).toBe('22222222-2222-2222-2222-222222222222'); // agence_id
    expect(insertCall[1][1]).toBe('Aminata Fall');
  });

  test('déduplique et met à jour les notes si le prospect existe déjà dans l\'agence', async () => {
    // 1. SELECT annonce
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          titre: 'Villa Ngor',
          prix: 800000,
          agence_id: '22222222-2222-2222-2222-222222222222',
        },
      ],
    });

    // 2. Déduplication : contact déjà existant
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 'existing-contact-uuid', notes: 'Premier appel le 10/09' }],
    });

    // 3. UPDATE contacts_immo
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .post('/api/crm-immo/public/lead')
      .send({
        annonce_id: '11111111-1111-1111-1111-111111111111',
        telephone: '221775556677',
        type_action: 'demande_visite',
        message: 'Disponible ce mardi',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.contactId).toBe('existing-contact-uuid');

    // Vérifier que c'est un UPDATE et non un INSERT
    const updateCall = pool.query.mock.calls[2];
    expect(updateCall[0]).toContain('UPDATE contacts_immo');
  });
});

describe('Chantier P1 : Filtres Spécifiques Marché Sénégalais (GET /api/immo?commodite=...)', () => {
  test('injecte la clause de filtrage sur groupe électrogène / suppresseur / titre foncier', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'immo-tf-1',
          titre: 'Terrain avec Titre Foncier Almadies',
          prix: 150000000,
          total_count: '1',
        },
      ],
    });

    const res = await request(app).get('/api/immo?commodite=titre_foncier');
    expect(res.status).toBe(200);
    expect(res.body.annonces).toHaveLength(1);

    const lastSqlCall = pool.query.mock.calls[0];
    const sqlQuery = lastSqlCall[0];
    const sqlParams = lastSqlCall[1];

    expect(sqlQuery).toContain('titre foncier');
    expect(sqlParams).toContain('titre_foncier');
  });
});

