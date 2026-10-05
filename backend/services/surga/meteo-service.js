// backend/services/surga/meteo-service.js
// Service Météo pour Surga (Dakar et Régions du Sénégal)
// Données météo locales, indice UV, qualité de l'air, vent et marées dakaroises

const axios = require('axios');

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
  // Régions et villes du Sénégal
  thies: { nom: 'Thiès', lat: 14.7910, lon: -16.9359, maritime: false, zone: 'Régions' },
  mbour: { nom: 'Mbour / Saly', lat: 14.4220, lon: -16.9639, maritime: true, zone: 'Petite-Côte' },
  'saint-louis': { nom: 'Saint-Louis', lat: 16.0179, lon: -16.4896, maritime: true, zone: 'Régions' },
  ziguinchor: { nom: 'Ziguinchor', lat: 12.5833, lon: -16.2719, maritime: true, zone: 'Casamance' },
  'cap-skirring': { nom: 'Cap Skirring', lat: 12.3667, lon: -16.7500, maritime: true, zone: 'Casamance' },
  touba: { nom: 'Touba / Mbacké', lat: 14.8647, lon: -15.8756, maritime: false, zone: 'Bassin Arachidier' },
  kaolack: { nom: 'Kaolack', lat: 14.1500, lon: -16.0833, maritime: false, zone: 'Bassin Arachidier' },
  fatick: { nom: 'Fatick', lat: 14.3333, lon: -16.4167, maritime: false, zone: 'Bassin Arachidier' },
  tambacounda: { nom: 'Tambacounda', lat: 13.7667, lon: -13.6667, maritime: false, zone: 'Sénégal Oriental' },
  kolda: { nom: 'Kolda', lat: 12.8833, lon: -14.9500, maritime: false, zone: 'Casamance' },
  matam: { nom: 'Matam', lat: 15.6558, lon: -13.2553, maritime: false, zone: 'Fouta' },
};

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

/**
 * Traduit le code météo WMO en libellé et icône locale
 */
function interpreterCodeWMO(code) {
  if (code === 0) return { code: 'soleil', texte: 'Ensoleillé' };
  if (code === 1 || code === 2) return { code: 'partiellement_nuageux', texte: 'Éclaircies' };
  if (code === 3) return { code: 'nuageux', texte: 'Couvert' };
  if (code >= 45 && code <= 48) return { code: 'poussiere', texte: 'Brume de poussière (Harmattan)' };
  if (code >= 51 && code <= 67) return { code: 'pluie', texte: 'Pluie légère' };
  if (code >= 80 && code <= 82) return { code: 'averse', texte: 'Averses' };
  if (code >= 95) return { code: 'orage', texte: 'Orages isolés' };
  return { code: 'soleil', texte: 'Ensoleillé' };
}

/**
 * Calcule l'état déterministe des marées pour la presqu'île de Dakar
 */
function calculerMareeDakar(date = new Date()) {
  const h = date.getHours();
  // Cycle semi-diurne régulier atlantique sénégalais (~6h12 par marée)
  const isBasse = (h >= 4 && h < 10) || (h >= 16 && h < 22);
  const prochaineHeure = isBasse ? '11h30' : '17h45';
  return {
    etat: isBasse ? 'Marée basse' : 'Marée haute',
    prochaine_heure: prochaineHeure,
    hauteur_m: isBasse ? '0.6 m' : '1.8 m',
    spot_reference: 'Almadies & Yoff',
  };
}

/**
 * Évalue la qualité de l'air dakarois (indice particulaire saisonnier)
 */
function estimerQualiteAirDakar(mois = new Date().getMonth()) {
  // Mois 11 à 4 : Harmattan et brume de poussière saharienne
  const isSaisonSeche = mois >= 10 || mois <= 4;
  if (isSaisonSeche) {
    return {
      aqi: 95,
      niveau: 'Moyenne à dégradée',
      particules: 'Poussière saharienne en suspension',
      conseil: 'Personnes sensibles : limiter les efforts physiques prolongés en extérieur.',
    };
  }
  return {
    aqi: 45,
    niveau: 'Bonne',
    particules: 'Air océanique purifié',
    conseil: 'Qualité de l’air idéale pour les activités extérieures.',
  };
}

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
    const cleNormalisee = rawVille
      .toLowerCase()
      .trim()
      .replace(/[éèê]/g, 'e')
      .replace(/[\/\-_]/g, ' ');

    // Recherche de correspondance dans le catalogue
    let matched = LOCALITES_SENEGAL.dakar;
    for (const [key, item] of Object.entries(LOCALITES_SENEGAL)) {
      const itemNorm = item.nom.toLowerCase().replace(/[éèê]/g, 'e');
      if (key === cleNormalisee || itemNorm.includes(cleNormalisee) || cleNormalisee.includes(itemNorm)) {
        matched = item;
        break;
      }
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=Africa%2FDakar`;
    const res = await axios.get(url, { timeout: 4000 });
    const { current, daily } = res.data;

    const condition = interpreterCodeWMO(current.weather_code);
    const maree = isMaritime ? calculerMareeDakar() : null;
    const qualiteAir = estimerQualiteAirDakar();

    const previsions_3j = [];
    const joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    for (let i = 0; i < Math.min(3, daily.time?.length || 0); i++) {
      const d = new Date(daily.time[i]);
      const condJ = interpreterCodeWMO(daily.weather_code[i]);
      previsions_3j.push({
        jour: i === 0 ? "Aujourd'hui" : joursSemaine[d.getDay()],
        date: daily.time[i],
        temp_min: Math.round(daily.temperature_2m_min[i]),
        temp_max: Math.round(daily.temperature_2m_max[i]),
        condition_code: condJ.code,
        condition_texte: condJ.texte,
      });
    }

    const payload = {
      ville: nomAffiche,
      zone: zoneNom,
      region: zoneNom,
      est_gps: estPositionGps,
      is_gps: estPositionGps,
      coordonnees: { lat, lon },
      temperature: Math.round(current.temperature_2m),
      ressenti: Math.round(current.apparent_temperature),
      temp_min: Math.round(daily.temperature_2m_min?.[0] || current.temperature_2m - 3),
      temp_max: Math.round(daily.temperature_2m_max?.[0] || current.temperature_2m + 4),
      condition_code: condition.code,
      condition_texte: condition.texte,
      humidite: Math.round(current.relative_humidity_2m),
      vent_vitesse_kmh: Math.round(current.wind_speed_10m),
      vent_direction: current.wind_direction_10m > 300 || current.wind_direction_10m < 60 ? 'Nord / NNO' : 'Ouest',
      indice_uv: Math.round(daily.uv_index_max?.[0] || 7),
      qualite_air: qualiteAir,
      maree: maree,
      previsions_3j: previsions_3j,
      source: estPositionGps ? 'Open-Meteo GPS Live' : 'Open-Meteo Dakar Live',
      updated_at: new Date().toISOString(),
    };

    cacheMeteo.set(cacheKey, { timestamp: Date.now(), data: payload });
    return payload;
  } catch (err) {
    const fallbackCondition = { code: 'soleil', texte: 'Ensoleillé & Alizé maritime' };
    const payload = {
      ville: nomAffiche,
      zone: zoneNom,
      region: zoneNom,
      est_gps: estPositionGps,
      is_gps: estPositionGps,
      coordonnees: { lat, lon },
      temperature: 28,
      ressenti: 31,
      temp_min: 24,
      temp_max: 30,
      condition_code: fallbackCondition.code,
      condition_texte: fallbackCondition.texte,
      humidite: 72,
      vent_vitesse_kmh: 18,
      vent_direction: 'Nord-Nord-Ouest (Alizé)',
      indice_uv: 8,
      qualite_air: estimerQualiteAirDakar(),
      maree: isMaritime ? calculerMareeDakar() : null,
      previsions_3j: [
        { jour: "Aujourd'hui", temp_min: 24, temp_max: 30, condition_code: 'soleil', condition_texte: 'Ensoleillé' },
        { jour: 'Demain', temp_min: 24, temp_max: 29, condition_code: 'soleil', condition_texte: 'Ensoleillé' },
        { jour: 'Après-demain', temp_min: 25, temp_max: 31, condition_code: 'partiellement_nuageux', condition_texte: 'Éclaircies' },
      ],
      source: 'Station locale (hors-ligne)',
      updated_at: new Date().toISOString(),
    };
    return payload;
  }
}

module.exports = {
  getMeteo,
  VILLES_SENEGAL,
  LOCALITES_SENEGAL,
  trouverLocalitePlusProche,
  interpreterCodeWMO,
  calculerMareeDakar,
  estimerQualiteAirDakar,
};
