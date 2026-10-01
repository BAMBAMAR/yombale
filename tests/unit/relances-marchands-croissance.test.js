// tests/unit/relances-marchands-croissance.test.js — AUD-122 / AUD-124 (relances de fin d'essai)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'npl_master_jwt_secret_test_2026';

function charger({ reglages = {}, lignes = {} } = {}) {
  jest.resetModules();
  const envois = [];
  const requetes = [];
  jest.doMock('../../backend/models/db', () => ({
    pool: {
      query: jest.fn(async (sql) => {
        requetes.push(sql);
        for (const [motif, rows] of Object.entries(lignes)) {
          if (sql.includes(motif)) return { rows };
        }
        return { rows: [] };
      }),
    },
  }));
  jest.doMock('../../backend/lib/cronLogger', () => ({ executerTacheCron: (_n, fn) => fn() }));
  jest.doMock('../../backend/lib/magicAuthToken', () => ({ genererMagicToken: () => 'tok' }));
  jest.doMock('../../backend/lib/settingsCache', () => ({
    getNum: jest.fn(async (k) => (reglages[k] !== undefined ? Number(reglages[k]) : 0)),
    get: jest.fn(async (k) => (reglages[k] !== undefined ? String(reglages[k]) : null)),
  }));
  jest.doMock('../../backend/services/whatsapp', () => ({
    sendWhatsAppNotification: jest.fn(async (tel, payload) => { envois.push(payload); return { messages: [{ id: 'x' }] }; }),
    estDesinscrit: jest.fn(async () => false),
  }));
  const { traiterRelancesMarchands } = require('../../backend/services/cron-relances-marchands');
  return { traiterRelancesMarchands, envois, requetes };
}

const ligne = { id: 'a1', fin: new Date(), nom: 'Boutique Test', slug: 'bt', telephone: '221770009911' };

describe('AUD-122 / AUD-124 : relances de fin d\'essai', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-01T10:00:00Z'));
  });
  afterEach(() => jest.useRealTimers());

  test('J-3 : prix de départ et remise annuelle viennent des réglages admin', async () => {
    const { traiterRelancesMarchands, envois } = charger({
      reglages: { plan_decouverte_prix: 3000, reduc_12_mois: 20, alertes_abonnement_whatsapp: 'true' },
      lignes: { "CURRENT_DATE + INTERVAL '3 days'": [ligne] },
    });
    await traiterRelancesMarchands();
    const msg = envois.map(e => e.textMessage).join('\n');
    expect(msg).toMatch(/à partir de 3\s?000 FCFA\/mois/);
    expect(msg).toMatch(/-20%/);
    expect(msg).not.toMatch(/2 500/);
    expect(msg).not.toMatch(/-25%/);
  });

  test('J-1 : prix Pro des réglages, et plus de promesse de suspension du catalogue', async () => {
    const { traiterRelancesMarchands, envois } = charger({
      reglages: { plan_pro_prix: 6000, alertes_abonnement_whatsapp: 'true' },
      lignes: { "CURRENT_DATE + INTERVAL '1 day'": [ligne] },
    });
    await traiterRelancesMarchands();
    const msg = envois.map(e => e.textMessage).join('\n');
    expect(msg).toMatch(/Pro \(6\s?000 FCFA\/mois\)/);
    expect(msg).not.toMatch(/catalogue seront suspendus/);
    expect(msg).toMatch(/Caisse POS sera suspendu/);
  });

  test('l\'interrupteur admin désactive les alertes d\'abonnement (aucune requête J-3/J-1/J+1 expiré)', async () => {
    const { traiterRelancesMarchands, envois, requetes } = charger({
      reglages: { alertes_abonnement_whatsapp: 'false' },
      lignes: { "CURRENT_DATE + INTERVAL '3 days'": [ligne], "CURRENT_DATE + INTERVAL '1 day'": [ligne] },
    });
    await traiterRelancesMarchands();
    expect(envois).toHaveLength(0);
    expect(requetes.some(s => s.includes("INTERVAL '3 days'") && s.includes('is_trial = true'))).toBe(false);
  });

  test('la tâche est planifiée toutes les heures, pas toutes les 24 h (un redémarrage de nuit ne la supprime plus)', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '../../backend/services/cron-relances-marchands.js'), 'utf8');
    expect(src).toMatch(/\}, 60 \* 60 \* 1000\)/);
    expect(src).not.toMatch(/\}, 24 \* 60 \* 60 \* 1000\)/);
  });
});
