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
async function collecterDepuisOpenStreetMap(limite = 150) {
  let ajoutes = 0;
  let ignores = 0;
  let totalTraites = 0;
  const erreurs = [];

  try {
    // Requête Overpass sur la presqu'île de Dakar et environs
    // Bounding Box : 14.65 (Sud Dakar) à 14.85 (Nord Dakar), -17.55 (Ouest) à -17.25 (Est Rufisque)
    const query = `[out:json][timeout:25];(node["shop"](14.65,-17.55,14.85,-17.25);node["contact:phone"](14.65,-17.55,14.85,-17.25);node["contact:whatsapp"](14.65,-17.55,14.85,-17.25);way["shop"](14.65,-17.55,14.85,-17.25););out center tags ${parseInt(limite, 10) || 150};`;

    const res = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'NopalouAutoCollector/1.0 (https://nopalou.com)',
      },
      timeout: 25000,
    });

    const elements = res.data?.elements || [];
    totalTraites = elements.length;

    for (const el of elements) {
      const tags = el.tags || {};
      const telBrut = tags.phone || tags['contact:phone'] || tags['contact:whatsapp'] || tags['contact:mobile'];
      const nomBrut = tags.name || tags.brand || tags.operator;

      if (!telBrut || !nomBrut) {
        ignores++;
        continue;
      }

      // Normalisation du téléphone sénégalais
      const norm = normaliserTelephoneSenegal(telBrut);
      // On ne retient que les téléphones mobiles / WhatsApp (77, 78, 76, 75, 70), pas les fixes (33)
      if (!norm.valide || norm.operateur === 'Fixe / Autre' || norm.national.startsWith('22133')) {
        ignores++;
        continue;
      }

      // Vérification blacklist
      if (estDesinscrit && (await estDesinscrit(norm.national))) {
        ignores++;
        continue;
      }

      // Détection catégorie et quartier
      const rawCategory = tags.shop || tags.amenity || 'mode';
      let cat = 'mode';
      if (/phone|mobile|tech|computer|electronics/i.test(rawCategory)) cat = 'smartphones';
      else if (/bakery|supermarket|convenience|grocery/i.test(rawCategory)) cat = 'superette';
      else if (/hairdresser|beauty|cosmetics/i.test(rawCategory)) cat = 'beaute';
      else if (/hardware|doityourself/i.test(rawCategory)) cat = 'quincaillerie';
      else if (/car|motorcycle|tyres/i.test(rawCategory)) cat = 'auto-moto';

      const quartier = tags['addr:suburb'] || tags['addr:district'] || tags['addr:city'] || detecterQuartier(`${nomBrut} Dakar`) || 'Dakar';
      const nomBq = toTitleCase(nettoyerNomBoutique(nomBrut, cat, quartier));

      // Insertion sécurisée avec ON CONFLICT DO NOTHING (anti-doublon absolu)
      const ins = await pool.query(
        `INSERT INTO prospection_leads (
          nom_boutique, telephone, telephone_brut, operateur, categorie, ville, quartier, source, statut, score, fit_score
        ) VALUES ($1, $2, $3, $4, $5, 'Dakar', $6, 'osm_places', 'nouveau', 75, 80)
        ON CONFLICT (telephone) DO NOTHING
        RETURNING id`,
        [nomBq, norm.national, norm.brut, norm.operateur, cat, quartier]
      );

      if (ins.rows.length > 0) {
        ajoutes++;
      } else {
        ignores++;
      }
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
