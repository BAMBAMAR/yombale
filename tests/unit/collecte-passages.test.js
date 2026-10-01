// tests/unit/collecte-passages.test.js : AUD-173 (un passage « ok » doit avoir rapporté des données)
// Faux sites (axios simulé) et base simulée. Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation.
process.env.NODE_ENV = 'test';
const path = require('path');

const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);

const pageJumia = (cat, page, n = 5) => '<html><script type="application/ld+json">' + JSON.stringify({
  '@type': 'ItemList', itemListElement: Array.from({ length: n }, (_, i) => ({
    item: { name: `Produit ${cat} p${page} n${i} ref${page}${i}`, offers: { price: String(10000 + i * 500) }, url: `https://www.jumia.sn/${cat}-p${page}-${i}.html`, image: 'https://img.local/x.jpg' } })) }) + '</script></html>';
const PAGE_DEFI = '<html><title>Just a moment...</title><body>Enable JavaScript and cookies to continue</body></html>';

let pool; let axios; let sc; let alerte; let requetesSql;

// La base simulée répond comme une base saine : marchand connu, offre déjà connue (chemin de mise à jour)
function baseSimulee({ medianes = [], statutsPrecedents = [] } = {}) {
  requetesSql = [];
  pool.query.mockImplementation(async (sql, params) => {
    requetesSql.push({ sql, params });
    if (/SELECT items_extraits FROM scraping_runs/.test(sql)) return { rows: medianes.map((m) => ({ items_extraits: m })) };
    if (/SELECT statut FROM scraping_runs/.test(sql)) return { rows: statutsPrecedents.map((s) => ({ statut: s })) };
    if (/FROM marchands WHERE/.test(sql)) return { rows: [{ id: 'm1', nom: 'x' }] };
    if (/FROM offres WHERE marchand_id/.test(sql)) return { rows: [{ id: 'o1', produit_id: 'p1', prix: 1 }] };
    if (/SELECT id,slug FROM categories/.test(sql)) return { rows: [] };
    return { rows: [] };
  });
}
const insertRuns = () => requetesSql.filter((q) => /INSERT INTO scraping_runs/.test(q.sql));
const majSync = () => requetesSql.filter((q) => /UPDATE marchands SET derniere_sync/.test(q.sql));

beforeEach(() => {
  jest.resetModules();
  delete process.env.SCRAPING_STATUTS_STRICTS;
  jest.doMock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
  jest.doMock(chemin('models', 'db'), () => ({ pool: { query: jest.fn() } }));
  jest.doMock(chemin('services', 'admin-alerts'), () => ({ alerterAdmin: jest.fn().mockResolvedValue({}) }));
  axios = require('axios');
  pool = require(chemin('models', 'db')).pool;
  alerte = require(chemin('services', 'admin-alerts')).alerterAdmin;
  sc = require(chemin('services', 'scraper.js'));
  // les attentes entre pages (secondes) ne doivent pas ralentir le test
  jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0; });
});
afterEach(() => { jest.restoreAllMocks(); });

const erreurHttp = (status) => Object.assign(new Error('HTTP ' + status), { response: { status } });

describe('AUD-173 : un passage sans donnée n\'est pas un succès', () => {
  test('page de défi en HTTP 200 sur toutes les catégories : statut echec, derniere_sync inchangée, codes HTTP conservés', async () => {
    baseSimulee();
    axios.get.mockResolvedValue({ status: 200, data: PAGE_DEFI });
    const rap = await sc.lancerScraping(['jumia']);
    expect(rap.sources.jumia.scrapes).toBe(0);
    expect(rap.sources.jumia.statut).toBe('echec');
    expect(majSync()).toHaveLength(0);
    const run = insertRuns()[0];
    expect(run).toBeDefined();
    expect(run.params).toContain('echec');
    expect(JSON.parse(run.params[6])).toEqual({ 200: expect.any(Number) }); // http_codes
  });

  test('HTTP 503 permanent : statut echec avec les codes 503 enregistrés', async () => {
    baseSimulee();
    axios.get.mockRejectedValue(erreurHttp(503));
    const rap = await sc.lancerScraping(['coinafrique']);
    expect(rap.sources.coinafrique.statut).toBe('echec');
    expect(majSync()).toHaveLength(0);
    expect(JSON.parse(insertRuns()[0].params[6])['503']).toBeGreaterThan(0);
  });

  test('deux passages echec consécutifs : alerte administrateur ; un seul : pas d\'alerte', async () => {
    baseSimulee({ statutsPrecedents: ['echec', 'ok'] });
    axios.get.mockResolvedValue({ status: 200, data: PAGE_DEFI });
    await sc.lancerScraping(['jumia']);
    expect(alerte).not.toHaveBeenCalled();
    baseSimulee({ statutsPrecedents: ['echec', 'echec'] });
    await sc.lancerScraping(['jumia']);
    expect(alerte).toHaveBeenCalledTimes(1);
    expect(alerte.mock.calls[0][0].titre).toMatch(/Jumia/);
  });

  test('source saine (toutes les catégories rapportent des articles) : statut ok et derniere_sync mise à jour', async () => {
    baseSimulee();
    axios.get.mockImplementation(async (url) => {
      const m = url.match(/jumia\.sn\/([^/]+)\//);
      return { status: 200, data: pageJumia(m ? m[1] : 'x', 1) };
    });
    const rap = await sc.lancerScraping(['jumia']);
    expect(rap.sources.jumia.statut).toBe('ok');
    expect(rap.sources.jumia.scrapes).toBeGreaterThan(0);
    expect(majSync()).toHaveLength(1);
    expect(insertRuns()[0].params).toContain('ok');
  });

  test('volume très inférieur à la médiane des passages précédents : statut degrade, motif de volume', async () => {
    baseSimulee({ medianes: [10000, 10000, 10000, 10000, 10000, 10000, 10000] });
    axios.get.mockImplementation(async (url) => {
      const m = url.match(/jumia\.sn\/([^/]+)\//);
      return { status: 200, data: pageJumia(m ? m[1] : 'x', 1) };
    });
    const rap = await sc.lancerScraping(['jumia']);
    expect(rap.sources.jumia.statut).toBe('degrade');
    expect(insertRuns()[0].params.join('|')).toMatch(/volume_/);
  });

  test('retour arrière SCRAPING_STATUTS_STRICTS=false : derniere_sync toujours mise à jour (ancien comportement)', async () => {
    process.env.SCRAPING_STATUTS_STRICTS = 'false';
    baseSimulee();
    axios.get.mockResolvedValue({ status: 200, data: PAGE_DEFI });
    await sc.lancerScraping(['jumia']);
    expect(majSync()).toHaveLength(1);
  });
});

describe('AUD-173 : nouveaux sites, un passage mesuré par site', () => {
  test('site sans article exploitable : passage echec enregistré, derniere_sync inchangée', async () => {
    baseSimulee();
    axios.get.mockImplementation(async (url) => {
      if (/wp-json/.test(url)) throw erreurHttp(404);
      return { status: 200, data: '<html><body>' + 'accueil sans produit '.repeat(10) + '</body></html>' };
    });
    await sc.lancerScrapingNouveauxSites(['promosn']);
    const run = insertRuns().find((q) => q.params[0] === 'Promo.sn');
    expect(run).toBeDefined();
    expect(run.params).toContain('echec');
    expect(majSync()).toHaveLength(0);
  });
});

describe('AUD-173 : évaluation du statut (fonction pure)', () => {
  let evaluer;
  beforeEach(() => { evaluer = require(chemin('lib', 'scrapingRun.js')).evaluerStatut; });
  const base = { categoriesCibles: 10, categoriesAvecArticles: 10, requetes: { total: 40, erreurs: 0 }, itemsExtraits: 1000, medianeItems: 1000 };

  test('cas nominal : ok', () => expect(evaluer(base).statut).toBe('ok'));
  test('0 article : echec', () => expect(evaluer({ ...base, itemsExtraits: 0 }).statut).toBe('echec'));
  test('couverture 8 catégories sur 10 : degrade', () => expect(evaluer({ ...base, categoriesAvecArticles: 8 }).statut).toBe('degrade'));
  test('11 % d\'erreurs HTTP : degrade ; 10 % : ok', () => {
    expect(evaluer({ ...base, requetes: { total: 100, erreurs: 11 } }).statut).toBe('degrade');
    expect(evaluer({ ...base, requetes: { total: 100, erreurs: 10 } }).statut).toBe('ok');
  });
  test('volume 49 % de la médiane : degrade ; 50 % : ok ; sans historique : ok', () => {
    expect(evaluer({ ...base, itemsExtraits: 490 }).statut).toBe('degrade');
    expect(evaluer({ ...base, itemsExtraits: 500 }).statut).toBe('ok');
    expect(evaluer({ ...base, itemsExtraits: 5, medianeItems: null }).statut).toBe('ok');
  });
  test('un 404 est une fin de pagination, pas une erreur ; l\'absence de statut en est une', () => {
    const { estErreurHttp } = require(chemin('lib', 'scrapingRun.js'));
    expect(estErreurHttp(404)).toBe(false);
    expect(estErreurHttp(200)).toBe(false);
    expect(estErreurHttp(403)).toBe(true);
    expect(estErreurHttp(429)).toBe(true);
    expect(estErreurHttp(503)).toBe(true);
    expect(estErreurHttp('ECONNABORTED')).toBe(true);
  });
});
