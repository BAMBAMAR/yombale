// backend/services/scraper-new-sites.js v3
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
//
//  CORRECTIONS v3 :
//  - FIX prix divisés par 100/1000 : détection FCFA élargie + garde-fou post-division
//  - FIX autodécouverte : patterns supplémentaires + test de toutes les candidates
//  - FIX HTML scraping : sélecteur bdi/span.amount pour WooCommerce récent
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
  const n = parseInt((t + '').replace(/[\s\u00a0]/g, '').replace(/[^0-9]/g, ''));
  return isNaN(n) || n < 500 ? 0 : n;
}
function nettoyerTitre(t) {
  return (t || '').trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').slice(0, 255);
}

// ── CORRECTION : détection devise FCFA élargie ───────────────
// XOF = code ISO officiel du FCFA (zone UEMOA, dont Sénégal)
// XAF = FCFA zone CEMAC (parfois utilisé par erreur dans WooCommerce)
// Certains sites laissent le champ vide ou utilisent des alias non standard
const CODES_FCFA = new Set(['XOF', 'FCFA', 'CFA', 'XAF', 'SENEGAL', 'SEN', 'F CFA', '']);
function isCurrencyFCFA(currencyCode) {
  return CODES_FCFA.has((currencyCode || '').toUpperCase().trim());
}

// ── CORRECTION : calcul du prix avec garde-fou ───────────────
// WooCommerce renvoie les prix en "minor units" (centimes).
// Pour XOF, il ne devrait PAS y avoir de décimales (currency_minor_unit=0).
// Mais certains sites laissent la config par défaut (=2 pour EUR/USD).
// Résultat : 150 000 FCFA stocké comme 150000 → divisé par 100 → 1 500 FCFA (FAUX).
//
// Stratégie de correction :
//  1. Si la devise est FCFA → ne jamais diviser (rawUnit forcé à 0).
//  2. Si la devise est inconnue ET que la division produit un prix < 500 → ne pas diviser.
function calculerPrixWoo(pricesObj) {
  const currCode = (pricesObj?.currency_code || '').toUpperCase().trim();
  const prixRaw  = parseInt(pricesObj?.price || pricesObj?.sale_price || '0', 10);
  if (isNaN(prixRaw) || prixRaw <= 0) return 0;

  // Devise FCFA connue → pas de conversion
  if (isCurrencyFCFA(currCode)) return prixRaw;

  // Devise non-FCFA → appliquer les minor units
  const rawUnit = parseInt(pricesObj?.currency_minor_unit ?? '0', 10);
  if (rawUnit <= 0) return prixRaw;

  const prixDivise = Math.round(prixRaw / Math.pow(10, rawUnit));

  // Garde-fou : si le résultat semble trop bas pour être du FCFA (< 500),
  // mais que le brut est lui dans une plage raisonnable, ne pas diviser.
  if (prixDivise < 500 && prixRaw >= 500) {
    console.warn(`[PRIX] Garde-fou activé: brut=${prixRaw}, divisé=${prixDivise} (÷${Math.pow(10,rawUnit)}) → conservation du brut`);
    return prixRaw;
  }

  return prixDivise;
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
// CORRECTION : patterns élargis + validation que l'URL répond avant de la retourner
async function decouvririURLsShop(baseUrl) {
  const candidates = new Set();

  // Patterns de chemins courants sur les boutiques sénégalaises
  const SHOP_PATTERNS = [
    /\/shop\/?$/i, /\/boutique\/?$/i, /\/produits?\/?$/i, /\/store\/?$/i,
    /\/telephones?\/?$/i, /\/smartphones?\/?$/i, /\/electromenager\/?$/i,
    /\/informatique\/?$/i, /\/tv\/?$/i, /\/mode\/?$/i, /\/beaute\/?$/i,
    /product-categor(y|ie)\//i, /categori/i, /\/catalog\/?$/i,
    /\/nos-produits\/?$/i, /\/tous-les-produits\/?$/i,
  ];

  // URLs fixes à toujours tenter (par ordre de probabilité sur WooCommerce SN)
  const DEFAULTS = ['/shop/', '/boutique/', '/produits/', '/store/'];

  try {
    const html = await fetchHtml(baseUrl, '', 12000);
    const $ = cheerio.load(html);

    // 1. Liens de navigation principaux
    $('nav a[href], .menu a[href], #menu a[href], header a[href], .nav-menu a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const full = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
      if (
        full.includes(baseUrl.replace(/https?:\/\//, '')) &&
        SHOP_PATTERNS.some(p => p.test(full))
      ) {
        candidates.add(full.split('?')[0].replace(/\/$/, '') + '/');
      }
    });

    // 2. Liens footer et body
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href.startsWith('http') && SHOP_PATTERNS.some(p => p.test(href))) {
        const full = `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`.split('?')[0];
        if (!full.includes('wp-') && !full.includes('.css') && !full.includes('.js')) {
          candidates.add(full.replace(/\/$/, '') + '/');
        }
      }
    });
  } catch (err) {
    console.warn(`[DISCOVER] ${baseUrl} homepage inaccessible: ${err.message}`);
  }

  // Toujours ajouter les defaults
  for (const d of DEFAULTS) candidates.add(`${baseUrl}${d}`);

  // CORRECTION : tester chaque candidate et ne garder que celles qui répondent
  const valides = [];
  for (const url of [...candidates].slice(0, 10)) {
    try {
      await axios.head(url, { timeout: 5000, maxRedirects: 3, headers: { 'User-Agent': randUA() } });
      valides.push(url);
    } catch {
      // URL inaccessible → ignorée silencieusement
    }
  }

  // Si aucune URL valide, retourner quand même /shop/ pour tenter le HTML scraping
  const result = valides.length > 0 ? valides.slice(0, 6) : [`${baseUrl}/shop/`];
  console.log(`[DISCOVER] ${baseUrl} → ${result.length} URL(s) valide(s): ${result.join(' | ')}`);
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
        // CORRECTION : utiliser calculerPrixWoo() à la place du bloc inline précédent
        const prix  = calculerPrixWoo(p.prices);
        const img   = p.images?.[0]?.src || null;
        const lien  = p.permalink || `${baseUrl}/?p=${p.id}`;
        if (titre.length > 3 && prix > 500) resultats.push({ titre, prix, url: lien, image_url: img });
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
        // REST v3 renvoie le prix en string texte brut (ex: "150000"), pas en minor units
        const prix  = nettoyerPrix(p.price || p.regular_price || '0');
        const img   = p.images?.[0]?.src || null;
        const lien  = p.permalink || `${baseUrl}/?p=${p.id}`;
        if (titre.length > 3 && prix > 500) resultats.push({ titre, prix, url: lien, image_url: img });
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
// CORRECTION : ajout du sélecteur bdi pour WooCommerce 8.x+ et du sélecteur
// data-price (attribut HTML5 souvent plus fiable que le texte affiché)
const SELECTEURS = [
  // WooCommerce standard (v5–v8)
  {
    c: 'li.product,article.product,.product-item,.product-grid-item',
    t: '.woocommerce-loop-product__title,h2.product-title,h3.product-title,.product-name,h3',
    p: '.price bdi,.price .woocommerce-Price-amount,.price .amount,.woocommerce-Price-amount,bdi',
    l: 'a.woocommerce-loop-product__link,a[href*="product"],a.product-link',
    i: 'img.attachment-woocommerce_thumbnail,img.wp-post-image,.product-image img,img',
  },
  // Flatsome / thèmes enfants
  {
    c: '.product-small,.product-card,.box-product,.col-inner',
    t: '.name,.product-title,h3,h4,.title',
    p: '.price bdi,.price .amount,.price-wrapper .amount,span.amount',
    l: 'a[href*="product"],a.product-link,.box-image > a',
    i: 'img.attachment-shop_catalog,img.featured-image,img',
  },
  // PrestaShop
  {
    c: '.product-miniature,.thumbnail-container,article.product-miniature',
    t: '.product-title a,h3.product-title,.product-name',
    p: '.price,.product-price,span[itemprop="price"],.current-price',
    l: 'a.product-thumbnail,a.product-title,h3.product-title a',
    i: 'img.product-cover-img,img.thumbnail,img',
  },
  // Générique e-commerce
  {
    c: '[class*="product-card"],[class*="product-item"],[class*="item-product"]',
    t: '[class*="product-name"],[class*="product-title"],h2,h3,h4',
    p: '[class*="price"],[class*="prix"],[itemprop="price"],[data-price]',
    l: 'a[href*="product"],a[href*="produit"],a[href]',
    i: 'img[src*="product"],img[src*="catalog"],img',
  },
];

async function scraperHTML(baseUrl, nom, shopUrls, maxPages = 3) {
  const resultats = [];
  const vus = new Set();

  for (const catUrl of shopUrls) {
    for (let page = 1; page <= maxPages; page++) {
      const sep     = catUrl.includes('?') ? '&' : '?';
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

            // CORRECTION : tenter aussi l'attribut data-price et content (schema.org)
            const prixTxt =
              $(el).find(s.p).first().text() ||
              $(el).find('[itemprop="price"]').attr('content') ||
              $(el).find('[data-price]').attr('data-price') || '';
            const prix = nettoyerPrix(prixTxt);

            let href = $(el).find(s.l).first().attr('href') || $(el).closest('a').attr('href') || '';
            if (href && !href.startsWith('http')) href = `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;

            const imgEl  = $(el).find(s.i).first();
            const img    = imgEl.attr('data-src') || imgEl.attr('src') || imgEl.attr('data-lazy') || null;
            const imgFull = img && !img.startsWith('http') ? `${baseUrl}${img}` : img;

            if (titre.length > 3 && prix > 500 && !vus.has(titre)) {
              vus.add(titre);
              resultats.push({ titre, prix, url: href, image_url: imgFull });
              found++;
            }
          });

          if (found > 0) {
            console.log(`[HTML] ${nom} — ${catUrl.split('/').filter(Boolean).pop() || 'shop'} p${page}: ${found} (sél: ${s.c.slice(0, 30)})`);
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
  const { nom, baseUrl } = config;
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`[NEW] ${nom}  (${baseUrl})`);

  // 1. WooCommerce Store API (JSON — le plus fiable)
  let res = await scraperWooStoreAPI(baseUrl, nom, 8);
  if (res.length >= 5) {
    console.log(`[NEW] ${nom} ✅ WC-Store API → ${res.length} produits`);
    return res;
  }

  // 2. WooCommerce REST API v3
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
  { id: 'nova',                  nom: 'Nova Sénégal',             baseUrl: 'https://nova.sn' },
  { id: 'kanje',                 nom: 'Kanje',                    baseUrl: 'https://kanje.sn' },
  { id: 'electroniccorp',        nom: 'Electronic Corp SN',       baseUrl: 'https://electroniccorp.sn' },
  { id: 'dakarmondialtelephone', nom: 'Dakar Mondial Téléphone',  baseUrl: 'https://dakarmondialtelephone.com' },
  { id: 'dakarmarket',           nom: 'Dakar Market',             baseUrl: 'https://dakarmarket.sn' },
  { id: 'kaynoo',                nom: 'Kaynoo',                   baseUrl: 'https://www.kaynoo.sn' },
  { id: 'masterofficedeco',      nom: 'Master Office Déco',       baseUrl: 'https://masterofficedeco.sn' },
  { id: 'afriqmarket',           nom: 'AfriQ Market',             baseUrl: 'https://shop.afriqmarket.com' },
  { id: 'electroluxdakar',       nom: 'Electrolux Dakar',         baseUrl: 'https://electroluxdakar.com' },
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
