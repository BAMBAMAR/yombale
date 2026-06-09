// backend/services/scraper-immo-expat.js
// Scrape les annonces immobilières sur expat-dakar.com
// URLs et sélecteurs vérifiés sur le site réel (juin 2026)
const axios   = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../models/db');

const BASE  = 'https://www.expat-dakar.com';
const DELAY = 1500;

// URLs réelles vérifiées
const SECTIONS = [
  { path: '/appartements-a-louer',            type_bien: 'appartement', transaction: 'location' },
  { path: '/appartements-meubles',            type_bien: 'appartement', transaction: 'location' },
  { path: '/maisons-a-louer',                 type_bien: 'maison',      transaction: 'location' },
  { path: '/chambres-a-louer',                type_bien: 'chambre',     transaction: 'location' },
  { path: '/proprietes-commerciales-a-louer', type_bien: 'bureau',      transaction: 'location' },
  { path: '/appartements-a-vendre',           type_bien: 'appartement', transaction: 'vente'    },
  { path: '/maisons-a-vendre',                type_bien: 'maison',      transaction: 'vente'    },
  { path: '/terrains-a-vendre',               type_bien: 'terrain',     transaction: 'vente'    },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Si SCRAPER_PROXY_URL est défini (ex: ScraperAPI), l'utiliser pour contourner les blocages IP
// ScraperAPI : http://api.scraperapi.com?api_key=VOTRE_CLE&url=<URL>
function proxyUrl(url) {
  const proxy = process.env.SCRAPER_PROXY_URL;
  if (!proxy) return url;
  return `${proxy}${encodeURIComponent(url)}`;
}

async function fetchPage(url) {
  const target = proxyUrl(url);
  const res = await axios.get(target, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
    timeout: 30000,
    maxRedirects: 5,
  });
  return cheerio.load(res.data);
}

function parsePrix(txt) {
  if (!txt) return null;
  const clean = txt.replace(/[^0-9]/g, '');
  const v = parseInt(clean, 10);
  return (v > 0 && v < 999_000_000) ? v : null;
}

function parseNbChambres(txt) {
  if (!txt) return null;
  const m = txt.match(/(\d+)\s*chambre/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseSurfaceTitre(titre) {
  if (!titre) return null;
  const m = titre.match(/(\d+)\s*m[²2]/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseLocalisation(txt) {
  if (!txt) return { ville: 'Dakar', quartier: null };
  const t = txt.trim();
  const VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack',
                  'Mbour', 'Touba', 'Diourbel', 'Louga', 'Kolda'];
  for (const v of VILLES) {
    if (t.toLowerCase().includes(v.toLowerCase())) {
      // "Parcelles Assainies, Dakar" → quartier = "Parcelles Assainies"
      const parts = t.split(',');
      const quartier = parts.length > 1 ? parts[0].trim() : t;
      return { ville: v, quartier };
    }
  }
  return { ville: 'Dakar', quartier: t };
}

async function scraperPage(url, type_bien, transaction) {
  const annonces = [];
  try {
    const $ = await fetchPage(url);

    $('.listing-card').each((_, el) => {
      const $el = $(el);

      // Sélecteurs exacts vérifiés
      const titre   = $el.find('.listing-card__header__title').first().text().trim();
      if (!titre) return;

      const prixTxt = $el.find('.listing-card__info-bar__price').first().text().trim()
                   || $el.find('.listing-card__price').first().text().trim();

      const locTxt  = $el.find('.listing-card__header__location').first().text().trim();

      // Nb chambres dans les tags (ex: "1 chambre", "3 pièces")
      const tagsTxt = $el.find('.listing-card__header__tags').text();
      const nbCh    = parseNbChambres(tagsTxt);

      // Image : src direct
      const img     = $el.find('img').first();
      const photo   = img.attr('src') || img.attr('data-src') || null;

      // Lien vers l'annonce
      const href    = $el.find('a[href*="/annonce/"]').first().attr('href')
                   || $el.closest('a').attr('href') || '';
      const urlAnn  = href.startsWith('http') ? href : BASE + href;

      // Référence externe = ID numérique dans l'URL
      const refM    = urlAnn.match(/-(\d{5,})\/?$/);
      const ref_ext = refM ? 'expat-' + refM[1] : null;

      const loc     = parseLocalisation(locTxt);

      annonces.push({
        titre,
        type_bien,
        transaction,
        prix:        parsePrix(prixTxt),
        surface_m2:  parseSurfaceTitre(titre),
        nb_chambres: nbCh,
        ville:       loc.ville,
        quartier:    loc.quartier,
        photos:      (photo && !photo.includes('placeholder')) ? [photo] : [],
        url_source:  urlAnn,
        source:      'expat-dakar',
        ref_externe: ref_ext,
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
    a.titre, a.type_bien, a.transaction, a.prix || null, a.surface_m2 || null,
    null, a.nb_chambres || null, a.ville, a.quartier || null, null,
    JSON.stringify(a.photos || []), a.url_source, a.source, a.ref_externe,
  ]);
}

async function scraperImmo({ dryRun = false } = {}) {
  const stats = { scrapes: 0, inseres: 0, ignores: 0, erreurs: [], dryRun };

  for (const sec of SECTIONS) {
    for (let pg = 1; pg <= 5; pg++) {
      // Expat-Dakar : pagination via ?page=N
      const url = pg === 1
        ? `${BASE}${sec.path}`
        : `${BASE}${sec.path}?page=${pg}`;

      console.log(`[EXPAT-IMMO] ${url}`);
      const annonces = await scraperPage(url, sec.type_bien, sec.transaction);

      if (!annonces.length) {
        console.log(`[EXPAT-IMMO] Page vide → arrêt section ${sec.path}`);
        break;
      }

      stats.scrapes += annonces.length;

      for (const a of annonces) {
        if (!a.titre) { stats.ignores++; continue; }
        try {
          if (dryRun) {
            console.log(`  [DRY] ${a.titre} | ${a.prix ? a.prix + ' F' : 'prix?'} | ${a.ville}${a.quartier ? ' / ' + a.quartier : ''}`);
          } else {
            await upsertAnnonce(a);
          }
          stats.inseres++;
        } catch (e) {
          console.warn(`  Erreur upsert: ${e.message}`);
          stats.erreurs.push(e.message);
        }
      }

      await sleep(DELAY);
    }
  }

  console.log(`[EXPAT-IMMO ${dryRun ? 'DRY' : 'RÉEL'}] scrapes: ${stats.scrapes}, insérés: ${stats.inseres}, ignorés: ${stats.ignores}, erreurs: ${stats.erreurs.length}`);
  return stats;
}

module.exports = { scraperImmo };
