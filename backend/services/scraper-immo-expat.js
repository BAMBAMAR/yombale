// backend/services/scraper-immo-expat.js
// Scrape les annonces de location immobilière sur expat-dakar.com
// Catégories : locations-appartements, locations-villas, locations-maisons,
//              locations-chambres-studios, locations-bureaux-commerces-et-entrepots
const axios   = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../models/db');

const BASE  = 'https://www.expat-dakar.com';
const DELAY = 1500; // ms entre requêtes

const SECTIONS = [
  { path: '/locations-appartements',              type_bien: 'appartement',  transaction: 'location' },
  { path: '/locations-villas',                    type_bien: 'villa',        transaction: 'location' },
  { path: '/locations-maisons',                   type_bien: 'maison',       transaction: 'location' },
  { path: '/locations-chambres-studios',          type_bien: 'studio',       transaction: 'location' },
  { path: '/locations-bureaux-commerces',         type_bien: 'bureau',       transaction: 'location' },
  { path: '/ventes-appartements',                 type_bien: 'appartement',  transaction: 'vente'    },
  { path: '/ventes-villas',                       type_bien: 'villa',        transaction: 'vente'    },
  { path: '/ventes-terrains',                     type_bien: 'terrain',      transaction: 'vente'    },
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

function parseNombre(txt) {
  if (!txt) return null;
  const m = txt.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function parseSurface(txt) {
  if (!txt) return null;
  const m = txt.match(/(\d+)\s*m/i);
  return m ? parseInt(m[1], 10) : null;
}

// Extrait quartier/ville à partir du titre ou du lieu affiché
function parseLocalisation(txt) {
  if (!txt) return { ville: 'Dakar', quartier: null };
  const t = txt.trim();
  const VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack',
                  'Mbour', 'Touba', 'Diourbel', 'Louga', 'Kolda', 'Tambacounda'];
  for (const v of VILLES) {
    if (t.toLowerCase().includes(v.toLowerCase())) {
      return { ville: v, quartier: t };
    }
  }
  return { ville: 'Dakar', quartier: t };
}

async function scraperPage(url, type_bien, transaction) {
  const annonces = [];
  try {
    const $ = await fetchPage(url);

    // Expat-Dakar liste ses annonces dans .listings-cards ou .listing-card
    $('.listing-card, .listings-cards .card, article.listing').each((_, el) => {
      const $el = $(el);

      const titre = $el.find('.listing-card__header__title, h3.title, .title').first().text().trim();
      if (!titre) return;

      const prixTxt   = $el.find('.listing-card__header__price, .price').first().text();
      const locTxt    = $el.find('.listing-card__header__location, .location').first().text().trim();
      const surfaceTxt= $el.find('.listing-card__details .surface, [class*="surface"]').first().text();
      const piecesTxt = $el.find('[class*="rooms"], [class*="pieces"]').first().text();
      const chambresTxt= $el.find('[class*="bedrooms"], [class*="chambres"]').first().text();

      const href = $el.find('a').first().attr('href') || '';
      const urlAnnonce = href.startsWith('http') ? href : BASE + href;

      // Référence externe = slug de l'URL
      const refMatch = urlAnnonce.match(/\/(\d+)\/?$/);
      const ref_externe = refMatch ? 'expat-' + refMatch[1] : null;

      const photo = $el.find('img').first().attr('data-src')
                 || $el.find('img').first().attr('src') || null;

      const loc = parseLocalisation(locTxt);

      annonces.push({
        titre,
        type_bien,
        transaction,
        prix:        parsePrix(prixTxt),
        surface_m2:  parseSurface(surfaceTxt),
        nb_pieces:   parseNombre(piecesTxt),
        nb_chambres: parseNombre(chambresTxt),
        ville:       loc.ville,
        quartier:    loc.quartier,
        photos:      photo ? [photo] : [],
        url_source:  urlAnnonce,
        source:      'expat-dakar',
        ref_externe,
      });
    });
  } catch (err) {
    console.warn(`[EXPAT-IMMO] Erreur page ${url}: ${err.message}`);
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
    a.titre, a.type_bien, a.transaction, a.prix, a.surface_m2,
    a.nb_pieces, a.nb_chambres, a.ville, a.quartier || null,
    a.description || null, JSON.stringify(a.photos || []),
    a.url_source, a.source, a.ref_externe,
  ]);
}

async function scraperImmo({ dryRun = false } = {}) {
  const stats = { scrapes: 0, inseres: 0, erreurs: [], dryRun };

  for (const sec of SECTIONS) {
    // Scraper les 3 premières pages de chaque section
    for (let pg = 1; pg <= 3; pg++) {
      const url = `${BASE}${sec.path}?page=${pg}`;
      console.log(`[EXPAT-IMMO] ${url}`);

      const annonces = await scraperPage(url, sec.type_bien, sec.transaction);
      stats.scrapes += annonces.length;

      if (!annonces.length) break; // Fin de pagination

      for (const a of annonces) {
        if (!a.prix && !a.titre) continue;
        try {
          if (dryRun) {
            console.log('[EXPAT-IMMO DRY]', a.titre, a.prix, a.ville);
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

  console.log(`[EXPAT-IMMO] Terminé — scrapes: ${stats.scrapes}, insérés: ${stats.inseres}, erreurs: ${stats.erreurs.length}`);
  return stats;
}

module.exports = { scraperImmo };
