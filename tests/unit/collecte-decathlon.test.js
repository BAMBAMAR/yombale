// tests/unit/collecte-decathlon.test.js : AUD-183 (decathlon.sn est un PrestaShop ; l'ancienne « catégorie » était une page produit)
// Le gabarit des cartes reprend la structure réelle relevée en lecture seule le 02/10/2026 (`.product-card`,
// `a.js-product-card-link`, image avec `alt`, `.price_amount`, pagination `?page=N`).
// Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation sur l'ancien code.
process.env.NODE_ENV = 'test';
const fs = require('fs');
const path = require('path');
const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);
const erreurHttp = (status) => Object.assign(new Error('HTTP ' + status), { response: { status } });

const carte = (n, page) => `<div class="product-card" data-sku="sku-${page}-${n}"><div class="product-card_media"><div class="product-card_image">
  <a href="https://www.decathlon.sn/p/${page}${n}-corde-${n}.html" class="js-product-card-link" tabindex="-1"><img alt="Corde a sauter ${page}-${n}" src="https://contents.mediadecathlon.com/p${page}${n}.jpg"></a></div></div>
  <div class="product-card_details"><span class="price_items"><span class="price_item"><span class="price_amount">${3000 + n * 500} CFA</span></span></span></div></div>`;
const pageCategorie = (page, n) => '<html><body>' + Array.from({ length: n }, (_, i) => carte(i, page)).join('') + '</body></html>';

describe('AUD-183 : scraper Decathlon sur la structure réelle (PrestaShop)', () => {
  let axios; let sc;
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
    jest.doMock(chemin('models', 'db'), () => ({ pool: { query: jest.fn().mockResolvedValue({ rows: [] }) } }));
    axios = require('axios');
    sc = require(chemin('services', 'scraper.js'));
    jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0; });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test('lit toutes les pages d\'une catégorie (24 + 6 articles), prix en FCFA entiers jamais divisés, URL absolues, titre = alt de l\'image', async () => {
    axios.get.mockImplementation(async (url) => {
      if (/\?page=3/.test(url)) throw erreurHttp(404);
      return { status: 200, data: /\?page=2/.test(url) ? pageCategorie(2, 6) : pageCategorie(1, 24) };
    });
    const items = await sc.scraperDecathlon('3756-fitness-cardio', 25);
    expect(items).toHaveLength(30);
    expect(items[0]).toMatchObject({ titre: 'Corde a sauter 1-0', prix: 3000, url: 'https://www.decathlon.sn/p/10-corde-0.html', prix_brut: '3000 CFA' });
    expect(items.every((i) => i.url.startsWith('https://www.decathlon.sn/p/') && i.prix >= 3000)).toBe(true);
  });

  test('page déjà vue (le site renvoie la même page) : arrêt, aucun doublon', async () => {
    axios.get.mockResolvedValue({ status: 200, data: pageCategorie(1, 5) });
    const items = await sc.scraperDecathlon('3756-fitness-cardio', 25);
    expect(items).toHaveLength(5);
    expect(axios.get).toHaveBeenCalledTimes(2);   // page 1, puis page 2 sans aucun nouvel article
  });

  test('plus aucun appel à l\'API WooCommerce (elle n\'existe pas sur ce site : 404)', async () => {
    axios.get.mockResolvedValue({ status: 200, data: pageCategorie(1, 3) });
    await sc.scraperDecathlon('3756-fitness-cardio', 2);
    expect(axios.get.mock.calls.every(([u]) => !/wp-json/.test(u))).toBe(true);
  });

  test('la configuration ne contient plus la page produit 3745 et propose de vraies catégories', () => {
    const src = fs.readFileSync(chemin('services', 'scraper.js'), 'utf8');
    const m = src.match(/decathlon: \[([^\]]*)\]/);
    expect(m).not.toBeNull();
    expect(m[1]).not.toMatch(/3745-tous-les-sports/);
    expect(m[1].match(/'\d+-[a-z0-9-]+'/g).length).toBeGreaterThanOrEqual(5);
  });
});
