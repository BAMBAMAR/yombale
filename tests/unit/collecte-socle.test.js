// tests/unit/collecte-socle.test.js : AUD-171, AUD-172, AUD-176 (audit de la collecte de données du 2026-10-01)
// Gardes statiques + un test de comportement. Racine surchargeable (COLLECTE_BACK_ROOT) pour rejouer les gardes sur
// une copie de l'ancien code (contrôle par mutation : sur l'ancien code, ces tests doivent échouer).
process.env.NODE_ENV = 'test';
const fs = require('fs');
const path = require('path');

const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const lire = (rel) => fs.readFileSync(path.join(RACINE_BACK, rel), 'utf8');

function sources(dir, sortie = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'tests') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sources(p, sortie);
    else if (/\.js$/.test(e.name)) sortie.push(p);
  }
  return sortie;
}

describe('AUD-171 : aucun secret ni mot de passe littéral en repli', () => {
  // `process.env.X_SECRET || 'valeur'` : une valeur par défaut connue de tous ceux qui lisent le dépôt
  const REPLI_LITTERAL = /(?:SECRET|PASSWORD|PASSWD|TOKEN|API_KEY)\w*\s*\|\|\s*['"`][^'"`\s]{4,}['"`]/;

  test('aucun fichier du backend ne donne de valeur littérale par défaut à un secret, mot de passe ou jeton', () => {
    const fautifs = sources(RACINE_BACK)
      .filter((p) => REPLI_LITTERAL.test(fs.readFileSync(p, 'utf8')))
      .map((p) => path.relative(RACINE_BACK, p).replace(/\\/g, '/'));
    expect(fautifs).toEqual([]);
  });

  test('le scraper Facebook ne vise jamais l\'URL de production par défaut', () => {
    expect(lire('services/scraper-immo-facebook.js')).not.toMatch(/BACKEND_URL\s*\|\|\s*['"`]https?:/);
  });
});

describe('AUD-171 : le repli HTTP du scraper Facebook exige BACKEND_URL et ADMIN_SECRET explicites', () => {
  let axios;
  let upsertAnnonceClassifiee;
  let pool;
  const annonce = { categorie_slug: 'divers', titre: 'Annonce test', description: 'd', prix: 1000, ville: 'Dakar', contact_tel: '771234567', photos: [], caracteristiques: {}, source: 'facebook-group-x', ref_externe: 'fb-x-1', url_source: 'https://www.facebook.com/groups/x/posts/1' };

  beforeEach(() => {
    jest.resetModules();
    delete process.env.BACKEND_URL;
    delete process.env.ADMIN_SECRET;
    jest.doMock('axios', () => ({ post: jest.fn().mockResolvedValue({ data: { inseres: 1 } }) }));
    jest.doMock(path.join(RACINE_BACK, 'models', 'db'), () => ({ pool: { query: jest.fn() } }));
    axios = require('axios');
    pool = require(path.join(RACINE_BACK, 'models', 'db')).pool;
    ({ upsertAnnonceClassifiee } = require(path.join(RACINE_BACK, 'services', 'scraper-immo-facebook.js')));
    const erreurReseau = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' });
    pool.query.mockRejectedValue(erreurReseau);
  });

  test('sans BACKEND_URL ni ADMIN_SECRET : l\'erreur d\'origine est relancée, aucun appel réseau', async () => {
    await expect(upsertAnnonceClassifiee({ ...annonce })).rejects.toThrow(/ECONNRESET/);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('avec BACKEND_URL seul : toujours aucun appel (pas de secret par défaut)', async () => {
    process.env.BACKEND_URL = 'http://localhost:4100';
    await expect(upsertAnnonceClassifiee({ ...annonce })).rejects.toThrow(/ECONNRESET/);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('avec BACKEND_URL et ADMIN_SECRET explicites : le repli est utilisé, vers cette URL et avec ce secret', async () => {
    process.env.BACKEND_URL = 'http://localhost:4100';
    process.env.ADMIN_SECRET = 'secret-de-test-explicite';
    const r = await upsertAnnonceClassifiee({ ...annonce });
    expect(r).toEqual({ doublon: false });
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toBe('http://localhost:4100/api/scraper/sync-annonces');
    expect(axios.post.mock.calls[0][2].headers['x-admin-secret']).toBe('secret-de-test-explicite');
  });
});

describe('AUD-171 : les jetons de connexion magique et de paiement de dette n\'ont pas de secret par défaut', () => {
  const charger = () => {
    jest.resetModules();
    return {
      magic: require(path.join(RACINE_BACK, 'lib', 'magicAuthToken.js')),
      credit: require(path.join(RACINE_BACK, 'lib', 'creditPaymentToken.js')),
    };
  };
  const sauve = { jwt: process.env.JWT_SECRET, ses: process.env.SESSION_SECRET };
  afterEach(() => {
    if (sauve.jwt === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = sauve.jwt;
    if (sauve.ses === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = sauve.ses;
  });

  test('sans JWT_SECRET ni SESSION_SECRET : aucun jeton n\'est signé et un jeton forgé avec l\'ancienne valeur publique est refusé', () => {
    delete process.env.JWT_SECRET; delete process.env.SESSION_SECRET;
    const { magic, credit } = charger();
    expect(() => magic.genererMagicToken({ userId: 'u1' })).toThrow(/JWT_SECRET/);
    expect(() => credit.genererCreditToken('c1', 'b1')).toThrow(/JWT_SECRET/);
    // jeton forgé par un tiers qui connaît l'ancien secret par défaut du dépôt
    const crypto = require('crypto');
    const exp = Date.now() + 3600e3;
    const forge = Buffer.from(JSON.stringify({ u: 'victime', b: '', t: '', exp, s: crypto.createHmac('sha256', 'nopalou_secure_magic_token_secret_key_2026').update(`victime:::${exp}`).digest('hex') })).toString('base64url');
    expect(magic.validerMagicToken(forge).valide).toBe(false);
    const expS = Math.floor(Date.now() / 1000) + 3600;
    const payload = `c1:b1:${expS}`;
    const forgeCredit = Buffer.from(`${payload}:${crypto.createHmac('sha256', 'nopalou_credit_secret_key_2026').update(payload).digest('hex')}`).toString('base64url');
    expect(credit.validerCreditToken(forgeCredit).valide).toBe(false);
  });

  test('avec un secret configuré : aller-retour valide, et un jeton signé avec un autre secret est refusé', () => {
    process.env.JWT_SECRET = 'secret-de-test-A';
    const a = charger();
    const t = a.magic.genererMagicToken({ userId: 'u1', boutiqueId: 'b1' });
    expect(a.magic.validerMagicToken(t)).toMatchObject({ valide: true, userId: 'u1', boutiqueId: 'b1' });
    const c = a.credit.genererCreditToken('c1', 'b1');
    expect(a.credit.validerCreditToken(c)).toMatchObject({ valide: true, clientId: 'c1', boutiqueId: 'b1' });
    process.env.JWT_SECRET = 'secret-de-test-B';
    const b = charger();
    expect(b.magic.validerMagicToken(t).valide).toBe(false);
    expect(b.credit.validerCreditToken(c).valide).toBe(false);
  });
});

describe('AUD-172 : la table scraping_runs est créée par les migrations', () => {
  const migration = () => lire('migrate-inline.js');
  const ddl = () => {
    const m = migration().match(/CREATE TABLE IF NOT EXISTS scraping_runs \(([\s\S]*?)\n\s*\)`/);
    return m ? m[1] : '';
  };

  test('une migration crée scraping_runs', () => {
    expect(ddl()).not.toBe('');
  });

  test('les scrapers passent par RunCollecte (une seule écriture de passage, pas d\'INSERT en double)', () => {
    for (const f of ['services/scraper.js', 'services/scraper-immo-expat.js', 'services/scraper-immo-coinafrique.js']) {
      const src = lire(f);
      expect(src).toMatch(/RunCollecte/);
      expect(src).not.toMatch(/INSERT INTO scraping_runs/);
    }
  });

  test.each([
    'lib/scrapingRun.js',
  ])('toutes les colonnes écrites par %s existent dans la table', (fichier) => {
    const m = lire(fichier).match(/INSERT INTO scraping_runs\s*\(([\s\S]*?)\)\s*VALUES/);
    expect(m).not.toBeNull();
    const colonnes = m[1].split(',').map((c) => c.trim()).filter(Boolean);
    expect(colonnes.length).toBeGreaterThan(5);
    const manquantes = colonnes.filter((c) => !new RegExp(`\\b${c}\\b`).test(ddl()));
    expect(manquantes).toEqual([]);
  });

  test('les colonnes lues par le script d\'audit existent aussi (started_at, items_doublons)', () => {
    expect(ddl()).toMatch(/\bstarted_at\b/);
    expect(ddl()).toMatch(/\bitems_doublons\b/);
  });
});

describe('AUD-176 : f_unaccent et unaccent sont créées par les migrations', () => {
  test('la migration crée l\'extension unaccent', () => {
    expect(lire('migrate-inline.js')).toMatch(/CREATE EXTENSION IF NOT EXISTS unaccent/);
  });

  test('la migration crée f_unaccent(text) seulement si elle est absente (jamais de remplacement)', () => {
    const src = lire('migrate-inline.js');
    expect(src).toMatch(/to_regprocedure\('public\.f_unaccent\(text\)'\) IS NULL/);
    expect(src).toMatch(/CREATE FUNCTION public\.f_unaccent\(text\)[\s\S]*?IMMUTABLE/);
    expect(src).not.toMatch(/CREATE OR REPLACE FUNCTION (?:public\.)?f_unaccent/);
  });

  test('tout fichier du backend qui utilise f_unaccent suppose une migration qui la crée', () => {
    const utilisateurs = sources(RACINE_BACK)
      .filter((p) => !/migrate/.test(p) && /\bf_unaccent\s*\(/.test(fs.readFileSync(p, 'utf8')));
    expect(utilisateurs.length).toBeGreaterThan(0); // la garde garde un sens tant que le code l'utilise
    expect(lire('migrate-inline.js')).toMatch(/CREATE FUNCTION public\.f_unaccent/);
  });
});
