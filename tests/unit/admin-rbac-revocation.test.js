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
