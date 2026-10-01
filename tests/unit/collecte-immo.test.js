// tests/unit/collecte-immo.test.js : AUD-179 (erreurs HTTP visibles) et AUD-175 (CoinAfrique immo ne détruit plus ce qu'il récolte)
// Partie 1 : faux sites (axios simulé) et base simulée. Partie 2 : vraie base PostgreSQL JETABLE, seulement si
// COLLECTE_TEST_DB_URL est défini (jamais la production). Exemple :
//   . scripts\audit\audit-env.ps1 ; $env:COLLECTE_TEST_DB_URL = $env:DATABASE_URL -replace '/nopalou_audit$','/nopalou_fresh' ; npx jest tests/unit/collecte-immo.test.js
// Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation sur l'ancien code.
process.env.NODE_ENV = 'test';
const path = require('path');

const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);
const erreurHttp = (status) => Object.assign(new Error('HTTP ' + status), { response: { status } });

const cartesExpat = (n, tag) => '<html><body>' + Array.from({ length: n }, (_, i) =>
  `<div class="listing-card"><a href="/annonce/x-${tag}-${i}-${100000 + i}">l</a><span class="listing-card__header__title">Appartement F3 ${tag} n${i}</span><span class="listing-card__info-bar__price">${150000 + i * 1000} FCFA</span><span class="listing-card__header__location">Mermoz, Dakar</span></div>`).join('') + '</body></html>';
const PAGE_VIDE = '<html><body>fin</body></html>';

describe('AUD-179 : erreurs HTTP des scrapers immobiliers (faux sites)', () => {
  let axios; let pool; let expat; let coin; let insertsRuns;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
    jest.doMock(chemin('models', 'db'), () => ({ pool: { query: jest.fn() } }));
    jest.doMock(chemin('services', 'admin-alerts'), () => ({ alerterAdmin: jest.fn().mockResolvedValue({}) }));
    axios = require('axios');
    pool = require(chemin('models', 'db')).pool;
    insertsRuns = [];
    pool.query.mockImplementation(async (sql, params) => {
      if (/INSERT INTO scraping_runs/.test(sql)) insertsRuns.push(params);
      return { rows: [] };
    });
    expat = require(chemin('services', 'scraper-immo-expat.js'));
    coin = require(chemin('services', 'scraper-immo-coinafrique.js'));
    jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0; });
  });
  afterEach(() => jest.restoreAllMocks());

  test('Expat immo, HTTP 500 partout : les erreurs sont comptées, 3 tentatives par section, passage echec avec les codes', async () => {
    axios.get.mockRejectedValue(erreurHttp(500));
    const r = await expat.scraperImmo({ dryRun: false });
    expect(r.scrapes).toBe(0);
    expect(r.erreurs.length).toBe(8);                  // une erreur par section, plus jamais 0
    expect(r.erreurs[0]).toMatch(/500/);
    expect(axios.get).toHaveBeenCalledTimes(8 * 3);   // 1 essai + 2 nouvelles tentatives par section
    expect(r.statut).toBe('echec');
    expect(JSON.parse(insertsRuns[0][6])).toEqual({ 500: 24 });
  });

  test('Expat immo, 503 transitoire puis succès : aucune erreur, les annonces sont lues', async () => {
    let premiere = true;
    axios.get.mockImplementation(async (url) => {
      if (premiere) { premiere = false; throw erreurHttp(503); }
      return { status: 200, data: /page=2/.test(url) ? PAGE_VIDE : cartesExpat(10, 'a') };
    });
    const r = await expat.scraperImmo({ dryRun: true });
    expect(r.erreurs).toEqual([]);
    expect(r.scrapes).toBe(80);
  });

  test('Expat immo, 403 : jamais de nouvelle tentative (on n\'insiste pas)', async () => {
    axios.get.mockRejectedValue(erreurHttp(403));
    const r = await expat.scraperImmo({ dryRun: true });
    expect(axios.get).toHaveBeenCalledTimes(8);
    expect(r.erreurs.length).toBe(8);
  });

  test('Expat immo, 404 sur la page 2 : fin de pagination, pas une erreur', async () => {
    axios.get.mockImplementation(async (url) => {
      if (/page=2/.test(url)) throw erreurHttp(404);
      return { status: 200, data: cartesExpat(10, 'b') };
    });
    const r = await expat.scraperImmo({ dryRun: true });
    expect(r.erreurs).toEqual([]);
    expect(r.scrapes).toBe(80);
  });

  test('CoinAfrique immo, site indisponible (503 au test de connectivité) : erreur visible et passage echec enregistré', async () => {
    axios.get.mockRejectedValue(erreurHttp(503));
    const r = await coin.scraperImmo({ dryRun: false });
    expect(r.erreurs[0]).toMatch(/Site indisponible/);
    expect(r.statut).toBe('echec');
    expect(insertsRuns).toHaveLength(1);
  });

  test('CoinAfrique immo, HTTP 500 sur les sections : erreurs comptées (6 sections), jamais 0', async () => {
    axios.get.mockImplementation(async (url) => {
      if (/categorie\/immobilier$/.test(url)) return { status: 200, data: PAGE_VIDE };
      throw erreurHttp(500);
    });
    const r = await coin.scraperImmo({ dryRun: true });
    expect(r.erreurs.length).toBe(6);
    expect(r.scrapes).toBe(0);
  });
});

const urlTest = process.env.COLLECTE_TEST_DB_URL;
(urlTest ? describe : describe.skip)('AUD-175 : CoinAfrique immo, un re-scrape ne modifie jamais le statut d\'une annonce connue (base PostgreSQL jetable)', () => {
  let pool; let coin; const tag = 'zz175' + Date.now();
  const annonce = (n, extra = {}) => ({ titre: `Appartement test ${tag} ${n}`, type_bien: 'appartement', transaction: 'location', prix: 150000, ville: 'Dakar', quartier: 'Mermoz', photos: [], url_source: `https://sn.coinafrique.com/annonce/appartements/${tag}-${n}`, source: 'coinafrique', ref_externe: `coin-${tag}-${n}`, meuble: false, ...extra });
  const etat = async (n) => (await pool.query('SELECT actif, rejete, motif_rejet, contact_tel FROM annonces_immo WHERE ref_externe = $1', [`coin-${tag}-${n}`])).rows[0];
  const inserer = (n, actif, rejete, motif) => pool.query(
    `INSERT INTO annonces_immo (titre, type_bien, transaction, prix, ville, photos, url_source, source, ref_externe, actif, rejete, motif_rejet, contact_tel)
     VALUES ($1,'appartement','location',150000,'Dakar','[]'::jsonb,$2,'coinafrique',$3,$4,$5,$6,$7)`,
    [`Appartement test ${tag} ${n}`, `https://sn.coinafrique.com/annonce/appartements/${tag}-${n}`, `coin-${tag}-${n}`, actif, rejete, motif, actif ? '771234567' : null]);

  beforeAll(() => {
    if (/render\.com|onrender/.test(urlTest)) throw new Error('REFUS : base de production');
    jest.resetModules();
    jest.dontMock(chemin('models', 'db')); // la partie 1 a simulé la base : ici on veut la vraie
    process.env.DATABASE_URL = urlTest;
    pool = require(chemin('models', 'db')).pool;
    coin = require(chemin('services', 'scraper-immo-coinafrique.js'));
  });
  afterAll(async () => {
    await pool.query('DELETE FROM annonces_immo WHERE ref_externe LIKE $1', [`coin-${tag}-%`]);
    await pool.end();
  });

  test('annonce publiée (téléphone connu) re-scrapée sans téléphone : reste active et non rejetée', async () => {
    await inserer(1, true, false, null);
    await coin.upsertAnnonce(annonce(1));
    expect(await etat(1)).toMatchObject({ actif: true, rejete: false, motif_rejet: null, contact_tel: '771234567' });
  });

  test('annonce nouvelle sans téléphone : inactive, motif a_completer (distinct d\'un rejet de modération)', async () => {
    await coin.upsertAnnonce(annonce(2));
    expect(await etat(2)).toMatchObject({ actif: false, rejete: true, motif_rejet: 'a_completer' });
  });

  test('annonce a_completer pour laquelle un téléphone et un prix arrivent : activée', async () => {
    await coin.upsertAnnonce(annonce(2, { contact_tel: '778889900' }));
    expect(await etat(2)).toMatchObject({ actif: true, rejete: false, motif_rejet: null, contact_tel: '778889900' });
  });

  test('annonce rejetée par un modérateur : jamais réactivée par un re-scrape, même avec un téléphone', async () => {
    await inserer(3, false, true, 'Faux immo (modération)');
    await coin.upsertAnnonce(annonce(3, { contact_tel: '778889900' }));
    expect(await etat(3)).toMatchObject({ actif: false, rejete: true, motif_rejet: 'Faux immo (modération)' });
  });

  test('annonce rejetée par l\'ancien motif automatique : activée quand un téléphone arrive', async () => {
    await inserer(4, false, true, 'Données scrapées sans contact téléphonique direct ou sans prix');
    await coin.upsertAnnonce(annonce(4, { contact_tel: '778889900' }));
    expect(await etat(4)).toMatchObject({ actif: true, rejete: false, motif_rejet: null });
  });
});
