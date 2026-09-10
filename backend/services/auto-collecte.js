// backend/services/auto-collecte.js — Collecte automatique ultra-légère pour Render (0 impact RAM)
const axios = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../models/db');
const {
  normaliserTelephoneSenegal,
  nettoyerNomBoutique,
  detecterQuartier,
  estLeadEmploiOuInvalide,
  extraireLeadsDepuisTexte,
  toTitleCase,
  nettoyerContactNom,
} = require('./prospection');

let estDesinscrit;
try {
  const ws = require('./whatsapp');
  estDesinscrit = ws.estDesinscrit;
} catch (_) {
  estDesinscrit = async () => false;
}

/**
 * 1. Collecteur OpenStreetMap / Overpass API (Dakar & Régions)
 * Pure requête HTTP REST JSON (~0.1 Mo RAM). Zéro Chromium, zéro navigateur headless.
 */
async function collecterDepuisOpenStreetMap(limite = 500) {
  let ajoutes = 0;
  let ignores = 0;
  let totalTraites = 0;
  const erreurs = [];

  try {
    // Requête Overpass élargie sur Dakar et le Sénégal (boutiques, artisans, commerces déclarés)
    const query = `[out:json][timeout:30];
(
  node["contact:phone"](12.0,-17.6,16.7,-11.3);
  node["contact:whatsapp"](12.0,-17.6,16.7,-11.3);
  node["contact:mobile"](12.0,-17.6,16.7,-11.3);
  node["phone"](12.0,-17.6,16.7,-11.3);
  way["contact:phone"](12.0,-17.6,16.7,-11.3);
  way["phone"](12.0,-17.6,16.7,-11.3);
);
out center tags ${parseInt(limite, 10) || 500};`;

    const res = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'NopalouAutoCollector/1.0 (https://nopalou.com)',
      },
      timeout: 30000,
    });

    const elements = res.data?.elements || [];
    totalTraites = elements.length;

    const leadsAInserer = [];

    for (const el of elements) {
      const tags = el.tags || {};
      const telBrut = tags['contact:whatsapp'] || tags['contact:mobile'] || tags['contact:phone'] || tags.phone;
      const nomBrut = tags.name || tags.brand || tags.operator;

      if (!telBrut || !nomBrut) {
        ignores++;
        continue;
      }

      // Normalisation du téléphone sénégalais
      const norm = normaliserTelephoneSenegal(telBrut);
      // On ne retient que les téléphones mobiles / WhatsApp (77, 78, 76, 75, 70), pas les fixes (33, 30, etc.)
      if (
        !norm.valide ||
        norm.operateur === 'Fixe' ||
        norm.operateur === 'Autre' ||
        !/^(221)?(77|78|76|75|70)/.test(norm.national)
      ) {
        ignores++;
        continue;
      }

      // Détection catégorie et quartier
      const rawCategory = tags.shop || tags.amenity || tags.craft || tags.tourism || 'commerce';
      let cat = 'mode';
      if (/phone|mobile|tech|computer|electronics/i.test(rawCategory)) cat = 'smartphones';
      else if (/bakery|supermarket|convenience|grocery|market|food/i.test(rawCategory)) cat = 'superette';
      else if (/hairdresser|beauty|cosmetics|tailor|clothes/i.test(rawCategory)) cat = 'beaute';
      else if (/hardware|doityourself|carpenter/i.test(rawCategory)) cat = 'quincaillerie';
      else if (/car|motorcycle|tyres/i.test(rawCategory)) cat = 'auto-moto';
      else if (/restaurant|cafe|fast_food/i.test(rawCategory)) cat = 'restaurant';
      else if (/pharmacy|doctors|clinic/i.test(rawCategory)) cat = 'sante';

      const ville = tags['addr:city'] || (el.lat && el.lat > 14.5 && el.lat < 15.0 && el.lon < -17.0 ? 'Dakar' : 'Sénégal');
      const quartier = tags['addr:suburb'] || tags['addr:district'] || detecterQuartier(`${nomBrut} Dakar`) || ville;
      const nomBq = toTitleCase(nettoyerNomBoutique(nomBrut, cat, quartier));

      leadsAInserer.push({
        nom: nomBq,
        tel: norm.national,
        brut: norm.brut,
        op: norm.operateur,
        cat,
        ville,
        quartier,
      });
    }

    // Insertion par blocs ultra-rapides de 30 leads (2 à 3 secondes chrono)
    const CHUNK_SIZE = 30;
    for (let i = 0; i < leadsAInserer.length; i += CHUNK_SIZE) {
      const chunk = leadsAInserer.slice(i, i + CHUNK_SIZE);
      const values = [];
      const rowsSql = chunk.map((lead, idx) => {
        const o = idx * 7;
        values.push(lead.nom, lead.tel, lead.brut, lead.op, lead.cat, lead.ville, lead.quartier);
        return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6}, $${o + 7}, 'osm_places', 'nouveau', 75, 80)`;
      });

      const queryInsert = `
        INSERT INTO prospection_leads (
          nom_boutique, telephone, telephone_brut, operateur, categorie, ville, quartier, source, statut, score, fit_score
        ) VALUES ${rowsSql.join(', ')}
        ON CONFLICT (telephone) DO NOTHING
        RETURNING id
      `;

      const ins = await pool.query(queryInsert, values);
      ajoutes += ins.rows.length;
      ignores += (chunk.length - ins.rows.length);
    }
  } catch (err) {
    erreurs.push(`OpenStreetMap: ${err.message}`);
  }

  return { source: 'osm_places', totalTraites, ajoutes, ignores, erreurs };
}

const CIBLES_DORKING = {
  mode: {
    titre: 'Vendeurs Mode & Vêtements (Instagram / TikTok / Dakar)',
    urls: [
      'https://www.expat-dakar.com/mode-beaute/dakar',
      'https://www.expat-dakar.com/vetements-homme/dakar',
      'https://www.expat-dakar.com/vetements-femme/dakar',
      'https://www.expat-dakar.com/chaussures/dakar',
      'https://www.expat-dakar.com/sacs-accessoires/dakar',
    ],
    bingQuery: 'site:instagram.com ("77" OR "78" OR "76" OR "70") ("Dakar" OR "Sénégal") ("boutique" OR "mode")',
    cat: 'mode',
  },
  smartphones: {
    titre: 'Commerces Téléphonie & High-Tech (TikTok / Instagram / Dakar)',
    urls: [
      'https://www.expat-dakar.com/telephones/dakar',
      'https://www.expat-dakar.com/ordinateurs/dakar',
      'https://www.expat-dakar.com/tablettes/dakar',
      'https://www.expat-dakar.com/accessoires-informatique/dakar',
    ],
    bingQuery: 'site:tiktok.com ("wa.me" OR "77" OR "78" OR "76") ("Dakar" OR "Sénégal") ("téléphone" OR "iphone")',
    cat: 'smartphones',
  },
  quincaillerie: {
    titre: 'Quincailleries & Matériaux (Google Maps / Dakar)',
    urls: [
      'https://www.expat-dakar.com/materiaux-outils-equipements/dakar',
      'https://www.expat-dakar.com/materiel-de-construction/dakar',
      'https://www.expat-dakar.com/bricolage-outillage/dakar',
    ],
    bingQuery: 'site:facebook.com ("quincaillerie" OR "matériaux" OR "ciment") ("Dakar" OR "Sénégal") ("77" OR "78" OR "76")',
    cat: 'quincaillerie',
  },
  grossiste: {
    titre: 'Grossistes & Importateurs Chine-Dakar (Facebook / Alibaba)',
    urls: [
      'https://www.expat-dakar.com/materiel-pro/dakar',
      'https://www.expat-dakar.com/electromenager/dakar',
      'https://www.expat-dakar.com/alimentaire-restauration/dakar',
    ],
    bingQuery: 'site:facebook.com ("arrivage" OR "grossiste") ("Chine" OR "Alibaba") ("Dakar" OR "Sénégal") ("77" OR "78" OR "76")',
    cat: 'grossiste',
  },
  beaute: {
    titre: 'Cosmétique, Beauté & Parfumerie (Instagram / Dakar)',
    urls: [
      'https://www.expat-dakar.com/parfums-produits-cosmetiques/dakar',
      'https://www.expat-dakar.com/beaute-cosmetique/dakar',
      'https://www.expat-dakar.com/soins-du-corps/dakar',
    ],
    bingQuery: 'site:instagram.com ("77" OR "78" OR "76") ("Dakar" OR "Sénégal") ("cosmétique" OR "parfum" OR "beauté")',
    cat: 'beaute',
  },
};

/**
 * 2. Collecteur Dorking & Marketplaces Automatisé (100% Gratuit, 0 Chromium, < 2 Mo RAM)
 * Aspire directement les vendeurs en ligne de Dakar (Instagram, TikTok, Facebook, Expat-Dakar)
 */
async function collecterCibleDorking(targetKey = 'all', maxPages = 2) {
  const cles = targetKey === 'all' ? Object.keys(CIBLES_DORKING) : (CIBLES_DORKING[targetKey] ? [targetKey] : Object.keys(CIBLES_DORKING));
  let ajoutes = 0;
  let ignores = 0;
  let totalTraites = 0;
  const erreurs = [];
  const regexTel = /(?:(?:\+|00)?221)?[\s.-]?(7[05678][\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|7[05678]\d{7})/g;

  const leadsAInserer = [];

  for (const k of cles) {
    const config = CIBLES_DORKING[k];
    if (!config) continue;

    // ── Source A : Annonces et boutiques Expat-Dakar par catégorie ───────────
    for (const baseUrl of config.urls) {
      for (let p = 1; p <= maxPages; p++) {
        try {
          const res = await axios.get(`${baseUrl}?page=${p}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'fr-FR,fr;q=0.9',
            },
            timeout: 10000,
          });

          const $ = cheerio.load(res.data);
          $('.listing-card').each((_, el) => {
            const card = $(el);
            const rawTitle = card.find('.listing-card__header__title').text().trim() || card.find('h2, h3, a.listing-card__inner').text().trim();
            const rawLoc = card.find('.listing-card__header__location').text().trim().replace(/\s+/g, ' ');
            const cardText = card.text();
            const pMatch = cardText.match(regexTel);

            if (pMatch && pMatch.length > 0) {
              totalTraites++;
              const norm = normaliserTelephoneSenegal(pMatch[0]);
              if (
                norm.valide &&
                norm.operateur !== 'Fixe' &&
                norm.operateur !== 'Autre' &&
                /^(221)?(77|78|76|75|70)/.test(norm.national)
              ) {
                const quartier = detecterQuartier(`${rawTitle} ${rawLoc}`) || (rawLoc ? rawLoc.split(',')[0].trim() : 'Dakar');
                const nomBq = toTitleCase(nettoyerNomBoutique(rawTitle || 'Boutique Dakar', config.cat, quartier));

                leadsAInserer.push({
                  nom: nomBq,
                  tel: norm.national,
                  brut: norm.brut,
                  op: norm.operateur,
                  cat: config.cat,
                  ville: 'Dakar',
                  quartier: quartier || 'Dakar',
                  source: 'dorking_auto',
                });
              } else {
                ignores++;
              }
            }
          });
        } catch (e) {
          // Continue silencieusement si la page est absente
        }
      }
    }

    // ── Source B : Dorking Bing (Instagram / TikTok / Facebook) sans clé ────
    try {
      const resBing = await axios.get('https://www.bing.com/search', {
        params: { q: config.bingQuery, count: 50 },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(resBing.data);
      $('li.b_algo').each((_, el) => {
        const item = $(el);
        const title = item.find('h2').text().trim();
        const snippet = item.find('.b_caption p').text().trim();
        const fullTxt = `${title} ${snippet}`;
        const pMatch = fullTxt.match(regexTel);

        if (pMatch && pMatch.length > 0) {
          totalTraites++;
          const norm = normaliserTelephoneSenegal(pMatch[0]);
          if (
            norm.valide &&
            norm.operateur !== 'Fixe' &&
            norm.operateur !== 'Autre' &&
            /^(221)?(77|78|76|75|70)/.test(norm.national)
          ) {
            const nomBq = toTitleCase(nettoyerNomBoutique(title || 'Vendeur Réseau Social', config.cat, 'Dakar'));
            leadsAInserer.push({
              nom: nomBq,
              tel: norm.national,
              brut: norm.brut,
              op: norm.operateur,
              cat: config.cat,
              ville: 'Dakar',
              quartier: 'Dakar',
              source: 'dorking_auto',
            });
          } else {
            ignores++;
          }
        }
      });
    } catch (eBing) {
      // Ignorer si Bing rate
    }
  }

  // Insertion par blocs ultra-rapides de 30 leads avec ON CONFLICT DO NOTHING
  const CHUNK_SIZE = 30;
  for (let i = 0; i < leadsAInserer.length; i += CHUNK_SIZE) {
    const chunk = leadsAInserer.slice(i, i + CHUNK_SIZE);
    const values = [];
    const rowsSql = chunk.map((lead, idx) => {
      const o = idx * 7;
      values.push(lead.nom, lead.tel, lead.brut, lead.op, lead.cat, lead.ville, lead.quartier);
      return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6}, $${o + 7}, 'dorking_auto', 'nouveau', 80, 85)`;
    });

    try {
      const queryInsert = `
        INSERT INTO prospection_leads (
          nom_boutique, telephone, telephone_brut, operateur, categorie, ville, quartier, source, statut, score, fit_score
        ) VALUES ${rowsSql.join(', ')}
        ON CONFLICT (telephone) DO NOTHING
        RETURNING id
      `;

      const ins = await pool.query(queryInsert, values);
      ajoutes += ins.rows.length;
      ignores += (chunk.length - ins.rows.length);
    } catch (dbErr) {
      erreurs.push(`Batch insert: ${dbErr.message}`);
    }
  }

  return { source: 'dorking_auto', target: targetKey, totalTraites, ajoutes, ignores, erreurs };
}

/**
 * 3. Lanceur Unifié d'Auto-Collecte sans impact mémoire Render
 */
async function lancerAutoCollecte(options = {}) {
  const { source = 'all', target = 'all' } = options;
  const debut = Date.now();
  const memAvant = process.memoryUsage().heapUsed / 1024 / 1024;

  const resultats = {
    totalAjoutes: 0,
    totalIgnores: 0,
    sources: [],
    dureeMs: 0,
    ramDeltaMb: 0,
  };

  // 1. Aspiration Dorking & Réseaux Sociaux / Marketplaces
  if (source === 'all' || source === 'dorking' || target !== 'all') {
    const resDorking = await collecterCibleDorking(target === 'all' ? (source === 'dorking' ? 'all' : 'all') : target, 2);
    resultats.totalAjoutes += resDorking.ajoutes;
    resultats.totalIgnores += resDorking.ignores;
    resultats.sources.push(resDorking);
  }

  // 2. Aspiration OpenStreetMap Places (si demandé ou en mode global)
  if ((source === 'all' || source === 'osm') && target === 'all') {
    const resOsm = await collecterDepuisOpenStreetMap(300);
    resultats.totalAjoutes += resOsm.ajoutes;
    resultats.totalIgnores += resOsm.ignores;
    resultats.sources.push(resOsm);
  }

  const memApres = process.memoryUsage().heapUsed / 1024 / 1024;
  resultats.dureeMs = Date.now() - debut;
  resultats.ramDeltaMb = Number(Math.max(0, memApres - memAvant).toFixed(2));

  return resultats;
}

module.exports = {
  collecterDepuisOpenStreetMap,
  collecterCibleDorking,
  lancerAutoCollecte,
  CIBLES_DORKING,
};

