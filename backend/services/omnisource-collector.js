// backend/services/omnisource-collector.js
// Moteur d'Ingestion Universelle Omnisource (Google, Réseaux Sociaux & Commerces Locaux)
// Collecte de volume et haute qualité sans dépendance aux plateformes tierces.

const axios = require('axios');
const cheerio = require('cheerio');
const { pool } = require('../models/db');
const {
  normaliserTelephoneSenegal,
  nettoyerNomBoutique,
  detecterQuartier,
  estLeadEmploiOuInvalide,
  toTitleCase,
  nettoyerContactNom,
} = require('./prospection');

// Regex universelle pour détecter les numéros sénégalais mobiles / WhatsApp dans le texte
const REGEX_TEL_SN = /(?:(?:\+|00)?221)?[\s.-]?(7[05678][\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|7[05678]\d{7})/g;

// Regex pour extraire un prix en FCFA / XOF / F
function extrairePrixTexte(texte, categorie) {
  if (!texte) return null;
  const t = texte.replace(/\s+/g, ' ');

  // Format explicite : "150 000 FCFA", "150000 F", "25.000 CFA", "350000/mois"
  let m = t.match(/(?:prix\s*[:=-]?\s*)?(\d[\d\s.]{3,12})\s*(?:fcfa|xof|f\b|fr\b|cfa\b|\/(?:mois|jour))/i);
  if (m) {
    const v = parseInt(m[1].replace(/[\s.]/g, ''), 10);
    if (estPrixCoherent(v, categorie)) return v;
  }

  // Format abrégé : "35k", "40 k" -> 35000, 40000
  m = t.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (m) {
    const v = Math.round(parseFloat(m[1].replace(',', '.')) * 1000);
    if (estPrixCoherent(v, categorie)) return v;
  }

  // Format "Prix: 25000"
  m = t.match(/(?:prix|à|a)\s*[:=-]?\s*(\d{4,9})\b/i);
  if (m) {
    const v = parseInt(m[1], 10);
    if (estPrixCoherent(v, categorie)) return v;
  }

  return null;
}

function estPrixCoherent(prix, categorie) {
  if (!prix || isNaN(prix)) return false;
  if (categorie === 'immo') {
    // Location min 15 000 F, Vente min 1 000 000 F, max 2 Milliards
    return prix >= 15000 && prix <= 2_000_000_000;
  }
  if (categorie === 'auto-moto') {
    return prix >= 500000 && prix <= 150_000_000;
  }
  // Retail / Mode / High-Tech
  return prix >= 1000 && prix <= 20_000_000;
}

// Nettoyage de titre pour éliminer le bruit des réseaux sociaux (hashtags, emojis excessifs)
function nettoyerTitreReseauSocial(titreBrut, categorie) {
  if (!titreBrut) return 'Annonce certifiée';
  let t = titreBrut
    .replace(/#\S+/g, ' ') // Retire les hashtags
    .replace(/(?:Facebook|Instagram|TikTok|wa\.me\S*)/gi, ' ')
    .replace(/\b(?:00221|\+221)?7[05678]\d{7}\b/g, ' ') // Retire le numéro de tél du titre
    .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ') // Emojis
    .replace(/\s+/g, ' ')
    .trim();

  // Si le titre a été trop raccourci, créer un titre descriptif propre
  if (t.length < 5) {
    const labels = {
      smartphones: 'Téléphone & Accessoires disponibles',
      mode: 'Article de Mode & Prêt-à-Porter',
      beaute: 'Produit Cosmétique & Beauté',
      immo: 'Bien Immobilier à Dakar',
      'auto-moto': 'Véhicule disponible à Dakar',
      quincaillerie: 'Matériel & Quincaillerie',
    };
    return labels[categorie] || 'Article disponible à Dakar';
  }

  return t.slice(0, 160);
}

// Configuration des cibles de collecte omnicanale
const CONFIG_OMNISOURCE = {
  smartphones: {
    label: 'Smartphones & High-Tech',
    categorie: 'smartphones',
    queries: [
      'site:instagram.com ("wa.me" OR "77" OR "78" OR "76") Dakar (iphone OR samsung OR téléphone)',
      'site:tiktok.com ("wa.me" OR "77" OR "78" OR "76") Dakar (téléphone OR accessoires)',
    ],
    osmQuery: 'node["shop"="mobile_phone"](14.5,-17.6,14.9,-17.2); node["shop"="electronics"](14.5,-17.6,14.9,-17.2);',
  },
  mode: {
    label: 'Mode & Prêt-à-Porter',
    categorie: 'mode',
    queries: [
      'site:instagram.com ("wa.me" OR "77" OR "78" OR "76" OR "70") Dakar (robe OR bazin OR boutique)',
      'site:tiktok.com ("77" OR "78" OR "76") Dakar (mode OR chaussures OR livraison)',
    ],
    osmQuery: 'node["shop"="clothes"](14.5,-17.6,14.9,-17.2); node["shop"="shoes"](14.5,-17.6,14.9,-17.2); node["shop"="boutique"](14.5,-17.6,14.9,-17.2);',
  },
  beaute: {
    label: 'Cosmétique & Parfumerie',
    categorie: 'beaute',
    queries: [
      'site:instagram.com ("wa.me" OR "77" OR "78" OR "76") Dakar (parfum OR cosmétique OR soins)',
      'site:tiktok.com ("77" OR "78" OR "76") Dakar (mèches OR perruques OR beauté)',
    ],
    osmQuery: 'node["shop"="cosmetics"](14.5,-17.6,14.9,-17.2); node["shop"="perfumery"](14.5,-17.6,14.9,-17.2);',
  },
  immo: {
    label: 'Immobilier & Terrains',
    categorie: 'immo',
    queries: [
      'site:facebook.com ("77" OR "78" OR "76" OR "70") Dakar ("appartement à louer" OR "villa à vendre")',
      'site:facebook.com ("77" OR "78" OR "76") ("Almadies" OR "Mermoz" OR "Maristes") "à louer"',
    ],
    osmQuery: 'node["office"="estate_agent"](14.5,-17.6,14.9,-17.2); node["amenity"="real_estate"](14.5,-17.6,14.9,-17.2);',
  },
  quincaillerie: {
    label: 'Quincaillerie & Matériaux',
    categorie: 'quincaillerie',
    queries: [
      'site:facebook.com ("77" OR "78" OR "76") Dakar ("quincaillerie" OR "matériaux" OR "ciment")',
    ],
    osmQuery: 'node["shop"="hardware"](14.5,-17.6,14.9,-17.2); node["shop"="doityourself"](14.5,-17.6,14.9,-17.2);',
  },
};

/**
 * 1. Collecteur Réseaux Sociaux & Google Search Dorking
 * Capture les publications Instagram / TikTok / Facebook avec prix et numéro WhatsApp
 */
async function collecterReseauxSociaux(verticaleKey = 'all', options = {}) {
  const { limite = 50 } = options;
  const cles = verticaleKey === 'all' ? Object.keys(CONFIG_OMNISOURCE) : [verticaleKey];

  let annoncesInseres = 0;
  let leadsInseres = 0;
  let doublons = 0;
  const erreurs = [];

  for (const k of cles) {
    const cfg = CONFIG_OMNISOURCE[k];
    if (!cfg || !cfg.queries) continue;

    for (const dorkQuery of cfg.queries) {
      try {
        const res = await axios.get('https://www.bing.com/search', {
          params: { q: dorkQuery, count: Math.min(30, limite) },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9',
          },
          timeout: 12000,
        });

      const $ = cheerio.load(res.data);
      const items = [];

      $('li.b_algo').each((_, el) => {
        const card = $(el);
        const title = card.find('h2').text().trim();
        const snippet = card.find('.b_caption p').text().trim();
        const link = card.find('h2 a').attr('href') || '';
        const texteComplet = `${title} ${snippet}`;

        const matchTels = texteComplet.match(REGEX_TEL_SN);
        if (matchTels && matchTels.length > 0) {
          const normTel = normaliserTelephoneSenegal(matchTels[0]);
          if (normTel.valide && /^(221)?(77|78|76|75|70)/.test(normTel.national)) {
            // Identifier la plateforme
            let sourcePlateforme = 'reseaux_sociaux';
            if (link.includes('instagram.com')) sourcePlateforme = 'instagram';
            else if (link.includes('tiktok.com')) sourcePlateforme = 'tiktok';
            else if (link.includes('facebook.com')) sourcePlateforme = 'facebook';

            const prix = extrairePrixTexte(texteComplet, cfg.categorie);
            const quartier = detecterQuartier(texteComplet) || 'Dakar';
            const titrePropre = nettoyerTitreReseauSocial(title, cfg.categorie);
            const nomVendeur = toTitleCase(nettoyerNomBoutique(title, cfg.categorie, quartier));

            items.push({
              titre: titrePropre,
              description: snippet.slice(0, 500) || titrePropre,
              prix: prix,
              telephone: normTel.national,
              telephoneBrut: normTel.brut,
              operateur: normTel.operateur,
              vendeur: nomVendeur,
              categorie: cfg.categorie,
              ville: 'Dakar',
              quartier: quartier,
              source: sourcePlateforme,
              urlSource: link.split('?')[0],
            });
          }
        }
      });

      // Ingestion sécurisée avec dédoublonnage à 30 jours
      for (const item of items) {
        try {
          // A. Vérifier doublon dans annonces_classifiees
          const { rows: existants } = await pool.query(
            `SELECT id FROM annonces_classifiees 
             WHERE contact_tel = $1 AND LOWER(TRIM(titre)) = $2 AND created_at > NOW() - INTERVAL '30 days' 
             LIMIT 1`,
            [item.telephone, item.titre.toLowerCase().trim()]
          );

          if (existants.length > 0) {
            doublons++;
            continue;
          }

          // B. Insérer dans annonces_classifiees
          const insAnnonce = await pool.query(
            `INSERT INTO annonces_classifiees (
              categorie_slug, titre, description, prix, ville, quartier,
              contact_nom, contact_tel, photos, source, source_detail, url_source,
              actif, supprimee, rejete, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, true, false, false, NOW(), NOW())
            RETURNING id`,
            [
              item.categorie,
              item.titre,
              item.description,
              item.prix,
              item.ville,
              item.quartier,
              item.vendeur,
              item.telephone,
              JSON.stringify([]),
              item.source,
              `omnisource_${item.source}`,
              item.urlSource,
            ]
          );

          if (insAnnonce.rows.length > 0) {
            annoncesInseres++;

            // Si c'est un bien immo, insérer également dans annonces_immo
            if (item.categorie === 'immo' && item.prix) {
              await pool.query(
                `INSERT INTO annonces_immo (
                  titre, description, prix, ville, quartier, type_bien, transaction,
                  contact_nom, contact_tel, source, ref_externe, actif, supprimee, rejete, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, 'appartement', 'location', $6, $7, 'omnisource_immo', $8, true, false, false, NOW(), NOW())
                ON CONFLICT (source, ref_externe) DO NOTHING`,
                [
                  item.titre,
                  item.description,
                  item.prix,
                  item.ville,
                  item.quartier,
                  item.vendeur,
                  item.telephone,
                  `classifiee-${insAnnonce.rows[0].id}`,
                ]
              ).catch(() => {});
            }
          }

          // C. Insérer ou synchroniser dans prospection_leads (CRM WhatsApp)
          const insLead = await pool.query(
            `INSERT INTO prospection_leads (
              nom_boutique, contact_nom, telephone, telephone_brut, operateur,
              categorie, ville, quartier, source, statut, score, fit_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'nouveau', 85, 90)
            ON CONFLICT (telephone) DO UPDATE SET
              derniere_activite = NOW(),
              score = GREATEST(prospection_leads.score, 85)
            RETURNING id`,
            [
              item.vendeur,
              item.vendeur,
              item.telephone,
              item.telephoneBrut,
              item.operateur,
              item.categorie,
              item.ville,
              item.quartier,
              `omnisource_${item.source}`,
            ]
          );

          if (insLead.rows.length > 0) {
            leadsInseres++;
          }
        } catch (itemErr) {
          erreurs.push(itemErr.message);
        }
      }
    } catch (errReq) {
      erreurs.push(`${k}: ${errReq.message}`);
    }
  }
}

  return {
    source: 'reseaux_sociaux_dorking',
    verticale: verticaleKey,
    annoncesInseres,
    leadsInseres,
    doublons,
    erreurs: erreurs.slice(0, 5),
  };
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function executerOverpassResilient(query) {
  for (const ep of OVERPASS_ENDPOINTS) {
    try {
      const res = await axios.post(ep, query, {
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'NopalouOmnisource/2.0 (https://nopalou.com)',
        },
        timeout: 12000,
      });
      if (res.data && Array.isArray(res.data.elements)) {
        return res.data.elements;
      }
    } catch (e) {
      // Tenter le miroir suivant
    }
  }
  return [];
}

/**
 * 2. Scanner Local Google Maps / OpenStreetMap Places
 * Référence les commerces physiques de Dakar et régions avec vitrines locales
 */
async function collecterCommercesLocaux(verticaleKey = 'all', options = {}) {
  const { limite = 100 } = options;
  const cles = verticaleKey === 'all' ? Object.keys(CONFIG_OMNISOURCE) : [verticaleKey];

  let annoncesInseres = 0;
  let leadsInseres = 0;
  let doublons = 0;
  const erreurs = [];

  for (const k of cles) {
    const cfg = CONFIG_OMNISOURCE[k];
    if (!cfg || !cfg.osmQuery) continue;

    try {
      const queryOsm = `[out:json][timeout:12];
(
  ${cfg.osmQuery}
);
out center tags ${Math.min(100, limite)};`;

      const elements = await executerOverpassResilient(queryOsm);
      if (elements.length === 0) {
        erreurs.push(`OSM ${k}: Aucun élément retourné par les miroirs`);
      }

      for (const el of elements) {
        const tags = el.tags || {};
        const telBrut = tags['contact:whatsapp'] || tags['contact:mobile'] || tags['contact:phone'] || tags.phone;
        const nomBrut = tags.name || tags.brand || tags.operator;

        if (!telBrut || !nomBrut) continue;

        const normTel = normaliserTelephoneSenegal(telBrut);
        if (!normTel.valide || !/^(221)?(77|78|76|75|70)/.test(normTel.national)) {
          continue;
        }

        const quartier = tags['addr:suburb'] || tags['addr:district'] || detecterQuartier(`${nomBrut} Dakar`) || 'Dakar';
        const nomPropre = toTitleCase(nettoyerNomBoutique(nomBrut, cfg.categorie, quartier));
        const titreAnnonce = `${nomPropre} — ${cfg.label} (${quartier})`;

        try {
          // A. Vérifier doublon dans annonces_classifiees
          const { rows: existants } = await pool.query(
            `SELECT id FROM annonces_classifiees 
             WHERE contact_tel = $1 AND categorie_slug = $2 
             LIMIT 1`,
            [normTel.national, cfg.categorie]
          );

          if (existants.length > 0) {
            doublons++;
            continue;
          }

          // B. Créer la vitrine locale dans annonces_classifiees
          const insAnnonce = await pool.query(
            `INSERT INTO annonces_classifiees (
              categorie_slug, titre, description, prix, ville, quartier,
              contact_nom, contact_tel, photos, source, source_detail,
              actif, supprimee, rejete, created_at, updated_at
            ) VALUES ($1, $2, $3, NULL, 'Dakar', $4, $5, $6, $7::jsonb, 'google_places', 'osm_local_commerce', true, false, false, NOW(), NOW())
            RETURNING id`,
            [
              cfg.categorie,
              titreAnnonce,
              `Commerce local et vitrine officielle référencée à ${quartier}. Contact direct via WhatsApp ou appel.`,
              quartier,
              nomPropre,
              normTel.national,
              JSON.stringify([]),
            ]
          );

          if (insAnnonce.rows.length > 0) {
            annoncesInseres++;
          }

          // C. Synchroniser dans prospection_leads
          const insLead = await pool.query(
            `INSERT INTO prospection_leads (
              nom_boutique, contact_nom, telephone, telephone_brut, operateur,
              categorie, ville, quartier, source, statut, score, fit_score
            ) VALUES ($1, $2, $3, $4, $5, $6, 'Dakar', $7, 'osm_places', 'nouveau', 80, 85)
            ON CONFLICT (telephone) DO UPDATE SET
              derniere_activite = NOW(),
              score = GREATEST(prospection_leads.score, 80)
            RETURNING id`,
            [
              nomPropre,
              nomPropre,
              normTel.national,
              normTel.brut,
              normTel.operateur,
              cfg.categorie,
              quartier,
            ]
          );

          if (insLead.rows.length > 0) {
            leadsInseres++;
          }
        } catch (insErr) {
          erreurs.push(insErr.message);
        }
      }
    } catch (errOsm) {
      erreurs.push(`OSM ${k}: ${errOsm.message}`);
    }
  }

  return {
    source: 'google_places_osm',
    verticale: verticaleKey,
    annoncesInseres,
    leadsInseres,
    doublons,
    erreurs: erreurs.slice(0, 5),
  };
}

/**
 * 3. Moteur Global d'Exécution Omnisource
 */
async function lancerCollecteOmnisource(options = {}) {
  const { mode = 'all', verticale = 'all', limite = 50 } = options;
  const debut = Date.now();

  const synthese = {
    succes: true,
    totalAnnoncesCreees: 0,
    totalLeadsSynchronises: 0,
    totalDoublonsEvites: 0,
    details: [],
    dureeMs: 0,
  };

  // 1. Aspiration Réseaux Sociaux & Search (Instagram, TikTok, Facebook)
  if (mode === 'all' || mode === 'reseaux') {
    const resReseaux = await collecterReseauxSociaux(verticale, { limite });
    synthese.totalAnnoncesCreees += resReseaux.annoncesInseres;
    synthese.totalLeadsSynchronises += resReseaux.leadsInseres;
    synthese.totalDoublonsEvites += resReseaux.doublons;
    synthese.details.push(resReseaux);
  }

  // 2. Aspiration Commerces Physiques (Google Places / OSM)
  if (mode === 'all' || mode === 'local') {
    const resLocal = await collecterCommercesLocaux(verticale, { limite });
    synthese.totalAnnoncesCreees += resLocal.annoncesInseres;
    synthese.totalLeadsSynchronises += resLocal.leadsInseres;
    synthese.totalDoublonsEvites += resLocal.doublons;
    synthese.details.push(resLocal);
  }

  synthese.dureeMs = Date.now() - debut;
  return synthese;
}

module.exports = {
  lancerCollecteOmnisource,
  collecterReseauxSociaux,
  collecterCommercesLocaux,
  CONFIG_OMNISOURCE,
  extrairePrixTexte,
  nettoyerTitreReseauSocial,
};
