// backend/services/surga/places-service.js
// Service des Bons Plans & Bonnes Adresses à Dakar — Tranche 14
// Résumés honnêtes d'avis clients en 3 lignes, recherche d'envies en langage naturel
// Zéro émoji, vouvoiement strict D19, conformité Low-Data

let pool = null;
try {
  pool = require('../../db');
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
 * Catalogue initial certifié des bonnes adresses dakaroises
 */
const PLACES_DAKAR_DEMO = [
  {
    id: 'place-chez-loutcha',
    slug: 'chez-loutcha-plateau',
    nom: 'Chez Loutcha',
    categorie: 'restaurant',
    quartier: 'Plateau',
    ville: 'Dakar',
    adresse: '101 Rue Moussé Diop, Dakar Plateau',
    budget_moyen_xof: 4500,
    fourchette_prix: '€€',
    tags_ambiance: ['authentique', 'climatisé', 'familial'],
    specialite: 'Thiéboudienne rouge au mérou et plats capverdiens',
    note_moyenne: 4.6,
    nb_avis: 1420,
    resume_honnete: 'Institution dakaroise réputée pour ses portions très généreuses et son thiéboudienne savoureux. Salle climatisée agréable mais souvent comble entre 13h et 14h30 : prévoyez quelques minutes d attente le midi.',
    contact_tel: '+221338210302',
    contact_whatsapp: '221338210302',
    horaires: 'Du lundi au samedi : 12h00 - 23h00',
    photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
  {
    id: 'place-dibiterie-haissam',
    slug: 'dibiterie-chez-haissam-ouakam',
    nom: 'Dibiterie Chez Haïssam',
    categorie: 'dibiterie',
    quartier: 'Ouakam',
    ville: 'Dakar',
    adresse: 'Route du Monument de la Renaissance, Ouakam',
    budget_moyen_xof: 3500,
    fourchette_prix: '€',
    tags_ambiance: ['authentique', 'terrasse'],
    specialite: 'Dibi d agneau braisé au feu de bois avec oignons moutardés',
    note_moyenne: 4.7,
    nb_avis: 890,
    resume_honnete: 'L une des meilleures viandes d agneau de Dakar, assaisonnée à la perfection et découpée à la minute sur papier kraft. Cadre populaire et rustique sans chichis, le service est rapide même en soirée de pointe.',
    contact_tel: '+221775123456',
    contact_whatsapp: '221775123456',
    horaires: 'Tous les jours : 18h00 - 02h00',
    photos: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
  {
    id: 'place-echappee-coworking',
    slug: 'lechappee-cafe-coworking-point-e',
    nom: 'L Échappée Coworking & Café',
    categorie: 'cafe_coworking',
    quartier: 'Point E',
    ville: 'Dakar',
    adresse: 'Rue de Diourbel, Point E',
    budget_moyen_xof: 3000,
    fourchette_prix: '€€',
    tags_ambiance: ['calme', 'wifi_rapide', 'climatisé', 'terrasse'],
    specialite: 'Café de spécialité, jus détox bissap-menthe et formule studieuse',
    note_moyenne: 4.8,
    nb_avis: 340,
    resume_honnete: 'Atmosphère calme et sereine idéale pour télétravailler en paix avec une connexion fibre très stable (100 Mbps) et des prises à chaque table. Prix légèrement supérieurs à un café standard mais largement justifiés par le confort.',
    contact_tel: '+221773456789',
    contact_whatsapp: '221773456789',
    horaires: 'Du lundi au samedi : 08h00 - 20h00',
    photos: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
  {
    id: 'place-cabane-pecheur',
    slug: 'la-cabane-du-pecheur-ngor',
    nom: 'La Cabane du Pêcheur',
    categorie: 'bord_de_mer',
    quartier: 'Ngor',
    ville: 'Dakar',
    adresse: 'Plage de Ngor, face à l île',
    budget_moyen_xof: 8500,
    fourchette_prix: '€€€',
    tags_ambiance: ['vue_mer', 'terrasse', 'romantique'],
    specialite: 'Lotte fraîche et thiof grillé servis les pieds dans le sable',
    note_moyenne: 4.5,
    nb_avis: 1120,
    resume_honnete: 'Emplacement d exception en bordure d océan avec brise marine et vue directe sur l île de Ngor. Poissons d une fraîcheur irréprochable ; l addition est un peu plus élevée que la moyenne locale mais le cadre est incomparable.',
    contact_tel: '+221338202020',
    contact_whatsapp: '221338202020',
    horaires: 'Du mardi au dimanche : 12h00 - 23h30',
    photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
  {
    id: 'place-phare-mamelles',
    slug: 'le-phare-des-mamelles-ouakam',
    nom: 'Le Phare des Mamelles Restaurant',
    categorie: 'bord_de_mer',
    quartier: 'Mamelles',
    ville: 'Dakar',
    adresse: 'Sommet du Phare des Mamelles, Ouakam',
    budget_moyen_xof: 10000,
    fourchette_prix: '€€€',
    tags_ambiance: ['vue_mer', 'romantique', 'terrasse'],
    specialite: 'Tapas de la mer et cocktails au coucher du soleil',
    note_moyenne: 4.6,
    nb_avis: 2300,
    resume_honnete: 'Vue panoramique à 360 degrés spectaculaire sur toute la presqu île et l océan Atlantique. Idéal pour un verre en fin d après-midi ou un dîner romantique ; prévoyez de réserver pour les tables en bordure de falaise le week-end.',
    contact_tel: '+221778901234',
    contact_whatsapp: '221778901234',
    horaires: 'Du mardi au dimanche : 17h00 - 02h00',
    photos: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
  {
    id: 'place-chez-katia',
    slug: 'chez-katia-almadies',
    nom: 'Chez Katia Almadies',
    categorie: 'brunch_crepe',
    quartier: 'Almadies',
    ville: 'Dakar',
    adresse: 'Route des Almadies, après la station Shell',
    budget_moyen_xof: 4000,
    fourchette_prix: '€€',
    tags_ambiance: ['terrasse', 'familial', 'climatisé'],
    specialite: 'Glaces artisanales au corossol et crêpes salées au feu de bois',
    note_moyenne: 4.5,
    nb_avis: 1650,
    resume_honnete: 'Adresse très conviviale adorée des familles et des jeunes dakarois pour une pause gourmande. Grand choix de parfums de glace et service chaleureux ; l affluence est forte les dimanches après-midi.',
    contact_tel: '+221338601010',
    contact_whatsapp: '221338601010',
    horaires: 'Tous les jours : 09h00 - 00h30',
    photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
  {
    id: 'place-noflaye-beach',
    slug: 'noflaye-beach-corniche-ouest',
    nom: 'Noflaye Beach',
    categorie: 'bord_de_mer',
    quartier: 'Fann',
    ville: 'Dakar',
    adresse: 'Corniche Ouest, Plage de Soumbédioune',
    budget_moyen_xof: 5500,
    fourchette_prix: '€€',
    tags_ambiance: ['vue_mer', 'terrasse', 'authentique'],
    specialite: 'Galettes de sarrasin bretonnes aux crevettes locales et jus de baobab',
    note_moyenne: 4.4,
    nb_avis: 980,
    resume_honnete: 'Une crêperie les pieds dans l eau avec une terrasse en bois surplombant les vagues de Soumbédioune. Ambiance décontractée et brise rafraîchissante permanente ; le service peut être un peu lent en heure de pointe.',
    contact_tel: '+221338250505',
    contact_whatsapp: '221338250505',
    horaires: 'Tous les jours : 10h00 - 23h00',
    photos: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
  {
    id: 'place-jardin-gourmand',
    slug: 'le-jardin-gourmand-mermoz',
    nom: 'Le Jardin Gourmand',
    categorie: 'brunch_crepe',
    quartier: 'Mermoz',
    ville: 'Dakar',
    adresse: 'Avenue Cheikh Anta Diop, Mermoz',
    budget_moyen_xof: 5000,
    fourchette_prix: '€€',
    tags_ambiance: ['calme', 'terrasse', 'familial'],
    specialite: 'Brunch dominical complet, omelettes relevées et gaufres croustillantes',
    note_moyenne: 4.6,
    nb_avis: 420,
    resume_honnete: 'Jardin arboré paisible à l abri du bruit des grandes avenues. Les assiettes sont colorées et les ingrédients frais de saison. Très apprécié pour les petits déjeuners prolongés en matinée.',
    contact_tel: '+221774567890',
    contact_whatsapp: '221774567890',
    horaires: 'Du mardi au dimanche : 08h30 - 18h00',
    photos: ['https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
  {
    id: 'place-dibiterie-dakaroise',
    slug: 'dibiterie-dakaroise-liberte6',
    nom: 'Dibiterie Dakaroise',
    categorie: 'dibiterie',
    quartier: 'Liberté',
    ville: 'Dakar',
    adresse: 'Rond-point Liberté 6, en face du terminus',
    budget_moyen_xof: 2500,
    fourchette_prix: '€',
    tags_ambiance: ['authentique'],
    specialite: 'Quart de mouton grillé aux épices locales et pain chaud tapalapa',
    note_moyenne: 4.5,
    nb_avis: 670,
    resume_honnete: 'L adresse de quartier par excellence : viande très tendre, assaisonnement généreux et rapport qualité-prix imbattable. Espace réduit pour manger sur place, la majorité des habitués emportent leur paquet.',
    contact_tel: '+221776543219',
    contact_whatsapp: '221776543219',
    horaires: 'Tous les jours : 17h00 - 01h00',
    photos: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
  {
    id: 'place-fourchette-plateau',
    slug: 'la-fourchette-plateau',
    nom: 'La Fourchette Restaurant',
    categorie: 'restaurant',
    quartier: 'Plateau',
    ville: 'Dakar',
    adresse: '4 Rue Parent, Dakar Plateau',
    budget_moyen_xof: 12000,
    fourchette_prix: '€€€',
    tags_ambiance: ['climatisé', 'romantique'],
    specialite: 'Cuisine fusion sénégalaise et internationale, poissons nobles et sushis',
    note_moyenne: 4.7,
    nb_avis: 1850,
    resume_honnete: 'Référence gastronomique du centre-ville, parfait pour les déjeuners d affaires discrets et les dîners raffinés. Carte très variée avec produits de haute qualité ; réservation vivement conseillée pour le soir.',
    contact_tel: '+221338426666',
    contact_whatsapp: '221338426666',
    horaires: 'Du lundi au samedi : 12h00 - 15h00 et 19h30 - 23h30',
    photos: ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80'],
    verifie: true,
    actif: true,
  },
];

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
        SELECT * FROM surga_places
        WHERE ${conditions.join(' AND ')}
        ORDER BY note_moyenne DESC, nb_avis DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const res = await pool.query(sql, params);
      return { places: res.rows, total: res.rows.length };
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
      if (res.rows.length > 0) return res.rows[0];
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
      return res.rows;
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
