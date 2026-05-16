// backend/services/scraper.js — Scrapers réels pour Expat-Dakar, Jumia SN, CoinAfrique
//
// CORRECTIONS :
// - nettoyerPrix : seuil minimum relevé à 500 FCFA (cohérent avec scraper-new-sites)
// - scraperExpatDakar : sélecteurs mis à jour + fallback plus agressif sur les liens
// - scraperJumia : sélecteur p.name ajouté, gestion de l'URL #catalog-listing
// - scraperCoinAfrique : sélecteur href relatif /annonce/ + fallback href parent
// - fetchPage : délai 429 porté à 20s * (i+1) pour éviter les bans durables
// - lancerScraping : pause entre catégories portée à 6 s pour réduire le ban-risk

const axios    = require('axios');
const cheerio  = require('cheerio');
const cron     = require('node-cron');
const { pool } = require('../models/db');

const UA = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];
const randUA = () => UA[Math.floor(Math.random() * UA.length)];

const CATS = {
  expat:       [
    'telephones-portables-et-tablettes',
    'informatique',
    'tv-video-photo',
    'electromenager',
    'mode-et-beaute',
    'jeux-et-jouets',
  ],
  jumia:       [
    'telephones-tablettes',
    'informatique',
    'tv-audio-video',
    'electromenager',
    'mode-et-accessoires',
    'gaming',
  ],
  coinafrique: [
    'telephonie',
    'informatique-et-multimedia',
    'electronique',
    'electromenager',
    'mode-et-beaute',
    'jeux-et-jouets',
  ],
};

const MARQUES = ['Samsung','Apple','Xiaomi','Tecno','Infinix','Oppo','Vivo','Huawei','Nokia',
  'HP','Lenovo','Dell','Asus','Acer','LG','Sony','Hisense','Haier','TCL','Realme','OnePlus','Motorola'];

const CAT_MOTS = [
  { slug:'smartphones',  mots:['samsung','iphone','xiaomi','tecno','infinix','oppo','vivo','huawei','nokia','realme','itel','tablette','smartphone','portable','ipad','téléphone','telephone'] },
  { slug:'informatique', mots:['laptop','ordinateur','macbook','lenovo','dell','hp',' pc ','clavier','souris','imprimante','disque','ssd','moniteur','ecran pc','router','wifi'] },
  { slug:'tv-electro',   mots:['télé','tele','tv ','led tv','écran tv','hisense','lg tv','samsung tv','refrigerateur','climatiseur','lave-linge','machine a laver','frigo','congélateur','ventilateur','fer a repasser'] },
  { slug:'maison',       mots:['canapé','table','chaise','lit','matelas','armoire','cuisine','meuble','déco','lampe','rideau'] },
  { slug:'mode',         mots:['robe','chaussure','sac','chemise','pantalon','vêtement','habit','sneaker','basket','montre','bijou','parfum','sac a main'] },
  { slug:'auto-moto',    mots:['voiture','moto','vélo','auto','pneu','scooter','trottinette','pièce auto'] },
  { slug:'jeux',         mots:['playstation','ps4','ps5','xbox','nintendo','manette','jeu video','gaming','casque gamer'] },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// CORRECTION : seuil minimum 500 FCFA (cohérent avec scraper-new-sites.js)
function nettoyerPrix(t) {
  if (!t) return 0;
  const n = parseInt((t + '').replace(/[\s\u00a0]/g, '').replace(/[^0-9]/g, ''));
  return isNaN(n) || n < 500 ? 0 : n;
}

function nettoyerTitre(t) { return (t || '').trim().replace(/\s+/g, ' ').slice(0, 255); }
function extraireMarque(titre) { const t = titre.toLowerCase(); return MARQUES.find(m => t.includes(m.toLowerCase())) || null; }

let _catCache = null;
function invaliderCatCache() { _catCache = null; }
async function getCatId(titre) {
  if (!_catCache) { const { rows } = await pool.query('SELECT id,slug FROM categories'); _catCache = rows; }
  const t = (' ' + titre + ' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const { slug, mots } of CAT_MOTS) { if (mots.some(m => t.includes(m))) { const c = _catCache.find(x => x.slug === slug); if (c) return c.id; } }
  return null;
}

const _marchandCache = {};
async function getMarchandId(nom, siteUrl = null) {
  if (_marchandCache[nom]) return _marchandCache[nom];
  const { rows } = await pool.query('SELECT id FROM marchands WHERE nom=$1', [nom]);
  if (rows.length) { _marchandCache[nom] = rows[0].id; return rows[0].id; }
  const r = await pool.query('INSERT INTO marchands(nom,site_url,methode) VALUES($1,$2,$3) RETURNING id', [nom, siteUrl, 'scraper']);
  _marchandCache[nom] = r.rows[0].id; return r.rows[0].id;
}

// CORRECTION : délai 429/403 porté à 20s * (i+1) pour éviter les bans prolongés
async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': randUA(),
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'Cache-Control': 'no-cache',
        },
        timeout: 20000, maxRedirects: 5,
      });
      return data;
    } catch (err) {
      const st = err.response?.status;
      console.warn(`[HTTP] Tentative ${i + 1}/${retries} — ${st || err.code} — ${url}`);
      if (i < retries - 1) await sleep(st === 429 || st === 403 ? 20000 * (i + 1) : 4000 * (i + 1));
      else throw err;
    }
  }
}

// ══════════════════════════════════════════════════════
//  SCRAPER 1 — Expat-Dakar
//
//  CORRECTIONS :
//  - Ajout du sélecteur .listing-card__header pour les nouvelles versions
//  - Fallback titre sur l'attribut title du lien <a>
//  - Normalisation du lien href même quand il est relatif sans /
// ══════════════════════════════════════════════════════
async function scraperExpatDakar(categorie = 'telephones-portables-et-tablettes', maxPages = 2) {
  const resultats = [], base = `https://www.expat-dakar.com/${categorie}`;
  console.log(`\n[EXPAT] ${base}`);
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? base : `${base}?page=${page}`;
    try {
      const html = await fetchPage(url), $ = cheerio.load(html); let found = 0;
      const essais = [
        // Layout principal observé
        {
          c: 'article.listing-item',
          t: '.listing-title,.listing-title-link,h3 a,.listing-card__title,.listing-card__header',
          p: '.listing-price,.listing-card__price,[class*="price"]',
          l: 'a.listing-title-link,a[href*="/annonce/"],a[href*="/detail/"],a[href]',
          i: 'img.listing-item-thumbnail,img[data-src],img.lazy,img[src]',
        },
        // Variante card
        {
          c: '.listing-card',
          t: '.listing-card__title,h3,.listing-card__name',
          p: '.listing-card__price,[class*="price"],[class*="prix"]',
          l: 'a[href]',
          i: 'img[data-src],img[src]',
        },
        // Variante classified
        {
          c: '.classified-item,.item-listing',
          t: '.item-title,h3,.title',
          p: '.item-price,.price',
          l: 'a[href]',
          i: 'img',
        },
        // Dernier recours : tout article
        {
          c: 'article',
          t: 'h3,h2,.title,[class*="title"],[class*="name"]',
          p: '[class*="price"],[class*="prix"],[class*="amount"]',
          l: 'a[href]',
          i: 'img[src],img[data-src]',
        },
      ];
      for (const s of essais) {
        const items = $(s.c); if (!items.length) continue;
        items.each((_, el) => {
          const titreEl = $(el).find(s.t).first();
          const titre   = nettoyerTitre(titreEl.text() || $(el).find(s.l).first().attr('title') || '');
          const prix    = nettoyerPrix($(el).find(s.p).first().text());
          let href      = $(el).find(s.l).first().attr('href') || '';
          if (href && !href.startsWith('http')) href = `https://www.expat-dakar.com${href.startsWith('/') ? '' : '/'}${href}`;
          const img     = $(el).find(s.i).first().attr('data-src') || $(el).find(s.i).first().attr('src') || null;
          if (titre.length > 3 && prix > 500) { resultats.push({ titre, prix, url: href, image_url: img }); found++; }
        });
        if (found > 0) { console.log(`[EXPAT] Page ${page}: ${found} (sélecteur "${s.c}")`); break; }
      }
      if (found === 0) {
        const snippet = $.html().replace(/\s+/g, ' ').slice(0, 600);
        console.warn(`[EXPAT] Page ${page}: 0 résultat. Début HTML: ${snippet}`);
        break;
      }
    } catch (err) { console.error(`[EXPAT] Page ${page}:`, err.message); }
    await sleep(2000 + Math.random() * 1000);
  }
  console.log(`[EXPAT] Total: ${resultats.length}`); return resultats;
}

// ══════════════════════════════════════════════════════
//  SCRAPER 2 — Jumia Sénégal
//
//  CORRECTIONS :
//  - Priorité au sélecteur p.name (plus stable que h3.name)
//  - Ajout de l'URL ?page=N sans fragment #catalog-listing (certains serveurs
//    ignorent le fragment mais cela évite des problèmes de redirection)
//  - Fallback image sur l'attribut data-image en plus de data-src
// ══════════════════════════════════════════════════════
async function scraperJumia(categorie = 'telephones-tablettes', maxPages = 3) {
  const resultats = [], base = `https://www.jumia.sn/${categorie}/`;
  console.log(`\n[JUMIA] ${base}`);
  for (let page = 1; page <= maxPages; page++) {
    // CORRECTION : ne plus utiliser #catalog-listing qui peut causer des soucis
    const url = page === 1 ? base : `${base}?page=${page}`;
    try {
      const html = await fetchPage(url), $ = cheerio.load(html); let found = 0;
      const essais = [
        // Layout 2024-2026 principal (p.name est plus stable que h3.name)
        {
          c: 'article.prd',
          t: 'p.name,h3.name,.name,[class*="name"]',
          p: 'div.prc,.prc,.price--current',
          l: 'a.core,a[href]',
          i: 'img.img,img[data-src],img[data-image],img[src]',
        },
        // Variante article[class*="prd"]
        {
          c: 'article[class*="prd"]',
          t: '[class*="name"]',
          p: '[class*="prc"],[class*="price"]',
          l: 'a[href]',
          i: 'img[data-src],img[data-image],img',
        },
        // Grille ul/li
        {
          c: 'ul.-pvs li',
          t: 'h3,.name,[class*="name"]',
          p: '[class*="price"],[class*="prc"]',
          l: 'a[href]',
          i: 'img',
        },
        // Dernier recours
        {
          c: 'article',
          t: 'p,h3,h2,[class*="name"],[class*="title"]',
          p: '[class*="price"],[class*="prc"],[class*="amount"]',
          l: 'a[href*="/"]',
          i: 'img',
        },
      ];
      for (const s of essais) {
        const items = $(s.c); if (!items.length) continue;
        items.each((_, el) => {
          const titreEl = $(el).find(s.t).first();
          const titre   = nettoyerTitre(titreEl.text() || titreEl.attr('data-name') || '');
          const prix    = nettoyerPrix($(el).find(s.p).first().text());
          let href      = $(el).find(s.l).first().attr('href') || '';
          if (href && !href.startsWith('http')) href = `https://www.jumia.sn${href.startsWith('/') ? '' : '/'}${href}`;
          // CORRECTION : tenter data-image en plus de data-src
          const imgEl   = $(el).find(s.i).first();
          const img     = imgEl.attr('data-src') || imgEl.attr('data-image') || imgEl.attr('src') || null;
          if (titre.length > 3 && prix > 500 && href) { resultats.push({ titre, prix, url: href, image_url: img }); found++; }
        });
        if (found > 0) { console.log(`[JUMIA] Page ${page}: ${found} (sélecteur "${s.c}")`); break; }
      }
      if (found === 0) {
        const snippet = $.html().replace(/\s+/g, ' ').slice(0, 600);
        console.warn(`[JUMIA] Page ${page}: 0 résultat. Début HTML: ${snippet}`);
        break;
      }
    } catch (err) { console.error(`[JUMIA] Page ${page}:`, err.message); }
    await sleep(2500 + Math.random() * 1500);
  }
  console.log(`[JUMIA] Total: ${resultats.length}`); return resultats;
}

// ══════════════════════════════════════════════════════
//  SCRAPER 3 — CoinAfrique Sénégal
//
//  CORRECTIONS :
//  - Fallback href élargi : on remonte à la balise <a> parente la plus proche
//    (sur CoinAfrique, le lien est souvent sur l'élément parent de .col.s6)
//  - Sélecteur supplémentaire pour la nouvelle version du site (div.ads-list)
// ══════════════════════════════════════════════════════
async function scraperCoinAfrique(categorie = 'telephonie', maxPages = 2) {
  const resultats = [], base = `https://sn.coinafrique.com/categorie/${categorie}`;
  console.log(`\n[COIN] ${base}`);
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? base : `${base}?page=${page}`;
    try {
      const html = await fetchPage(url), $ = cheerio.load(html); let found = 0;
      const essais = [
        // Layout principal observé — .col.s6 wrappé dans un <a>
        {
          c: '.col.s6',
          t: 'p.ad__card-description,.ad__card-description,.ad__card-name',
          p: 'p.ad__card-price,.ad__card-price',
          l: 'a[href*="/annonce/"],a[href*="/ad/"]',
          i: 'img',
        },
        // Nouvelle version — liste .ads-list
        {
          c: '.ads-list .col,.ads-list article',
          t: '.ad__card-description,.ad__card-name,h3,h2',
          p: '.ad__card-price,.price',
          l: 'a[href]',
          i: 'img',
        },
        // Fallback .card générique
        {
          c: '.card',
          t: '.card-title,p.description,.ad__card-description',
          p: '.price,p.price,.ad__card-price',
          l: 'a',
          i: 'img',
        },
        // Dernier recours
        {
          c: 'article,.item',
          t: 'h3,h2,.name,.title',
          p: '[class*="price"],[class*="prix"]',
          l: 'a[href]',
          i: 'img',
        },
      ];
      for (const s of essais) {
        const items = $(s.c); if (!items.length) continue;
        items.each((_, el) => {
          const titre = nettoyerTitre($(el).find(s.t).first().text());
          const prix  = nettoyerPrix($(el).find(s.p).first().text());
          // CORRECTION : remonter au parent <a> si aucun lien trouvé dans l'élément
          let href    = $(el).find(s.l).first().attr('href')
                     || $(el).closest('a').attr('href')
                     || $(el).parents('a').first().attr('href')
                     || '';
          if (href && !href.startsWith('http')) href = `https://sn.coinafrique.com${href.startsWith('/') ? '' : '/'}${href}`;
          const img   = $(el).find(s.i).first().attr('src') || $(el).find(s.i).first().attr('data-src') || null;
          if (titre.length > 3 && prix > 500) { resultats.push({ titre, prix, url: href, image_url: img }); found++; }
        });
        if (found > 0) { console.log(`[COIN] Page ${page}: ${found} (sélecteur "${s.c}")`); break; }
      }
      if (found === 0) { console.warn(`[COIN] Page ${page}: 0 résultat`); break; }
    } catch (err) { console.error(`[COIN] Page ${page}:`, err.message); }
    await sleep(2000 + Math.random() * 1000);
  }
  console.log(`[COIN] Total: ${resultats.length}`); return resultats;
}

// ══════════════════════════════════════════════════════
//  SAUVEGARDE EN BASE
// ══════════════════════════════════════════════════════
async function sauvegarderProduits(items, marchandNom, siteUrl) {
  const marchandId = await getMarchandId(marchandNom, siteUrl);
  const stats = { inseres: 0, mis_a_jour: 0, erreurs: 0 };
  for (const item of items) {
    try {
      let produitId;

      // 1. Correspondance exacte EAN (si dispo)
      if (item.ean) {
        const { rows: byEan } = await pool.query('SELECT id FROM produits WHERE ean=$1 LIMIT 1', [item.ean]);
        if (byEan.length > 0) { produitId = byEan[0].id; stats.mis_a_jour++; }
      }

      // 2. Correspondance par similarité sur le nom normalisé
      if (!produitId) {
        const nomNorm  = normaliserTitre(item.titre);
        const motsCles = nomNorm.split(/\s+/).filter(m => m.length >= 3).slice(0, 4);
        if (motsCles.length > 0) {
          const { rows: fuzzy } = await pool.query(
            `SELECT id, nom,
                    similarity(LOWER(nom), $1) AS sim
             FROM produits
             WHERE LOWER(nom) LIKE '%' || $2 || '%'
                OR LOWER(nom) ILIKE $3
             ORDER BY sim DESC LIMIT 3`,
            [nomNorm, motsCles[0].toLowerCase(), '%' + motsCles.slice(0, 2).join('%').toLowerCase() + '%'],
          );
          if (fuzzy.length > 0 && (fuzzy[0].sim > 0.35 || _motsClesCommuns(item.titre, fuzzy[0].nom) >= 2)) {
            produitId = fuzzy[0].id; stats.mis_a_jour++;
          }
        }
      }

      // 3. Aucun match → nouveau produit
      if (!produitId) {
        const catId    = await getCatId(item.titre);
        const { rows: n } = await pool.query(
          'INSERT INTO produits(nom,marque,categorie_id,ean,image_url) VALUES($1,$2,$3,$4,$5) RETURNING id',
          [item.titre, extraireMarque(item.titre), catId, item.ean || null, item.image_url],
        );
        produitId = n[0].id; stats.inseres++;
      }

      if (item.image_url) await pool.query('UPDATE produits SET image_url=$1 WHERE id=$2 AND image_url IS NULL', [item.image_url, produitId]);

      // Upsert offre
      const { rows: offre } = await pool.query(
        `INSERT INTO offres(produit_id,marchand_id,prix,url_achat,scraped_at,stock)
         VALUES($1,$2,$3,$4,NOW(),true)
         ON CONFLICT(produit_id,marchand_id)
         DO UPDATE SET prix=EXCLUDED.prix, url_achat=EXCLUDED.url_achat,
                       scraped_at=NOW(), stock=true
         RETURNING id`,
        [produitId, marchandId, item.prix, item.url],
      );
      if (offre.length > 0) await pool.query('INSERT INTO historique_prix(offre_id,prix) VALUES($1,$2)', [offre[0].id, item.prix]);
      await pool.query(
        'UPDATE produits SET prix_min=(SELECT MIN(o.prix) FROM offres o WHERE o.produit_id=$1 AND o.stock=true), nb_offres=(SELECT COUNT(o.id) FROM offres o WHERE o.produit_id=$1) WHERE id=$1',
        [produitId],
      );
    } catch (err) { console.error(`[DB] "${item.titre}":`, err.message); stats.erreurs++; }
  }
  return stats;
}

function _motsClesCommuns(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length >= 3));
  const wordsB = b.toLowerCase().split(/\W+/).filter(w => w.length >= 3);
  return wordsB.filter(w => wordsA.has(w)).length;
}

function normaliserTitre(s) {
  return (s || '').toLowerCase()
    .replace(/[''""\(\)\[\]]/g, '')
    .replace(/\b(neuf|occasion|reconditionné|garanti|livraison|offre|promo|bon état|état)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
}

// ══════════════════════════════════════════════════════
//  DIAGNOSTIC — test sans sauvegarder
// ══════════════════════════════════════════════════════
async function diagnosticScraper(source, categorie) {
  const fns  = { expat: scraperExpatDakar, jumia: scraperJumia, coinafrique: scraperCoinAfrique };
  const cats = { expat: 'telephones-portables-et-tablettes', jumia: 'telephones-tablettes', coinafrique: 'telephonie' };
  if (!fns[source]) throw new Error(`Source inconnue: ${source}. Valeurs: expat, jumia, coinafrique`);
  const items = await fns[source](categorie || cats[source], 1);
  return {
    source, categorie: categorie || cats[source],
    nb_resultats: items.length,
    statut: items.length > 0 ? 'OK' : 'AUCUN_RESULTAT',
    conseil: items.length === 0 ? 'Vérifier les sélecteurs CSS dans scraper.js — le site a peut-être changé de layout' : null,
    exemples: items.slice(0, 5).map(i => ({
      titre: i.titre,
      prix: `${i.prix.toLocaleString('fr-FR')} FCFA`,
      image: i.image_url ? '✓' : '✗',
      url: i.url,
    })),
  };
}

// ══════════════════════════════════════════════════════
//  ORCHESTRATION
// ══════════════════════════════════════════════════════
async function lancerScraping(sources = ['expat', 'jumia', 'coinafrique']) {
  const rapport = { debut: new Date(), sources: {} };
  invaliderCatCache();
  console.log('\n[SCRAPER] ══════ DÉBUT ══════');
  const conf = {
    expat:       { nom: 'Expat-Dakar',   url: 'https://www.expat-dakar.com', cats: CATS.expat,       fn: scraperExpatDakar },
    jumia:       { nom: 'Jumia Senegal', url: 'https://www.jumia.sn',        cats: CATS.jumia,       fn: scraperJumia },
    coinafrique: { nom: 'CoinAfrique',   url: 'https://sn.coinafrique.com',  cats: CATS.coinafrique, fn: scraperCoinAfrique },
  };
  for (const src of sources) {
    const c = conf[src]; if (!c) continue;
    const stats = { inseres: 0, mis_a_jour: 0, erreurs: 0, scrapes: 0 };
    for (const cat of c.cats) {
      try {
        const items = await c.fn(cat, 2); stats.scrapes += items.length;
        if (items.length > 0) { const r = await sauvegarderProduits(items, c.nom, c.url); stats.inseres += r.inseres; stats.mis_a_jour += r.mis_a_jour; stats.erreurs += r.erreurs; }
      } catch (err) { console.error(`[SCRAPER] ${src}/${cat}:`, err.message); stats.erreurs++; }
      // CORRECTION : pause entre catégories portée à 6 s pour réduire le risque de ban
      await sleep(6000);
    }
    rapport.sources[src] = stats;
    await pool.query('UPDATE marchands SET derniere_sync=NOW() WHERE nom=$1', [c.nom]);
    console.log(`[SCRAPER] ${c.nom}: ${stats.scrapes} scrapés → ${stats.inseres} nouveaux, ${stats.mis_a_jour} màj`);
    await sleep(8000);
  }
  rapport.fin = new Date(); rapport.duree_s = Math.round((rapport.fin - rapport.debut) / 1000);
  console.log(`[SCRAPER] ══════ FIN ${rapport.duree_s}s ══════`);
  return rapport;
}

// ══════════════════════════════════════════════════════
//  INTÉGRATION NOUVEAUX SITES
// ══════════════════════════════════════════════════════
const { scraperTousNouveauxSites, diagnosticNouveauSite } = require('./scraper-new-sites');

async function lancerScrapingNouveauxSites(siteIds = null) {
  invaliderCatCache();
  const resultatsParSite = await scraperTousNouveauxSites(siteIds);
  const stats = { inseres: 0, mis_a_jour: 0, erreurs: 0, scrapes: 0 };

  for (const { nom, baseUrl, items } of Object.values(resultatsParSite)) {
    if (!items.length) continue;
    stats.scrapes += items.length;
    try {
      const r = await sauvegarderProduits(items, nom, baseUrl);
      stats.inseres += r.inseres;
      stats.mis_a_jour += r.mis_a_jour;
      stats.erreurs += r.erreurs;
      await pool.query('UPDATE marchands SET derniere_sync=NOW() WHERE nom=$1', [nom]);
      console.log(`[NEW-SITES] ${nom}: ${items.length} scrapés → ${r.inseres} nouveaux, ${r.mis_a_jour} màj`);
    } catch (err) {
      console.error(`[NEW-SITES] ${nom} sauvegarde:`, err.message);
    }
  }
  return stats;
}

function demarrerScraping() {
  cron.schedule('0 */4 * * *', () => lancerScraping(['expat', 'jumia', 'coinafrique']).catch(console.error));
  cron.schedule('0 2,8,14,20 * * *', () => lancerScrapingNouveauxSites().catch(console.error));
  setTimeout(() => lancerScraping(['coinafrique']).catch(console.error), 30_000);
  setTimeout(() => lancerScrapingNouveauxSites().catch(console.error), 5 * 60_000);
  console.log('[SCRAPER] ✅ Cron actif — Expat+Jumia+CoinAfrique/4h + 9 nouveaux sites/6h');
}

module.exports = {
  scraperExpatDakar, scraperJumia, scraperCoinAfrique,
  sauvegarderProduits, lancerScraping, lancerScrapingNouveauxSites,
  demarrerScraping, diagnosticScraper, diagnosticNouveauSite, invaliderCatCache,
};
