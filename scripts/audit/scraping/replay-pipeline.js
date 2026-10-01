// Rejeu du pipeline produits : faux sites locaux (axios simulé) + copie locale de la base. Aucun accès réseau.
// Préalable : DATABASE_URL doit viser une COPIE jetable (ex. nopalou_scrap_audit créée par
// CREATE DATABASE nopalou_scrap_audit TEMPLATE nopalou_audit_data), migrée avec backend/migrate-inline.js,
// et f_unaccent(text) créée à la main (aucune migration ne la crée : AUD-176).
// Usage : . scripts\audit\audit-env.ps1 ; $env:DATABASE_URL = $env:DATABASE_URL -replace '/nopalou_audit$','/nopalou_scrap_audit' ; node scripts/audit/scraping/replay-pipeline.js
const R = require('path').resolve(__dirname, '../../../') + '/';
if (!/nopalou_scrap_audit$/.test(process.env.DATABASE_URL || '')) { console.error('REFUS : DATABASE_URL doit viser la copie nopalou_scrap_audit'); process.exit(2); }
const realST = global.setTimeout;
// accélère uniquement les sleep() des scrapers (pas les délais de pg)
global.setTimeout = (f, ms, ...a) => realST(f, /backend[\\/]services[\\/]scraper/.test(new Error().stack.split('\n')[2] || '') ? 0 : ms, ...a);
const axios = require('axios');
const log = []; const origLog = console.log;
let capture = false;
console.warn = (...a) => { if (capture) log.push('WARN ' + a.join(' ')); };
console.error = (...a) => { if (capture) log.push('ERR  ' + a.join(' ')); };
console.log = (...a) => { if (capture) log.push('LOG  ' + a.join(' ')); else origLog(...a); };
const out = (...a) => origLog(...a);

let requetes = [];
const mkErr = (status) => Object.assign(new Error('HTTP ' + status), { response: { status } });
let comportement = null;
axios.get = async (url, cfg) => { requetes.push(url); return comportement(url, cfg); };
axios.post = async () => { throw new Error('POST bloqué par le harnais'); };

const jumiaHtml = (cat, page, n = 40) => '<html><script type="application/ld+json">' + JSON.stringify({
  '@type': 'ItemList', itemListElement: Array.from({ length: n }, (_, i) => ({
    item: { name: `Produit ${cat} p${page} n${i} marque${page}${i}`, offers: { price: String(10000 + i * 500) },
      url: `https://www.jumia.sn/${cat}-p${page}-${i}.html`, image: 'https://img.local/x.jpg' } })) }) + '</script></html>';

(async () => {
  const sc = require(R + 'backend/services/scraper.js');
  const { pool } = require(R + 'backend/models/db');
  const q = (s, p) => pool.query(s, p).then(r => r.rows);
  const runsCaptures = [];
  const _q = pool.query.bind(pool);
  pool.query = (s, p) => {
    if (typeof s === 'string' && s.includes('INSERT INTO scraping_runs')) {
      runsCaptures.push({ source: p[0], pages_cibles: p[1], pages_ok: p[2], pages_erreur: p[3], extraits: p[4], statut: p[9] });
      return _q(s, p).catch(e => { runsCaptures.push('ECHEC SQL: ' + e.message); throw e; });
    }
    return _q(s, p);
  };
  await new Promise(r => realST(r, 1500));

  // T1 : pagination — faux Jumia de 30 pages x 40 produits
  const TOTAL = 30;
  comportement = (url) => {
    const m = url.match(/jumia\.sn\/([^/]+)\/(?:\?page=(\d+))?/);
    const page = m && m[2] ? +m[2] : 1;
    if (page > TOTAL) throw mkErr(404);
    return { data: jumiaHtml(m[1], page) };
  };
  requetes = []; capture = true;
  const t1 = await sc.scraperJumia('electronique', 4);
  const req4 = requetes.length; requetes = [];
  const t1b = await sc.scraperJumia('electronique', 100);
  capture = false;
  out('T1 pagination: items avec maxPages=4 (valeur utilisée par lancerScraping):', t1.length, '| requêtes', req4,
    '| items avec maxPages=100:', t1b.length, '| requêtes', requetes.length,
    '| couverture =', (100 * t1.length / t1b.length).toFixed(1) + '%');

  // T1c : lancerScraping(['jumia']) de bout en bout sur 9 catégories
  const nOffAvant = +(await q("SELECT count(*) n FROM offres o JOIN marchands m ON m.id=o.marchand_id WHERE m.nom='Jumia Senegal'"))[0].n;
  requetes = []; log.length = 0; capture = true;
  const rap = await sc.lancerScraping(['jumia']);
  capture = false;
  const nOffApres = +(await q("SELECT count(*) n FROM offres o JOIN marchands m ON m.id=o.marchand_id WHERE m.nom='Jumia Senegal'"))[0].n;
  out('T1c lancerScraping jumia: pages demandées', requetes.length, '| stats', JSON.stringify(rap.sources.jumia),
    '| offres Jumia', nOffAvant, '->', nOffApres, '| théorique faux site = 9 cat x', TOTAL, 'pages x 40 =', 9 * TOTAL * 40);
  out('T1c scraping_runs capture:', JSON.stringify(runsCaptures.splice(0)));
  out('T1c logs erreurs:', JSON.stringify([...new Set(log.filter(l => /^(ERR|WARN)/.test(l)))].slice(0, 4)));

  // T2 : page de blocage HTTP 200 (challenge) -> run "ok" avec 0 donnée, derniere_sync rafraîchie
  const syncAvant2 = (await q("SELECT derniere_sync FROM marchands WHERE nom='Jumia Senegal'"))[0].derniere_sync;
  comportement = () => ({ data: '<html><title>Just a moment...</title><body>Enable JavaScript and cookies to continue</body></html>' });
  requetes = []; log.length = 0; capture = true;
  const rap2 = await sc.lancerScraping(['jumia']);
  capture = false;
  const syncApres2 = (await q("SELECT derniere_sync FROM marchands WHERE nom='Jumia Senegal'"))[0].derniere_sync;
  out('T2 blocage 200: stats', JSON.stringify(rap2.sources.jumia), '| requêtes', requetes.length,
    '| derniere_sync avant', syncAvant2.toISOString(), 'après', syncApres2.toISOString(),
    '| rafraîchie sans aucune donnée =', syncApres2 > syncAvant2);

  // T2b : HTTP 503 permanent sur CoinAfrique
  comportement = () => { throw mkErr(503); };
  requetes = []; log.length = 0; capture = true;
  const rap2b = await sc.lancerScraping(['coinafrique']);
  capture = false;
  out('T2b 503 permanent coinafrique: stats', JSON.stringify(rap2b.sources.coinafrique), '| requêtes', requetes.length,
    '| erreurs comptées =', rap2b.sources.coinafrique.erreurs);
  out('T2/T2b scraping_runs capture:', JSON.stringify(runsCaptures.splice(0)));

  // T3 : deux variantes (couleurs) d'un même marchand -> une seule offre conservée
  const tag = 'ZZTEST' + Date.now();
  const itemsVar = [
    { titre: `Samsung Galaxy A15 128Go Noir ${tag}`, prix: 100000, url: `https://www.jumia.sn/${tag}-noir.html`, image_url: null },
    { titre: `Samsung Galaxy A15 128Go Bleu ${tag}`, prix: 110000, url: `https://www.jumia.sn/${tag}-bleu.html`, image_url: null },
  ];
  capture = true; const s3 = await sc.sauvegarderProduits(itemsVar, 'Jumia Senegal', 'https://www.jumia.sn'); capture = false;
  const o3 = await q("SELECT o.url_achat, o.prix FROM offres o WHERE o.titre_marchand LIKE $1", ['%' + tag + '%']);
  out('T3 variantes: stats', JSON.stringify(s3), '| offres conservées:', o3.length, JSON.stringify(o3));

  // T3b : même annonce, URL avec paramètre de tracking
  const tag2 = 'ZZTRACK' + Date.now();
  capture = true;
  await sc.sauvegarderProduits([{ titre: `Xiaomi Redmi 13C 128Go ${tag2}`, prix: 80000, url: `https://www.jumia.sn/${tag2}.html`, image_url: null }], 'Jumia Senegal', 'x');
  const s3b = await sc.sauvegarderProduits([{ titre: `Xiaomi Redmi 13C 128Go ${tag2}`, prix: 80000, url: `https://www.jumia.sn/${tag2}.html?utm_source=a`, image_url: null }], 'Jumia Senegal', 'x');
  capture = false;
  const o3b = await q("SELECT o.url_achat FROM offres o WHERE o.titre_marchand LIKE $1", ['%' + tag2 + '%']);
  out('T3b URL avec query: stats', JSON.stringify(s3b), '| offres:', JSON.stringify(o3b));

  // T3c : un prix isolé aberrant écrase-t-il l'offre existante ?
  const tag3 = 'ZZPRIX' + Date.now();
  capture = true;
  await sc.sauvegarderProduits([{ titre: `Tecno Spark 20 ${tag3}`, prix: 90000, url: `https://www.jumia.sn/${tag3}.html`, image_url: null }], 'Jumia Senegal', 'x');
  await sc.sauvegarderProduits([{ titre: `Tecno Spark 20 ${tag3}`, prix: 9000, url: `https://www.jumia.sn/${tag3}.html`, image_url: null }], 'Jumia Senegal', 'x');
  capture = false;
  const o3c = await q("SELECT prix, quarantinee FROM offres WHERE titre_marchand LIKE $1", ['%' + tag3 + '%']);
  out('T3c chute de prix x10 acceptée sans quarantaine:', JSON.stringify(o3c));

  // T7 : Decathlon WooCommerce XOF (minor_unit 0 ou 2) -> division par 100
  for (const unit of [0, 2]) {
    comportement = () => ({ data: [{ name: 'Maillot de foot adulte', permalink: 'https://www.decathlon.sn/p/maillot', prices: { price: unit === 0 ? '25000' : '2500000', currency_code: 'XOF', currency_minor_unit: unit }, images: [{ src: 'https://i/x.jpg' }] }] });
    const d = await sc.scraperDecathlon('3745-tous-les-sports', 3);
    out(`T7 Decathlon WC minor_unit=${unit}: prix extrait`, JSON.stringify(d.map(x => x.prix)), '(attendu 25000)');
  }
  await pool.end();
  process.exit(0);
})().catch(e => { origLog('HARNAIS ERR', e); process.exit(1); });
