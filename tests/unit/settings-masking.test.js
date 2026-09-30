// AUD-029 — GET /api/settings ne renvoie jamais les secrets en clair ; PUT ignore les valeurs masquées
process.env.NODE_ENV = 'test';

jest.mock('../../backend/middlewares/auth', () => ({ adminSecretOnly: (req, res, next) => next() }));
// La route passe par le garde RBAC (AUD-028) : neutralisé ici pour tester uniquement le masquage des secrets
jest.mock('../../backend/middlewares/admin-rbac', () => ({ adminAccess: () => [(req, res, next) => next()] }));
const store = {
  prix_annonce: '1500',
  wave_api_key: 'wave_live_ABCDEFGHIJKL',
  wave_signing_secret: 'short',
  telegram_bot_token: '123456:ABC-DEF-very-secret',
  fb_page_access_token: 'EAAGsecretsecretsecretC123',
  stripe_webhook_secret: 'whsec_1234567890',
  empty_token: '',
};
jest.mock('../../backend/lib/settingsCache', () => ({
  DEFAULTS: { prix_annonce: '', wave_api_key: '', wave_signing_secret: '', telegram_bot_token: '' },
  getAll: jest.fn(async () => ({ ...store })),
  get: jest.fn(async (k) => store[k]),
  setMany: jest.fn(async () => {}),
  invalidate: jest.fn(),
}));

const request = require('supertest');
const express = require('express');
const s = require('../../backend/lib/settingsCache');
const router = require('../../backend/routes/settings');

const app = express();
app.use(express.json());
app.use('/api/settings', router);

test('les clés sensibles sont masquées (quatre derniers caractères au plus), les autres intactes', async () => {
  const res = await request(app).get('/api/settings');
  expect(res.status).toBe(200);
  const raw = JSON.stringify(res.body);
  for (const secret of ['wave_live_ABCDEFGHIJKL', '123456:ABC-DEF-very-secret', 'EAAGsecretsecretsecretC123', 'whsec_1234567890']) {
    expect(raw.includes(secret)).toBe(false);
  }
  expect(res.body.wave_api_key).toBe('****IJKL');
  expect(res.body.fb_page_access_token).toBe('****C123');
  expect(res.body.wave_signing_secret).toBe('****'); // valeur courte : aucun caractère révélé
  expect(res.body.empty_token).toBe('');
  expect(res.body.prix_annonce).toBe('1500');
});

test('PUT : une valeur masquée ne remplace pas le secret ; une vraie valeur est enregistrée', async () => {
  s.setMany.mockClear();
  const masked = await request(app).put('/api/settings').send({ prix_annonce: '2000', wave_api_key: '****IJKL' });
  expect(masked.status).toBe(200);
  expect(s.setMany).toHaveBeenCalledWith({ prix_annonce: '2000' });

  s.setMany.mockClear();
  const real = await request(app).put('/api/settings').send({ wave_api_key: 'nouvelle-cle-reelle' });
  expect(real.status).toBe(200);
  expect(s.setMany).toHaveBeenCalledWith({ wave_api_key: 'nouvelle-cle-reelle' });
});

test('PUT avec uniquement des valeurs masquées : aucune écriture', async () => {
  s.setMany.mockClear();
  const res = await request(app).put('/api/settings').send({ wave_api_key: '****IJKL' });
  expect(res.status).toBe(400);
  expect(s.setMany).not.toHaveBeenCalled();
});
