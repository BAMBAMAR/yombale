// Gardes de l'audit UX/parcours du 02/10/2026 (AUD-213 à AUD-233).
// Chaque test doit échouer sans son correctif (contrôle par mutation).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@127.0.0.1:1/jest_mock'; // base simulée ci-dessous, jamais jointe

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const request = require('supertest');
const app = require('../../backend/app');
const { pool } = require('../../backend/models/db');

describe('AUD-215 — suivi public : jamais de joker', () => {
  beforeEach(() => { jest.clearAllMocks(); pool.query.mockResolvedValue({ rows: [{ id: 'x', reference: 'C-1', client_nom: 'A B', client_telephone: '770000001', statut: 'en_attente', montant_total: 1 }] }); });

  test.each(['XX-INEXISTANT', 'abcdefgh', 'zzzzzzzz'])('« %s » (ni référence ni téléphone) : 400 et aucune requête SQL', async (terme) => {
    const res = await request(app).get('/api/boutiques/commandes/suivi').query({ q: terme });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/référence|numéro/i);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('une référence bien formée passe toujours', async () => {
    const res = await request(app).get('/api/boutiques/commandes/suivi').query({ ref: 'C-MUR0MZMR70C8' });
    expect(res.statusCode).toBe(200);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('un téléphone de 9 chiffres passe toujours', async () => {
    const res = await request(app).get('/api/boutiques/commandes/suivi').query({ tel: '770000001' });
    expect(res.statusCode).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual(['770000001']);
  });
});
