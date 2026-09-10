// backend/services/auto-collecte.js — Collecte automatique ultra-légère pour Render (0 impact RAM)
const axios = require('axios');
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

/**
 * 2. Collecteur Dorking SERP API (Instagram, TikTok, Facebook)
 * Pure requête HTTP REST JSON (~0.2 Mo RAM).
 * Fonctionne avec Serper API (ou toute SERP API compatible Google).
 */
async function collecterDepuisDorkingApi() {
  const serperKey = process.env.SERPER_API_KEY || process.env.SERP_API_KEY;
  if (!serperKey) {
    return {
      source: 'dorking_api',
      active: false,
      message: 'SERPER_API_KEY non configurée dans les variables d\'environnement. Renseignez la clé gratuite pour activer la collecte Google/Instagram/TikTok.',
      ajoutes: 0,
      totalTraites: 0,
    };
  }

  let ajoutes = 0;
  let ignores = 0;
  let totalTraites = 0;
  const erreurs = [];

  const requetesDorking = [
    { query: 'site:instagram.com ("77" OR "78" OR "76" OR "70") ("Dakar" OR "Sénégal") ("boutique" OR "mode" OR "livraison")', cat: 'mode' },
    { query: 'site:tiktok.com ("wa.me" OR "77" OR "78" OR "76") ("Dakar" OR "Sénégal") ("téléphone" OR "iphone" OR "accessoires")', cat: 'smartphones' },
    { query: 'site:facebook.com ("arrivage" OR "grossiste") ("Chine" OR "Alibaba") ("Dakar" OR "Sénégal") ("77" OR "78" OR "76")', cat: 'grossiste' },
    { query: 'site:instagram.com ("77" OR "78" OR "76") ("Dakar" OR "Sénégal") ("cosmétique" OR "parfum" OR "beauté")', cat: 'beaute' },
  ];

  for (const item of requetesDorking) {
    try {
      const res = await axios.post(
        'https://google.serper.dev/search',
        { q: item.query, num: 20, gl: 'sn', hl: 'fr' },
        { headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      const organic = res.data?.organic || [];
      totalTraites += organic.length;

      let rawText = '';
      for (const org of organic) {
        rawText += `\n${org.title || ''} ${org.snippet || ''} ${org.link || ''}`;
      }

      if (rawText.trim()) {
        const leads = extraireLeadsDepuisTexte(rawText, {
          categorie: item.cat,
          ville: 'Dakar',
          quartier: 'Dakar',
          source: 'dorking_auto',
        });

        for (const l of leads) {
          const ins = await pool.query(
            `INSERT INTO prospection_leads (
              nom_boutique, telephone, telephone_brut, operateur, categorie, ville, quartier, source, statut, score, fit_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'nouveau', 80, 85)
            ON CONFLICT (telephone) DO NOTHING
            RETURNING id`,
            [l.nom_boutique, l.telephone, l.telephone_brut, l.operateur, l.categorie, l.ville, l.quartier, 'dorking_auto']
          );

          if (ins.rows.length > 0) ajoutes++;
          else ignores++;
        }
      }
    } catch (err) {
      erreurs.push(`Dorking ${item.cat}: ${err.message}`);
    }
  }

  return { source: 'dorking_api', active: true, totalTraites, ajoutes, ignores, erreurs };
}

/**
 * 3. Lanceur Unifié d'Auto-Collecte sans impact mémoire Render
 */
async function lancerAutoCollecte(options = {}) {
  const { source = 'all' } = options;
  const debut = Date.now();
  const memAvant = process.memoryUsage().heapUsed / 1024 / 1024;

  const resultats = {
    totalAjoutes: 0,
    totalIgnores: 0,
    sources: [],
    dureeMs: 0,
    ramDeltaMb: 0,
  };

  if (source === 'all' || source === 'osm') {
    const resOsm = await collecterDepuisOpenStreetMap(200);
    resultats.totalAjoutes += resOsm.ajoutes;
    resultats.totalIgnores += resOsm.ignores;
    resultats.sources.push(resOsm);
  }

  if (source === 'all' || source === 'dorking') {
    const resDorking = await collecterDepuisDorkingApi();
    resultats.totalAjoutes += resDorking.ajoutes;
    resultats.totalIgnores += resDorking.ignores || 0;
    resultats.sources.push(resDorking);
  }

  const memApres = process.memoryUsage().heapUsed / 1024 / 1024;
  resultats.dureeMs = Date.now() - debut;
  resultats.ramDeltaMb = Number(Math.max(0, memApres - memAvant).toFixed(2));

  return resultats;
}

module.exports = {
  collecterDepuisOpenStreetMap,
  collecterDepuisDorkingApi,
  lancerAutoCollecte,
};
