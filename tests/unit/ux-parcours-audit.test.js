// Gardes de l'audit UX/parcours du 02/10/2026 (AUD-213 à AUD-233).
// Chaque test doit échouer sans son correctif (contrôle par mutation).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@127.0.0.1:1/jest_mock'; // base simulée ci-dessous, jamais jointe

jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn() } }));

const request = require('supertest');
const app = require('../../backend/app');
const { pool } = require('../../backend/models/db');

describe('AUD-218 — un SMS simulé n\'est jamais un envoi réussi en production', () => {
  const avecEnv = async (env, fn) => {
    const avant = process.env.NODE_ENV; process.env.NODE_ENV = env;
    delete process.env.ORANGE_SMS_CLIENT_ID; delete process.env.ORANGE_SMS_AUTH_HEADER;
    try { jest.resetModules(); return await fn(require('../../backend/services/sms')); } finally { process.env.NODE_ENV = avant; }
  };
  test('production : success=false', async () => {
    const r = await avecEnv('production', (sms) => sms.sendSMS('+221770000001', 'Bonjour'));
    expect(r.success).toBe(false);
    expect(r.simulated).toBe(true);
  });
  test('hors production : la simulation reste un succès (tests et audits locaux)', async () => {
    const r = await avecEnv('development', (sms) => sms.sendSMS('+221770000001', 'Bonjour'));
    expect(r.success).toBe(true);
  });
});

const fs = require('fs');
const path = require('path');
const FRONT = process.env.UXP_FRONT_ROOT || path.join(__dirname, '../../frontend-next/src');
const lire = (rel) => fs.readFileSync(path.join(FRONT, rel), 'utf8');

describe('AUD-220 — jamais de lien wa.me construit à la main dans la vitrine boutique', () => {
  test.each([
    'app/boutiques/[id]/page.tsx',
    'app/boutiques/[id]/BoutiqueDetailClient.tsx',
    'app/boutiques/[id]/produits/[produitId]/page.tsx',
    'app/boutiques/[id]/components/BoutiqueInfosTab.tsx',
    'app/boutiques/[id]/SocialShopFeed.tsx',
  ])('%s passe par lienWhatsapp()', (rel) => {
    const src = lire(rel);
    expect(src).not.toMatch(/wa\.me\/\$\{/);
    expect(src).toMatch(/lienWhatsapp\(/);
  });
});

describe('AUD-217 — la confirmation de commande ne ment pas', () => {
  test('aucune promesse « transmise avec succès » avant l\'envoi, aucun repli sur le numéro administrateur', () => {
    for (const rel of ['components/cart/DrawerCartSuccessModal.tsx', 'components/cart/useDrawerCartCheckout.ts']) {
      const src = lire(rel);
      expect(src).not.toMatch(/transmise avec succès/);
      expect(src).not.toMatch(/221777202086/);
      expect(src).not.toMatch(/Pouvons-nous organiser la livraison/);
    }
    expect(lire('components/cart/DrawerCartSuccessModal.tsx')).toMatch(/Dernière étape/);
    expect(lire('components/cart/DrawerCartSuccessModal.tsx')).toMatch(/suivi-commande\?ref=/);
  });
  test('libellés du panier sans ponctuation doublée ni emoji', () => {
    for (const l of ['fr', 'en', 'ar']) {
      const src = lire(`i18n/locales/${l}/shop.ts`);
      expect(src).not.toMatch(/(chooseOrderMode|orderViaWhatsAppDirect|onlineFormOption): '[^']*(:|→)'/);
      expect(src).not.toMatch(/(notifyVendorWhatsApp|directOnlineOrder): '[^']*[\u{1F300}-\u{1FAFF}]/u);
      expect(src).toMatch(/deliveryToAgree:/);
    }
  });
});

describe('AUD-213 — le succès de création de boutique ne dépend plus d\'un état local', () => {
  test('le wizard navigue vers /creer-boutique/succes et ne garde plus de boutiqueCreee', () => {
    const src = lire('app/creer-boutique/page.tsx');
    expect(src).toMatch(/router\.replace\(`\/creer-boutique\/succes\?/);
    expect(src).not.toMatch(/setBoutiqueCreee|boutiqueCreee/);
    // la navigation vient après la tentative d'ouverture de session, même si elle échoue
    expect(src.indexOf('setAuthCookieAction(data.token)')).toBeLessThan(src.indexOf('router.replace(`/creer-boutique/succes'));
    expect(src).toMatch(/sessionOuverte = false/);
  });
  test('la page de succès existe et lit tout depuis l\'adresse', () => {
    const src = lire('app/creer-boutique/succes/page.tsx');
    expect(src).toMatch(/useSearchParams/);
    expect(src).toMatch(/asPage/);
    expect(lire('app/creer-boutique/components/ModalBoutiqueCreeeSucces.tsx')).toMatch(/sessionNonOuverte/);
  });
});

describe('AUD-224 — message de connexion explicite', () => {
  test('un mauvais mot de passe ne répond plus « Accès non autorisé »', () => {
    const src = lire('app/connexion/ConnexionForm.tsx');
    expect(src).toMatch(/errors\.invalidCredentials/);
    expect(src).not.toMatch(/Identifiants invalides'\) return t\('errors\.unauthorized'\)/);
    for (const l of ['fr', 'en', 'ar']) expect(lire(`i18n/locales/${l}/errors.ts`)).toMatch(/invalidCredentials:/);
  });
});

describe('AUD-216 — recherche globale : pertinence, vrais totaux, budget', () => {
  const ligne = (n, extra = {}) => ({ id: String(n), nom: 'x', total_count: '176', ...extra });
  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockImplementation(async (sql) => {
      if (/FROM produits p/.test(sql)) return { rows: [ligne(1, { prix: 120000 }), ligne(2, { prix: 130000 })] };
      if (/FROM boutiques b/.test(sql)) return { rows: [] };
      if (/annonces_classifiees/.test(sql)) return { rows: [ligne(3, { total_count: '44' })] };
      return { rows: [] };
    });
  });
  const produitsSql = () => pool.query.mock.calls.map(c => c[0]).find(s => /FROM produits p/.test(s));
  const produitsParams = () => pool.query.mock.calls.find(c => /FROM produits p/.test(c[0]))[1];

  test('le total est le vrai nombre de correspondances, pas la taille de la page', async () => {
    const res = await request(app).get('/api/search').query({ q: 'iphone', limit: 12 });
    expect(res.statusCode).toBe(200);
    expect(res.body.totaux).toMatchObject({ produits: 176, annonces: 44 });
    expect(res.body.total).toBe(176 + 44);
  });

  test('seules les offres en stock comptent ; les prix très inférieurs à la médiane passent en fin de liste', async () => {
    await request(app).get('/api/search').query({ q: 'iphone' });
    const sql = produitsSql();
    expect(sql).toMatch(/EXISTS \(SELECT 1 FROM offres o/);
    expect(sql).toMatch(/percentile_cont/);
    expect(sql).not.toMatch(/ORDER BY\s+CASE WHEN p\.nom ILIKE \$2 THEN 0 ELSE 1 END,\s+p\.prix_min ASC/);
  });

  test('budget : prix_max et tri sont transmis, tri inconnu ignoré (aucune injection)', async () => {
    await request(app).get('/api/search').query({ q: 'iphone', prix_max: '200000', tri: 'prix_asc' });
    expect(produitsParams()).toContain(200000);
    expect(produitsSql()).toMatch(/ORDER BY[\s\S]*m\.prix_min ASC/);
    // PostgreSQL refuse un paramètre non référencé (« impossible de déterminer le type du paramètre $2 ») : constaté sur base réelle
    expect(produitsSql()).toMatch(/\$2::text IS NOT NULL/);
    jest.clearAllMocks();
    await request(app).get('/api/search').query({ q: 'iphone', tri: 'x; DROP TABLE produits' });
    expect(produitsSql()).not.toMatch(/DROP TABLE/);
  });
});

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
