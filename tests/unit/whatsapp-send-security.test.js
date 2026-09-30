// AUD-027 — POST /api/whatsapp/send : authentification obligatoire, destinataire = numéro du compte
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../backend/services/whatsapp', () => ({
  sendFiche: jest.fn().mockResolvedValue(true),
  estDesinscrit: jest.fn().mockResolvedValue(false),
}));
jest.mock('../../backend/services/whatsapp-health', () => ({ getStatus: jest.fn(), recordFailure: jest.fn() }));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const { pool } = require('../../backend/models/db');
const wa = require('../../backend/services/whatsapp');
const router = require('../../backend/routes/whatsapp');

const app = express();
app.use(express.json());
app.use('/api/whatsapp', router);

const token = jwt.sign({ userId: 'user-1', jwtVersion: 1 }, process.env.JWT_SECRET);
const auth = `Bearer ${token}`;

// verifierToken exécute d'abord une requête de version de session, puis la route lit le téléphone
function mockSession(phone = '771110001') {
  pool.query.mockReset();
  pool.query
    .mockResolvedValueOnce({ rows: [{ jwt_version: 1, suspendu: false, supprime_le: null }] })
    .mockResolvedValueOnce({ rows: [{ telephone: phone }] });
}

beforeEach(() => { wa.sendFiche.mockClear(); wa.estDesinscrit.mockReset().mockResolvedValue(false); });

test('anonyme : 401 et aucun envoi', async () => {
  const res = await request(app).post('/api/whatsapp/send').send({ type: 'produit', id: 'p1', phone: '221770000000' });
  expect(res.status).toBe(401);
  expect(wa.sendFiche).not.toHaveBeenCalled();
});

test('connecté : envoi vers le numéro du COMPTE, le numéro du corps est ignoré', async () => {
  mockSession('771110001');
  const res = await request(app).post('/api/whatsapp/send').set('Authorization', auth)
    .send({ type: 'produit', id: 'p1', phone: '221770000000' });
  expect(res.status).toBe(200);
  expect(wa.sendFiche).toHaveBeenCalledTimes(1);
  expect(wa.sendFiche).toHaveBeenCalledWith('produit', 'p1', '771110001');
});

test('type hors liste : 400 sans envoi', async () => {
  mockSession();
  const res = await request(app).post('/api/whatsapp/send').set('Authorization', auth).send({ type: 'admin', id: 'p1' });
  expect(res.status).toBe(400);
  expect(wa.sendFiche).not.toHaveBeenCalled();
});

test('compte sans téléphone : 400 sans envoi', async () => {
  mockSession(null);
  const res = await request(app).post('/api/whatsapp/send').set('Authorization', auth).send({ type: 'produit', id: 'p1' });
  expect(res.status).toBe(400);
  expect(wa.sendFiche).not.toHaveBeenCalled();
});

test('numéro désinscrit (STOP) : 403 sans envoi', async () => {
  mockSession();
  wa.estDesinscrit.mockResolvedValue(true);
  const res = await request(app).post('/api/whatsapp/send').set('Authorization', auth).send({ type: 'produit', id: 'p1' });
  expect(res.status).toBe(403);
  expect(wa.sendFiche).not.toHaveBeenCalled();
});
