// backend/services/scraper-new-sites.js v2
// ═══════════════════════════════════════════════════════════════
//  SCRAPER — 9 SITES SÉNÉGALAIS (non-Cloudflare, accessibles depuis Railway)
//
//  ✅ Scrapables : nova.sn, kanje.sn, electroniccorp.sn,
//                  dakarmondialtelephone.com, dakarmarket.sn, kaynoo.sn,
//                  masterofficedeco.sn, shop.afriqmarket.com, electroluxdakar.com
//
//  🛡️ Cloudflare (exclus) : jiji.sn, soumari.com, promo.sn,
//                             electromenager-dakar.com, universcosmetix.com
//
//  Stratégie par priorité :
//  1. Auto-découverte URL shop depuis homepage
//  2. WooCommerce Store API  /wp-json/wc/store/v1/products  (JSON public)
//  3. WooCommerce REST API   /wp-json/wc/v3/products        (parfois ouvert)
//  4. HTML scraping adaptatif (WooCommerce + PrestaShop)
// ═══════════════════════════════════════════════════════════════

const axios   = require('axios');
const cheerio = require('cheerio');

// ── Helpers ──────────────────────────────────────────────────
const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];
const randUA = () => UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
const sleep  = ms => new Promise(r => setTimeout(r, ms));

function nettoyerPrix(t) {
  if (!t) return 0;
  let s = (t + '').replace(/[\s\u00a0]/g, '');
  // Supprimer la partie d\u00e9cimale (virgule/point + 1-2 chiffres) avant le strip global
  // "185000,50" \u2192 "185000" | "1750.00" \u2192 "1750" | "185.000" (milliers) \u2192 inchang\u00e9
  s = s.replace(/[,.](\d{1,2})(?=\D|$)/g, '');
  const n = parseInt(s.replace(/[^0-9]/g, ''));
  return isNaN(n) || n < 500 ? 0 : n;
}
function nettoyerTitre(t) {
  return (t || '').trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').slice(0, 255);
}

function buildHeaders(referer = '') {
  return {
    'User-Agent': randUA(),
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': referer ? 'same-origin' : 'none',
    'Cache-Control': 'max-age=0',
    ...(referer ? { Referer: referer } : {}),
  };
}

async function fetchHtml(url, referer = '', timeout = 20000) {
  const { data } = await axios.get(url, {
    headers: buildHeaders(referer), timeout, maxRedirects: 5,
    responseType: 'text',
  });
  return data;
}

async function fetchJson(url, timeout = 15000) {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': randUA(), 'Accept': 'application/json' },
    timeout, maxRedirects: 3,
  });
  return data;
}

// ── AUTO-DÉCOUVERTE URLs shop depuis la homepage ─────────────
// Cherche les liens nav qui pointent vers /shop, /boutique, etc.
async function decouvririURLsShop(baseUrl) {
  const candidates = new Set();
  const SHOP_PATTERNS = [
    /\/shop\/?$/i, /\/boutique\/?$/i, /\/produits\/?$/i, /\/store\/?$/i,
    /\/telephones?\/?$/i, /\/smartphones?\/?$/i, /\/electromenager\/?$/i,
    /\/informatique\/?$/i, /\/tv\/?$/i, /\/mode\/?$/i, /\/beaute\/?$/i,
    /product-categor(y|ie)\//i, /categori/i,
  ];
  try {
    const html = await fetchHtml(baseUrl, '', 10000);
    const $ = cheerio.load(html);

    // 1. Liens de navigation
    $('nav a[href], .menu a[href], #menu a[href], header a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const full = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
      if (full.includes(baseUrl.replace('https://', '').replace('http://', '')) &&
          SHOP_PATTERNS.some(p => p.test(full))) {
        candidates.add(full.split('?')[0].replace(/\/$/, '') + '/');
      }
    });

    // 2. Liens footer et liens généraux
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href.startsWith('http') && SHOP_PATTERNS.some(p => p.test(href))) {
        const full = `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`.split('?')[0];
        if (!full.includes('wp-') && !full.includes('.css') && !full.includes('.js')) {
          candidates.add(full.replace(/\/$/, '') + '/');
        }
      }
    });

    // 3. Toujours tenter /shop/ par défaut
    candidates.add(`${baseUrl}/shop/`);

  } catch (err) {
    console.warn(`[DISCOVER] ${baseUrl}: ${err.message}`);
    candidates.add(`${baseUrl}/shop/`);
  }

  const result = [...candidates].slice(0, 8);
  console.log(`[DISCOVER] ${baseUrl} → ${result.length} URLs: ${result.join(' | ')}`);
  return result;
}

// ── STRATÉGIE A — WooCommerce Store API (public JSON) ────────
async function scraperWooStoreAPI(baseUrl, nom, maxPages = 8) {
  const resultats = [];
  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `${baseUrl}/wp-json/wc/store/v1/products?per_page=100&page=${page}&status=publish`;
      const data = await fetchJson(url);
      if (!Array.isArray(data) || !data.length) break;

      for (const p of data) {
        const titre = nettoyerTitre(p.name || '');
        // FCFA (XOF) = 0 décimales en réalité — ne jamais diviser pour XOF
        // Certains sites WC mal configurés renvoient currency_minor_unit=2 ou 3 pour XOF
        // Solution : vérifier le code devise. Si XOF/FCFA → utiliser le prix brut directement
        const currCode = (p.prices?.currency_code || '').toUpperCase();
        const isFCFA   = currCode === 'XOF' || currCode === 'FCFA' || currCode === 'CFA' || currCode === '';
        const rawUnit  = isFCFA ? 0 : parseInt(p.prices?.currency_minor_unit ?? '0', 10);
        const prixRaw  = parseInt(p.prices?.price || p.prices?.sale_price || '0', 10);
        const prix     = rawUnit > 0 ? Math.round(prixRaw / Math.pow(10, rawUnit)) : prixRaw;
        const img  = p.images?.[0]?.src || null;
        const url  = p.permalink || `${baseUrl}/?p=${p.id}`;
        if (titre.length > 3 && prix > 500) resultats.push({ titre, prix, url, image_url: img });
      }
      console.log(`[WC-STORE] ${nom} p${page}: ${data.length} (total: ${resultats.length})`);
      await sleep(1000 + Math.random() * 500);
    } catch (err) {
      const code = err.response?.status;
      if (code === 404 || code === 401) {
        console.log(`[WC-STORE] ${nom}: API indisponible (${code})`);
      } else {
        console.warn(`[WC-STORE] ${nom} p${page}: ${code || err.code}`);
      }
      break;
    }
  }
  return resultats;
}

// ── STRATÉGIE B — WooCommerce REST API v3 ────────────────────
async function scraperWooRESTAPI(baseUrl, nom, maxPages = 3) {
  const resultats = [];
  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `${baseUrl}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish`;
      const data = await fetchJson(url);
      if (!Array.isArray(data) || !data.length) break;

      for (const p of data) {
        const titre = nettoyerTitre(p.name || '');
        const prix  = nettoyerPrix(p.price || p.regular_price || '0');
        const img   = p.images?.[0]?.src || null;
        const url   = p.permalink || `${baseUrl}/?p=${p.id}`;
        if (titre.length > 3 && prix > 500) resultats.push({ titre, prix, url, image_url: img });
      }
      console.log(`[WC-REST] ${nom} p${page}: ${data.length}`);
      await sleep(1000);
    } catch (err) {
      console.log(`[WC-REST] ${nom}: ${err.response?.status || err.code}`);
      break;
    }
  }
  return resultats;
}

// ── STRATÉGIE C — HTML adaptatif ─────────────────────────────
const SELECTEURS = [
  // WooCommerce standard
  { c: 'li.product,article.product,.product-item,.product-grid-item',
    t: '.woocommerce-loop-product__title,h2.product-title,h3.product-title,.product-name,.woocommerce-loop-product__title,h3',
    p: '.price .woocommerce-Price-amount,.price .amount,.woocommerce-Price-amount,bdi',
    l: 'a.woocommerce-loop-product__link,a[href*="product"],a.product-link',
    i: 'img.attachment-woocommerce_thumbnail,img.wp-post-image,.product-image img,img' },
  // Flatsome / Flatsome child themes
  { c: '.product-small,.product-card,.box-product,.col-inner',
    t: '.name,.product-title,h3,h4,.title',
    p: '.price .amount,.price-wrapper .amount,span.amount',
    l: 'a[href*="product"],a.product-link,.box-image > a',
    i: 'img.attachment-shop_catalog,img.featured-image,img' },
  // PrestaShop
  { c: '.product-miniature,.thumbnail-container,article.product-miniature',
    t: '.product-title a,h3.product-title,.product-name',
    p: '.price,.product-price,span[itemprop="price"],.current-price',
    l: 'a.product-thumbnail,a.product-title,h3.product-title a',
    i: 'img.product-cover-img,img.thumbnail,img' },
  // Générique e-commerce
  { c: '[class*="product-card"],[class*="product-item"],[class*="item-product"]',
    t: '[class*="product-name"],[class*="product-title"],h2,h3,h4',
    p: '[class*="price"],[class*="prix"],[itemprop="price"]',
    l: 'a[href*="product"],a[href*="produit"],a[href]',
    i: 'img[src*="product"],img[src*="catalog"],img' },
];

async function scraperHTML(baseUrl, nom, shopUrls, maxPages = 3) {
  const resultats = [];
  const vus = new Set();

  for (const catUrl of shopUrls) {
    for (let page = 1; page <= maxPages; page++) {
      const sep  = catUrl.includes('?') ? '&' : '?';
      const pageUrl = page === 1 ? catUrl : `${catUrl}${sep}page=${page}`;
      try {
        const html = await fetchHtml(pageUrl, baseUrl);
        const $    = cheerio.load(html);
        let found  = 0;

        for (const s of SELECTEURS) {
          const items = $(s.c);
          if (!items.length) continue;

          items.each((_, el) => {
            const titre = nettoyerTitre($(el).find(s.t).first().text());
            const prixTxt = $(el).find(s.p).first().text()
              || $(el).find('[itemprop="price"]').attr('content') || '';
            const prix  = nettoyerPrix(prixTxt);
            let href = $(el).find(s.l).first().attr('href') || $(el).closest('a').attr('href') || '';
            if (href && !href.startsWith('http')) href = `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
            const imgEl = $(el).find(s.i).first();
            const img = imgEl.attr('data-src') || imgEl.attr('src') || imgEl.attr('data-lazy') || null;
            const imgFull = img && !img.startsWith('http') ? `${baseUrl}${img}` : img;

            if (titre.length > 3 && prix > 500 && !vus.has(titre)) {
              vus.add(titre);
              resultats.push({ titre, prix, url: href, image_url: imgFull });
              found++;
            }
          });

          if (found > 0) {
            console.log(`[HTML] ${nom} — ${catUrl.split('/').pop() || 'shop'} p${page}: ${found} (sél: ${s.c.slice(0,30)})`);
            break;
          }
        }

        if (found === 0) { console.warn(`[HTML] ${nom} p${page}: 0, arrêt`); break; }
      } catch (err) {
        const code = err.response?.status;
        console.error(`[HTML] ${nom} — ${pageUrl}: ${code || err.message}`);
        break;
      }
      await sleep(2000 + Math.random() * 1500);
    }
    await sleep(2500);
  }
  return resultats;
}

// ── ORCHESTRATEUR PAR SITE ───────────────────────────────────
async function scraperSite(config) {
  const { id, nom, baseUrl } = config;
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`[NEW] ${nom}  (${baseUrl})`);

  // 1. Tenter WooCommerce Store API (le plus efficace, JSON pur)
  let res = await scraperWooStoreAPI(baseUrl, nom, 8);
  if (res.length >= 5) {
    console.log(`[NEW] ${nom} ✅ WC-Store API → ${res.length} produits`);
    return res;
  }

  // 2. Tenter WooCommerce REST API
  res = await scraperWooRESTAPI(baseUrl, nom, 3);
  if (res.length >= 5) {
    console.log(`[NEW] ${nom} ✅ WC-REST API → ${res.length} produits`);
    return res;
  }

  // 3. Auto-découverte des URLs shop + HTML scraping
  console.log(`[NEW] ${nom} — APIs KO, tentative HTML scraping...`);
  const shopUrls = await decouvririURLsShop(baseUrl);
  await sleep(1500);
  res = await scraperHTML(baseUrl, nom, shopUrls, 3);

  if (res.length > 0) {
    console.log(`[NEW] ${nom} ✅ HTML → ${res.length} produits`);
  } else {
    console.log(`[NEW] ${nom} ⛔ Toutes les stratégies ont échoué`);
  }
  return res;
}

// ── CATALOGUE — 9 sites accessibles depuis Railway ───────────
const SITES_CONFIG = [
  { id: 'nova',                nom: 'Nova Sénégal',          baseUrl: 'https://nova.sn' },
  { id: 'kanje',               nom: 'Kanje',                  baseUrl: 'https://kanje.sn' },
  { id: 'electroniccorp',      nom: 'Electronic Corp SN',     baseUrl: 'https://electroniccorp.sn' },
  { id: 'dakarmondialtelephone', nom: 'Dakar Mondial Téléphone', baseUrl: 'https://dakarmondialtelephone.com' },
  { id: 'dakarmarket',         nom: 'Dakar Market',           baseUrl: 'https://dakarmarket.sn' },
  { id: 'kaynoo',              nom: 'Kaynoo',                 baseUrl: 'https://www.kaynoo.sn' },
  { id: 'masterofficedeco',    nom: 'Master Office Déco',     baseUrl: 'https://masterofficedeco.sn' },
  { id: 'afriqmarket',         nom: 'AfriQ Market',           baseUrl: 'https://shop.afriqmarket.com' },
  { id: 'electroluxdakar',     nom: 'Electrolux Dakar',       baseUrl: 'https://electroluxdakar.com' },
];

// ── DIAGNOSTIC ───────────────────────────────────────────────
async function diagnosticNouveauSite(siteId) {
  const config = SITES_CONFIG.find(s => s.id === siteId);
  if (!config) {
    throw new Error(`Site inconnu: "${siteId}". Disponibles: ${SITES_CONFIG.map(s => s.id).join(', ')}`);
  }
  const items = await scraperSite(config);
  return {
    site: config.nom, url: config.baseUrl,
    nb_resultats: items.length,
    statut: items.length >= 5 ? 'OK' : items.length > 0 ? 'PARTIEL' : 'ECHEC',
    exemples: items.slice(0, 5).map(i => ({
      titre: i.titre,
      prix:  `${(i.prix || 0).toLocaleString('fr-FR')} FCFA`,
      image: i.image_url ? '✓' : '✗',
      url:   i.url,
    })),
  };
}

// ── SCRAPING GLOBAL ──────────────────────────────────────────
async function scraperTousNouveauxSites(siteIds = null) {
  const configs = siteIds
    ? SITES_CONFIG.filter(s => siteIds.includes(s.id))
    : SITES_CONFIG;

  const resultatsParSite = {};
  console.log(`\n[NEW-SITES] ══════ DÉBUT (${configs.length} sites) ══════`);

  for (const config of configs) {
    try {
      const items = await scraperSite(config);
      resultatsParSite[config.id] = { nom: config.nom, baseUrl: config.baseUrl, items };
    } catch (err) {
      console.error(`[NEW-SITES] ${config.nom}: ${err.message}`);
      resultatsParSite[config.id] = { nom: config.nom, baseUrl: config.baseUrl, items: [] };
    }
    await sleep(6000 + Math.random() * 3000);
  }

  const total = Object.values(resultatsParSite).reduce((s, v) => s + v.items.length, 0);
  console.log(`\n[NEW-SITES] ══════ FIN — ${total} produits total ══════`);
  return resultatsParSite;
}

module.exports = {
  scraperTousNouveauxSites,
  diagnosticNouveauSite,
  SITES_CONFIG,
};
