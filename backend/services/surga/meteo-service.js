// backend/services/surga/meteo-service.js
// Service Météo pour Surga (Dakar et Régions du Sénégal)
// Localités, mémoire et dernier relevé ; les sources elles-mêmes sont dans sources-externes.js

const sources = require('./sources-externes');

const LOCALITES_SENEGAL = {
  // Dakar & Presqu'île
  dakar: { nom: 'Dakar', lat: 14.6937, lon: -17.4441, maritime: true, zone: 'Dakar' },
  'dakar-plateau': { nom: 'Dakar Plateau', lat: 14.6700, lon: -17.4300, maritime: true, zone: 'Dakar' },
  almadies: { nom: 'Almadies / Ngor', lat: 14.7450, lon: -17.5150, maritime: true, zone: 'Dakar' },
  ouakam: { nom: 'Ouakam / Mamelles', lat: 14.7200, lon: -17.4900, maritime: true, zone: 'Dakar' },
  yoff: { nom: 'Yoff / Ouest-Foire', lat: 14.7550, lon: -17.4650, maritime: true, zone: 'Dakar' },
  mermoz: { nom: 'Mermoz / Sacré-Cœur', lat: 14.7080, lon: -17.4700, maritime: true, zone: 'Dakar' },
  'parcelles-assainies': { nom: 'Parcelles Assainies', lat: 14.7600, lon: -17.4400, maritime: true, zone: 'Dakar' },
  'grand-dakar': { nom: 'Grand Dakar / Colobane', lat: 14.7050, lon: -17.4500, maritime: false, zone: 'Dakar' },
  // Banlieue dakaroise
  pikine: { nom: 'Pikine', lat: 14.7570, lon: -17.3950, maritime: true, zone: 'Banlieue' },
  guediawaye: { nom: 'Guédiawaye', lat: 14.7700, lon: -17.3850, maritime: true, zone: 'Banlieue' },
  rufisque: { nom: 'Rufisque', lat: 14.7167, lon: -17.2667, maritime: true, zone: 'Banlieue' },
  diamniadio: { nom: 'Diamniadio', lat: 14.7300, lon: -17.1800, maritime: false, zone: 'Banlieue' },
  // Régions et villes du Sénégal (14 régions couvertes)
  thies: { nom: 'Thiès', lat: 14.7910, lon: -16.9359, maritime: false, zone: 'Régions' },
  mbour: { nom: 'Mbour / Saly', lat: 14.4220, lon: -16.9639, maritime: true, zone: 'Petite-Côte' },
  'saint-louis': { nom: 'Saint-Louis', lat: 16.0179, lon: -16.4896, maritime: true, zone: 'Régions' },
  touba: { nom: 'Touba / Mbacké', lat: 14.8647, lon: -15.8756, maritime: false, zone: 'Bassin Arachidier' },
  diourbel: { nom: 'Diourbel', lat: 14.6500, lon: -16.2333, maritime: false, zone: 'Bassin Arachidier' },
  kaolack: { nom: 'Kaolack', lat: 14.1500, lon: -16.0833, maritime: false, zone: 'Bassin Arachidier' },
  fatick: { nom: 'Fatick', lat: 14.3333, lon: -16.4167, maritime: false, zone: 'Bassin Arachidier' },
  kaffrine: { nom: 'Kaffrine', lat: 14.1059, lon: -15.5414, maritime: false, zone: 'Bassin Arachidier' },
  louga: { nom: 'Louga', lat: 15.6186, lon: -16.2244, maritime: false, zone: 'Régions' },
  ziguinchor: { nom: 'Ziguinchor', lat: 12.5833, lon: -16.2719, maritime: true, zone: 'Casamance' },
  'cap-skirring': { nom: 'Cap Skirring', lat: 12.3667, lon: -16.7500, maritime: true, zone: 'Casamance' },
  kolda: { nom: 'Kolda', lat: 12.8833, lon: -14.9500, maritime: false, zone: 'Casamance' },
  sedhiou: { nom: 'Sédhiou', lat: 12.7081, lon: -15.5569, maritime: false, zone: 'Casamance' },
  tambacounda: { nom: 'Tambacounda', lat: 13.7667, lon: -13.6667, maritime: false, zone: 'Sénégal Oriental' },
  kedougou: { nom: 'Kédougou', lat: 12.5564, lon: -12.1747, maritime: false, zone: 'Sénégal Oriental' },
  matam: { nom: 'Matam', lat: 15.6558, lon: -13.2553, maritime: false, zone: 'Fouta' },
};

function normaliserTexte(str) {
  return (str || '')
    .replace(/[œŒ]/g, 'oe')
    .replace(/[æÆ]/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\/\-_,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Rétrocompatibilité
const VILLES_SENEGAL = LOCALITES_SENEGAL;

// Cache mémoire pour économiser le réseau (TTL 20 minutes)
const cacheMeteo = new Map();
const TTL_CACHE_MS = 20 * 60 * 1000;

/**
 * Trouve la localité la plus proche d'un point GPS donné
 */
function trouverLocalitePlusProche(lat, lon) {
  let minDistance = Infinity;
  let plusProche = LOCALITES_SENEGAL.dakar;
  for (const key of Object.keys(LOCALITES_SENEGAL)) {
    const loc = LOCALITES_SENEGAL[key];
    const dLat = loc.lat - lat;
    const dLon = loc.lon - lon;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < minDistance) {
      minDistance = dist;
      plusProche = loc;
    }
  }
  return plusProche;
}

// SRG-A4-015 / D53 : calculerMareeDakar et estimerQualiteAirDakar rendaient deux horaires de marée fixes et deux indices
// de qualité de l'air (45 ou 95 selon le mois), sans aucune source. D57, D65 : la météo vient de MET Norway, les marées
// et la qualité de l'air d'Open-Meteo (sources-externes.js). Une source absente ou muette laisse son champ à null :
// l'écran affiche « indisponible ».
const { directionVent } = sources;

// Dernier relevé réellement reçu par localité (D43) : servi daté et marqué « non actualisé » quand la source ne répond pas.
const derniersReleves = new Map();

/**
 * Fournit les données météo en temps réel (support ville ou coordonnées GPS)
 * @param {string|Object} options - nom de ville/quartier ou { lat, lon, ville }
 */
async function getMeteo(options = 'Dakar') {
  let lat = 14.6937;
  let lon = -17.4441;
  let nomAffiche = 'Dakar';
  let isMaritime = true;
  let cacheKey = 'dakar';
  let estPositionGps = false;
  let zoneNom = 'Dakar';

  if (typeof options === 'object' && options !== null && options.lat && options.lon) {
    lat = parseFloat(options.lat);
    lon = parseFloat(options.lon);
    estPositionGps = true;
    cacheKey = `gps_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const plusProche = trouverLocalitePlusProche(lat, lon);
    nomAffiche = `${plusProche.nom}`;
    isMaritime = plusProche.maritime;
    zoneNom = plusProche.zone || 'Dakar';
  } else {
    const rawVille = typeof options === 'string' ? options : (options?.ville || 'Dakar');
    const cleNormalisee = normaliserTexte(rawVille);

    // Recherche de correspondance dans le catalogue
    let matched = null;
    // Passe 1 : correspondance exacte directe
    for (const [key, item] of Object.entries(LOCALITES_SENEGAL)) {
      const itemNorm = normaliserTexte(item.nom);
      if (key === cleNormalisee || itemNorm === cleNormalisee || item.nom.toLowerCase().trim() === rawVille.toLowerCase().trim()) {
        matched = item;
        break;
      }
    }

    // Passe 2 : correspondance par sous-partie (ex: 'ngor', 'saly', 'mamelles')
    if (!matched) {
      for (const [key, item] of Object.entries(LOCALITES_SENEGAL)) {
        const parts = item.nom.split('/').map((p) => normaliserTexte(p));
        if (parts.some((p) => p === cleNormalisee)) {
          matched = item;
          break;
        }
      }
    }

    // Passe 3 : correspondance partielle avec priorité au nom le plus spécifique
    if (!matched) {
      const entries = Object.entries(LOCALITES_SENEGAL).sort((a, b) => b[1].nom.length - a[1].nom.length);
      for (const [key, item] of entries) {
        const itemNorm = normaliserTexte(item.nom);
        if (itemNorm.includes(cleNormalisee) || cleNormalisee.includes(itemNorm) || key.includes(cleNormalisee)) {
          matched = item;
          break;
        }
      }
    }

    if (!matched) {
      matched = LOCALITES_SENEGAL.dakar;
    }

    lat = matched.lat;
    lon = matched.lon;
    nomAffiche = matched.nom;
    isMaritime = matched.maritime;
    zoneNom = matched.zone || 'Dakar';
    cacheKey = nomAffiche.toLowerCase();
  }

  const cacheItem = cacheMeteo.get(cacheKey);
  if (cacheItem && Date.now() - cacheItem.timestamp < TTL_CACHE_MS) {
    return cacheItem.data;
  }

  try {
    const releve = await sources.lireMeteo(lat, lon);
    if (!releve) throw new Error('Réponse météo inexploitable');
    // Marées (localités du littoral) et qualité de l'air : chacune vaut null si sa source est éteinte ou muette.
    const [maree, qualite_air] = await Promise.all([
      isMaritime ? sources.lireMaree(lat, lon) : null,
      sources.lireQualiteAir(lat, lon),
    ]);

    const payload = {
      ville: nomAffiche,
      zone: zoneNom,
      region: zoneNom,
      est_gps: estPositionGps,
      is_gps: estPositionGps,
      coordonnees: { lat, lon },
      ...releve,
      qualite_air,
      maree,
    };

    cacheMeteo.set(cacheKey, { timestamp: Date.now(), data: payload });
    derniersReleves.set(cacheKey, payload);
    return payload;
  } catch (err) {
    // SRG-A2-009 / D43 : l'ancien repli servait « 28 °C, Ensoleillé, Station locale » daté de l'instant de l'appel.
    // La source ne répond pas : dernière prévision reçue, datée et marquée, ou rien. La marée et la qualité de l'air
    // de ce relevé ne sont plus servies : elles décrivaient l'heure où il a été reçu.
    console.warn('[SURGA METEO] Source indisponible :', err.message);
    const dernier = derniersReleves.get(cacheKey);
    return dernier ? { ...dernier, maree: null, qualite_air: null, non_actualise: true } : null;
  }
}

module.exports = {
  getMeteo,
  VILLES_SENEGAL,
  LOCALITES_SENEGAL,
  trouverLocalitePlusProche,
  directionVent,
};
