// tests/unit/collecte-pagination.test.js : AUD-174 (la pagination n'est plus bornée à 4 / 5 / 8 pages codées en dur)
// Faux sites (axios simulé) et base simulée. Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation.
process.env.NODE_ENV = 'test';
const path = require('path');

const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);
const erreurHttp = (status, headers = {}) => Object.assign(new Error('HTTP ' + status), { response: { status, headers } });

const pageJumia = (cat, page, n = 5) => '<html><script type="application/ld+json">' + JSON.stringify({
  '@type': 'ItemList', itemListElement: Array.from({ length: n }, (_, i) => ({
    item: { name: `Produit ${cat} p${page} n${i} ref${page}${i}`, offers: { price: String(10000 + i * 500) }, url: `https://www.jumia.sn/${cat}-p${page}-${i}.html`, image: 'https://img.local/x.jpg' } })) }) + '</script></html>';
const cartesExpat = (n, tag) => '<html><body>' + Array.from({ length: n }, (_, i) =>
  `<div class="listing-card"><a href="/annonce/x-${tag}-${i}-${100000 + i}">l</a><span class="listing-card__header__title">Appartement F3 ${tag} n${i}</span><span class="listing-card__info-bar__price">${150000 + i * 1000} FCFA</span><span class="listing-card__header__location">Mermoz, Dakar</span></div>`).join('') + '</body></html>';

let axios; let pool; let sc;
const ENV = ['SCRAPE_MAX_PAGES', 'SCRAPE_MAX_PAGES_IMMO', 'SCRAPE_MAX_PAGES_WOO'];

beforeEach(() => {
  jest.resetModules();
  ENV.forEach((k) => delete process.env[k]);
  jest.doMock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
  jest.doMock(chemin('models', 'db'), () => ({ pool: { query: jest.fn() } }));
  jest.doMock(chemin('services', 'admin-alerts'), () => ({ alerterAdmin: jest.fn().mockResolvedValue({}) }));
  axios = require('axios');
  pool = require(chemin('models', 'db')).pool;
  pool.query.mockImplementation(async (sql) => {
    if (/FROM marchands WHERE/.test(sql)) return { rows: [{ id: 'm1', nom: 'x' }] };
    if (/FROM offres WHERE marchand_id/.test(sql)) return { rows: [{ id: 'o1', produit_id: 'p1', prix: 1 }] };
    return { rows: [] };
  });
  sc = require(chemin('services', 'scraper.js'));
  jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0; });
});
afterEach(() => { jest.restoreAllMocks(); ENV.forEach((k) => delete process.env[k]); });

// faux Jumia : `total` pages de 5 articles, 404 au-delà
const jumia = (total) => axios.get.mockImplementation(async (url) => {
  const m = url.match(/jumia\.sn\/([^/]+)\/(?:\?page=(\d+))?/);
  const page = m && m[2] ? +m[2] : 1;
  if (page > total) throw erreurHttp(404);
  return { status: 200, data: pageJumia(m[1], page) };
});

describe('AUD-174 : produits (faux Jumia de 20 pages, 9 catégories, 5 articles par page)', () => {
  test('par défaut : tout le site est lu (20 pages), arrêt sur le 404 de fin de pagination', async () => {
    jumia(20);
    const rap = await sc.lancerScraping(['jumia']);
    expect(rap.sources.jumia.scrapes).toBe(9 * 20 * 5);
  });

  test('le plafond est un garde-fou réglable : SCRAPE_MAX_PAGES=10 limite à 10 pages', async () => {
    process.env.SCRAPE_MAX_PAGES = '10';
    jumia(20);
    const rap = await sc.lancerScraping(['jumia']);
    expect(rap.sources.jumia.scrapes).toBe(9 * 10 * 5);
  });

  test('retour arrière : SCRAPE_MAX_PAGES=4 rétablit l\'ancien comportement (4 pages)', async () => {
    process.env.SCRAPE_MAX_PAGES = '4';
    jumia(20);
    const rap = await sc.lancerScraping(['jumia']);
    expect(rap.sources.jumia.scrapes).toBe(9 * 4 * 5);
  });

  test('refus 403 à partir de la page 3 : aucune insistance, arrêt après deux erreurs, 4 requêtes par catégorie', async () => {
    axios.get.mockImplementation(async (url) => {
      const m = url.match(/jumia\.sn\/([^/]+)\/(?:\?page=(\d+))?/);
      const page = m && m[2] ? +m[2] : 1;
      if (page >= 3) throw erreurHttp(403);
      return { status: 200, data: pageJumia(m[1], page) };
    });
    const rap = await sc.lancerScraping(['jumia']);
    expect(axios.get).toHaveBeenCalledTimes(9 * 4);     // pages 1 et 2, puis 403 sur 3 et 4 (une requête chacune)
    expect(rap.sources.jumia.scrapes).toBe(9 * 2 * 5);
  });

  test('429 : nouvelle tentative après attente, la page est finalement lue', async () => {
    let dejaRefuse = false;
    axios.get.mockImplementation(async (url) => {
      const m = url.match(/jumia\.sn\/([^/]+)\/(?:\?page=(\d+))?/);
      const page = m && m[2] ? +m[2] : 1;
      if (page > 1) throw erreurHttp(404);
      if (!dejaRefuse) { dejaRefuse = true; throw erreurHttp(429, { 'retry-after': '1' }); }
      return { status: 200, data: pageJumia(m[1], 1) };
    });
    const rap = await sc.lancerScraping(['jumia']);
    expect(rap.sources.jumia.scrapes).toBe(9 * 5);
  });
});

describe('AUD-174 : immobilier (faux Expat-Dakar de 20 pages, 8 sections, 10 annonces par page)', () => {
  const faux = () => axios.get.mockImplementation(async (url) => {
    const m = url.match(/expat-dakar\.com(\/[^?]+)(?:\?page=(\d+))?/);
    const page = m && m[2] ? +m[2] : 1;
    if (page > 20) return { status: 200, data: '<html><body>fin</body></html>' };
    return { status: 200, data: cartesExpat(10, m[1].replace(/\W/g, '') + 'p' + page) };
  });

  test('par défaut : les 20 pages de chaque section sont lues (avant : 5 pages, 25 %)', async () => {
    faux();
    const r = await require(chemin('services', 'scraper-immo-expat.js')).scraperImmo({ dryRun: true });
    expect(r.scrapes).toBe(8 * 20 * 10);
  });

  test('retour arrière : SCRAPE_MAX_PAGES_IMMO=5 rétablit l\'ancien comportement', async () => {
    process.env.SCRAPE_MAX_PAGES_IMMO = '5';
    faux();
    const r = await require(chemin('services', 'scraper-immo-expat.js')).scraperImmo({ dryRun: true });
    expect(r.scrapes).toBe(8 * 5 * 10);
  });
});

describe('AUD-174 : sites WooCommerce (faux Soumari de 1 200 produits, API Store par pages de 100)', () => {
  const produits = (page) => Array.from({ length: 100 }, (_, i) => ({ name: `Article woo p${page} n${i}`, prices: { price: String(15000 + i), currency_code: 'XOF', currency_minor_unit: 0 }, images: [{ src: 'https://i/x.jpg' }], permalink: `https://soumari.com/produit/p${page}-${i}` }));
  const faux = () => axios.get.mockImplementation(async (url) => {
    const m = url.match(/wc\/store\/v1\/products\?per_page=100&page=(\d+)/);
    if (!m) throw erreurHttp(404);
    const page = +m[1];
    return { status: 200, data: page <= 12 ? produits(page) : [] };
  });

  test('par défaut : les 12 pages (1 200 produits) sont lues (avant : 8 pages, 800 produits)', async () => {
    faux();
    const r = await require(chemin('services', 'scraper-new-sites.js')).diagnosticNouveauSite('soumari');
    expect(r.nb_resultats).toBe(1200);
  });

  test('retour arrière : SCRAPE_MAX_PAGES_WOO=8 rétablit le plafond de 800 produits', async () => {
    process.env.SCRAPE_MAX_PAGES_WOO = '8';
    faux();
    const r = await require(chemin('services', 'scraper-new-sites.js')).diagnosticNouveauSite('soumari');
    expect(r.nb_resultats).toBe(800);
  });
});
