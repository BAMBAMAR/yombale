// backend/services/scraper-immo-coinafrique.js
// Scrape les annonces immobilières sur sn.coinafrique.com
const axios   = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../models/db');

const BASE  = 'https://sn.coinafrique.com';
const DELAY = 1500;

const SECTIONS = [
  { path: '/category/appartements-a-louer',       type_bien: 'appartement', transaction: 'location' },
  { path: '/category/villas-a-louer',             type_bien: 'villa',       transaction: 'location' },
  { path: '/category/chambres-a-louer',           type_bien: 'chambre',     transaction: 'location' },
  { path: '/category/bureaux-plateaux-a-louer',   type_bien: 'bureau',      transaction: 'location' },
  { path: '/category/appartements-a-vendre',      type_bien: 'appartement', transaction: 'vente'    },
  { path: '/category/terrains-a-vendre',          type_bien: 'terrain',     transaction: 'vente'    },
  { path: '/category/villas-a-vendre',            type_bien: 'villa',       transaction: 'vente'    },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
    timeout: 20000,
  });
  return cheerio.load(res.data);
}

function parsePrix(txt) {
  if (!txt) return null;
  const clean = txt.replace(/[^0-9]/g, '');
  const v = parseInt(clean, 10);
  return (v > 0 && v < 999_000_000) ? v : null;
}

function parseSurface(txt) {
  if (!txt) return null;
  const m = txt.match(/(\d+)\s*m/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseLocalisation(txt) {
  if (!txt) return { ville: 'Dakar', quartier: null };
  const t = txt.trim();
  const VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack',
                  'Mbour', 'Touba', 'Diourbel', 'Louga', 'Kolda', 'Tambacounda'];
  for (const v of VILLES) {
    if (t.toLowerCase().includes(v.toLowerCase())) return { ville: v, quartier: t };
  }
  return { ville: 'Dakar', quartier: t };
}

async function scraperPage(url, type_bien, transaction) {
  const annonces = [];
  try {
    const $ = await fetchPage(url);

    // CoinAfrique : cards dans .col.s6 > .ad-card ou .browse-listing
    $('.ad-card, .col.s6.m4.l3, .listing-ad-item').each((_, el) => {
      const $el = $(el);

      const titre = $el.find('.ad__info__title, h2, h3, .title').first().text().trim();
      if (!titre) return;

      const prixTxt   = $el.find('.ad__info__price, .price').first().text();
      const locTxt    = $el.find('.ad__info__location, .location, .city').first().text().trim();
      const surfaceTxt = $el.find('[class*="surface"], [class*="size"]').first().text();

      const href = $el.find('a').first().attr('href') || '';
      const urlAnnonce = href.startsWith('http') ? href : BASE + href;

      const refMatch = urlAnnonce.match(/\/(\w{8,})\/?(?:\?|$)/);
      const ref_externe = refMatch ? 'coin-' + refMatch[1] : null;

      const photo = $el.find('img').first().attr('data-src')
                 || $el.find('img').first().attr('src') || null;
      const propre = photo && !photo.includes('placeholder') ? photo : null;

      const loc = parseLocalisation(locTxt);

      annonces.push({
        titre,
        type_bien,
        transaction,
        prix:       parsePrix(prixTxt),
        surface_m2: parseSurface(surfaceTxt),
        ville:      loc.ville,
        quartier:   loc.quartier,
        photos:     propre ? [propre] : [],
        url_source: urlAnnonce,
        source:     'coinafrique',
        ref_externe,
      });
    });
  } catch (err) {
    console.warn(`[COIN-IMMO] Erreur page ${url}: ${err.message}`);
  }
  return annonces;
}

async function upsertAnnonce(a) {
  await pool.query(`
    INSERT INTO annonces_immo
      (titre, type_bien, transaction, prix, surface_m2, nb_pieces, nb_chambres,
       ville, quartier, description, photos, url_source, source, ref_externe)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14)
    ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
    DO UPDATE SET
      titre      = EXCLUDED.titre,
      prix       = COALESCE(EXCLUDED.prix, annonces_immo.prix),
      photos     = CASE WHEN jsonb_array_length(EXCLUDED.photos) > 0
                        THEN EXCLUDED.photos ELSE annonces_immo.photos END,
      actif      = true,
      updated_at = NOW()
  `, [
    a.titre, a.type_bien, a.transaction, a.prix || null, a.surface_m2 || null,
    null, null, a.ville, a.quartier || null, null,
    JSON.stringify(a.photos || []), a.url_source, a.source, a.ref_externe,
  ]);
}

async function scraperImmo({ dryRun = false } = {}) {
  const stats = { scrapes: 0, inseres: 0, erreurs: [], dryRun };

  for (const sec of SECTIONS) {
    for (let pg = 1; pg <= 3; pg++) {
      const url = pg === 1 ? `${BASE}${sec.path}` : `${BASE}${sec.path}?page=${pg}`;
      console.log(`[COIN-IMMO] ${url}`);

      const annonces = await scraperPage(url, sec.type_bien, sec.transaction);
      stats.scrapes += annonces.length;
      if (!annonces.length) break;

      for (const a of annonces) {
        try {
          if (dryRun) {
            console.log('[COIN-IMMO DRY]', a.titre, a.prix, a.ville);
          } else {
            await upsertAnnonce(a);
          }
          stats.inseres++;
        } catch (e) {
          stats.erreurs.push(e.message);
        }
      }
      await sleep(DELAY);
    }
  }

  console.log(`[COIN-IMMO] Terminé — scrapes: ${stats.scrapes}, insérés: ${stats.inseres}, erreurs: ${stats.erreurs.length}`);
  return stats;
}

module.exports = { scraperImmo };
