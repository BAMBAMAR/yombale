// backend/services/scraper-immo-coinafrique.js
// Scrape les annonces immobilières sur sn.coinafrique.com
// Sélecteurs vérifiés sur le site réel (juin 2026)
const axios   = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../models/db');

const BASE  = 'https://sn.coinafrique.com';
const DELAY = 3000; // CoinAfrique est lent — respecter un délai plus long

// CoinAfrique utilise /categorie/ (français) et mélange location+vente sur chaque page
// On détecte le type de transaction depuis l'URL du slug
const SECTIONS = [
  { path: '/categorie/appartements',        type_bien: 'appartement' },
  { path: '/categorie/appartements-meubles',type_bien: 'appartement_meuble' },
  { path: '/categorie/villas',              type_bien: 'villa'       },
  { path: '/categorie/chambres',            type_bien: 'chambre'     },
  { path: '/categorie/terrains',            type_bien: 'terrain'     },
  { path: '/categorie/terrains-agricoles',  type_bien: 'terrain'     },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
        timeout: 30000,
      });
      return cheerio.load(res.data);
    } catch (err) {
      const status = err.response?.status;
      if ((status === 502 || status === 503 || status === 504) && i < retries) {
        await sleep(4000); continue;
      }
      throw err;
    }
  }
}

// Détecte location/vente depuis le slug de l'URL
// ex: /annonce/appartements/vente-appartement-xxx → 'vente'
//     /annonce/appartements/location-appartement-xxx → 'location'
function transactionFromUrl(url) {
  if (url.includes('/vente-') || url.includes('-a-vendre')) return 'vente';
  return 'location';
}

// Type bien depuis l'URL path (/annonce/{type}/...)
function typeBienFromUrl(url, defaut) {
  const m = url.match(/\/annonce\/([^/]+)\//);
  if (!m) return defaut;
  const slug = m[1];
  if (slug.includes('villa'))       return 'villa';
  if (slug.includes('terrain'))     return 'terrain';
  if (slug.includes('studio'))      return 'studio';
  if (slug.includes('chambre'))     return 'chambre';
  if (slug.includes('bureau'))      return 'bureau';
  if (slug.includes('immeuble'))    return 'maison';
  if (slug.includes('appartement')) return 'appartement';
  if (slug.includes('maison'))      return 'maison';
  return defaut;
}

// Affine le type_bien en croisant catégorie source + mots-clés du titre.
// Les annonceurs publient souvent studios/chambres sous "Appartements" sur coinafrique.
function raffinerTypeBien(type_bien, titre) {
  const t = (titre || '').toLowerCase();
  if (type_bien === 'chambre') return /meub/i.test(t) ? 'chambre_meuble' : 'chambre';
  if (type_bien === 'appartement' || type_bien === 'appartement_meuble') {
    if (/\bstudio\b/.test(t)) return 'studio';
    if (/\bchambre[s]?\b/.test(t) && !/\bappart(?:ement)?\b/.test(t))
      return /meub/i.test(t) ? 'chambre_meuble' : 'chambre';
  }
  return type_bien;
}

// Extrait le nombre de pièces depuis le titre
// ex: "Appartement F3", "2 pièces", "T4", "studio" → 1
function extractNbPieces(titre) {
  if (!titre) return null;
  const t = titre.toLowerCase();
  if (/\bstudio\b/.test(t)) return 1;
  let m = t.match(/\b[ft](\d)\b/);
  if (m) return parseInt(m[1], 10);
  m = t.match(/(\d+)\s*pi[eè]ce/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function parseLocalisation(txt) {
  if (!txt) return { ville: 'Dakar', quartier: null };
  const VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack',
                  'Mbour', 'Touba', 'Diourbel', 'Louga', 'Kolda', 'Tambacounda'];
  const t = txt.trim();
  for (const v of VILLES) {
    if (t.toLowerCase().includes(v.toLowerCase())) {
      return { ville: v, quartier: t };
    }
  }
  return { ville: 'Dakar', quartier: t };
}

async function scraperPage(url, type_bien_defaut) {
  const annonces = [];
  try {
    const $ = await fetchPage(url);

    // Container: .col.s6.m4.l3 avec .ad__card à l'intérieur
    // Exclure le carousel top-ads
    $('.col.s6.m4.l3').not('.swiper-slide').each((_, el) => {
      const $el = $(el);

      // Lien vers l'annonce
      const lienEl = $el.find('.ad__card-image, a[href*="/annonce/"]').first();
      const href   = lienEl.attr('href') || '';
      if (!href) return;
      const urlAnn = href.startsWith('http') ? href : BASE + href;

      // Titre : depuis l'attribut title ou alt de l'image
      const titre = lienEl.attr('title')
                 || $el.find('img').first().attr('alt')
                 || $el.find('[class*="title"], h2, h3').first().text().trim()
                 || '';
      if (!titre) return;

      // Prix : data-ad-price sur .card-fav ou .ad__card-price
      const prixRaw = $el.find('[data-ad-price]').attr('data-ad-price')
                   || $el.find('[class*="price"]').first().text();
      const prixV = prixRaw ? parseInt(String(prixRaw).replace(/[^0-9]/g,''), 10) : 0;
      const prix = (prixV >= 10_000 && prixV < 999_000_000) ? prixV : null;

      // Image : img.ad__card-img avec src direct
      const img = $el.find('img.ad__card-img, img').first();
      const photo = img.attr('src') || img.attr('data-src') || null;

      // Localisation : dans le texte de la carte ou depuis le slug
      const locTxt = $el.find('[class*="location"], [class*="city"], [class*="place"], p').first().text().trim()
                  || $el.find('.card-content p').first().text().trim();
      const loc    = parseLocalisation(locTxt);

      // Référence externe : ID numérique en fin de slug, ou hash URL en secours pour éviter les doublons
      const refM   = urlAnn.match(/-(\d{5,})\/?(?:\?|$)/);
      const ref_ext = refM
        ? `coin-${refM[1]}`
        : `coin-u-${Buffer.from(urlAnn).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 16)}`;

      // Transaction : depuis l'URL
      const transaction = transactionFromUrl(urlAnn);
      const type_bien   = raffinerTypeBien(typeBienFromUrl(urlAnn, type_bien_defaut), titre);

      const titreTrim = titre.trim();
      annonces.push({
        titre:       titreTrim,
        type_bien,
        transaction,
        prix:        prix && prix > 0 && prix < 999_000_000 ? prix : null,
        ville:       loc.ville,
        quartier:    loc.quartier,
        photos:      (photo && !photo.includes('placeholder')) ? [photo] : [],
        url_source:  urlAnn,
        source:      'coinafrique',
        ref_externe: ref_ext,
        meuble:      type_bien.includes('meuble'),
        nb_pieces:   extractNbPieces(titreTrim),
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
       ville, quartier, description, photos, url_source, source, ref_externe, meuble)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15)
    ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
    DO UPDATE SET
      titre      = EXCLUDED.titre,
      prix       = COALESCE(EXCLUDED.prix, annonces_immo.prix),
      photos     = CASE WHEN jsonb_array_length(EXCLUDED.photos) > 0
                        THEN EXCLUDED.photos ELSE annonces_immo.photos END,
      meuble     = EXCLUDED.meuble,
      nb_pieces  = COALESCE(EXCLUDED.nb_pieces, annonces_immo.nb_pieces),
      actif      = true,
      updated_at = NOW()
  `, [
    a.titre, a.type_bien, a.transaction, a.prix || null, null,
    a.nb_pieces || null, null, a.ville, a.quartier || null, null,
    JSON.stringify(a.photos || []), a.url_source, a.source, a.ref_externe,
    a.meuble || false,
  ]);
}

async function scraperImmo({ dryRun = false } = {}) {
  const stats = { scrapes: 0, inseres: 0, ignores: 0, erreurs: [], dryRun };

  // Test de connectivité rapide
  try {
    await axios.get(`${BASE}/categorie/immobilier`, {
      headers: { 'User-Agent': UA }, timeout: 15000,
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 502 || status === 503 || status === 504 || err.code === 'ECONNABORTED') {
      console.warn(`[COIN-IMMO] Site indisponible (${status || err.code}) — sync ignorée`);
      stats.erreurs.push(`Site indisponible: ${status || err.code}`);
      return stats;
    }
  }

  for (const sec of SECTIONS) {
    for (let pg = 1; pg <= 5; pg++) {
      const url = pg === 1 ? `${BASE}${sec.path}` : `${BASE}${sec.path}?page=${pg}`;
      console.log(`[COIN-IMMO] ${url}`);

      const annonces = await scraperPage(url, sec.type_bien);

      if (!annonces.length) {
        console.log(`[COIN-IMMO] Page vide → arrêt ${sec.path}`);
        break;
      }

      stats.scrapes += annonces.length;

      for (const a of annonces) {
        if (!a.titre) { stats.ignores++; continue; }
        try {
          if (dryRun) {
            console.log(`  [DRY] ${a.titre} | ${a.prix ? a.prix + ' F' : 'prix?'} | ${a.transaction} | ${a.ville}${a.quartier ? ' / ' + a.quartier.slice(0,30) : ''}`);
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

  console.log(`[COIN-IMMO ${dryRun ? 'DRY' : 'RÉEL'}] scrapes: ${stats.scrapes}, insérés: ${stats.inseres}, ignorés: ${stats.ignores}, erreurs: ${stats.erreurs.length}`);
  return stats;
}

module.exports = { scraperImmo };
