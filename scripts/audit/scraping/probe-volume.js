// Sonde de volume en LECTURE SEULE (autorisée par l'utilisateur le 01/10/2026).
// ATTENTION : seule exception à la garde réseau de l'audit. À lancer SANS `. scripts\audit\audit-env.ps1`.
// Aucune base, aucun secret. Environ 45 requêtes GET de pages publiques, 3,5 s entre deux requêtes,
// User-Agent qui s'identifie, arrêt immédiat de l'hôte sur 403 / 429 / 503 / page de défi (consigné, jamais contourné).
// Usage : node scripts/audit/scraping/probe-volume.js [sortie.json]
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

if (/audit-guard/.test(process.env.NODE_OPTIONS || '')) { console.error('Lancer ce script hors de audit-env.ps1 (la garde bloque le réseau).'); process.exit(2); }

const UA = 'Nopalou-Audit-Probe/1.0 (mesure de volume en lecture seule, 1 requete / 3,5 s)';
const DELAY = 3500;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const argv = process.argv.slice(2); const opt = n => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : null; };
const PAGES = (opt('pages') || '1,20').split(',').map(Number); const SANS_ROBOTS = argv.includes('--sans-robots'); const SANS_WOO = argv.includes('--sans-woo'); const FILTRE = opt('sources') ? opt('sources').split(',') : null;
const bloques = new Set();
const journal = [];
let nbRequetes = 0;

async function get(url, accept = 'text/html,application/xhtml+xml') {
  const hote = new URL(url).host;
  if (bloques.has(hote)) return { hote, status: 'hote_arrete', data: '', headers: {} };
  await sleep(DELAY); nbRequetes++;
  try {
    const r = await axios.get(url, { headers: { 'User-Agent': UA, Accept: accept, 'Accept-Language': 'fr-FR,fr;q=0.9' }, timeout: 25000, maxRedirects: 5, validateStatus: () => true, responseType: 'text', transformResponse: x => x });
    const corps = typeof r.data === 'string' ? r.data : '';
    const defi = /just a moment|cf-chl|enable javascript and cookies|attention required/i.test(corps.slice(0, 4000));
    if ([403, 429, 503].includes(r.status) || defi) { bloques.add(hote); }
    return { hote, status: defi && r.status === 200 ? '200_defi' : r.status, data: corps, headers: r.headers, finalUrl: r.request?.res?.responseUrl || url };
  } catch (e) { return { hote, status: 'erreur_' + (e.code || e.message), data: '', headers: {} }; }
}

const total = html => {
  const t = cheerio.load(html || '').root().text().replace(/\s+/g, ' ').slice(0, 20000);
  const m = t.match(/(\d[\d\s.,]{0,8}\d|\d)\s*(?:r[ée]sultats?|produits?\s+trouv|produits?\b|annonces?|articles?)/i);
  return m ? m[0].trim() : null;
};

const SOURCES = [
  { nom: 'Jumia', cat: 'telephone-tablette', url: p => `https://www.jumia.sn/telephone-tablette/${p > 1 ? `?page=${p}` : ''}`, compte: $ => $('article.prd').length || $('a.core').length, liens: $ => $('article.prd a.core').map((_, a) => $(a).attr('href')).get() },
  { nom: 'Expat-Dakar produits', cat: 'telephones', url: p => `https://www.expat-dakar.com/telephones${p > 1 ? `?page=${p}` : ''}`, compte: $ => $('article.listing-item, .listing-card').length || $('a[href*="/annonce/"]').length, liens: $ => $('.listing-card a[href*="/annonce/"], article.listing-item a[href*="/annonce/"]').map((_, a) => $(a).attr('href')).get() },
  { nom: 'CoinAfrique produits', cat: 'telephones-et-tablettes', url: p => `https://sn.coinafrique.com/categorie/telephones-et-tablettes${p > 1 ? `?page=${p}` : ''}`, compte: $ => new Set($('.col.s6.m4.l3').not('.swiper-slide').find('a[href*="/annonce/"]').map((_, a) => $(a).attr('href')).get()).size, liens: $ => $('.col.s6.m4.l3').not('.swiper-slide').find('a[href*="/annonce/"]').map((_, a) => $(a).attr('href')).get() },
  { nom: 'Auchan', cat: '104-epicerie-salee', url: p => `https://www.auchan.sn/104-epicerie-salee${p > 1 ? `?page=${p}` : ''}`, compte: $ => $('.product-miniature').length, liens: $ => $('.product-miniature a').map((_, a) => $(a).attr('href')).get() },
  { nom: 'Kaynoo', cat: 'produits-hightech', url: p => `https://www.kaynoo.sn/produits-hightech.html${p > 1 ? `?p=${p}` : ''}`, compte: $ => $('.product-item').length, liens: $ => $('.product-item-name a').map((_, a) => $(a).attr('href')).get() },
  { nom: 'Jiji', cat: 'mobile-phones', url: p => `https://jiji.sn/mobile-phones${p > 1 ? `?page=${p}` : ''}`, compte: $ => $('.b-list-advert-base').length, liens: $ => $('.b-list-advert-base').map((_, a) => $(a).attr('href')).get() },
  { nom: 'Expat-Dakar immo', cat: 'appartements-a-louer', url: p => `https://www.expat-dakar.com/appartements-a-louer${p > 1 ? `?page=${p}` : ''}`, compte: $ => $('.listing-card').length, liens: $ => $('.listing-card a[href*="/annonce/"]').map((_, a) => $(a).attr('href')).get() },
  { nom: 'CoinAfrique immo', cat: 'appartements', url: p => `https://sn.coinafrique.com/categorie/appartements${p > 1 ? `?page=${p}` : ''}`, compte: $ => new Set($('.col.s6.m4.l3').not('.swiper-slide').find('a[href*="/annonce/"]').map((_, a) => $(a).attr('href')).get()).size, liens: $ => $('.col.s6.m4.l3').not('.swiper-slide').find('a[href*="/annonce/"]').map((_, a) => $(a).attr('href')).get() },
];
const WOO = ['https://nova.sn', 'https://kanje.sn', 'https://electroniccorp.sn', 'https://dakarmondialtelephone.com', 'https://dakarmarket.sn', 'https://www.kaynoo.sn', 'https://masterofficedeco.sn', 'https://shop.afriqmarket.com', 'https://electroluxdakar.com', 'https://soumari.com', 'https://promo.sn', 'https://electromenager-dakar.com', 'https://universcosmetix.com', 'https://www.decathlon.sn'];

(async () => {
  const sortie = { date: new Date().toISOString(), ua: UA, sources: [], woocommerce: [], robots: [] };
  for (const s of SOURCES.filter(x => !FILTRE || FILTRE.includes(x.nom))) {
    const hote = new URL(s.url(1)).origin;
    if (!SANS_ROBOTS) {
      const rb = await get(hote + '/robots.txt', 'text/plain');
      sortie.robots.push({ source: s.nom, status: rb.status, extrait: rb.status === 200 ? rb.data.split('\n').filter(l => /^(user-agent|disallow|crawl-delay)/i.test(l)).slice(0, 12).join(' | ') : null });
    }
    const lignes = [];
    for (const p of PAGES) {
      const r = await get(s.url(p));
      const $ = cheerio.load(r.data || '');
      const ok = typeof r.status === 'number' && r.status === 200;
      // empreinte : 3 premiers liens de fiche, pour savoir si une page profonde diffère réellement de la page 1
      const liens = ok ? [...new Set(s.liens($))].slice(0, 3) : [];
      lignes.push({ page: p, status: r.status, octets: (r.data || '').length, elements: ok ? s.compte($) : null, total_affiche: p === 1 ? total(r.data) : null, liens, url_finale: r.finalUrl && r.finalUrl !== s.url(p) ? r.finalUrl : undefined });
    }
    sortie.sources.push({ source: s.nom, categorie: s.cat, pages: lignes });
    console.log(s.nom, JSON.stringify(lignes.map(l => `${l.page}:${l.status}/${l.elements}`)));
  }
  if (!SANS_WOO) for (const base of WOO) {
    const r = await get(`${base}/wp-json/wc/store/v1/products?per_page=1&page=1`, 'application/json');
    sortie.woocommerce.push({ site: base, status: r.status, total_produits: r.headers['x-wp-total'] ? +r.headers['x-wp-total'] : null, total_pages_par_100: r.headers['x-wp-totalpages'] && r.headers['x-wp-total'] ? Math.ceil(+r.headers['x-wp-total'] / 100) : null });
    console.log(base, r.status, r.headers['x-wp-total'] || '-');
  }
  sortie.requetes = nbRequetes; sortie.hotes_arretes = [...bloques];
  const out = argv.find(a => a.endsWith('.json')) || 'probe-volume.json';
  fs.writeFileSync(out, JSON.stringify(sortie, null, 1));
  console.log('Requêtes :', nbRequetes, '| hôtes arrêtés (403/429/503/défi) :', [...bloques].join(', ') || 'aucun', '| sortie :', out);
})();
