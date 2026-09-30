// AUD-028 — garde RBAC par ressource (requireAdminAccess) et matrice des rôles
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));
const { requireAdminAccess, ROLE_PERMISSIONS } = require('../../backend/middlewares/admin-rbac');

const permsDe = (role) => (role === 'super_admin' ? { all: true } : { ...(ROLE_PERMISSIONS[role] || {}) });

function executer(middleware, { role, method = 'GET', permissions }) {
  return new Promise((resolve) => {
    const req = { method, originalUrl: '/test', adminUser: role ? { role, permissions: permissions || permsDe(role) } : undefined };
    const res = { status(c) { this.code = c; return this; }, json(b) { resolve({ code: this.code, body: b }); } };
    middleware(req, res, () => resolve({ code: 200 }));
  });
}

beforeEach(() => { delete process.env.RBAC_MODE; });

describe('requireAdminAccess — lecture et écriture', () => {
  const garde = requireAdminAccess('crm');

  test('support_client : lecture CRM autorisée, écriture refusée (403)', async () => {
    expect((await executer(garde, { role: 'support_client', method: 'GET' })).code).toBe(200);
    for (const m of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const r = await executer(garde, { role: 'support_client', method: m });
      expect(r.code).toBe(403);
      expect(r.body.code).toBe('ADMIN_FORBIDDEN_PERMISSION');
    }
  });

  test('admin_operationnel : lecture et écriture CRM autorisées', async () => {
    expect((await executer(garde, { role: 'admin_operationnel', method: 'GET' })).code).toBe(200);
    expect((await executer(garde, { role: 'admin_operationnel', method: 'DELETE' })).code).toBe(200);
  });

  test('super_admin : toujours autorisé', async () => {
    expect((await executer(garde, { role: 'super_admin', method: 'DELETE' })).code).toBe(200);
  });

  test('non authentifié : 401', async () => {
    expect((await executer(garde, { method: 'GET' })).code).toBe(401);
  });

  test('ressource sans permission d\'édition dans la matrice (settings) : réservée au super_admin', async () => {
    const settings = requireAdminAccess('settings');
    expect((await executer(settings, { role: 'admin_operationnel', method: 'GET' })).code).toBe(200); // settings:view
    expect((await executer(settings, { role: 'admin_operationnel', method: 'PUT' })).code).toBe(403);
    expect((await executer(settings, { role: 'finance', method: 'GET' })).code).toBe(403);
    expect((await executer(settings, { role: 'super_admin', method: 'PUT' })).code).toBe(200);
  });

  test('clé d\'édition personnalisée (modération immo) : moderateur autorisé, finance refusé', async () => {
    const immo = requireAdminAccess('immo', { edit: 'immo:moderate' });
    expect((await executer(immo, { role: 'moderateur', method: 'PUT' })).code).toBe(200);
    expect((await executer(immo, { role: 'finance', method: 'PUT' })).code).toBe(403);
  });
});

describe('RBAC_MODE', () => {
  const garde = requireAdminAccess('crm');

  test('log : journalise mais ne bloque pas', async () => {
    process.env.RBAC_MODE = 'log';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await executer(garde, { role: 'support_client', method: 'DELETE' });
    expect(r.code).toBe(200);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[RBAC LOG]'));
    warn.mockRestore();
  });

  test('off : ne bloque pas ; valeur inconnue : retombe sur enforce (sécurité par défaut)', async () => {
    process.env.RBAC_MODE = 'off';
    expect((await executer(garde, { role: 'support_client', method: 'DELETE' })).code).toBe(200);
    process.env.RBAC_MODE = 'nimporte-quoi';
    expect((await executer(garde, { role: 'support_client', method: 'DELETE' })).code).toBe(403);
  });
});
