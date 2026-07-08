// backend/services/scraper.js — Scrapers réels pour Expat-Dakar, Jumia SN, CoinAfrique
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
  'HP','Lenovo','Dell','Asus','Acer','LG','Sony','Hisense','Haier','TCL','Realme','OnePlus','Motorola',
  'Astech','Bruhm','Skyworth','Finix','Enduro','Nasco','Polystar'];

// Mots trop communs pour discriminer deux produits : marques, familles de produits.
// Exclus du matching par mots-clés pour éviter ex. "Galaxy Buds" ≈ "Galaxy A55".
const MOTS_GENERIQUES = new Set([
  'samsung','apple','xiaomi','tecno','infinix','oppo','vivo','huawei','nokia',
  'realme','oneplus','motorola','itel','hp','lenovo','dell','asus','acer',
  'lg','sony','hisense','haier','tcl','galaxy','redmi','iphone','ipad','macbook',
  'astech','bruhm','skyworth','finix','enduro','nasco','polystar',
  // Termes techniques de climatisation/électroménager : décrivent la catégorie,
  // pas le modèle — ne doivent jamais suffire à eux seuls à fusionner deux produits.
  'split','inverter','double','wifi','climatiseur','climatiseurs',
]);

const CAT_MOTS = [
  // ── Audio / Wearables (priorité max — avant smartphones pour "Galaxy Buds/Watch") ──
  { slug:'tv-electro', mots:[
    'ecouteur','écouteur','airpod','galaxy buds','freebuds','redmi buds','nothing ear',
    'casque audio','casque bluetooth','casque sans fil','casque anc','casque noise',
    ' tws ','enceinte bluetooth','enceinte portable','enceinte sans fil','haut-parleur','soundbar','barre de son',
    'montre connect','smartwatch','bracelet connect','galaxy watch','galaxy fit','redmi watch','xiaomi watch',
  ]},
  // ── Téléviseurs ──
  { slug:'tv-electro', mots:[
    'television','téléviseur','tv 4k','tv led','tv oled','tv qled','smart tv','android tv',
    'led tv','hisense tv','lg tv','samsung tv 4k','tcl tv','bruhm','skyworth','nobel tv',
    'écran tv','ecran tv','astech tv','finix tv','enduro tv',
  ]},
  // ── Réfrigération ──
  { slug:'tv-electro', mots:[
    'refrigerat','réfrigérat','frigo','congelat','congélat','armoire refrig','vitrine refrig',
  ]},
  // ── Climatisation ──
  { slug:'tv-electro', mots:[
    'climatiseur','split ','split inv','reversible clim','pompe a chaleur',
  ]},
  // ── Gros électroménager ──
  { slug:'tv-electro', mots:[
    'lave-linge','lave linge','machine a laver','machine à laver','seche-linge','lave-vaisselle',
  ]},
  // ── Petit électroménager ──
  { slug:'tv-electro', mots:[
    'micro-onde','micro onde','four electrique','four électrique','chauffe-eau','chauffe eau',
    'ventilateur','air fryer','friteuse','induction','plaque de cuisson',
    'mixeur','blender','aspirateur','fer a repasser','cafetiere','bouilloire','grille-pain',
    'batterie de cuisine','enduro','finix','astech',
  ]},
  // ── Tablettes (avant smartphones pour intercepter "Galaxy Tab", "iPad") ──
  { slug:'informatique', mots:[
    'tablette',' ipad','ipad ','galaxy tab','samsung tab','lenovo tab','huawei matepad','xiaomi pad',
  ]},
  // ── Smartphones ──
  { slug:'smartphones', mots:[
    'iphone','tecno ','infinix ','oppo ','realme ','itel ','vivo ','redmi note','redmi ',
    'samsung galaxy a','samsung galaxy s','samsung galaxy m','samsung galaxy z','samsung galaxy f',
    'xiaomi mi ','xiaomi poco','huawei p','huawei y','huawei nova',
    'nokia ','oneplus ','google pixel','motorola moto',
    'smartphone','telephone portable','téléphone portable',
  ]},
  // ── Informatique ──
  { slug:'informatique', mots:[
    'laptop','ordinateur portable','ordinateur de bureau','macbook','chromebook',
    'lenovo ideapad','lenovo thinkpad','dell inspiron','dell latitude',
    'hp pavilion','hp elitebook','hp probook',' pc portable',' pc bureau',
    'clavier','souris ','imprimante','disque dur',' ssd ','moniteur','ecran pc',
    'routeur','asus vivobook','asus zenbook','acer aspire','acer nitro','toshiba',
  ]},
  // ── Maison ──
  { slug:'maison', mots:[
    'canapé','canape','chaise','matelas','lit ','armoire','meuble','fontaine','table basse','commode',
    'table a manger','lampe','rideau','coussin','vaisselle','drap',
  ]},
  // ── Mode ──
  { slug:'mode', mots:[
    'robe','chaussure','sac a main','sac à main','chemise','pantalon','vêtement','habit',
    'sneaker','basket','parfum','eau de toilette','eau de parfum','musc','jean homme','t-shirt','coffret beaute',
  ]},
  // ── Auto-moto ──
  { slug:'auto-moto', mots:[
    'voiture','moto ','scooter','trottinette','pièce auto','piece auto','batterie voiture','pneu',
  ]},
  // ── Jeux vidéo ──
  { slug:'jeux', mots:[
    'playstation','ps4','ps5','xbox','nintendo','manette jeu','jeu video','gaming','casque gamer','console jeu','joystick',
  ]},
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function nettoyerPrix(t) {
  if (!t) return 0;
  let s = (t + '').trim();
  // Supprimer la partie décimale AVANT de retirer les non-chiffres.
  // Règle : séparateur (,/.) suivi de 1 ou 2 chiffres = décimale → supprimer.
  //         séparateur suivi de 3 chiffres = séparateur de milliers → garder les chiffres.
  // Ex :  "185 000,50 F" → "185 000 F" → 185000  ✓
  //       "1 750,00"     → "1 750"     → 1750    ✓
  //       "185.000 F"    → inchangé   → 185000  ✓  (3 chiffres, pas de suppression)
  s = s.replace(/[,.](\d{1,2})(?=\D|$)/g, '');
  const n = parseInt(s.replace(/[^0-9]/g, ''));
  return isNaN(n) || n < 100 ? 0 : n;
}
function nettoyerTitre(t) { return (t||'').trim().replace(/\s+/g,' ').slice(0,255); }
function extraireMarque(titre) { const t=titre.toLowerCase(); return MARQUES.find(m=>t.includes(m.toLowerCase()))||null; }

let _catCache=null;
// Forcer rechargement du cache (utile après migration au démarrage)
function invaliderCatCache() { _catCache = null; }
async function getCatId(titre) {
  if(!_catCache){ const {rows}=await pool.query('SELECT id,slug FROM categories'); _catCache=rows; }
  const t=(' '+titre+' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for(const {slug,mots} of CAT_MOTS){ if(mots.some(m=>t.includes(m))){ const c=_catCache.find(x=>x.slug===slug); if(c) return c.id; } }
  return null;
}

const _marchandCache={};
async function getMarchandId(nom,siteUrl=null) {
  if(_marchandCache[nom]) return _marchandCache[nom];
  const {rows}=await pool.query('SELECT id FROM marchands WHERE nom=$1',[nom]);
  if(rows.length){ _marchandCache[nom]=rows[0].id; return rows[0].id; }
  const r=await pool.query('INSERT INTO marchands(nom,site_url,methode) VALUES($1,$2,$3) RETURNING id',[nom,siteUrl,'scraper']);
  _marchandCache[nom]=r.rows[0].id; return r.rows[0].id;
}

async function fetchPage(url, retries=3) {
  for(let i=0;i<retries;i++){
    try{
      const {data}=await axios.get(url,{
        headers:{'User-Agent':randUA(),'Accept':'text/html,application/xhtml+xml','Accept-Language':'fr-FR,fr;q=0.9','Cache-Control':'no-cache'},
        timeout:20000, maxRedirects:5
      });
      return data;
    }catch(err){
      const st=err.response?.status;
      console.warn(`[HTTP] Tentative ${i+1}/${retries} — ${st||err.code} — ${url}`);
      if(i<retries-1) await sleep(st===429||st===403 ? 12000*(i+1) : 3000*(i+1));
      else throw err;
    }
  }
}

// ══════════════════════════════════════════════════════
//  SCRAPER 1 — Expat-Dakar
//  Layout observé mai 2025 :
//  <article class="listing-item">
//    <a class="listing-title-link" href="/telephones/...">
//      <h3 class="listing-title">Samsung A55</h3>
//    </a>
//    <span class="listing-price">175 000 FCFA</span>
//    <img class="lazy listing-item-thumbnail" data-src="...">
//  </article>
// ══════════════════════════════════════════════════════
async function scraperExpatDakar(categorie='telephones-portables-et-tablettes', maxPages=2) {
  const resultats=[], base=`https://www.expat-dakar.com/${categorie}`;
  console.log(`\n[EXPAT] ${base}`);
  for(let page=1;page<=maxPages;page++){
    const url=page===1?base:`${base}?page=${page}`;
    try{
      const html=await fetchPage(url), $=cheerio.load(html); let found=0;
      const essais=[
        { c:'article.listing-item',         t:'.listing-title,.listing-title-link,h3 a,.listing-card__title', p:'.listing-price,.listing-card__price,[class*="price"]',  l:'a.listing-title-link,a[href*="/telephones/"],a[href*="/annonce/"],a[href*="/detail/"]', i:'img.listing-item-thumbnail,img[data-src],img.lazy,img[src]' },
        { c:'.listing-card',                 t:'.listing-card__title,h3',                                      p:'.listing-card__price,[class*="price"],[class*="prix"]',   l:'a[href]', i:'img[data-src],img[src]' },
        { c:'.classified-item,.item-listing',t:'.item-title,h3',                                               p:'.item-price,.price',                                     l:'a[href]', i:'img' },
        { c:'article',                       t:'h3,h2,.title,[class*="title"],[class*="name"]',                p:'[class*="price"],[class*="prix"],[class*="amount"]',      l:'a[href]', i:'img[src],img[data-src]' },
      ];
      for(const s of essais){
        const items=$(s.c); if(!items.length) continue;
        items.each((_,el)=>{
          const titre=nettoyerTitre($(el).find(s.t).first().text()||$(el).find(s.l).first().attr('title'));
          const prix=nettoyerPrix($(el).find(s.p).first().text());
          let href=$(el).find(s.l).first().attr('href')||'';
          if(href&&!href.startsWith('http')) href=`https://www.expat-dakar.com${href}`;
          const img=$(el).find(s.i).first().attr('data-src')||$(el).find(s.i).first().attr('src')||null;
          if(titre.length>3&&prix>500){ resultats.push({titre,prix,url:href,image_url:img}); found++; }
        });
        if(found>0){ console.log(`[EXPAT] Page ${page}: ${found} (sélecteur "${s.c}")`); break; }
      }
      if(found===0){
        const snippet=$.html().replace(/\s+/g,' ').slice(0,600);
        console.warn(`[EXPAT] Page ${page}: 0 résultat. Début HTML: ${snippet}`);
        break;
      }
    }catch(err){ console.error(`[EXPAT] Page ${page}:`,err.message); }
    await sleep(2000+Math.random()*1000);
  }
  console.log(`[EXPAT] Total: ${resultats.length}`); return resultats;
}

// ══════════════════════════════════════════════════════
//  SCRAPER 2 — Jumia Sénégal
//
//  Jumia tourne sur Next.js : les produits sont dans
//  <script id="__NEXT_DATA__"> (JSON) et ne sont PAS
//  dans le DOM statique — les sélecteurs CSS seuls échouent.
//
//  Stratégies par ordre de priorité :
//   1. __NEXT_DATA__ (Next.js) — JSON complet embarqué
//   2. JSON-LD  (<script type="application/ld+json">)
//   3. data-gtm-* / attributs data du catalogue
//   4. Sélecteurs CSS (fallback SSR / layout futur)
// ══════════════════════════════════════════════════════

// Extrait les produits depuis le JSON __NEXT_DATA__ de Jumia.
// La structure peut varier entre versions Next.js — on explore récursivement.
function _extraireProduitsNextData(obj, resultats, baseUrl, profondeur = 0) {
  if (!obj || typeof obj !== 'object' || profondeur > 8) return;
  // Tableau de produits identifié par la présence des clés typiques Jumia
  if (Array.isArray(obj)) {
    for (const item of obj) _extraireProduitsNextData(item, resultats, baseUrl, profondeur + 1);
    return;
  }
  // Objet produit Jumia : possède "name" + un champ prix
  const nom = obj.name || obj.title || obj.product_name;
  const prixBrut = obj.price || obj.special_price || obj.prices?.current ||
                   obj.prices?.original || obj.selling_price;
  const url = obj.url || obj.product_url || obj.sku_url;
  const img = obj.image || obj.thumbnail || obj.images?.[0];

  if (nom && prixBrut) {
    const prix = typeof prixBrut === 'number' ? Math.round(prixBrut) : nettoyerPrix(String(prixBrut));
    const href = url ? (url.startsWith('http') ? url : `${baseUrl}${url}`) : baseUrl;
    if (prix > 500 && nom.length > 3) {
      resultats.push({ titre: nettoyerTitre(nom), prix, url: href, image_url: img || null });
      return; // ne pas descendre dans les enfants d'un objet produit déjà traité
    }
  }
  for (const val of Object.values(obj)) _extraireProduitsNextData(val, resultats, baseUrl, profondeur + 1);
}

async function scraperJumia(categorie='telephones-tablettes', maxPages=3) {
  const resultats=[], base=`https://www.jumia.sn/${categorie}/`;
  console.log(`\n[JUMIA] ${base}`);

  for(let page=1;page<=maxPages;page++){
    const url=page===1?base:`${base}?page=${page}#catalog-listing`;
    let found=0;
    try{
      const html=await fetchPage(url);
      const $=cheerio.load(html);

      // ── Stratégie 1 : __NEXT_DATA__ ───────────────────────────
      const nextRaw = $('#__NEXT_DATA__').html() || $('script#__NEXT_DATA__').html();
      if (nextRaw) {
        try {
          const nextJson = JSON.parse(nextRaw);
          const avant = resultats.length;
          _extraireProduitsNextData(nextJson, resultats, 'https://www.jumia.sn');
          found = resultats.length - avant;
          if (found > 0) console.log(`[JUMIA] Page ${page}: ${found} via __NEXT_DATA__`);
        } catch (e) { console.warn('[JUMIA] __NEXT_DATA__ parse error:', e.message); }
      }

      // ── Stratégie 2 : JSON-LD ──────────────────────────────────
      if (found === 0) {
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const ld = JSON.parse($(el).html() || '{}');
            const items = ld['@type'] === 'ItemList' ? (ld.itemListElement || [])
                        : ld['@type'] === 'Product'  ? [ld]
                        : [];
            for (const it of items) {
              const prod = it.item || it;
              const nom  = prod.name;
              const prix = nettoyerPrix(String(prod.offers?.price || prod.offers?.lowPrice || ''));
              const href = prod.url || prod.offers?.url || '';
              const img  = prod.image || (Array.isArray(prod.image) ? prod.image[0] : null);
              if (nom && prix > 500) {
                resultats.push({ titre: nettoyerTitre(nom), prix, url: href, image_url: img || null });
                found++;
              }
            }
          } catch {}
        });
        if (found > 0) console.log(`[JUMIA] Page ${page}: ${found} via JSON-LD`);
      }

      // ── Stratégie 3 : attributs data-gtm / data-* ─────────────
      if (found === 0) {
        $('[data-gtm-product],[data-product],[data-item]').each((_, el) => {
          try {
            const raw = $(el).attr('data-gtm-product') || $(el).attr('data-product') || $(el).attr('data-item');
            const obj = JSON.parse(raw || '{}');
            const nom  = obj.name || obj.item_name;
            const prix = nettoyerPrix(String(obj.price || obj.item_price || ''));
            const href = $(el).find('a').first().attr('href') || '';
            const img  = $(el).find('img').first().attr('data-src') || $(el).find('img').first().attr('src') || null;
            if (nom && prix > 500) {
              resultats.push({ titre: nettoyerTitre(nom), prix, url: href.startsWith('http') ? href : `https://www.jumia.sn${href}`, image_url: img });
              found++;
            }
          } catch {}
        });
        if (found > 0) console.log(`[JUMIA] Page ${page}: ${found} via data-gtm-product`);
      }

      // ── Stratégie 4 : sélecteurs CSS (SSR / layout futur) ─────
      if (found === 0) {
        const essais=[
          { c:'article.prd',           t:'p.name,h3.name,.name',              p:'div.prc,.prc,.price--current', l:'a.core,a[href]', i:'img.img,img[data-src],img[src]' },
          { c:'article[class*="prd"]', t:'[class*="name"]',                   p:'[class*="prc"],[class*="price"]', l:'a[href]', i:'img' },
          { c:'ul.-pvs li',            t:'h3,.name,[class*="name"]',          p:'[class*="price"],[class*="prc"]', l:'a[href]', i:'img' },
          { c:'article',               t:'p,h3,h2,[class*="name"]',           p:'[class*="price"],[class*="prc"],[class*="amount"]', l:'a[href*="/"]', i:'img' },
        ];
        for(const s of essais){
          const items=$(s.c); if(!items.length) continue;
          items.each((_,el)=>{
            const titreEl=$(el).find(s.t).first();
            const titre=nettoyerTitre(titreEl.text()||titreEl.attr('data-name'));
            const prix=nettoyerPrix($(el).find(s.p).first().text());
            let href=$(el).find(s.l).first().attr('href')||'';
            if(href&&!href.startsWith('http')) href=`https://www.jumia.sn${href}`;
            const img=$(el).find(s.i).first().attr('data-src')||$(el).find(s.i).first().attr('src')||null;
            if(titre.length>3&&prix>500&&href){ resultats.push({titre,prix,url:href,image_url:img}); found++; }
          });
          if(found>0){ console.log(`[JUMIA] Page ${page}: ${found} via CSS "${s.c}"`); break; }
        }
      }

      if(found===0){
        // Log les 800 premiers chars pour faciliter le diagnostic
        const snippet=$.html().replace(/\s+/g,' ').slice(0,800);
        console.warn(`[JUMIA] Page ${page}: 0 résultat sur toutes les stratégies.`);
        console.warn(`[JUMIA] HTML début: ${snippet}`);
        console.warn(`[JUMIA] __NEXT_DATA__ présent: ${!!nextRaw}, taille: ${nextRaw?.length||0}`);
        break;
      }
    }catch(err){ console.error(`[JUMIA] Page ${page}:`,err.message); }
    await sleep(2500+Math.random()*1500);
  }
  console.log(`[JUMIA] Total: ${resultats.length}`); return resultats;
}

// ══════════════════════════════════════════════════════
//  SCRAPER 3 — CoinAfrique Sénégal
//  Layout observé mai 2025 :
//  <div class="col s6">
//    <a href="/annonce/123456">
//      <div class="card">
//        <p class="ad__card-price">45 000 CFA</p>
//        <p class="ad__card-description">Samsung Galaxy A32</p>
//      </div>
//    </a>
//  </div>
// ══════════════════════════════════════════════════════
async function scraperCoinAfrique(categorie='telephonie', maxPages=2) {
  const resultats=[], base=`https://sn.coinafrique.com/categorie/${categorie}`;
  console.log(`\n[COIN] ${base}`);
  for(let page=1;page<=maxPages;page++){
    const url=page===1?base:`${base}?page=${page}`;
    try{
      const html=await fetchPage(url), $=cheerio.load(html); let found=0;
      const essais=[
        { c:'.col.s6',    t:'p.ad__card-description,.ad__card-description', p:'p.ad__card-price,.ad__card-price', l:'a[href*="/annonce/"]', i:'img' },
        { c:'.card',      t:'.card-title,p.description', p:'.price,p.price', l:'a', i:'img' },
        { c:'article,.item', t:'h3,h2,.name,.title', p:'[class*="price"],[class*="prix"]', l:'a[href]', i:'img' },
      ];
      for(const s of essais){
        const items=$(s.c); if(!items.length) continue;
        items.each((_,el)=>{
          const titre=nettoyerTitre($(el).find(s.t).first().text());
          const prix=nettoyerPrix($(el).find(s.p).first().text());
          let href=$(el).find(s.l).first().attr('href')||$(el).closest('a').attr('href')||'';
          if(href&&!href.startsWith('http')) href=`https://sn.coinafrique.com${href}`;
          const img=$(el).find(s.i).first().attr('src')||$(el).find(s.i).first().attr('data-src')||null;
          if(titre.length>3&&prix>500){ resultats.push({titre,prix,url:href,image_url:img}); found++; }
        });
        if(found>0){ console.log(`[COIN] Page ${page}: ${found} (sélecteur "${s.c}")`); break; }
      }
      if(found===0){ console.warn(`[COIN] Page ${page}: 0 résultat`); break; }
    }catch(err){ console.error(`[COIN] Page ${page}:`,err.message); }
    await sleep(2000+Math.random()*1000);
  }
  console.log(`[COIN] Total: ${resultats.length}`); return resultats;
}

// ══════════════════════════════════════════════════════
//  SAUVEGARDE EN BASE
// ══════════════════════════════════════════════════════
// ── Prix médian de référence par catégorie — TTL 1h ──────────────
const _prixMedianCache = {}; // { categorieId: { valeur, expireAt } }
const MEDIAN_TTL_MS = 60 * 60 * 1000;
async function getPrixMedianCategorie(categorieId) {
  const cached = _prixMedianCache[categorieId];
  if (cached && cached.expireAt > Date.now()) return cached.valeur;
  try {
    const { rows } = await pool.query(`
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.prix) AS mediane
      FROM offres o
      JOIN produits p ON p.id = o.produit_id
      WHERE p.categorie_id = $1 AND o.stock = true AND o.prix > 1000
    `, [categorieId]);
    const m = rows[0]?.mediane;
    if (m && m > 0) _prixMedianCache[categorieId] = { valeur: m, expireAt: Date.now() + MEDIAN_TTL_MS };
    return m || null;
  } catch { return null; }
}

// ── Prix plancher déduit du titre (taille écran, RAM, BTU, audio…) ─
// Permet de détecter une division par 100/1000 même sur offre unique.
function prixPlancher(titre) {
  const s = ' ' + (titre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'') + ' ';

  // ── Accessoires : pas de plancher d'appareil complet (sacoche/chargeur
  // pour "ordinateur portable" ne coûte pas le prix d'un ordinateur) ──
  if (/\b(chargeur|cable|câble|adaptateur|support|housse|etui|étui|coque|sacoche|protection ecran|film de protection|verre trempe|batterie externe|power\s*bank|powerbank)\b/.test(s)) {
    return null;
  }

  // ── Taille écran TV/PC/moniteur (pouces ou ") ──────────────────
  // Capture les valeurs décimales (ex: "6.78 pouces") pour ne pas lire
  // "6.78"" comme "78 pouces"
  const ecran = s.match(/(\d+(?:[.,]\d+)?)\s*(?:pouces?|["″»]|\binch)/);
  if (ecran) {
    const p = parseFloat(ecran[1].replace(',', '.'));
    if (p >= 85) return 500_000;
    if (p >= 65) return 250_000;
    if (p >= 55) return 150_000;
    if (p >= 43) return  80_000;
    if (p >= 32) return  40_000;
    if (p >= 24) return  25_000;
    if (p >= 13) return  20_000; // laptop/tablette
  }

  // ── Taille TV standalone (sans unité mais TV explicite) ───────
  // Couvre "Televiseur Samsung 43 Smart" ou "TV Astech 98 Google TV"
  // Liste blanche de tailles standard TV pour éviter les faux positifs
  if (/televiseur|television/.test(s)) {
    const tvSize = s.match(/\b(32|40|43|50|55|58|65|70|75|80|85|86|90|98|100|105)\b/);
    if (tvSize) {
      const p = parseInt(tvSize[1], 10);
      if (p >= 85) return 500_000;
      if (p >= 65) return 250_000;
      if (p >= 55) return 150_000;
      if (p >= 43) return  80_000;
      if (p >= 32) return  40_000;
    }
  }

  // ── RAM smartphone/PC ──────────────────────────────────────────
  // Motif ambigu "Xgo ram Ygo" (stockage et RAM de part et d'autre du mot
  // "ram", ordre variable selon l'annonceur) : la RAM étant toujours ≤ au
  // stockage, on retient le plus petit des deux nombres.
  const ramDouble = s.match(/(\d+)\s*go\s+ram\s+(\d+)\s*go/);
  const ram = ramDouble || s.match(/(\d+)\s*go\s+ram|ram\s*:?\s*(\d+)\s*go/);
  if (ram) {
    const r = ramDouble
      ? Math.min(parseInt(ramDouble[1]), parseInt(ramDouble[2]))
      : parseInt(ram[1] || ram[2]);
    if (r >= 12) return 150_000;
    if (r >= 8)  return  80_000;
    if (r >= 6)  return  50_000;
    if (r >= 4)  return  30_000;
  }

  // ── Stockage seul (≥ 128 Go) — exclut cartes mémoire/clés USB/SSD et
  // tablettes enfants/entrée de gamme : leur stockage annoncé est souvent
  // gonflé (marketing/microSD) alors que l'appareil reste très bon marché ──
  const sto = s.match(/(\d+)\s*go(?!\s*ram)/);
  if (sto
      && !/carte\s*(memoire|memory|sd|micro\s*sd)|cle\s*usb|disque dur|ssd|hdd/.test(s)
      && !/tablette.{0,15}enfant|enfant.{0,15}tablette|oteeto/.test(s)) {
    const st = parseInt(sto[1]);
    if (st >= 512) return 200_000;
    if (st >= 256) return 100_000;
    if (st >= 128) return  50_000;
  }

  // ── BTU climatiseur ────────────────────────────────────────────
  const btu = s.match(/(\d[\d\s]*)\s*btu/);
  if (btu) {
    const b = parseInt(btu[1].replace(/\s/g, ''));
    if (b >= 18000) return 300_000;
    if (b >= 12000) return 200_000;
    if (b >=  9000) return 150_000;
    if (b >=  5000) return  80_000;
  }

  // ── Réfrigérateur / congélateur (litres) ──────────────────────
  const vol = s.match(/(\d{2,3})\s*(?:litres?|l)\b/);
  if (vol && /frigo|refrig|congelat/.test(s)) {
    const v = parseInt(vol[1]);
    if (v >= 400) return 400_000;
    if (v >= 300) return 250_000;
    if (v >= 200) return 150_000;
    if (v >= 100) return  80_000;
  }
  if (/refriger|frigo\b/.test(s) && !/piece|spare/.test(s)) return 80_000;
  if (/lave[- ]linge|machine.{0,6}laver/.test(s))           return 150_000;
  if (/congelateur|congelat/.test(s))                        return 100_000;
  if (/climatiseur|split |clim\b/.test(s))                   return 100_000;

  // ── Audio — modèles haut de gamme (référence exacte) ──────────
  if (/wh.?1000xm\d/.test(s))                               return 150_000; // Sony XM3/4/5
  if (/wh.?ch\d{3}|wh.?xb\d{3}/.test(s))                   return  30_000; // Sony entrée gamme
  if (/airpods?\s*pro|airpods?\s*max/.test(s))              return 100_000;
  if (/airpods?\b/.test(s))                                  return  50_000;
  if (/bose\s*(quietcomfort|qc\d|700|nc\d)/.test(s))        return 150_000;
  if (/jbl\s*(charge\s*[4-9]|xtreme|boombox|partybox)/.test(s)) return 60_000;
  if (/jbl\s*(flip\s*[4-9]|pulse\s*[4-9])/.test(s))        return  35_000;
  if (/jbl\s*(go\s*[2-9]|clip\s*[3-9])/.test(s))           return  15_000;
  if (/galaxy buds|galaxy watch/.test(s))                   return  60_000;
  if (/apple watch\s*(ultra|pro|series\s*[7-9])/.test(s))  return 200_000;
  if (/apple watch/.test(s))                                 return 100_000;
  if (/sennheiser\s*(hd|momentum|pxc)/.test(s))             return  80_000;
  if (/harman kardon/.test(s))                               return  80_000;
  if (/beats\s*(studio|pro|solo|fit)/.test(s))              return  80_000;

  // ── Audio — type de produit ────────────────────────────────────
  if (/casque\s*(noise.cancell|anc|sans.fil|bluetooth|actif)/.test(s)) return 30_000;
  if (/casque\s*(sony|bose|jbl|sennheiser|beats|anker)/.test(s))       return 50_000;
  if (/casque audio|casque stereo|casque hifi/.test(s))                 return 12_000;
  if (/casque\b/.test(s) && !/casque gaz|casque moto/.test(s))         return 10_000;
  if (/ecouteur\s*(sans.fil|bluetooth|tws|anc)/.test(s))               return 15_000;
  if (/ecouteur/.test(s))                                               return  8_000;
  if (/enceinte\s*(bluetooth|portable|sans.fil)/.test(s))              return 15_000;
  if (/enceinte\s*(hifi|home.cinema|barre.de.son)/.test(s))            return 50_000;

  // ── Montre connectée ───────────────────────────────────────────
  if (/smartwatch|montre connectee|montre intelligente/.test(s))        return 15_000;

  // ── Laptop / ordinateur ────────────────────────────────────────
  if (/macbook|chromebook/.test(s))                          return 200_000;
  if (/laptop|ordinateur portable|pc portable/.test(s))      return 150_000;
  if (/ordinateur de bureau|pc bureau|tour pc/.test(s))      return 100_000;
  if (/imprimante laser/.test(s))                            return  80_000;
  if (/imprimante/.test(s))                                  return  30_000;

  // ── Tablette ───────────────────────────────────────────────────
  if (/ipad\b/.test(s))                                      return 150_000;
  if (/tablette\s*(android|samsung|huawei|lenovo)/.test(s))  return  60_000;

  // ── Caméra / photo ─────────────────────────────────────────────
  if (/reflex|mirrorless|appareil photo/.test(s))            return 150_000;
  if (/camera\s*(ip|surveillance|360)/.test(s))              return  15_000;

  // ── TV sans dimension précisée mais avec marque ───────────────
  if (/(hisense|lg|samsung|tcl|sony|philips)\s*(tv|television|tele|televiseur)/.test(s)) return 80_000;
  if (/\b(tv|tele|television)\b|televiseur/.test(s))         return  50_000;

  return null; // pas de signal → pas de plancher
}

// ── Correction prix XOF (division par 100/1000) ───────────────────
function corrigerPrixXOF(prix) {
  if (prix <= 0) return null;
  if (prix < 500) return null;
  return prix;
}

// Applique la correction ×100/×1000 (prix trop bas) ou ÷100/÷1000 (prix trop haut).
function corrigerPrixParPlancher(prix, titre) {
  const plancher = prixPlancher(titre);
  if (!plancher) return prix;

  // ── Correction ascendante : prix trop bas ─────────────────────
  if (prix < plancher) {
    const p100  = prix * 100;
    const p1000 = prix * 1000;
    if (p100 >= plancher && p100 <= plancher * 30) {
      console.warn(`[PRIX×100] "${titre}" : ${prix} → ${p100} FCFA (plancher: ${plancher})`);
      return p100;
    }
    if (p1000 >= plancher && p1000 <= plancher * 30) {
      console.warn(`[PRIX×1000] "${titre}" : ${prix} → ${p1000} FCFA (plancher: ${plancher})`);
      return p1000;
    }
  }

  // ── Correction descendante : prix trop haut (÷100 ou ÷1000) ──
  // Seuil : prix > plancher × 100 (clairement aberrant vers le haut)
  if (prix > plancher * 100) {
    const d100  = Math.round(prix / 100);
    const d1000 = Math.round(prix / 1000);
    if (d100 >= plancher && d100 <= plancher * 30) {
      console.warn(`[PRIX÷100] "${titre}" : ${prix} → ${d100} FCFA (plancher: ${plancher})`);
      return d100;
    }
    if (d1000 >= plancher && d1000 <= plancher * 30) {
      console.warn(`[PRIX÷1000] "${titre}" : ${prix} → ${d1000} FCFA (plancher: ${plancher})`);
      return d1000;
    }
  }

  return prix; // aucune correction applicable
}

// Extrait la taille d'écran en pouces depuis un titre (ex: "43"" → 43, "98 pouces" → 98)
function extrairePouce(titre) {
  const m = (titre || '').match(/\b(\d{2,3})\s*(?:pouces?|"|\binch)/i);
  return m ? parseInt(m[1], 10) : null;
}

async function sauvegarderProduits(items, marchandNom, siteUrl) {
  const marchandId=await getMarchandId(marchandNom,siteUrl);
  const stats={inseres:0,mis_a_jour:0,erreurs:0,filtres:0};
  const produitsModifies = new Set(); // pour le batch update final

  for(const item of items){
    try{
      // ── Pré-filtre et correction prix ────────────────────────
      const prixVerifie = corrigerPrixXOF(item.prix);
      if (prixVerifie === null) {
        console.warn('[PRIX] Rejeté (trop bas) :', item.titre, '→', item.prix, 'FCFA');
        stats.filtres++;
        continue;
      }
      // Correction ×100/×1000 si le prix est sous le plancher du titre
      // Ex : TV 98" à 17 325 FCFA → 1 732 500 FCFA
      item.prix = corrigerPrixParPlancher(prixVerifie, item.titre);
      let produitId;

      // 1. Correspondance exacte EAN (si dispo)
      if(item.ean){
        const {rows:byEan}=await pool.query('SELECT id FROM produits WHERE ean=$1 LIMIT 1',[item.ean]);
        if(byEan.length>0){ produitId=byEan[0].id; stats.mis_a_jour++; }
      }

      // 2. Correspondance par similarité sur le nom normalisé
      if(!produitId){
        const nomNorm = normaliserTitre(item.titre);
        // Extraire mots-clés discriminants (modèle, référence) — exclure les marques génériques
        const motsCles = nomNorm.split(/\s+/).filter(m => m.length >= 3 && !MOTS_GENERIQUES.has(m)).slice(0, 4);
        if(motsCles.length > 0){
          const {rows:fuzzy}=await pool.query(
            `SELECT id, nom,
                    similarity(LOWER(nom), $1) AS sim
             FROM produits
             WHERE LOWER(nom) LIKE '%' || $2 || '%'
                OR LOWER(nom) ILIKE $3
             ORDER BY sim DESC LIMIT 3`,
            [nomNorm, motsCles[0].toLowerCase(), '%' + motsCles.slice(0,2).join('%').toLowerCase() + '%']
          );
          // Seuil 0.65 : "Galaxy Buds" vs "Galaxy A55" → ~0.61 → rejeté correctement
          if(fuzzy.length > 0 && (fuzzy[0].sim > 0.65 || _motsClesCommuns(item.titre, fuzzy[0].nom) >= 2)){
            // Bloquer les fusions inter-marques (ex: "Split Astech 24000BTU" ne doit
            // jamais devenir la même fiche qu'un "Split Samsung 24000BTU" — les
            // mots-clés techniques communs (split/inverter/btu…) ne suffisent pas).
            const marqueSrc  = extraireMarque(item.titre);
            const marqueDest = extraireMarque(fuzzy[0].nom);
            // Bloquer les regroupements inter-tailles écran (ex: TV 43" vs TV 98")
            const tailleSrc  = extrairePouce(item.titre);
            const tailleDest = extrairePouce(fuzzy[0].nom);
            if (marqueSrc && marqueDest && marqueSrc !== marqueDest) {
              // Marques différentes → laisser créer un nouveau produit
            } else if (tailleSrc && tailleDest && Math.abs(tailleSrc - tailleDest) > 10) {
              // Tailles incompatibles → laisser créer un nouveau produit
            } else {
              produitId = fuzzy[0].id; stats.mis_a_jour++;
            }
          }
        }
      }

      // 3. Aucun match → nouveau produit
      if(!produitId){
        const catId=await getCatId(item.titre);
        const {rows:n}=await pool.query(
          'INSERT INTO produits(nom,marque,categorie_id,ean,image_url) VALUES($1,$2,$3,$4,$5) RETURNING id',
          [item.titre, extraireMarque(item.titre), catId, item.ean||null, item.image_url]
        );
        produitId=n[0].id; stats.inseres++;
      }

      if(item.image_url) await pool.query('UPDATE produits SET image_url=$1 WHERE id=$2 AND image_url IS NULL',[item.image_url,produitId]);
      // Corriger la catégorie si elle est absente ou manifestement fausse
      const catDetectee = await getCatId(item.titre);
      if(catDetectee) await pool.query(
        'UPDATE produits SET categorie_id=$1 WHERE id=$2 AND (categorie_id IS NULL OR categorie_id != $1)',
        [catDetectee, produitId]
      );

      // Upsert offre avec titre du marchand
      const {rows:offre}=await pool.query(
        `INSERT INTO offres(produit_id,marchand_id,prix,url_achat,titre_marchand,scraped_at,stock)
         VALUES($1,$2,$3,$4,$5,NOW(),true)
         ON CONFLICT(produit_id,marchand_id)
         DO UPDATE SET prix=EXCLUDED.prix, url_achat=EXCLUDED.url_achat,
                       titre_marchand=EXCLUDED.titre_marchand,
                       scraped_at=NOW(), stock=true
         RETURNING id`,
        [produitId,marchandId,item.prix,item.url,item.titre]
      );
      if(offre.length>0) await pool.query('INSERT INTO historique_prix(offre_id,prix) VALUES($1,$2)',[offre[0].id,item.prix]);

      // Accumuler pour batch update final (évite N sous-requêtes imbriquées)
      produitsModifies.add(produitId);
    }catch(err){ console.error(`[DB] "${item.titre}":`,err.message); stats.erreurs++; }
  }

  // Batch update prix_min + nb_offres : 1 requête pour tous les produits modifiés
  if(produitsModifies.size > 0){
    const ids = [...produitsModifies];
    await pool.query(`
      UPDATE produits SET
        prix_min = sub.prix_min,
        nb_offres = sub.nb_offres
      FROM (
        SELECT p.id,
          MIN(CASE WHEN o.stock THEN o.prix END) AS prix_min,
          COUNT(o.id) AS nb_offres
        FROM produits p
        LEFT JOIN offres o ON o.produit_id = p.id
        WHERE p.id = ANY($1::uuid[])
        GROUP BY p.id
      ) sub
      WHERE produits.id = sub.id`,
      [ids]
    );

    // Vérifier les alertes de prix déclenchées par cette mise à jour (comptes web, via produit_id)
    const { rows: declenchees } = await pool.query(
      `SELECT a.*, p.nom AS produit_nom, p.prix_min
       FROM alertes a
       JOIN produits p ON p.id = a.produit_id
       WHERE a.active = true AND a.produit_id = ANY($1::uuid[])
         AND p.prix_min IS NOT NULL AND p.prix_min <= a.prix_cible`,
      [ids]
    );

    // Idem pour les alertes créées via le chatbot WhatsApp (sans produit_id, matching par nom)
    const { rows: declencheesWhatsapp } = await pool.query(
      `SELECT a.*, p.id AS produit_id, p.nom AS produit_nom, p.prix_min
       FROM alertes a
       JOIN produits p ON p.id = ANY($1::uuid[])
         AND p.nom ILIKE '%' || a.produit_nom || '%'
       WHERE a.active = true AND a.telephone IS NOT NULL AND a.produit_id IS NULL
         AND p.prix_min IS NOT NULL AND p.prix_min <= a.prix_cible`,
      [ids]
    );

    if (declenchees.length > 0 || declencheesWhatsapp.length > 0) {
      const { envoyerAlertePrix } = require('./notifications');
      for (const alerte of [...declenchees, ...declencheesWhatsapp]) {
        await envoyerAlertePrix(alerte, alerte.prix_min).catch(err => console.error('[ALERTE]', err.message));
      }
    }
  }

  return stats;
}

// Compte les mots-clés DISCRIMINANTS en commun — exclut les marques et familles génériques
// pour éviter que "samsung" + "galaxy" suffisent à fusionner Galaxy Buds avec Galaxy A55.
function _motsClesCommuns(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length >= 3 && !MOTS_GENERIQUES.has(w)));
  const wordsB = b.toLowerCase().split(/\W+/).filter(w => w.length >= 3 && !MOTS_GENERIQUES.has(w));
  return wordsB.filter(w => wordsA.has(w)).length;
}

function normaliserTitre(s) {
  return (s||'').toLowerCase()
    .replace(/[''""()\[\]]/g,'')
    .replace(/\b(neuf|occasion|reconditionné|garanti|livraison|offre|promo|bon état|état)\b/gi,'')
    .replace(/\s+/g,' ').trim();
}

// ══════════════════════════════════════════════════════
//  DIAGNOSTIC — test sans sauvegarder
// ══════════════════════════════════════════════════════
async function diagnosticScraper(source, categorie) {
  const fns={expat:scraperExpatDakar,jumia:scraperJumia,coinafrique:scraperCoinAfrique};
  const cats={expat:'telephones-portables-et-tablettes',jumia:'telephones-tablettes',coinafrique:'telephonie'};
  if(!fns[source]) throw new Error(`Source inconnue: ${source}. Valeurs: expat, jumia, coinafrique`);
  const items=await fns[source](categorie||cats[source],1);
  return {
    source, categorie:categorie||cats[source],
    nb_resultats:items.length,
    statut:items.length>0?'OK':'AUCUN_RESULTAT',
    conseil:items.length===0?'Vérifier les sélecteurs CSS dans scraper.js — le site a peut-être changé de layout':null,
    exemples:items.slice(0,5).map(i=>({titre:i.titre,prix:`${i.prix.toLocaleString()} FCFA`,image:i.image_url?'✓':'✗',url:i.url})),
  };
}

// ══════════════════════════════════════════════════════
//  ORCHESTRATION
// ══════════════════════════════════════════════════════
// Verrou global : empêche lancerScraping() et lancerScrapingNouveauxSites()
// de tourner en même temps (chevauchement cron/setTimeout constaté comme
// cause probable d'un dépassement mémoire sur le plan gratuit Render — deux
// pipelines de scraping simultanés cumulent leurs tableaux en RAM).
let scrapingEnCours = false;

async function lancerScraping(sources=['expat','jumia','coinafrique']) {
  if (scrapingEnCours) {
    console.log('[SCRAPER] Cycle déjà en cours, requête ignorée');
    return { ignore: true };
  }
  scrapingEnCours = true;
  try {
    const rapport={debut:new Date(),sources:{}};
    // BUG FIX : invalider le cache catégories pour recharger depuis la DB
    invaliderCatCache();
    console.log('\n[SCRAPER] ══════ DÉBUT ══════');
    const conf={
      expat:       {nom:'Expat-Dakar',  url:'https://www.expat-dakar.com',  cats:CATS.expat,       fn:scraperExpatDakar},
      jumia:       {nom:'Jumia Senegal',url:'https://www.jumia.sn',         cats:CATS.jumia,       fn:scraperJumia},
      coinafrique: {nom:'CoinAfrique',  url:'https://sn.coinafrique.com',   cats:CATS.coinafrique, fn:scraperCoinAfrique},
    };
    for(const src of sources){
      const c=conf[src]; if(!c) continue;
      const stats={inseres:0,mis_a_jour:0,erreurs:0,scrapes:0};
      for(const cat of c.cats){
        try{
          const items=await c.fn(cat,2); stats.scrapes+=items.length;
          if(items.length>0){ const r=await sauvegarderProduits(items,c.nom,c.url); stats.inseres+=r.inseres; stats.mis_a_jour+=r.mis_a_jour; stats.erreurs+=r.erreurs; }
        }catch(err){ console.error(`[SCRAPER] ${src}/${cat}:`,err.message); stats.erreurs++; }
        await sleep(4000);
      }
      rapport.sources[src]=stats;
      await pool.query('UPDATE marchands SET derniere_sync=NOW() WHERE nom=$1',[c.nom]);
      console.log(`[SCRAPER] ${c.nom}: ${stats.scrapes} scrapés → ${stats.inseres} nouveaux, ${stats.mis_a_jour} màj`);
      await sleep(5000);
    }
    rapport.fin=new Date(); rapport.duree_s=Math.round((rapport.fin-rapport.debut)/1000);
    console.log(`[SCRAPER] ══════ FIN ${rapport.duree_s}s ══════`);
    return rapport;
  } finally {
    scrapingEnCours = false;
  }
}

// ══════════════════════════════════════════════════════
//  INTÉGRATION NOUVEAUX SITES
// ══════════════════════════════════════════════════════
const { scraperTousNouveauxSites, diagnosticNouveauSite } = require('./scraper-new-sites');

async function lancerScrapingNouveauxSites(siteIds = null) {
  if (scrapingEnCours) {
    console.log('[NEW-SITES] Cycle déjà en cours, requête ignorée');
    return { ignore: true };
  }
  scrapingEnCours = true;
  try {
    invaliderCatCache();
    const stats = { inseres: 0, mis_a_jour: 0, erreurs: 0, scrapes: 0 };

    // Insertion en base immédiatement après chaque site (pas d'accumulation
    // de tous les sites en mémoire — cf. commentaire dans scraper-new-sites.js)
    await scraperTousNouveauxSites(siteIds, async (config, items) => {
      if (!items.length) return;
      stats.scrapes += items.length;
      try {
        const r = await sauvegarderProduits(items, config.nom, config.baseUrl);
        stats.inseres += r.inseres;
        stats.mis_a_jour += r.mis_a_jour;
        stats.erreurs += r.erreurs;
        await pool.query('UPDATE marchands SET derniere_sync=NOW() WHERE nom=$1', [config.nom]);
        console.log(`[NEW-SITES] ${config.nom}: ${items.length} scrapés → ${r.inseres} nouveaux, ${r.mis_a_jour} màj`);
      } catch (err) {
        console.error(`[NEW-SITES] ${config.nom} sauvegarde:`, err.message);
      }
    });

    return stats;
  } finally {
    scrapingEnCours = false;
  }
}

// ── Publication réseaux sociaux ────────────────────────────────────
// Publie les posts Facebook approuvés dont la date est passée
async function publierPostsApprouves() {
  if (!process.env.FB_PAGE_ID || !process.env.FB_PAGE_ACCESS_TOKEN) return;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM facebook_posts
       WHERE statut = 'approuve'
         AND (date_publication IS NULL OR date_publication <= NOW())
       ORDER BY date_publication ASC NULLS LAST
       LIMIT 5`
    );
    if (!rows.length) { console.log('[SOCIAL] Aucun post approuvé à publier'); return; }

    const { publierPost } = require('../routes/facebook-posts');
    for (const post of rows) {
      const results = await publierPost(post);
      await pool.query(
        `UPDATE facebook_posts
         SET statut = CASE WHEN $1 IS NOT NULL THEN 'publie' ELSE 'erreur' END,
             post_fb_id=$1, post_ig_id=$2, date_publie=NOW(), erreur=$3, updated_at=NOW()
         WHERE id=$4`,
        [results.fb_id || null, results.ig_id || null, results.erreur || null, post.id]
      );
      if (results.fb_id) console.log(`[SOCIAL] ✅ Post publié FB:${results.fb_id} IG:${results.ig_id || '-'}`);
      else console.error('[SOCIAL] ❌', results.erreur);
    }
  } catch (err) {
    console.error('[SOCIAL] Erreur cron publication:', err.message);
  }
}

async function envoyerRelancesExpiration() {
  const { envoyerEmail } = require('./email');
  const { sendWhatsAppText } = require('./whatsapp');
  const FRONTEND = process.env.FRONTEND_URL || 'https://nopalou.com';

  // Sponsorings expirés il y a 7 jours (boutiques, immo, annonces boostées)
  const { rows: boutiques } = await pool.query(`
    SELECT u.email, u.nom, b.nom AS boutique_nom
    FROM boutiques b JOIN utilisateurs u ON u.id = b.utilisateur_id
    WHERE b.sponsorise = true
      AND b.sponsor_jusqu_au BETWEEN NOW() - INTERVAL '8 days' AND NOW() - INTERVAL '6 days'
  `);
  for (const b of boutiques) {
    envoyerEmail({
      to: b.email,
      subject: 'Votre mise en avant Nopalou a expiré',
      html: `<p>Bonjour ${b.nom},</p><p>La mise en avant de votre boutique <strong>${b.boutique_nom}</strong> a expiré. <a href="${FRONTEND}/boutique">Renouvelez maintenant →</a></p>`,
    }).catch(() => {});
  }

  // Abonnements Pro/Business expirés il y a 7 jours
  const { rows: abonnements } = await pool.query(`
    SELECT u.email, u.nom, a.plan
    FROM abonnements a JOIN utilisateurs u ON u.id = a.utilisateur_id
    WHERE a.statut = 'actif'
      AND a.fin BETWEEN NOW() - INTERVAL '8 days' AND NOW() - INTERVAL '6 days'
  `);
  for (const a of abonnements) {
    envoyerEmail({
      to: a.email,
      subject: `Votre abonnement Nopalou ${a.plan} a expiré`,
      html: `<p>Bonjour ${a.nom},</p><p>Votre abonnement <strong>${a.plan}</strong> a expiré. <a href="${FRONTEND}/boutique/abonnement">Renouveler →</a></p>`,
    }).catch(() => {});
  }

  console.log(`[RELANCE] ${boutiques.length} boutiques + ${abonnements.length} abonnements relancés`);
}

// ══════════════════════════════════════════════════════
//  NETTOYAGE DES OFFRES AVEC URL MORTE
//  Une annonce CoinAfrique/Expat-Dakar expire côté marchand sans que le
//  scraper (qui ne fait qu'ajouter/mettre à jour ce qu'il retrouve) ne le
//  détecte jamais — l'offre restait "en stock" indéfiniment même quand
//  /api/click menait à un lien mort chez le marchand.
// ══════════════════════════════════════════════════════
async function offreEstMorte(url) {
  try {
    await axios.head(url, {
      headers: { 'User-Agent': randUA() },
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: null,
    });
    return false;
  } catch {
    // Certains sites (ex: CoinAfrique) rejettent HEAD — on retente en GET avant de conclure
    try {
      const r = await axios.get(url, {
        headers: { 'User-Agent': randUA() },
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: null,
      });
      return r.status === 404 || r.status === 410;
    } catch {
      // Timeout/DNS/refus de connexion répété : on ne peut pas conclure avec certitude
      // (peut être un blocage anti-bot temporaire) → ne pas supprimer sur un seul échec réseau
      return false;
    }
  }
}

async function nettoyerOffresExpirees(limite = 200) {
  const { rows: offres } = await pool.query(
    `SELECT id, url_achat, produit_id FROM offres
     WHERE stock = true AND scraped_at < NOW() - INTERVAL '20 hours'
     ORDER BY scraped_at ASC LIMIT $1`,
    [limite]
  );
  let mortes = 0;
  const produitsModifies = new Set();
  for (const o of offres) {
    if (await offreEstMorte(o.url_achat)) {
      await pool.query('UPDATE offres SET stock = false WHERE id = $1', [o.id]);
      produitsModifies.add(o.produit_id);
      mortes++;
    }
    await sleep(500 + Math.random() * 500);
  }
  if (produitsModifies.size > 0) {
    const ids = [...produitsModifies];
    await pool.query(`
      UPDATE produits SET
        prix_min = sub.prix_min,
        nb_offres = sub.nb_offres
      FROM (
        SELECT p.id,
          MIN(CASE WHEN o.stock THEN o.prix END) AS prix_min,
          COUNT(o.id) FILTER (WHERE o.stock) AS nb_offres
        FROM produits p
        LEFT JOIN offres o ON o.produit_id = p.id
        WHERE p.id = ANY($1::uuid[])
        GROUP BY p.id
      ) sub
      WHERE produits.id = sub.id`,
      [ids]
    );
  }
  console.log(`[NETTOYAGE] ${offres.length} offres vérifiées, ${mortes} retirées (URL morte)`);
  return { verifiees: offres.length, mortes };
}

function demarrerScraping() {
  // Toutes les 12h pour limiter la consommation mémoire (plan gratuit Railway)
  cron.schedule('0 */12 * * *', () => lancerScraping(['expat', 'jumia', 'coinafrique']).catch(console.error));
  cron.schedule('0 6,18 * * *', () => lancerScrapingNouveauxSites().catch(console.error));
  // Publication réseaux sociaux — vérifie toutes les heures les posts approuvés
  cron.schedule('0 * * * *', () => publierPostsApprouves().catch(console.error));
  // Nettoyage WhatsApp — messages dédupliqués >7j et sessions inactives >1h, chaque jour à 3h
  cron.schedule('0 3 * * *', () => {
    const { cleanupOldMessages, resetInactiveSessions } = require('./whatsapp-chatbot');
    cleanupOldMessages().catch(err => console.error('[WHATSAPP] cleanup messages:', err.message));
    resetInactiveSessions().catch(err => console.error('[WHATSAPP] reset sessions:', err.message));
  });
  // Relance commerciale — chaque jour à 9h UTC : email + WhatsApp aux sponsorings/abonnements expirés J-7
  cron.schedule('0 9 * * *', () => envoyerRelancesExpiration().catch(err => console.error('[RELANCE]', err.message)));
  // Nettoyage des offres avec URL marchand morte (annonces expirées côté CoinAfrique/Expat-Dakar)
  cron.schedule('30 4 * * *', () => nettoyerOffresExpirees().catch(err => console.error('[NETTOYAGE]', err.message)));

  // Premier scraping 10 min après démarrage (laisser l'app se stabiliser)
  setTimeout(() => lancerScraping(['coinafrique']).catch(console.error), 10 * 60 * 1000);
  setTimeout(() => lancerScrapingNouveauxSites().catch(console.error), 15 * 60 * 1000);
  console.log('[SCRAPER] ✅ Cron actif — premier scraping dans 10 min, puis toutes les 12h');
  console.log('[SOCIAL]  ✅ Cron actif — publication bons plans chaque jour à 8h UTC');
}

module.exports = { scraperExpatDakar, scraperJumia, scraperCoinAfrique, sauvegarderProduits, lancerScraping, lancerScrapingNouveauxSites, demarrerScraping, diagnosticScraper, diagnosticNouveauSite, invaliderCatCache, prixPlancher, corrigerPrixParPlancher, nettoyerOffresExpirees };
