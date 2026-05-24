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
  'HP','Lenovo','Dell','Asus','Acer','LG','Sony','Hisense','Haier','TCL','Realme','OnePlus','Motorola'];

const CAT_MOTS = [
  { slug:'smartphones',  mots:['samsung galaxy','iphone','xiaomi','tecno','infinix','oppo','vivo','huawei','nokia','realme','itel','tablette','smartphone','portable','ipad','téléphone','telephone','redmi','google pixel','oneplus','motorola moto'] },
  { slug:'informatique', mots:['laptop','ordinateur','macbook','lenovo','dell','hp ',' pc ','clavier','souris','imprimante','disque dur','ssd','moniteur','ecran pc','routeur','wifi','asus','acer','toshiba','epson','canon imprimante','brother'] },
  { slug:'tv-electro',   mots:['télé','tele','tv ','led tv','écran tv','hisense','lg tv','samsung tv','refrigerateur','réfrigérateur','climatiseur','split ','lave-linge','machine a laver','frigo','congélateur','ventilateur','fer a repasser','chauffe-eau','micro-onde','four électrique','induction','plaque de cuisson','mixeur','blender','aspirateur','air fryer','friteuse','batterie de cuisine','enduro','finix','astech'] },
  { slug:'maison',       mots:['canapé','table ','chaise','lit ','matelas','armoire','cuisine','meuble','déco','lampe','rideau','coussin','vaisselle','oreiller','drap','serviette','fontaine'] },
  { slug:'mode',         mots:['robe','chaussure','sac ','chemise','pantalon','vêtement','habit','sneaker','basket','montre','bijou','parfum','sac a main','jean ','t-shirt','coffret','eau de toilette','eau de parfum','musc','cologne'] },
  { slug:'auto-moto',    mots:['voiture','moto ','vélo','auto ','pneu','scooter','trottinette','pièce auto','batterie voiture'] },
  { slug:'jeux',         mots:['playstation','ps4','ps5','xbox','nintendo','manette','jeu video','gaming','casque gamer','console','joystick'] },
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

  // ── Taille écran TV/PC/moniteur (pouces ou ") ──────────────────
  const ecran = s.match(/(\d+)\s*(?:pouces?|"|\binch)/);
  if (ecran) {
    const p = parseInt(ecran[1]);
    if (p >= 85) return 500_000;
    if (p >= 65) return 250_000;
    if (p >= 55) return 150_000;
    if (p >= 43) return  80_000;
    if (p >= 32) return  40_000;
    if (p >= 24) return  25_000;
    if (p >= 13) return  20_000; // laptop/tablette
  }

  // ── RAM smartphone/PC ──────────────────────────────────────────
  const ram = s.match(/(\d+)\s*go\s+ram|ram\s*:?\s*(\d+)\s*go/);
  if (ram) {
    const r = parseInt(ram[1] || ram[2]);
    if (r >= 12) return 150_000;
    if (r >= 8)  return  80_000;
    if (r >= 6)  return  50_000;
    if (r >= 4)  return  30_000;
  }

  // ── Stockage seul (≥ 128 Go) ───────────────────────────────────
  const sto = s.match(/(\d+)\s*go(?!\s*ram)/);
  if (sto) {
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
  if (/(hisense|lg|samsung|tcl|sony|philips)\s*(tv|television|tele)/.test(s)) return 80_000;
  if (/\b(tv|tele|television)\b/.test(s))                    return  50_000;

  return null; // pas de signal → pas de plancher
}

// ── Correction prix XOF (division par 100/1000) ───────────────────
function corrigerPrixXOF(prix) {
  if (prix <= 0) return null;
  if (prix < 500) return null;
  return prix;
}

// Applique la correction ×100 ou ×1000 si le prix est sous le plancher du titre.
function corrigerPrixParPlancher(prix, titre) {
  const plancher = prixPlancher(titre);
  if (!plancher || prix >= plancher) return prix;
  const p100  = prix * 100;
  const p1000 = prix * 1000;
  // ×100 : résultat dans [plancher … plancher×30]
  if (p100 >= plancher && p100 <= plancher * 30) {
    console.warn(`[PRIX×100] "${titre}" : ${prix} → ${p100} FCFA (plancher: ${plancher})`);
    return p100;
  }
  // ×1000 : résultat dans [plancher … plancher×30]
  if (p1000 >= plancher && p1000 <= plancher * 30) {
    console.warn(`[PRIX×1000] "${titre}" : ${prix} → ${p1000} FCFA (plancher: ${plancher})`);
    return p1000;
  }
  return prix; // aucun multiple ne convient → laisser passer
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
        // Extraire mots-clés discriminants (modèle, référence)
        const motsCles = nomNorm.split(/\s+/).filter(m => m.length >= 3).slice(0, 4);
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
          // Seuil : similarité > 0.35 ou les 2 premiers mots-clés matchent
          if(fuzzy.length > 0 && (fuzzy[0].sim > 0.35 || _motsClesCommuns(item.titre, fuzzy[0].nom) >= 2)){
            produitId = fuzzy[0].id; stats.mis_a_jour++;
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
  }

  return stats;
}

// Compte les mots-clés en commun entre deux titres (insensible à la casse)
function _motsClesCommuns(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w=>w.length>=3));
  const wordsB = b.toLowerCase().split(/\W+/).filter(w=>w.length>=3);
  return wordsB.filter(w=>wordsA.has(w)).length;
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
async function lancerScraping(sources=['expat','jumia','coinafrique']) {
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
  // Cron historique : Expat + Jumia + CoinAfrique toutes les 4h
  cron.schedule('0 */4 * * *', () => lancerScraping(['expat', 'jumia', 'coinafrique']).catch(console.error));
  // Nouveaux sites : toutes les 6h (décalé de 2h pour ne pas surcharger)
  cron.schedule('0 2,8,14,20 * * *', () => lancerScrapingNouveauxSites().catch(console.error));
  // Premier scraping 30s après démarrage (CoinAfrique seul — rapide)
  setTimeout(() => lancerScraping(['coinafrique']).catch(console.error), 30_000);
  // Nouveaux sites 5 min après démarrage
  setTimeout(() => lancerScrapingNouveauxSites().catch(console.error), 90_000);
  console.log('[SCRAPER] ✅ Cron actif — CoinAfrique/30s + 9 nouveaux sites/90s + tous/4h-6h');
}

module.exports = { scraperExpatDakar, scraperJumia, scraperCoinAfrique, sauvegarderProduits, lancerScraping, lancerScrapingNouveauxSites, demarrerScraping, diagnosticScraper, diagnosticNouveauSite, invaliderCatCache, prixPlancher };
