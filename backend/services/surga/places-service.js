// backend/services/surga/places-service.js
// Service des Bons Plans & Bonnes Adresses à Dakar — Tranche 14
// Résumés honnêtes d'avis clients en 3 lignes, recherche d'envies en langage naturel
// Zéro émoji, vouvoiement strict D19, conformité Low-Data

let pool = null;
try {
  const dbModule = require('../../models/db');
  pool = dbModule.pool || dbModule;
} catch {
  // Mode offline ou test unitaire
}

const { QUARTIERS_DAKAR } = require('./immo-service');

/**
 * Catégories officielles des adresses
 */
const CATEGORIES_PLACES = [
  { id: 'tous', label: 'Toutes les adresses' },
  { id: 'restaurant', label: 'Restaurants Sénégalais & Monde' },
  { id: 'dibiterie', label: 'Dibiteries & Viandes Braisées' },
  { id: 'cafe_coworking', label: 'Cafés Calmes & Coworking' },
  { id: 'bord_de_mer', label: 'Bord de Mer & Terrasses' },
  { id: 'brunch_crepe', label: 'Brunchs & Petits Déjeuners' },
];

/**
 * Tags d'ambiance disponibles
 */
const TAGS_AMBIANCE = [
  'calme',
  'wifi_rapide',
  'vue_mer',
  'terrasse',
  'climatisé',
  'authentique',
  'familial',
  'romantique',
];

/**
 * Catalogue initial certifié des bonnes adresses dakaroises (42+ adresses)
 */
let PLACES_DAKAR_DEMO = [];
try {
  PLACES_DAKAR_DEMO = require('../../data/surga-places-catalogue.json');
} catch (err) {
  PLACES_DAKAR_DEMO = [];
}

/**
 * Normaliser une chaîne de caractères
 */
function normaliser(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Parser de recherche d'adresses et d'envies en langage naturel
 * @param {string} texte
 * @returns {Object}
 */
function parserRecherchePlacesNaturelle(texte = '') {
  if (!texte || typeof texte !== 'string') {
    return { quartier: null, categorie: 'tous', ambiance: null, budgetMax: null, queryPropre: '' };
  }

  const t = normaliser(texte);

  // 1. Quartier
  let quartier = null;
  for (const q of QUARTIERS_DAKAR) {
    if (t.includes(normaliser(q))) {
      quartier = q;
      break;
    }
  }

  // 2. Catégorie d'envie
  let categorie = 'tous';
  if (t.includes('dibi') || t.includes('viande') || t.includes('agneau') || t.includes('mouton') || t.includes('grillade')) {
    categorie = 'dibiterie';
  } else if (t.includes('cafe') || t.includes('coworking') || t.includes('bosser') || t.includes('travailler') || t.includes('wifi')) {
    categorie = 'cafe_coworking';
  } else if (t.includes('mer') || t.includes('plage') || t.includes('ocean') || t.includes('poisson') || t.includes('falaise')) {
    categorie = 'bord_de_mer';
  } else if (t.includes('brunch') || t.includes('crepe') || t.includes('creperie') || t.includes('petit dej') || t.includes('glace')) {
    categorie = 'brunch_crepe';
  } else if (t.includes('manger') || t.includes('resto') || t.includes('restaurant') || t.includes('thieb') || t.includes('yassa')) {
    categorie = 'restaurant';
  }

  // 3. Tags d'ambiance
  let ambiance = null;
  if (t.includes('calme') || t.includes('tranquille') || t.includes('silencieux')) {
    ambiance = 'calme';
  } else if (t.includes('vue mer') || t.includes('vue sur mer') || t.includes('bord mer')) {
    ambiance = 'vue_mer';
  } else if (t.includes('wifi') || t.includes('fibre') || t.includes('connexion')) {
    ambiance = 'wifi_rapide';
  } else if (t.includes('terrasse') || t.includes('dehors') || t.includes('plein air')) {
    ambiance = 'terrasse';
  } else if (t.includes('climatise') || t.includes('frais') || t.includes('clim')) {
    ambiance = 'climatisé';
  } else if (t.includes('romantique') || t.includes('amoureux') || t.includes('couple')) {
    ambiance = 'romantique';
  }

  // 4. Budget max
  let budgetMax = null;
  const matchK = t.match(/(\d+)\s*k/);
  if (matchK) {
    budgetMax = parseInt(matchK[1], 10) * 1000;
  } else {
    const matchPrix = t.match(/(?:moins de|max|maximum|budget|pour)\s*(\d{1,3}(?:\s*\d{3})+|\d{4,6})(?:\s*f|\s*fcfa)?/);
    if (matchPrix && matchPrix[1]) {
      const propre = matchPrix[1].replace(/\s+/g, '');
      budgetMax = parseInt(propre, 10);
    } else if (t.includes('pas cher') || t.includes('economique') || t.includes('accessible')) {
      budgetMax = 4000;
    }
  }

  return {
    quartier,
    categorie,
    ambiance,
    budgetMax,
    queryPropre: texte.trim(),
  };
}

/**
 * Normalise les types numériques d'une ligne SQL de surga_places
 * @param {Object} row
 * @returns {Object|null}
 */
function normaliserPlaceRow(row) {
  if (!row) return null;
  let tags = row.tags_ambiance;
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch { tags = []; }
  }
  let photos = row.photos;
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch { photos = []; }
  }
  return {
    ...row,
    note_moyenne: parseFloat(row.note_moyenne) || 4.5,
    nb_avis: parseInt(row.nb_avis, 10) || 0,
    budget_moyen_xof: parseInt(row.budget_moyen_xof, 10) || 0,
    tags_ambiance: Array.isArray(tags) ? tags : [],
    photos: Array.isArray(photos) ? photos : [],
  };
}

/**
 * Rechercher des adresses avec filtres et score de pertinence
 * @param {Object} criteres
 * @returns {Promise<{ places: Array, total: number }>}
 */
async function rechercherPlaces(criteres = {}) {
  const {
    categorie = 'tous',
    quartier = null,
    ambiance = null,
    budgetMax = null,
    q = '',
    limit = 20,
    offset = 0,
  } = criteres;

  if (pool) {
    try {
      const conditions = ['actif = TRUE'];
      const params = [];

      if (categorie && categorie !== 'tous') {
        params.push(categorie);
        conditions.push(`categorie = $${params.length}`);
      }
      if (quartier && quartier.trim()) {
        params.push(`%${quartier.trim()}%`);
        conditions.push(`quartier ILIKE $${params.length}`);
      }
      if (budgetMax && Number(budgetMax) > 0) {
        params.push(Number(budgetMax));
        conditions.push(`budget_moyen_xof <= $${params.length}`);
      }
      if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        conditions.push(`(nom ILIKE $${params.length} OR specialite ILIKE $${params.length} OR resume_honnete ILIKE $${params.length})`);
      }

      params.push(limit);
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const sql = `
        SELECT *, COUNT(*) OVER() AS full_count FROM surga_places
        WHERE ${conditions.join(' AND ')}
        ORDER BY note_moyenne DESC, nb_avis DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const res = await pool.query(sql, params);
      if (res.rows.length > 0 || q || (categorie && categorie !== 'tous') || quartier || budgetMax) {
        const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
        return { places: res.rows.map(normaliserPlaceRow), total };
      }
    } catch (err) {
      console.warn('[SurgaPlaces] Erreur DB surga_places, fallback mémoire:', err.message);
    }
  }

  // Repli mémoire
  let items = [...PLACES_DAKAR_DEMO];

  if (categorie && categorie !== 'tous') {
    items = items.filter((p) => p.categorie === categorie);
  }
  if (quartier && quartier.trim()) {
    const qNorm = normaliser(quartier);
    items = items.filter((p) => normaliser(p.quartier).includes(qNorm));
  }
  if (ambiance) {
    items = items.filter((p) => p.tags_ambiance && p.tags_ambiance.includes(ambiance));
  }
  if (budgetMax && Number(budgetMax) > 0) {
    items = items.filter((p) => p.budget_moyen_xof <= Number(budgetMax));
  }
  if (q && q.trim()) {
    const qNorm = normaliser(q);
    items = items.filter(
      (p) =>
        normaliser(p.nom).includes(qNorm) ||
        normaliser(p.specialite).includes(qNorm) ||
        normaliser(p.resume_honnete).includes(qNorm) ||
        normaliser(p.quartier).includes(qNorm)
    );
  }

  // Tri par note moyenne décroissante
  items.sort((a, b) => b.note_moyenne - a.note_moyenne);

  return {
    places: items.slice(offset, offset + limit),
    total: items.length,
  };
}

/**
 * Récupérer une place par son identifiant
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function recupererPlaceParId(id) {
  if (pool) {
    try {
      const res = await pool.query(`SELECT * FROM surga_places WHERE id = $1`, [id]);
      if (res.rows.length > 0) return normaliserPlaceRow(res.rows[0]);
    } catch (e) {}
  }

  return PLACES_DAKAR_DEMO.find((p) => p.id === id || p.slug === id) || null;
}

/**
 * Basculer une adresse en favori
 * @param {string} userId
 * @param {string} placeId
 * @returns {Promise<boolean>}
 */
async function basculerFavoriPlace(userId, placeId) {
  if (!placeId) return false;

  if (pool && userId) {
    try {
      const existe = await pool.query(
        `SELECT id FROM surga_favoris_places WHERE user_id = $1 AND place_id = $2`,
        [userId, placeId]
      );
      if (existe.rows.length > 0) {
        await pool.query(
          `DELETE FROM surga_favoris_places WHERE user_id = $1 AND place_id = $2`,
          [userId, placeId]
        );
        return false;
      } else {
        await pool.query(
          `INSERT INTO surga_favoris_places (user_id, place_id) VALUES ($1, $2)`,
          [userId, placeId]
        );
        return true;
      }
    } catch (e) {}
  }

  return true;
}

/**
 * Lister les adresses favorites de l'utilisateur
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function listerFavorisPlaces(userId) {
  if (pool && userId) {
    try {
      const res = await pool.query(
        `SELECT p.*, f.created_at AS favori_depuis
         FROM surga_favoris_places f
         JOIN surga_places p ON f.place_id = p.id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC`,
        [userId]
      );
      return res.rows.map(normaliserPlaceRow);
    } catch (e) {}
  }

  return PLACES_DAKAR_DEMO.slice(0, 2);
}

/**
 * Synthèse concise pour le briefing du matin au vouvoiement strict D19
 * @param {Array} places
 * @param {string} [quartier]
 * @returns {string}
 */
function genererSynthesePlacesBriefing(places = [], quartier = 'Dakar') {
  if (places.length === 0) {
    return 'Bons plans : Les adresses sélectionnées de Dakar sont disponibles pour vos déjeuners et moments de détente.';
  }

  const premiere = places[0];
  return `Bon plan du jour : Découvrez "${premiere.nom}" à ${premiere.quartier} (${premiere.specialite}). Budget moyen : ${new Intl.NumberFormat('fr-FR').format(premiere.budget_moyen_xof)} FCFA.`;
}

module.exports = {
  CATEGORIES_PLACES,
  TAGS_AMBIANCE,
  PLACES_DAKAR_DEMO,
  parserRecherchePlacesNaturelle,
  rechercherPlaces,
  recupererPlaceParId,
  basculerFavoriPlace,
  listerFavorisPlaces,
  genererSynthesePlacesBriefing,
};
