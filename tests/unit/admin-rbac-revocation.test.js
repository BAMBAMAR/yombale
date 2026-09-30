// AUD-041 — un compte admin nominatif désactivé ou supprimé est révoqué immédiatement
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_SECRET = 'test-admin-secret-0123456789abcdef';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));
const jwt = require('jsonwebtoken');
const { pool } = require('../../backend/models/db');
const { requireAdminAuth } = require('../../backend/middlewares/admin-rbac');

const BREAK_GLASS_ID = '00000000-0000-0000-0000-000000000000';
const adminJwt = (payload) => jwt.sign({ scope: 'nopalou_admin', ...payload }, process.env.JWT_SECRET, { expiresIn: '1h' });

function run(headers) {
  return new Promise((resolve) => {
    const req = { headers, query: {} };
    const res = { status(c) { this.code = c; return this; }, json(b) { resolve({ code: this.code, body: b, req }); } };
    requireAdminAuth(req, res, () => resolve({ code: 200, req }));
  });
}

beforeEach(() => pool.query.mockReset());

test('compte actif : accès avec le rôle de la base (pas celui du jeton)', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ id: 'a1', nom: 'X', email: 'x@y', role: 'finance', permissions: {}, actif: true }] });
  const r = await run({ authorization: 'Bearer ' + adminJwt({ adminId: 'a1', role: 'super_admin' }) });
  expect(r.code).toBe(200);
  expect(r.req.adminUser.role).toBe('finance'); // le rôle « super_admin » écrit dans le jeton est ignoré
});

test('super_admin désactivé : refusé même si le jeton annonce super_admin', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ id: 'a1', nom: 'X', email: 'x@y', role: 'super_admin', permissions: {}, actif: false }] });
  const r = await run({ authorization: 'Bearer ' + adminJwt({ adminId: 'a1', role: 'super_admin' }) });
  expect(r.code).toBe(401);
});

test('super_admin supprimé (aucune ligne) : refusé', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] });
  const r = await run({ authorization: 'Bearer ' + adminJwt({ adminId: 'a1', role: 'super_admin' }) });
  expect(r.code).toBe(401);
});

test('jeton sans adminId et rôle super_admin : refusé', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] });
  const r = await run({ authorization: 'Bearer ' + adminJwt({ role: 'super_admin' }) });
  expect(r.code).toBe(401);
});

test('compte technique break-glass (identifiant nul, aucune ligne) : accepté', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] });
  const r = await run({ authorization: 'Bearer ' + adminJwt({ adminId: BREAK_GLASS_ID, role: 'super_admin' }) });
  expect(r.code).toBe(200);
  expect(r.req.adminUser.role).toBe('super_admin');
});

test('secret maître en en-tête : accepté ; mauvais secret : refusé', async () => {
  const ok = await run({ 'x-admin-secret': process.env.ADMIN_SECRET });
  expect(ok.code).toBe(200);
  const ko = await run({ 'x-admin-secret': 'mauvais' });
  expect(ko.code).toBe(401);
});

// AUD-030 — verrou anti-devinette du secret maître (10 échecs / 15 min / IP)
describe('verrou du secret maître', () => {
  const avecIp = (ip, headers) => new Promise((resolve) => {
    const req = { headers, query: {}, ip, method: 'GET', originalUrl: '/api/admin/x' };
    const res = { status(c) { this.code = c; return this; }, json(b) { resolve({ code: this.code, body: b, req }); } };
    requireAdminAuth(req, res, () => resolve({ code: 200, req }));
  });

  test('après 10 secrets faux, même le bon secret est refusé (429) depuis cette IP ; une autre IP reste servie', async () => {
    for (let i = 0; i < 10; i++) expect((await avecIp('203.0.113.7', { 'x-admin-secret': `faux-${i}` })).code).toBe(401);
    const verrouille = await avecIp('203.0.113.7', { 'x-admin-secret': process.env.ADMIN_SECRET });
    expect(verrouille.code).toBe(429);
    expect(verrouille.body.code).toBe('ADMIN_SECRET_LOCKED');
    expect((await avecIp('198.51.100.9', { 'x-admin-secret': process.env.ADMIN_SECRET })).code).toBe(200);
  });

  test('un succès remet le compteur à zéro', async () => {
    for (let i = 0; i < 9; i++) await avecIp('203.0.113.50', { 'x-admin-secret': `faux-${i}` });
    expect((await avecIp('203.0.113.50', { 'x-admin-secret': process.env.ADMIN_SECRET })).code).toBe(200);
    for (let i = 0; i < 9; i++) await avecIp('203.0.113.50', { 'x-admin-secret': `encore-faux-${i}` });
    expect((await avecIp('203.0.113.50', { 'x-admin-secret': process.env.ADMIN_SECRET })).code).toBe(200);
  });

  test('une requête sans secret (simple absence de session) n\'alimente pas le verrou', async () => {
    for (let i = 0; i < 15; i++) expect((await avecIp('203.0.113.99', {})).code).toBe(401);
    expect((await avecIp('203.0.113.99', { 'x-admin-secret': process.env.ADMIN_SECRET })).code).toBe(200);
  });
});
