// backend/services/scraper.js — Scrapers réels pour Expat-Dakar, Jumia SN, CoinAfrique
const axios    = require('axios');
const cheerio  = require('cheerio');
const cron     = require('node-cron');
const { pool } = require('../models/db');
const scrapingLock = require('../lib/scrapingLock');

const UA = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];
const randUA = () => UA[Math.floor(Math.random() * UA.length)];

const CATS = {
  expat:     ['telephones', 'tv-home-cinema', 'ordinateurs-accessoires', 'electromenager'],
  jumia:     ['telephone-tablette', 'electronique', 'informatique', 'electromenager'],
  coinafrique:['telephones-et-tablettes', 'electronique-et-video', 'ordinateurs-et-accessoires', 'electromenager'],
  auchan:    ['104-epicerie-salee', '105-epicerie-sucree', '110-petit-dejeuner', '108-boissons'],
  kaynoo:    ['produits-hightech', 'produits-electromenager', 'beaute-bien-etre', 'mode-sacs-accessoires'],
  decathlon: ['3745-tous-les-sports'],
  jiji:      ['mobile-phones', 'computers-and-accessories', 'tv-and-dvd-equipment', 'home-appliances']
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
  s = s.replace(/[,.](\d{1,2})(?=\D|$)/g, '');
  const n = parseInt(s.replace(/[^0-9]/g, ''));
  return isNaN(n) || n < 100 ? 0 : n;
}
function nettoyerTitre(t) { return (t||'').trim().replace(/\s+/g,' ').slice(0,255); }
function extraireMarque(titre) { const t=titre.toLowerCase(); return MARQUES.find(m=>t.includes(m.toLowerCase()))||null; }

let _catCache=null;
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

async function scraperExpatDakar(categorie='telephones', maxPages=4) {
  const resultats=[], base=`https://www.expat-dakar.com/${categorie}`;
  console.log(`\n[EXPAT] ${base}`);
  for(let page=1;page<=maxPages;page++){
    const url=page===1?base:`${base}?page=${page}`;
    try{
      const html=await fetchPage(url), $=cheerio.load(html); let found=0;
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const ld = JSON.parse($(el).html() || '{}');
          const graph = ld['@graph'] || [ld];
          for (const node of graph) {
            if (node['@type'] === 'WebPage' && node.mainEntity && node.mainEntity['@type'] === 'ItemList') {
              const items = node.mainEntity.itemListElement || [];
              for (const it of items) {
                const prod = it.item;
                if (!prod || prod['@type'] !== 'Product') continue;
                
                const titre = nettoyerTitre(prod.name);
                let prix = 0;
                if (prod.offers && prod.offers.priceSpecification && prod.offers.priceSpecification.price) {
                  prix = parseInt(prod.offers.priceSpecification.price, 10);
                } else if (prod.offers && prod.offers.price) {
                  prix = parseInt(prod.offers.price, 10);
                }
                
                let href = prod.url || '';
                if (href && !href.startsWith('http')) href = `https://www.expat-dakar.com${href}`;
                
                let img = null;
                if (prod.image) {
                  img = typeof prod.image === 'string' ? prod.image : (prod.image.url || prod.image.contentUrl);
                }
                
                if (titre.length > 3 && prix > 500) {
                  resultats.push({ titre, prix, url: href, image_url: img });
                  found++;
                }
              }
            }
          }
        } catch (e) {}
      });
      
      if (found > 0) {
        console.log(`[EXPAT] Page ${page}: ${found} résultats (via JSON-LD)`);
      } else {
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
      }
    }catch(err){ console.error(`[EXPAT] Page ${page}:`,err.message); }
    await sleep(2000+Math.random()*1000);
  }
  console.log(`[EXPAT] Total: ${resultats.length}`); return resultats;
}

function _extraireProduitsNextData(obj, resultats, baseUrl, profondeur = 0) {
  if (!obj || typeof obj !== 'object' || profondeur > 8) return;
  if (Array.isArray(obj)) {
    for (const item of obj) _extraireProduitsNextData(item, resultats, baseUrl, profondeur + 1);
    return;
  }
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
      return;
    }
  }
  for (const val of Object.values(obj)) _extraireProduitsNextData(val, resultats, baseUrl, profondeur + 1);
}

async function scraperJumia(categorie='telephone-tablette', maxPages=5) {
  const resultats=[], base=`https://www.jumia.sn/${categorie}/`;
  console.log(`\n[JUMIA] ${base}`);

  for(let page=1;page<=maxPages;page++){
    const url=page===1?base:`${base}?page=${page}#catalog-listing`;
    let found=0;
    try{
      const html=await fetchPage(url);
      const $=cheerio.load(html);

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
      }

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
      }

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
        break;
      }
    }catch(err){ console.error(`[JUMIA] Page ${page}:`,err.message); }
    await sleep(2500+Math.random()*1500);
  }
  console.log(`[JUMIA] Total: ${resultats.length}`); return resultats;
}

async function scraperCoinAfrique(categorie='telephones-et-tablettes', maxPages=4) {
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

async function scraperKaynoo(categorie='produits-hightech', maxPages=3) {
  const resultats = [];
  const base = `https://www.kaynoo.sn/${categorie}`;
  console.log(`\n[KAYNOO] ${base}`);
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? `${base}.html` : `${base}.html?p=${page}`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);
      let found = 0;
      $('.product-item').each((_, el) => {
        const titre = nettoyerTitre($(el).find('.product-item-name a').text());
        const prixStr = $(el).find('.price').first().text();
        const prix = nettoyerPrix(prixStr);
        let href = $(el).find('.product-item-name a').attr('href') || '';
        const img = $(el).find('.product-image-photo').attr('src') || $(el).find('.product-image-photo').attr('data-src') || null;
        if (titre.length > 3 && prix > 500) {
          resultats.push({ titre, prix, url: href, image_url: img });
          found++;
        }
      });
      if (found > 0) {
        console.log(`[KAYNOO] Page ${page}: ${found} résultats`);
      } else {
        console.warn(`[KAYNOO] Page ${page}: 0 résultat`);
        break;
      }
    } catch (err) {
      console.error(`[KAYNOO] Page ${page}:`, err.message);
    }
    await sleep(2000 + Math.random() * 1000);
  }
  console.log(`[KAYNOO] Total: ${resultats.length}`); return resultats;
}

async function scraperAuchan(categorie='137-boissons', maxPages=3) {
  const resultats = [];
  const base = `https://www.auchan.sn/${categorie}`;
  console.log(`\n[AUCHAN] ${base}`);
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? base : `${base}?page=${page}`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);
      let found = 0;
      $('.product-miniature, article, .item').each((_, el) => {
        const titre = nettoyerTitre($(el).find('.product-title a, h3, h2, .name').text());
        const prixStr = $(el).find('.product-price, .price, [itemprop="price"]').text();
        const prix = nettoyerPrix(prixStr);
        let href = $(el).find('.product-title a, a.thumbnail, a').attr('href') || '';
        if (href && !href.startsWith('http')) href = `https://www.auchan.sn${href}`;
        const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || null;
        if (titre.length > 3 && prix > 500) {
          resultats.push({ titre, prix, url: href, image_url: img });
          found++;
        }
      });
      if (found === 0) {
        const scriptMatch = html.match(/"products":(\[.*?\]),"totals"/);
        if (scriptMatch) {
          try {
            const arr = JSON.parse(scriptMatch[1]);
            for (const prod of arr) {
              const titre = nettoyerTitre(prod.name);
              const prix = nettoyerPrix(prod.price);
              const href = prod.url || '';
              const img = prod.cover?.url || null;
              if (titre && prix > 500) {
                resultats.push({ titre, prix, url: href, image_url: img });
                found++;
              }
            }
          } catch(e) {}
        }
      }
      if (found > 0) {
        console.log(`[AUCHAN] Page ${page}: ${found} résultats`);
      } else {
        console.warn(`[AUCHAN] Page ${page}: 0 résultat`);
        break;
      }
    } catch (err) {
      console.error(`[AUCHAN] Page ${page}:`, err.message);
    }
    await sleep(2000 + Math.random() * 1000);
  }
  console.log(`[AUCHAN] Total: ${resultats.length}`); return resultats;
}

// ══════════════════════════════════════════════════════
//  SCRAPER 6 — Decathlon (Next.js data-src JSON)
// ══════════════════════════════════════════════════════
async function scraperDecathlon(categorie = '3745-tous-les-sports', maxPages = 2) {
  const resultats = [], base = `https://www.decathlon.sn/${categorie}`;
  console.log(`\n[DECATHLON] ${base}`);
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? base : `${base}?page=${page}`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);
      let found = 0;

      $('script[type="application/json"][data-src]').each((_, el) => {
        try {
          const jsonText = $(el).html();
          if (jsonText && jsonText.includes('"price"')) {
            const data = JSON.parse(jsonText);
            const items = data[0]; 
            if (Array.isArray(items)) {
              for (const p of items) {
                if (p.title && p.price && p.price.amountRaw) {
                  const titre = nettoyerTitre(p.title);
                  const prix = parseInt(p.price.amountRaw, 10);
                  const url = p.cardLinkUrl || '';
                  const img = p.image ? p.image.url : null;
                  
                  if (titre.length > 3 && prix > 500) {
                    resultats.push({ titre, prix, url, image_url: img });
                    found++;
                  }
                }
              }
            }
          }
        } catch (e) {}
      });

      console.log(`[DECATHLON] Page ${page}: ${found} résultats`);
      if (found === 0) break;
    } catch (err) {
      console.error(`[DECATHLON] Page ${page}:`, err.message);
      break;
    }
    await sleep(2000);
  }
  console.log(`[DECATHLON] Total: ${resultats.length}`);
  return resultats;
}

// ══════════════════════════════════════════════════════
//  SCRAPER 7 — Jiji Sénégal
// ══════════════════════════════════════════════════════
async function scraperJiji(categorie = 'mobile-phones', maxPages = 4) {
  const resultats = [], base = `https://jiji.sn/${categorie}`;
  console.log(`\n[JIJI] ${base}`);
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? base : `${base}?page=${page}`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);
      let found = 0;

      $('.b-list-advert-base').each((_, el) => {
        const titre = nettoyerTitre($(el).find('.qa-advert-title').text());
        const prixTxt = $(el).find('.qa-advert-price').text();
        const prix = nettoyerPrix(prixTxt);
        let href = $(el).attr('href') || '';
        if (href && !href.startsWith('http')) href = `https://jiji.sn${href}`;
        const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || null;

        if (titre.length > 3 && prix > 500) {
          resultats.push({ titre, prix, url: href, image_url: img });
          found++;
        }
      });

      console.log(`[JIJI] Page ${page}: ${found} résultats`);
      if (found === 0) break;
    } catch (err) {
      console.error(`[JIJI] Page ${page}:`, err.message);
      break;
    }
    await sleep(2000);
  }
  console.log(`[JIJI] Total: ${resultats.length}`);
  return resultats;
}

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

const RAM_LABEL_RE   = /\bram\s*:?\s*(\d+)\s*g[ob]\b/;
const STOCKAGE_LABEL_RE = /\b(?:memoire|rom|stockage)\s*:?\s*(\d+)\s*g[ob]\b/;
const STOCKAGE_TO_RE = /\b(\d+(?:[.,]\d+)?)\s*t[ob]\b/;
const RAM_DOUBLE_RE = /(\d+)\s*g[ob]\s*[/]?\s*ram\s*[/]?\s*(\d+)\s*g[ob]/;

function extraireRamGo(s) {
  const label = s.match(RAM_LABEL_RE);
  if (label) return parseInt(label[1]);
  const ramDouble = s.match(RAM_DOUBLE_RE);
  if (ramDouble) return Math.min(parseInt(ramDouble[1]), parseInt(ramDouble[2]));
  const ram = s.match(/(\d+)\s*g[ob]\s*ram/);
  return ram ? parseInt(ram[1]) : null;
}

function extraireStockageGo(s) {
  const label = s.match(STOCKAGE_LABEL_RE);
  const to = !label && s.match(STOCKAGE_TO_RE);
  let sto;
  if (label) {
    sto = [null, label[1]];
  } else if (to) {
    sto = [null, String(Math.round(parseFloat(to[1].replace(',', '.')) * 1024))];
  } else {
    const ramDouble = s.match(RAM_DOUBLE_RE);
    sto = ramDouble
      ? [null, String(Math.max(parseInt(ramDouble[1]), parseInt(ramDouble[2])))]
      : s.match(/(\d+)\s*go(?!\s*ram)/);
  }
  if (!sto) return null;
  if (/carte\s*(memoire|memory|sd|micro\s*sd)|cle\s*usb|disque dur|ssd|hdd/.test(s)) return null;
  if (/tablette.{0,15}enfant|enfant.{0,15}tablette|oteeto/.test(s)) return null;
  return parseInt(sto[1]);
}

function extraireBtu(s) {
  const btu = s.match(/(\d[\d\s]*)\s*btu/);
  return btu ? parseInt(btu[1].replace(/\s/g, '')) : null;
}

function extraireBtuAffichage(s) {
  const btu = extraireBtu(s);
  if (btu != null) return btu;
  const cv = s.match(/(\d+(?:[.,]\d+)?)\s*cv\b/);
  return cv ? Math.round(parseFloat(cv[1].replace(',', '.')) * 3500) : null;
}

function extraireLitres(s) {
  const vol = s.match(/(\d{2,3})\s*(?:litres?|l)\b/);
  return vol ? parseInt(vol[1]) : null;
}

function extraireKg(s) {
  const kg = s.match(/(\d{1,2})\s*kg\b/);
  return kg ? parseInt(kg[1]) : null;
}

function prixPlancher(titre) {
  const s = ' ' + (titre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'') + ' ';

  if (/\b(chargeur|cable|câble|adaptateur|support|housse|etui|étui|coque|sacoche|protection ecran|film de protection|verre trempe|batterie externe|power\s*bank|powerbank)\b/.test(s)) {
    return null;
  }

  const ecran = s.match(/(\d+(?:[.,]\d+)?)\s*(?:pouces?|["″»]|\binch)/);
  if (ecran) {
    const p = parseFloat(ecran[1].replace(',', '.'));
    if (p >= 85) return 500_000;
    if (p >= 65) return 250_000;
    if (p >= 55) return 150_000;
    if (p >= 43) return  80_000;
    if (p >= 32) return  40_000;
    if (p >= 24) return  25_000;
    if (p >= 13) return  20_000;
  }

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

  const r = extraireRamGo(s);
  if (r != null) {
    if (r >= 12) return 150_000;
    if (r >= 8)  return  80_000;
    if (r >= 6)  return  50_000;
    if (r >= 4)  return  30_000;
  }

  const st = extraireStockageGo(s);
  if (st != null) {
    if (st >= 512) return 200_000;
    if (st >= 256) return 100_000;
    if (st >= 128) return  50_000;
  }

  const b = extraireBtu(s);
  if (b != null) {
    if (b >= 18000) return 300_000;
    if (b >= 12000) return 200_000;
    if (b >=  9000) return 150_000;
    if (b >=  5000) return  80_000;
  }

  const v = /frigo|refrig|congelat/.test(s) ? extraireLitres(s) : null;
  if (v != null) {
    if (v >= 400) return 400_000;
    if (v >= 300) return 250_000;
    if (v >= 200) return 150_000;
    if (v >= 100) return  80_000;
  }
  if (/refriger|frigo\b/.test(s) && !/piece|spare/.test(s)) return 80_000;
  if (/lave[- ]linge|machine.{0,6}laver/.test(s))           return 150_000;
  if (/congelateur|congelat/.test(s))                        return 100_000;
  if (/climatiseur|split |clim\b/.test(s))                   return 100_000;

  if (/wh.?1000xm\d/.test(s))                               return 150_000;
  if (/wh.?ch\d{3}|wh.?xb\d{3}/.test(s))                   return  30_000;
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

  if (/casque\s*(noise.cancell|anc|sans.fil|bluetooth|actif)/.test(s)) return 30_000;
  if (/casque\s*(sony|bose|jbl|sennheiser|beats|anker)/.test(s))       return 50_000;
  if (/casque audio|casque stereo|casque hifi/.test(s))                 return 12_000;
  if (/casque\b/.test(s) && !/casque gaz|casque moto/.test(s))         return 10_000;
  if (/ecouteur\s*(sans.fil|bluetooth|tws|anc)/.test(s))               return 15_000;
  if (/ecouteur/.test(s))                                               return  8_000;
  if (/enceinte\s*(bluetooth|portable|sans.fil)/.test(s))              return 15_000;
  if (/enceinte\s*(hifi|home.cinema|barre.de.son)/.test(s))            return 50_000;

  if (/smartwatch|montre connectee|montre intelligente/.test(s))        return 15_000;
  if (/macbook|chromebook/.test(s))                          return 200_000;
  if (/laptop|ordinateur portable|pc portable/.test(s))      return 150_000;
  if (/ordinateur de bureau|pc bureau|tour pc/.test(s))      return 100_000;
  if (/imprimante laser/.test(s))                            return  80_000;
  if (/imprimante/.test(s))                                  return  30_000;
  if (/ipad\b/.test(s))                                      return 150_000;
  if (/tablette\s*(android|samsung|huawei|lenovo)/.test(s))  return  60_000;
  if (/reflex|mirrorless|appareil photo/.test(s))            return 150_000;
  if (/camera\s*(ip|surveillance|360)/.test(s))              return  15_000;

  if (/(hisense|lg|samsung|tcl|sony|philips)\s*(tv|television|tele|televiseur)/.test(s)) return 80_000;
  if (/\b(tv|tele|television)\b|televiseur/.test(s))         return  50_000;

  return null;
}

function corrigerPrixXOF(prix) {
  if (prix <= 0) return null;
  if (prix < 500) return null;
  return prix;
}

function corrigerPrixParPlancher(prix, titre) {
  const plancher = prixPlancher(titre);
  if (!plancher) return prix;

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

  return prix;
}

function extrairePouce(titre) {
  const m = (titre || '').match(/\b(\d{2,3})\s*(?:pouces?|"|\binch)/i);
  return m ? parseInt(m[1], 10) : null;
}

const COULEURS = [
  { re: /\b(noir|black)\b/,        nom: 'Noir' },
  { re: /\b(blanc|white)\b/,       nom: 'Blanc' },
  { re: /\b(gris|gray|grey)\b/,    nom: 'Gris' },
  { re: /\b(bleu|blue)\b/,         nom: 'Bleu' },
  { re: /\b(rouge|red)\b/,         nom: 'Rouge' },
  { re: /\b(vert|green)\b/,        nom: 'Vert' },
  { re: /\b(or|dore|gold)\b/,      nom: 'Or' },
  { re: /\b(argent|silver)\b/,     nom: 'Argent' },
  { re: /\b(rose|pink)\b/,         nom: 'Rose' },
  { re: /\b(violet|purple)\b/,     nom: 'Violet' },
  { re: /\b(jaune|yellow)\b/,      nom: 'Jaune' },
];

function extraireEtat(s) {
  if (/\breconditionn[ée]\b/.test(s)) return 'reconditionne';
  if (/\bcomme neuf\b|\boccasion\b/.test(s)) return 'occasion';
  if (/\bneuf\b/.test(s)) return 'neuf';
  return null;
}

function extraireSpecs(titre) {
  const s = ' ' + (titre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'') + ' ';
  const couleur = COULEURS.find(c => c.re.test(s));
  const estClim       = /climatiseur|split |clim\b/.test(s);
  const estFrigo       = /frigo|refrig|congelat/.test(s);
  const estLaveLinge   = /lave[- ]linge|machine.{0,6}laver/.test(s);
  const estEcran       = /\b(tv|tele|television)\b|televiseur|ecran|moniteur/.test(s);
  return {
    stockage_go: extraireStockageGo(s),
    ram_go: extraireRamGo(s),
    couleur: couleur ? couleur.nom : null,
    etat: extraireEtat(s),
    puissance_btu: estClim ? extraireBtuAffichage(s) : null,
    capacite_litres: estFrigo ? extraireLitres(s) : null,
    capacite_kg: estLaveLinge ? extraireKg(s) : null,
    ecran_pouces: estEcran ? extrairePouce(s) : null,
  };
}

async function sauvegarderProduits(items, marchandNom, siteUrl) {
  const marchandId=await getMarchandId(marchandNom,siteUrl);
  const stats={inseres:0,mis_a_jour:0,erreurs:0,filtres:0};
  const produitsModifies = new Set();

  for(const item of items){
    try{
      const prixVerifie = corrigerPrixXOF(item.prix);
      if (prixVerifie === null) {
        stats.filtres++;
        continue;
      }
      item.prix = corrigerPrixParPlancher(prixVerifie, item.titre);
      let produitId;

      if(item.ean){
        const {rows:byEan}=await pool.query('SELECT id FROM produits WHERE ean=$1 LIMIT 1',[item.ean]);
        if(byEan.length>0){ produitId=byEan[0].id; stats.mis_a_jour++; }
      }

      if(!produitId){
        const {rows:byNom}=await pool.query(
          `SELECT id FROM produits WHERE ${sqlNomNormalise('nom')} = ${sqlNomNormalise('$1')} LIMIT 1`,
          [normaliserTitre(item.titre)]
        );
        if(byNom.length>0){ produitId=byNom[0].id; stats.mis_a_jour++; }
      }

      if(!produitId){
        const nomNorm = normaliserTitre(item.titre);
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
          if(fuzzy.length > 0 && (fuzzy[0].sim > 0.65 || _motsClesCommuns(item.titre, fuzzy[0].nom) >= 2)){
            const marqueSrc  = extraireMarque(item.titre);
            const marqueDest = extraireMarque(fuzzy[0].nom);
            const tailleSrc  = extrairePouce(item.titre);
            const tailleDest = extrairePouce(fuzzy[0].nom);
            if (marqueSrc && marqueDest && marqueSrc !== marqueDest) {
            } else if (tailleSrc && tailleDest && Math.abs(tailleSrc - tailleDest) > 10) {
            } else {
              produitId = fuzzy[0].id; stats.mis_a_jour++;
            }
          }
        }
      }

      if(!produitId){
        const catId=await getCatId(item.titre);
        const {rows:n}=await pool.query(
          'INSERT INTO produits(nom,marque,categorie_id,ean,image_url) VALUES($1,$2,$3,$4,$5) RETURNING id',
          [item.titre, extraireMarque(item.titre), catId, item.ean||null, item.image_url]
        );
        produitId=n[0].id; stats.inseres++;
      }

      if(item.image_url) await pool.query('UPDATE produits SET image_url=$1 WHERE id=$2 AND image_url IS NULL',[item.image_url,produitId]);
      const catDetectee = await getCatId(item.titre);
      if(catDetectee) await pool.query(
        'UPDATE produits SET categorie_id=$1 WHERE id=$2 AND (categorie_id IS NULL OR categorie_id != $1)',
        [catDetectee, produitId]
      );

      const specs = extraireSpecs(item.titre);
      const {rows:offre}=await pool.query(
        `INSERT INTO offres(produit_id,marchand_id,prix,url_achat,titre_marchand,specs,scraped_at,stock)
         VALUES($1,$2,$3,$4,$5,$6,NOW(),true)
         ON CONFLICT(produit_id,marchand_id)
         DO UPDATE SET prix=EXCLUDED.prix, url_achat=EXCLUDED.url_achat,
                       titre_marchand=EXCLUDED.titre_marchand,
                       specs=EXCLUDED.specs,
                       scraped_at=NOW(), stock=true
         RETURNING id`,
        [produitId,marchandId,item.prix,item.url,item.titre,JSON.stringify(specs)]
      );
      if(offre.length>0) await pool.query('INSERT INTO historique_prix(offre_id,prix) VALUES($1,$2)',[offre[0].id,item.prix]);

      produitsModifies.add(produitId);
    }catch(err){ console.error(`[DB] "${item.titre}":`,err.message); stats.erreurs++; }
  }

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

    const { rows: declenchees } = await pool.query(
      `SELECT a.*, p.nom AS produit_nom, p.prix_min
       FROM alertes a
       JOIN produits p ON p.id = a.produit_id
       WHERE a.active = true AND a.produit_id = ANY($1::uuid[])
         AND p.prix_min IS NOT NULL AND p.prix_min <= a.prix_cible`,
      [ids]
    );

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

function _motsClesCommuns(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length >= 3 && !MOTS_GENERIQUES.has(w)));
  const wordsB = b.toLowerCase().split(/\W+/).filter(w => w.length >= 3 && !MOTS_GENERIQUES.has(w));
  return wordsB.filter(w => wordsA.has(w)).length;
}

function sqlNomNormalise(col) {
  return `TRIM(LOWER(regexp_replace(regexp_replace(${col}, '[''’‘“”"()\\[\\]]', '', 'g'), '\\s+', ' ', 'g')))`;
}

function normaliserTitre(s) {
  return (s||'').toLowerCase()
    .replace(/[''""()\[\]]/g,'')
    .replace(/\b(neuf|occasion|reconditionné|garanti|livraison|offre|promo|bon état|état)\b/gi,'')
    .replace(/\s+/g,' ').trim();
}

async function diagnosticScraper(source, categorie) {
  const fns={expat:scraperExpatDakar,jumia:scraperJumia,coinafrique:scraperCoinAfrique,decathlon:scraperDecathlon,jiji:scraperJiji};
  const cats={expat:'telephones-portables-et-tablettes',jumia:'telephones-tablettes',coinafrique:'telephonie',decathlon:'3745-tous-les-sports',jiji:'mobile-phones'};
  if(!fns[source]) throw new Error(`Source inconnue: ${source}. Valeurs: expat, jumia, coinafrique, decathlon, jiji`);
  const items=await fns[source](categorie||cats[source],1);
  return {
    source, categorie:categorie||cats[source],
    nb_resultats:items.length,
    statut:items.length>0?'OK':'AUCUN_RESULTAT',
    conseil:items.length===0?'Vérifier les sélecteurs CSS dans scraper.js — le site a peut-être changé de layout':null,
    exemples:items.slice(0,5).map(i=>({titre:i.titre,prix:`${i.prix.toLocaleString()} FCFA`,image:i.image_url?'✓':'✗',url:i.url})),
  };
}

let scrapingEnCours = false;

async function lancerScraping(sources=['expat','jumia','coinafrique','auchan','kaynoo','decathlon','jiji']) {
  if (scrapingEnCours) {
    return { ignore: true };
  }
  if (!scrapingLock.tenterAcquerir('produits')) {
    return { ignore: true };
  }
  scrapingEnCours = true;
  try {
    const rapport={debut:new Date(),sources:{}};
    invaliderCatCache();
    console.log('\n[SCRAPER] ══════ DÉBUT ══════');
    const conf={
      expat:       {nom:'Expat-Dakar',  url:'https://www.expat-dakar.com',  cats:CATS.expat,       fn:scraperExpatDakar},
      jumia:       {nom:'Jumia Senegal',url:'https://www.jumia.sn',         cats:CATS.jumia,       fn:scraperJumia},
      coinafrique: {nom:'CoinAfrique',  url:'https://sn.coinafrique.com',   cats:CATS.coinafrique, fn:scraperCoinAfrique},
      auchan:      {nom:'Auchan',       url:'https://www.auchan.sn',        cats:CATS.auchan,      fn:scraperAuchan},
      kaynoo:      {nom:'Kaynoo',       url:'https://kaynoo.sn',            cats:CATS.kaynoo,      fn:scraperKaynoo},
      decathlon:   {nom:'Decathlon',    url:'https://www.decathlon.sn',     cats:CATS.decathlon,   fn:scraperDecathlon},
      jiji:        {nom:'Jiji',         url:'https://jiji.sn',              cats:CATS.jiji,        fn:scraperJiji},
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
    scrapingLock.relacher();
  }
}

const { scraperTousNouveauxSites, diagnosticNouveauSite } = require('./scraper-new-sites');

async function lancerScrapingNouveauxSites(siteIds = null) {
  if (scrapingEnCours) {
    return { ignore: true };
  }
  if (!scrapingLock.tenterAcquerir('nouveaux-sites')) {
    return { ignore: true };
  }
  scrapingEnCours = true;
  try {
    invaliderCatCache();
    const stats = { inseres: 0, mis_a_jour: 0, erreurs: 0, scrapes: 0 };
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
    scrapingLock.relacher();
  }
}

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
    if (!rows.length) return;

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
    }
  } catch (err) {
    console.error('[SOCIAL] Erreur cron publication:', err.message);
  }
}

async function envoyerRelancesExpiration() {
  const { envoyerEmail } = require('./email');
  const FRONTEND = process.env.FRONTEND_URL || 'https://nopalou.com';

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
}

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
    try {
      const r = await axios.get(url, {
        headers: { 'User-Agent': randUA() },
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: null,
      });
      return r.status === 404 || r.status === 410;
    } catch {
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
  return { verifiees: offres.length, mortes };
}

async function verifierAlertsPrix() {
  const { envoyerAlertePrix } = require('./notifications');

  try {
    const { rows: alertesProd } = await pool.query(`
      SELECT a.*, p.nom as produit_nom, p.id as produit_id
      FROM alertes a
      JOIN produits p ON a.produit_id = p.id
      WHERE a.active = true AND a.produit_id IS NOT NULL
      ORDER BY a.created_at DESC
    `);

    for (const alerte of alertesProd) {
      const { rows: offres } = await pool.query(`
        SELECT MIN(prix) as prix_min FROM offres
        WHERE produit_id = $1 AND stock = true
      `, [alerte.produit_id]);

      const prixActuel = offres[0]?.prix_min;
      if (prixActuel && prixActuel <= alerte.prix_cible) {
        await envoyerAlertePrix(alerte, prixActuel);
        await pool.query('UPDATE alertes SET active = false WHERE id = $1', [alerte.id]);
      }
    }

    const { rows: alertesChat } = await pool.query(`
      SELECT a.*, a.produit_nom
      FROM alertes a
      WHERE a.active = true AND a.telephone IS NOT NULL AND a.produit_id IS NULL
      ORDER BY a.created_at DESC
    `);

    for (const alerte of alertesChat) {
      const { rows: produits } = await pool.query(`
        SELECT p.id FROM produits p
        WHERE p.nom ILIKE '%' || $1 || '%'
        LIMIT 1
      `, [alerte.produit_nom]);

      if (produits.length === 0) continue;
      const produitId = produits[0].id;

      const { rows: offres } = await pool.query(`
        SELECT MIN(prix) as prix_min FROM offres
        WHERE produit_id = $1 AND stock = true
      `, [produitId]);

      const prixActuel = offres[0]?.prix_min;
      if (prixActuel && prixActuel <= alerte.prix_cible) {
        await envoyerAlertePrix(alerte, prixActuel);
        await pool.query('UPDATE alertes SET active = false WHERE id = $1', [alerte.id]);
      }
    }
  } catch (err) {
    console.error('[ALERTES] Erreur vérification:', err.message);
  }
}

function demarrerScraping() {
  cron.schedule('0 */12 * * *', () => lancerScraping(['expat', 'jumia', 'coinafrique', 'auchan', 'kaynoo', 'decathlon', 'jiji']).catch(console.error));
  cron.schedule('0 6,18 * * *', () => lancerScrapingNouveauxSites().catch(console.error));
  cron.schedule('0 * * * *', () => publierPostsApprouves().catch(console.error));
  cron.schedule('0 3 * * *', () => {
    const { cleanupOldMessages, resetInactiveSessions } = require('./whatsapp-chatbot');
    cleanupOldMessages().catch(err => console.error('[WHATSAPP] cleanup messages:', err.message));
    resetInactiveSessions().catch(err => console.error('[WHATSAPP] reset sessions:', err.message));
  });
  cron.schedule('0 9 * * *', () => envoyerRelancesExpiration().catch(err => console.error('[RELANCE]', err.message)));
  cron.schedule('30 4 * * *', () => nettoyerOffresExpirees().catch(err => console.error('[NETTOYAGE]', err.message)));

  setTimeout(() => lancerScraping(['coinafrique']).catch(console.error), 10 * 60 * 1000);
  setTimeout(() => lancerScrapingNouveauxSites().catch(console.error), 15 * 60 * 1000);
}

function demarrerCronsMetier() {
  cron.schedule('*/15 * * * *', () => verifierAlertsPrix().catch(err => console.error('[ALERTES]', err.message)));
  const { detecterAnomalies } = require('./anomaly-detector');
  cron.schedule('0 1 * * *', () => detecterAnomalies().catch(err => console.error('[ANOMALY]', err.message)));
}

module.exports = { 
  scraperExpatDakar, 
  scraperJumia, 
  scraperCoinAfrique, 
  scraperAuchan, 
  scraperKaynoo,
  scraperDecathlon,
  scraperJiji,
  sauvegarderProduits, 
  lancerScraping, 
  lancerScrapingNouveauxSites, 
  demarrerScraping, 
  demarrerCronsMetier, 
  diagnosticScraper, 
  diagnosticNouveauSite, 
  invaliderCatCache, 
  prixPlancher, 
  corrigerPrixParPlancher, 
  nettoyerOffresExpirees, 
  extraireSpecs, 
  verifierAlertsPrix, 
  detecterAnomalies: require('./anomaly-detector').detecterAnomalies, 
  sqlNomNormalise 
};
