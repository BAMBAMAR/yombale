// backend/services/scraper-new-sites.js
// ═══════════════════════════════════════════════════════════════
//  SCRAPER — 14 NOUVEAUX SITES SÉNÉGALAIS
//  Stratégie par ordre de priorité :
//  1. WooCommerce Store API (public, JSON, pas d'auth requise)
//  2. WooCommerce REST API v3 (tenter sans auth — parfois open)
//  3. HTML scraping avec sélecteurs CSS adaptatifs
//  4. Sitemap XML → pages produits individuelles
// ═══════════════════════════════════════════════════════════════

const axios   = require('axios');
const cheerio = require('cheerio');

// ──────────────────────────────────────────────────────────────
//  HELPERS communs (dupliqués ici pour autonomie du module)
// ──────────────────────────────────────────────────────────────

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
];
const randUA = () => UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function nettoyerPrix(t) {
  if (!t) return 0;
  const n = parseInt((t + '').replace(/\s/g, '').replace(/[^0-9]/g, ''));
  return isNaN(n) || n < 100 ? 0 : n;
}

function nettoyerTitre(t) {
  return (t || '').trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').slice(0, 255);
}

// Headers simulant un vrai navigateur Chrome
function getHeaders(referer = '') {
  return {
    'User-Agent': randUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': referer ? 'same-origin' : 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    ...(referer ? { 'Referer': referer } : {}),
  };
}

function getJsonHeaders() {
  return {
    'User-Agent': randUA(),
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr-FR,fr;q=0.9',
    'Origin': '',
    'Referer': '',
  };
}

async function fetchHtml(url, referer = '') {
  const { data } = await axios.get(url, {
    headers: getHeaders(referer),
    timeout: 20000,
    maxRedirects: 5,
    responseType: 'text',
  });
  return data;
}

async function fetchJson(url) {
  const { data } = await axios.get(url, {
    headers: getJsonHeaders(),
    timeout: 15000,
    maxRedirects: 3,
  });
  return data;
}

// ──────────────────────────────────────────────────────────────
//  STRATÉGIE A — WooCommerce Store API (public, sans auth)
//  Endpoint : /wp-json/wc/store/v1/products?per_page=100&page=N
//  Retourne : [{id, name, prices:{price}, images:[{src}], permalink}]
// ──────────────────────────────────────────────────────────────

async function scraperWooStoreAPI(baseUrl, marchandNom, maxPages = 10) {
  const resultats = [];
  console.log(`\n[WC-STORE] ${baseUrl}`);

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `${baseUrl}/wp-json/wc/store/v1/products?per_page=100&page=${page}&status=publish`;
      const data = await fetchJson(url);

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`[WC-STORE] ${marchandNom} — Page ${page}: 0 résultat (fin)`);
        break;
      }

      for (const p of data) {
        const titre = nettoyerTitre(p.name || '');
        // prices.price est en centimes (ex: "12500000" = 125 000 FCFA)
        const prixRaw = p.prices?.price || p.prices?.sale_price || '0';
        // WC Store API retourne les prix multipliés par 10^decimals (généralement 2)
        const decimals = parseInt(p.prices?.currency_minor_unit || '2', 10);
        const prix = Math.round(parseInt(prixRaw, 10) / Math.pow(10, decimals));
        const image = p.images?.[0]?.src || null;
        const urlProduit = p.permalink || `${baseUrl}/?p=${p.id}`;

        if (titre.length > 3 && prix > 500) {
          resultats.push({ titre, prix, url: urlProduit, image_url: image });
        }
      }

      console.log(`[WC-STORE] ${marchandNom} — Page ${page}: ${data.length} produits`);
      await sleep(1500 + Math.random() * 500);
    } catch (err) {
      if (err.response?.status === 404) {
        console.log(`[WC-STORE] ${marchandNom} — API non disponible (404)`);
      } else {
        console.warn(`[WC-STORE] ${marchandNom} — Page ${page}: ${err.response?.status || err.code}`);
      }
      break;
    }
  }

  console.log(`[WC-STORE] ${marchandNom} — Total: ${resultats.length}`);
  return resultats;
}

// ──────────────────────────────────────────────────────────────
//  STRATÉGIE B — WooCommerce REST API v3 (tentative sans auth)
//  Certains sites ont mal configuré les permissions → accessible
// ──────────────────────────────────────────────────────────────

async function scraperWooRESTAPI(baseUrl, marchandNom, maxPages = 5) {
  const resultats = [];
  console.log(`\n[WC-REST] ${baseUrl}`);

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `${baseUrl}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish`;
      const data = await fetchJson(url);

      if (!Array.isArray(data) || data.length === 0) break;

      for (const p of data) {
        const titre = nettoyerTitre(p.name || '');
        const prix = nettoyerPrix(p.price || p.regular_price || '0');
        const image = p.images?.[0]?.src || null;
        const urlProduit = p.permalink || `${baseUrl}/?p=${p.id}`;

        if (titre.length > 3 && prix > 500) {
          resultats.push({ titre, prix, url: urlProduit, image_url: image });
        }
      }

      console.log(`[WC-REST] ${marchandNom} — Page ${page}: ${data.length}`);
      await sleep(1000);
    } catch (err) {
      console.log(`[WC-REST] ${marchandNom} — ${err.response?.status || err.code} (pas d'accès libre)`);
      break;
    }
  }

  console.log(`[WC-REST] ${marchandNom} — Total: ${resultats.length}`);
  return resultats;
}

// ──────────────────────────────────────────────────────────────
//  STRATÉGIE C — HTML Scraping adaptatif (WooCommerce + PrestaShop)
//  Sélecteurs couvrant les thèmes WooCommerce les plus courants
// ──────────────────────────────────────────────────────────────

// Sélecteurs CSS ordonnés par probabilité de succès
const SELECTEURS_WOO = [
  // WooCommerce standard (thèmes: Flatsome, Astra, Divi, OceanWP, Storefront)
  {
    c: 'li.product, .product-item, .product-grid-item, article.product',
    t: '.woocommerce-loop-product__title, h2.product-title, h3.product-title, .product-name, .entry-title, .product__title',
    p: '.price .woocommerce-Price-amount, .price ins .amount, .price .amount, bdi, .woocommerce-Price-amount',
    l: 'a.woocommerce-loop-product__link, a[href*="product"], a.product-link, a.add_to_cart_button',
    i: 'img.attachment-woocommerce_thumbnail, img.wp-post-image, .product-image img, img[class*="product"]',
  },
  // Flatsome theme
  {
    c: '.product-small, .product-card, .box-product',
    t: '.name, .product-title, h3, h4',
    p: '.price .amount, .price-wrapper .amount, span.amount',
    l: 'a[href*="product"], a.product-link, .box-image > a',
    i: 'img.attachment-shop_catalog, img.featured-image, img',
  },
  // Astra / GeneratePress
  {
    c: '.ast-shop-product-in-loop, .product-woo-loop-item, .wc-block-grid__product',
    t: '.ast-product-title, .woocommerce-loop-product__title, h2',
    p: '.price .woocommerce-Price-amount, .price ins .amount',
    l: 'a.woocommerce-loop-product__link, a[href]',
    i: 'img',
  },
  // PrestaShop (utilisé sur certains sites .sn)
  {
    c: '.product-miniature, .thumbnail-container, article.product-miniature',
    t: '.product-title a, h3.product-title, .product-name',
    p: '.price, .product-price, span[itemprop="price"], .current-price',
    l: 'a.product-thumbnail, a.product-title, h3.product-title a',
    i: 'img.product-cover-img, img.thumbnail, img.card-img-top',
  },
  // Fallback générique e-commerce
  {
    c: '[class*="product-card"], [class*="product-item"], [class*="item-product"], [class*="product-box"]',
    t: '[class*="product-name"], [class*="product-title"], h2, h3, h4, [class*="name"]',
    p: '[class*="price"], [class*="prix"], [itemprop="price"]',
    l: 'a[href*="product"], a[href*="produit"], a[href]',
    i: 'img[src*="product"], img[src*="catalog"], img',
  },
];

const SELECTEURS_JIJI = [
  {
    c: '.b-list-advert__item-wrapper, [class*="advert-list-item"], .qa-advert-list-item',
    t: '[class*="advert-title"], .b-advert-title, .qa-advert-title-text, h3 a, h2 a',
    p: '[class*="price"], .b-list-advert__item-price, .qa-advert-price',
    l: 'a[href*="/advert/"], a[href*="jiji"]',
    i: 'img[data-src], img[src]',
  },
  {
    c: '.b-list-advert-base__item, .list-advert-item',
    t: '.b-advert-title-inner, h3, h2',
    p: '.b-advert-price__money, .price',
    l: 'a[href]',
    i: 'img',
  },
];

async function scraperHTML(config, maxPages = 3) {
  const { baseUrl, nom, categorieUrls, selecteurs } = config;
  const resultats = [];
  console.log(`\n[HTML] ${nom}`);

  for (const catUrl of categorieUrls) {
    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = page === 1 ? catUrl : `${catUrl}${catUrl.includes('?') ? '&' : '?'}page=${page}`;
      try {
        const html = await fetchHtml(pageUrl, baseUrl);
        const $ = cheerio.load(html);
        let found = 0;

        const sels = selecteurs || SELECTEURS_WOO;
        for (const s of sels) {
          const items = $(s.c);
          if (!items.length) continue;

          items.each((_, el) => {
            const titre = nettoyerTitre($(el).find(s.t).first().text());
            const prixText = $(el).find(s.p).first().text()
              || $(el).find(s.p).first().attr('content') || '';
            const prix = nettoyerPrix(prixText);

            let href = $(el).find(s.l).first().attr('href')
              || $(el).closest('a').attr('href') || '';
            if (href && !href.startsWith('http')) href = `${baseUrl}${href}`;

            const imgEl = $(el).find(s.i).first();
            const img = imgEl.attr('data-src') || imgEl.attr('src') || imgEl.attr('data-lazy') || null;
            const imgFull = img && !img.startsWith('http') ? `${baseUrl}${img}` : img;

            if (titre.length > 3 && prix > 500) {
              resultats.push({ titre, prix, url: href, image_url: imgFull });
              found++;
            }
          });

          if (found > 0) {
            console.log(`[HTML] ${nom} — ${pageUrl}: ${found} (sél: "${s.c}")`);
            break;
          }
        }

        if (found === 0) {
          console.warn(`[HTML] ${nom} — Page ${page}: 0 résultat, arrêt`);
          break;
        }
      } catch (err) {
        console.error(`[HTML] ${nom} — ${pageUrl}: ${err.response?.status || err.message}`);
        break;
      }
      await sleep(2000 + Math.random() * 1500);
    }
    await sleep(3000);
  }

  console.log(`[HTML] ${nom} — Total: ${resultats.length}`);
  return resultats;
}

// ──────────────────────────────────────────────────────────────
//  STRATÉGIE D — Sitemap XML → scraping pages produits
//  Pour sites avec protection anti-bot sur les listings
// ──────────────────────────────────────────────────────────────

async function scraperViaSitemap(baseUrl, marchandNom, maxProduits = 200) {
  const resultats = [];
  console.log(`\n[SITEMAP] ${baseUrl}`);

  try {
    // Tenter sitemap_index.xml puis sitemap.xml
    let sitemapUrls = [];
    for (const path of ['/product-sitemap.xml', '/sitemap_index.xml', '/sitemap.xml']) {
      try {
        const xml = await fetchHtml(`${baseUrl}${path}`);
        const $ = cheerio.load(xml, { xmlMode: true });
        // Extraire les URLs de produits
        $('url > loc, sitemap > loc').each((_, el) => {
          const loc = $(el).text();
          if (loc.includes('/product/') || loc.includes('/produit/') || loc.includes('?p=')) {
            sitemapUrls.push(loc);
          } else if (loc.includes('product-sitemap')) {
            // C'est un index → charger ce sitemap
            sitemapUrls.push(`__SITEMAP__${loc}`);
          }
        });
        if (sitemapUrls.length > 0) break;
      } catch { /* continuer */ }
    }

    // Résoudre les sous-sitemaps
    const toFetch = [];
    for (const u of sitemapUrls) {
      if (u.startsWith('__SITEMAP__')) {
        try {
          const xml2 = await fetchHtml(u.replace('__SITEMAP__', ''));
          const $2 = cheerio.load(xml2, { xmlMode: true });
          $2('url > loc').each((_, el) => toFetch.push($2(el).text()));
        } catch { /* ignorer */ }
      } else {
        toFetch.push(u);
      }
    }

    console.log(`[SITEMAP] ${marchandNom} — ${toFetch.length} URLs produits trouvées`);
    const sample = toFetch.slice(0, maxProduits);

    for (const url of sample) {
      try {
        const html = await fetchHtml(url, baseUrl);
        const $ = cheerio.load(html);

        // Extraire depuis la page produit WooCommerce
        const titre = nettoyerTitre(
          $('h1.product_title, h1.entry-title, h1[itemprop="name"], [class*="product-title"] h1').first().text()
          || $('h1').first().text()
        );
        const prixText = $('.price .woocommerce-Price-amount, .price .amount, bdi, [itemprop="price"]').first().text()
          || $('[itemprop="price"]').first().attr('content') || '';
        const prix = nettoyerPrix(prixText);
        const img = $('div.woocommerce-product-gallery img, .product-images img, [class*="product"] img').first().attr('src') || null;

        if (titre.length > 3 && prix > 500) {
          resultats.push({ titre, prix, url, image_url: img });
        }
      } catch { /* ignorer erreurs individuelles */ }
      await sleep(800 + Math.random() * 400);
    }
  } catch (err) {
    console.error(`[SITEMAP] ${marchandNom}: ${err.message}`);
  }

  console.log(`[SITEMAP] ${marchandNom} — Total: ${resultats.length}`);
  return resultats;
}

// ──────────────────────────────────────────────────────────────
//  CATALOGUE DES 14 SITES — config + stratégie par site
// ──────────────────────────────────────────────────────────────

// Catégories HTML à scraper par site (pages listing)
const CATS_WOO_GENERIQUES = [
  '/shop/', '/boutique/', '/produits/', '/telephones/', '/smartphones/',
  '/informatique/', '/electromenager/', '/television/', '/accessoires/', '/mode/',
];

const SITES_CONFIG = [
  // ── E-commerce WooCommerce reconnus ──
  {
    id: 'nova',
    nom: 'Nova Sénégal',
    baseUrl: 'https://nova.sn',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://nova.sn/shop/',
      'https://nova.sn/produit-categorie/smartphones/',
      'https://nova.sn/produit-categorie/informatique/',
      'https://nova.sn/produit-categorie/tv-son/',
      'https://nova.sn/produit-categorie/electromenager/',
    ],
  },
  {
    id: 'kanje',
    nom: 'Kanje',
    baseUrl: 'https://kanje.sn',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://kanje.sn/shop/',
      'https://kanje.sn/produit-categorie/telephones/',
      'https://kanje.sn/produit-categorie/informatique/',
      'https://kanje.sn/produit-categorie/electromenager/',
      'https://kanje.sn/produit-categorie/television/',
    ],
  },
  {
    id: 'electromenager-dakar',
    nom: 'Electroménager Dakar',
    baseUrl: 'https://www.electromenager-dakar.com',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://www.electromenager-dakar.com/shop/',
      'https://www.electromenager-dakar.com/produit-categorie/electromenager/',
      'https://www.electromenager-dakar.com/produit-categorie/television/',
      'https://www.electromenager-dakar.com/produit-categorie/climatiseur/',
    ],
  },
  {
    id: 'dakarmondialtelephone',
    nom: 'Dakar Mondial Telephone',
    baseUrl: 'https://dakarmondialtelephone.com',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://dakarmondialtelephone.com/shop/',
      'https://dakarmondialtelephone.com/produit-categorie/smartphones/',
      'https://dakarmondialtelephone.com/produit-categorie/accessoires/',
    ],
  },
  {
    id: 'kaynoo',
    nom: 'Kaynoo',
    baseUrl: 'https://www.kaynoo.sn',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://www.kaynoo.sn/shop/',
      'https://www.kaynoo.sn/produit-categorie/telephones/',
      'https://www.kaynoo.sn/produit-categorie/informatique/',
      'https://www.kaynoo.sn/produit-categorie/mode-beaute/',
    ],
  },
  {
    id: 'masterofficedeco',
    nom: 'Master Office Déco',
    baseUrl: 'https://masterofficedeco.sn',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://masterofficedeco.sn/shop/',
      'https://masterofficedeco.sn/produit-categorie/mobilier-de-bureau/',
      'https://masterofficedeco.sn/produit-categorie/informatique/',
      'https://masterofficedeco.sn/produit-categorie/decoration/',
    ],
  },
  {
    id: 'electroniccorp',
    nom: 'Electronic Corp SN',
    baseUrl: 'https://electroniccorp.sn',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://electroniccorp.sn/shop/',
      'https://electroniccorp.sn/produit-categorie/smartphones/',
      'https://electroniccorp.sn/produit-categorie/informatique/',
      'https://electroniccorp.sn/produit-categorie/tv-son/',
      'https://electroniccorp.sn/produit-categorie/electromenager/',
    ],
  },
  {
    id: 'universcosmetix',
    nom: 'Univers Cosmétix',
    baseUrl: 'https://www.universcosmetix.com',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://www.universcosmetix.com/shop/',
      'https://www.universcosmetix.com/produit-categorie/soins-corps/',
      'https://www.universcosmetix.com/produit-categorie/parfums/',
      'https://www.universcosmetix.com/produit-categorie/maquillage/',
    ],
  },
  {
    id: 'electroluxdakar',
    nom: 'Electrolux Dakar',
    baseUrl: 'https://electroluxdakar.com',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://electroluxdakar.com/shop/',
      'https://electroluxdakar.com/produit-categorie/refrigerateurs/',
      'https://electroluxdakar.com/produit-categorie/lave-linge/',
      'https://electroluxdakar.com/produit-categorie/climatiseurs/',
    ],
  },
  {
    id: 'afriqmarket',
    nom: 'AfriQ Market',
    baseUrl: 'https://shop.afriqmarket.com',
    strategies: ['woo-store', 'woo-rest', 'html'],
    categorieUrls: [
      'https://shop.afriqmarket.com/shop/',
      'https://shop.afriqmarket.com/produit-categorie/electronique/',
      'https://shop.afriqmarket.com/produit-categorie/electromenager/',
      'https://shop.afriqmarket.com/produit-categorie/mode/',
    ],
  },
  // ── Sites avec structure spéciale ──
  {
    id: 'promo',
    nom: 'Promo.sn',
    baseUrl: 'https://promo.sn',
    strategies: ['woo-store', 'html', 'sitemap'],
    categorieUrls: [
      'https://promo.sn/shop/',
      'https://promo.sn/boutique/',
      'https://promo.sn/telephones/',
      'https://promo.sn/electromenager/',
      'https://promo.sn/informatique/',
    ],
  },
  {
    id: 'soumari',
    nom: 'Soumari',
    baseUrl: 'https://www.soumari.com',
    strategies: ['woo-store', 'html'],
    categorieUrls: [
      'https://www.soumari.com/shop/',
      'https://www.soumari.com/boutique/',
      'https://www.soumari.com/telephones-tablettes/',
      'https://www.soumari.com/informatique/',
      'https://www.soumari.com/electromenager/',
    ],
  },
  {
    id: 'dakarmarket',
    nom: 'Dakar Market',
    baseUrl: 'https://dakarmarket.sn',
    strategies: ['woo-store', 'html'],
    categorieUrls: [
      'https://dakarmarket.sn/shop/',
      'https://dakarmarket.sn/boutique/',
      'https://dakarmarket.sn/telephones/',
      'https://dakarmarket.sn/electromenager/',
    ],
  },
  // ── Jiji (classifieds comme CoinAfrique) ──
  {
    id: 'jiji',
    nom: 'Jiji SN',
    baseUrl: 'https://jiji.sn',
    strategies: ['html-jiji'],
    // Jiji utilise son propre routing
    categorieUrls: [
      'https://jiji.sn/telephones-et-tablettes',
      'https://jiji.sn/ordinateurs-et-peripheriques',
      'https://jiji.sn/televiseurs-et-video',
      'https://jiji.sn/electromenagers',
      'https://jiji.sn/mode-et-vetements',
    ],
    selecteurs: SELECTEURS_JIJI,
  },
];

// ──────────────────────────────────────────────────────────────
//  ORCHESTRATEUR — tente les stratégies dans l'ordre
// ──────────────────────────────────────────────────────────────

async function scraperSite(config) {
  const { id, nom, baseUrl, strategies, categorieUrls, selecteurs } = config;
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`[NEW] Démarrage : ${nom} (${baseUrl})`);

  for (const strategie of strategies) {
    let resultats = [];
    try {
      if (strategie === 'woo-store') {
        resultats = await scraperWooStoreAPI(baseUrl, nom, 10);
      } else if (strategie === 'woo-rest') {
        resultats = await scraperWooRESTAPI(baseUrl, nom, 5);
      } else if (strategie === 'html' || strategie === 'html-jiji') {
        resultats = await scraperHTML({
          baseUrl, nom,
          categorieUrls: categorieUrls || [],
          selecteurs: strategie === 'html-jiji' ? SELECTEURS_JIJI : (selecteurs || SELECTEURS_WOO),
        }, 3);
      } else if (strategie === 'sitemap') {
        resultats = await scraperViaSitemap(baseUrl, nom, 150);
      }

      if (resultats.length >= 5) {
        console.log(`[NEW] ${nom} — ✅ ${strategie} → ${resultats.length} produits`);
        return resultats;
      } else if (resultats.length > 0) {
        console.log(`[NEW] ${nom} — ⚠️  ${strategie} → ${resultats.length} (trop peu, essai suivant)`);
      } else {
        console.log(`[NEW] ${nom} — ❌ ${strategie} → 0, essai suivant`);
      }
    } catch (err) {
      console.error(`[NEW] ${nom} — ${strategie}: ${err.message}`);
    }
    await sleep(2000);
  }

  console.log(`[NEW] ${nom} — ⛔ Toutes les stratégies ont échoué`);
  return [];
}

// ──────────────────────────────────────────────────────────────
//  DIAGNOSTIC — tester un seul site
// ──────────────────────────────────────────────────────────────

async function diagnosticNouveauSite(siteId) {
  const config = SITES_CONFIG.find(s => s.id === siteId);
  if (!config) throw new Error(`Site inconnu: ${siteId}. Valeurs: ${SITES_CONFIG.map(s => s.id).join(', ')}`);

  const items = await scraperSite(config);
  return {
    site: config.nom,
    url: config.baseUrl,
    nb_resultats: items.length,
    statut: items.length > 0 ? 'OK' : 'ECHEC',
    exemples: items.slice(0, 5).map(i => ({
      titre: i.titre,
      prix: `${(i.prix || 0).toLocaleString('fr-FR')} FCFA`,
      image: i.image_url ? '✓' : '✗',
      url: i.url,
    })),
  };
}

// ──────────────────────────────────────────────────────────────
//  EXPORT — intégration dans lancerScraping() existant
// ──────────────────────────────────────────────────────────────

/**
 * Scraper tous les nouveaux sites.
 * Retourne: Map<nomMarchand, items[]>
 */
async function scraperTousNouveauxSites(siteIds = null) {
  const configs = siteIds
    ? SITES_CONFIG.filter(s => siteIds.includes(s.id))
    : SITES_CONFIG;

  const resultatsParSite = {};
  console.log(`\n[NEW-SITES] ══════ DÉBUT (${configs.length} sites) ══════`);

  for (const config of configs) {
    try {
      const items = await scraperSite(config);
      resultatsParSite[config.id] = {
        nom: config.nom,
        baseUrl: config.baseUrl,
        items,
      };
    } catch (err) {
      console.error(`[NEW-SITES] ${config.nom}: ${err.message}`);
      resultatsParSite[config.id] = { nom: config.nom, baseUrl: config.baseUrl, items: [] };
    }
    // Pause entre sites pour éviter les bans
    await sleep(5000 + Math.random() * 3000);
  }

  const total = Object.values(resultatsParSite).reduce((s, v) => s + v.items.length, 0);
  console.log(`\n[NEW-SITES] ══════ FIN — ${total} produits total ══════`);
  return resultatsParSite;
}

module.exports = {
  scraperTousNouveauxSites,
  diagnosticNouveauSite,
  SITES_CONFIG,
  scraperWooStoreAPI,
  scraperHTML,
  scraperViaSitemap,
};
