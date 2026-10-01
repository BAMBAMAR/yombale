// backend/services/scraper-immo-coinafrique.js
// Scrape les annonces immobilières sur sn.coinafrique.com
// Sélecteurs vérifiés sur le site réel (juin 2026)
const axios   = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../models/db');
const { RunCollecte, noterRequeteCourante } = require('../lib/scrapingRun');

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

// AUD-179 : nouvelles tentatives sur les erreurs transitoires (5xx, 429, réseau) ; 403 et 404 ne sont jamais insistés.
async function fetchPage(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
        timeout: 30000,
      });
      noterRequeteCourante(res.status || 200);
      return cheerio.load(res.data);
    } catch (err) {
      const status = err.response?.status;
      noterRequeteCourante(status || err.code || 'none');
      const transitoire = !status || status >= 500 || status === 429;
      if (!transitoire || i === retries) throw err;
      await sleep(status === 429 ? 12000 * (i + 1) : 4000 * (i + 1));
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
  const clean = txt.replace(/location_on/gi, '').replace(/,\s*Sénégal/gi, '').trim();
  if (/cfa/i.test(clean) || /^\d[\d\s]*$/.test(clean) || /\d{3,}/.test(clean)) {
    return { ville: 'Dakar', quartier: null };
  }
  const VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack',
                  'Mbour', 'Touba', 'Diourbel', 'Louga', 'Kolda', 'Tambacounda'];
  for (const v of VILLES) {
    if (clean.toLowerCase().includes(v.toLowerCase())) {
      const parts = clean.split(',');
      const quartier = parts.length > 1 ? parts[0].trim() : (clean.toLowerCase() === v.toLowerCase() ? null : clean);
      const cleanQuartier = (quartier && !/cfa|\d{3,}/i.test(quartier)) ? quartier : null;
      return { ville: v, quartier: cleanQuartier };
    }
  }
  const validQuartier = (!/cfa|\d{3,}/i.test(clean)) ? clean : null;
  return { ville: 'Dakar', quartier: validQuartier };
}

async function extraireContactDetail(url) {
  if (!url) return { contact_tel: null, contact_nom: null, description: null };
  try {
    const $ = await fetchPage(url);
    if (!$) return { contact_tel: null, contact_nom: null, description: null };

    // Téléphone : a[href^="tel:"] ou whatsapp
    let phone = null;
    const telHref = $('a[href^="tel:"]').first().attr('href');
    if (telHref) {
      phone = telHref.replace(/^tel:/, '').trim();
    } else {
      const waHref = $('a[href*="wa.me"], a[href*="whatsapp"]').first().attr('href');
      if (waHref) {
        const m = waHref.match(/(?:\+|phone=)(\d{9,15})/);
        if (m) phone = '+' + m[1];
      }
    }

    // Nom annonceur : .username
    const nom = $('.username').first().text().trim() || null;

    // Description complète
    const description = $('.ad__info-description').first().text().trim() || null;

    return { contact_tel: phone, contact_nom: nom, description };
  } catch (err) {
    if (err.response?.status === 404) throw err;
    return { contact_tel: null, contact_nom: null, description: null };
  }
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

      // Localisation : cibler directement .ad__card-location et exclure les prix
      const locEl  = $el.find('.ad__card-location, [class*="location"], [class*="city"]').first();
      const locTxt = locEl.length ? locEl.text().trim() : '';
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
    throw err; // AUD-179 : l'erreur n'est plus confondue avec une page vide ; scraperImmo la compte
  }
  return annonces;
}

// AUD-175 : un re-scrape ne modifie JAMAIS le statut d'une annonce déjà connue (publiée ou rejetée). Une annonce
// nouvelle sans téléphone direct naît inactive avec le motif `a_completer` (rejete reste vrai pour ne pas encombrer la
// file de modération « en attente » de l'administration) ; elle est activée plus tard, et seulement alors, si un
// téléphone et un prix sont obtenus (motif `a_completer` ou ancien motif de rejet automatique).
const MOTIF_A_COMPLETER = 'a_completer';
const ANCIEN_MOTIF_AUTO = 'Données scrapées sans contact téléphonique direct ou sans prix';

async function upsertAnnonce(a) {
  const isActif = Boolean(a.contact_tel && a.contact_tel.length >= 7 && a.prix && a.prix > 0);
  const motifRejet = !isActif ? MOTIF_A_COMPLETER : null;

  await pool.query(`
    INSERT INTO annonces_immo
      (titre, type_bien, transaction, prix, surface_m2, nb_pieces, nb_chambres,
       ville, quartier, description, photos, url_source, source, ref_externe, meuble,
       contact_nom, contact_tel, actif, rejete, motif_rejet)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
    DO UPDATE SET
      titre       = EXCLUDED.titre,
      prix        = CASE WHEN EXCLUDED.prix IS NOT NULL THEN EXCLUDED.prix WHEN annonces_immo.prix < 10000 THEN NULL ELSE annonces_immo.prix END,
      photos      = CASE WHEN jsonb_array_length(EXCLUDED.photos) > 0
                         THEN EXCLUDED.photos ELSE annonces_immo.photos END,
      meuble      = EXCLUDED.meuble,
      nb_pieces   = COALESCE(EXCLUDED.nb_pieces, annonces_immo.nb_pieces),
      quartier    = COALESCE(EXCLUDED.quartier, annonces_immo.quartier),
      ville       = COALESCE(EXCLUDED.ville, annonces_immo.ville),
      description = COALESCE(EXCLUDED.description, annonces_immo.description),
      contact_nom = COALESCE(EXCLUDED.contact_nom, annonces_immo.contact_nom),
      contact_tel = COALESCE(EXCLUDED.contact_tel, annonces_immo.contact_tel),
      actif       = CASE WHEN EXCLUDED.actif AND annonces_immo.motif_rejet IN ('${MOTIF_A_COMPLETER}', '${ANCIEN_MOTIF_AUTO}')
                         THEN true ELSE annonces_immo.actif END,
      rejete      = CASE WHEN EXCLUDED.actif AND annonces_immo.motif_rejet IN ('${MOTIF_A_COMPLETER}', '${ANCIEN_MOTIF_AUTO}')
                         THEN false ELSE annonces_immo.rejete END,
      motif_rejet = CASE WHEN EXCLUDED.actif AND annonces_immo.motif_rejet IN ('${MOTIF_A_COMPLETER}', '${ANCIEN_MOTIF_AUTO}')
                         THEN NULL ELSE annonces_immo.motif_rejet END,
      updated_at  = NOW()
  `, [
    a.titre, a.type_bien, a.transaction, a.prix || null, null,
    a.nb_pieces || null, null, a.ville, a.quartier || null,
    a.description || null, JSON.stringify(a.photos || []), a.url_source, a.source,
    a.ref_externe, a.meuble || false, a.contact_nom || null, a.contact_tel || null,
    isActif, !isActif, motifRejet
  ]);
}
async function scraperImmo(options = {}) {
  const run = new RunCollecte({ source: 'coinafrique', systeme: 'immo', categoriesCibles: SECTIONS.length });
  return run.executer(() => scraperImmoMesure(options, run));
}

// AUD-179 / AUD-173 : une erreur HTTP est comptée (jamais « page vide ») ; le passage est évalué et persisté par RunCollecte.
async function scraperImmoMesure({ dryRun = false } = {}, run) {
  const stats = { scrapes: 0, inseres: 0, ignores: 0, erreurs: [], dryRun };
  let erreursUpsert = 0;

  const cloturer = async () => {
    if (dryRun) return;
    const verdict = await run.cloturer(pool, { itemsExtraits: stats.scrapes, itemsInseres: stats.inseres, itemsFiltres: stats.ignores, erreursSauvegarde: erreursUpsert });
    stats.statut = verdict.statut;
    stats.motifs = verdict.motifs;
  };

  // Test de connectivité rapide
  try {
    const rep = await axios.get(`${BASE}/categorie/immobilier`, {
      headers: { 'User-Agent': UA }, timeout: 15000,
    });
    noterRequeteCourante(rep.status || 200);
  } catch (err) {
    const status = err.response?.status;
    noterRequeteCourante(status || err.code || 'none');
    if (status === 502 || status === 503 || status === 504 || err.code === 'ECONNABORTED') {
      console.warn(`[COIN-IMMO] Site indisponible (${status || err.code}) — sync ignorée`);
      stats.erreurs.push(`Site indisponible: ${status || err.code}`);
      await cloturer(); // le passage « echec » est enregistré (et alerté s'il se répète)
      return stats;
    }
  }

  for (const sec of SECTIONS) {
    let totalSection = 0;
    for (let pg = 1; pg <= 5; pg++) {
      const url = pg === 1 ? `${BASE}${sec.path}` : `${BASE}${sec.path}?page=${pg}`;
      console.log(`[COIN-IMMO] ${url}`);

      let annonces;
      try {
        annonces = await scraperPage(url, sec.type_bien);
      } catch (err) {
        const st = err.response?.status;
        if (st === 404 && pg > 1) break; // fin de pagination
        stats.erreurs.push(`${sec.path} page ${pg}: ${st || err.code || err.message}`);
        break; // après les nouvelles tentatives de fetchPage
      }

      if (!annonces.length) {
        console.log(`[COIN-IMMO] Page vide → arrêt ${sec.path}`);
        break;
      }

      totalSection += annonces.length;
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
          erreursUpsert++;
        }
      }

      await sleep(DELAY);
    }
    run.noterCategorie(sec.path, totalSection);
  }

  console.log(`[COIN-IMMO ${dryRun ? 'DRY' : 'RÉEL'}] scrapes: ${stats.scrapes}, insérés: ${stats.inseres}, ignorés: ${stats.ignores}, erreurs: ${stats.erreurs.length}`);
  await cloturer();
  return stats;
}
module.exports = {
  scraperImmo,
  extraireContactDetail,
  upsertAnnonce,
  parseLocalisation,
  extractNbPieces,
  raffinerTypeBien,
  typeBienFromUrl,
  transactionFromUrl,
};
