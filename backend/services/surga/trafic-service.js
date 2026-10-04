// backend/services/surga/trafic-service.js
// Service de suivi, prévision déterministe et signalements du trafic routier à Dakar
// Intégration en temps réel TomTom Traffic API (Routing & Incidents) avec cache intelligent Low-Data
// Conforme philosophie Surga / Nopalou : Low-Data, Zéro Emoji, Vouvoiement strict D19

const axios = require('axios');

let pool = null;
try {
  pool = require('../../db');
} catch {
  // Mode offline ou test unitaire sans DB
}

/**
 * Corridors routiers et transports structurants majeurs de la presqu'île de Dakar
 * Avec coordonnées d'origine et destination GPS pour interrogation directe TomTom en temps réel.
 */
const AXES_ROUTIERS_DAKAR = [
  {
    id: 'a1-entrant',
    nom: 'Autoroute A1 (Sens Entrant vers Centre-Ville)',
    origine: 'Diamniadio / Rufisque',
    destination: 'Plateau / Centre-Ville',
    type: 'autoroute',
    sens: 'entrant',
    tempsHabituelMin: 28,
    distanceKm: 33.4,
    from: '14.7167,-17.2667',
    to: '14.6700,-17.4300',
    coords: { lat: 14.7175, lon: -17.436 },
    pointsChauds: ['Péage Thiaroye', 'Sortie Hann Maristes', 'Colobane'],
  },
  {
    id: 'a1-sortant',
    nom: 'Autoroute A1 (Sens Sortant vers Banlieue / AIBD)',
    origine: 'Plateau / Colobane',
    destination: 'Rufisque / Diamniadio',
    type: 'autoroute',
    sens: 'sortant',
    tempsHabituelMin: 26,
    distanceKm: 32.1,
    from: '14.6700,-17.4300',
    to: '14.7167,-17.2667',
    coords: { lat: 14.757, lon: -17.375 },
    pointsChauds: ['Échangeur Patte d’Oie', 'Sortie Pikine', 'Gare de péage'],
  },
  {
    id: 'vdn-sud',
    nom: 'VDN (Sens Nord ➔ Sud vers Mermoz & Centre)',
    origine: 'CICES / Guédiawaye',
    destination: 'Mermoz / Fann / Plateau',
    type: 'voie_express',
    sens: 'entrant',
    tempsHabituelMin: 8,
    distanceKm: 6.6,
    from: '14.7430,-17.4720',
    to: '14.6950,-17.4600',
    coords: { lat: 14.712, lon: -17.468 },
    pointsChauds: ['Rond-Point Sacré Cœur', 'Croisement Mermoz'],
  },
  {
    id: 'vdn-nord',
    nom: 'VDN (Sens Sud ➔ Nord vers Foire & Banlieue)',
    origine: 'Mermoz / Sacré Cœur',
    destination: 'CICES / Golf / Guédiawaye',
    type: 'voie_express',
    sens: 'sortant',
    tempsHabituelMin: 11,
    distanceKm: 9.3,
    from: '14.6950,-17.4600',
    to: '14.7430,-17.4720',
    coords: { lat: 14.743, lon: -17.472 },
    pointsChauds: ['Échangeur Foire', 'CICES', 'Golf Club'],
  },
  {
    id: 'corniche-ouest-sud',
    nom: 'Corniche Ouest (Vers Soumbédioune & Plateau)',
    origine: 'Almadies / Ouakam',
    destination: 'Plateau / Centre-Ville',
    type: 'corniche',
    sens: 'entrant',
    tempsHabituelMin: 18,
    distanceKm: 13.6,
    from: '14.7450,-17.5150',
    to: '14.6700,-17.4300',
    coords: { lat: 14.685, lon: -17.466 },
    pointsChauds: ['Fann Résidence', 'Tunnel de Soumbédioune', 'Magic Land'],
  },
  {
    id: 'corniche-ouest-nord',
    nom: 'Corniche Ouest (Vers Ouakam & Almadies)',
    origine: 'Plateau',
    destination: 'Almadies / Ngor',
    type: 'corniche',
    sens: 'sortant',
    tempsHabituelMin: 18,
    distanceKm: 13.8,
    from: '14.6700,-17.4300',
    to: '14.7450,-17.5150',
    coords: { lat: 14.698, lon: -17.472 },
    pointsChauds: ['Sortie Porte du Millénaire', 'Mosquée de la Divinité'],
  },
  {
    id: 'rn1-rufisque',
    nom: 'Route de Rufisque (RN1)',
    origine: 'Colobane',
    destination: 'Rufisque',
    type: 'nationale',
    sens: 'mixte',
    tempsHabituelMin: 22,
    distanceKm: 27.9,
    from: '14.7088,-17.4372',
    to: '14.7167,-17.2667',
    coords: { lat: 14.752, lon: -17.391 },
    pointsChauds: ['Bout-Clair Thiaroye', 'Mbao', 'Poste Thiaroye'],
  },
  {
    id: 'patte-doie-echangeur',
    nom: 'Échangeur Patte d’Oie & Pont Sénégal92',
    origine: 'Grand Dakar',
    destination: 'Parcelles Assainies / Yoff',
    type: 'echangeur',
    sens: 'carrefour',
    tempsHabituelMin: 15,
    distanceKm: 8.9,
    from: '14.7050,-17.4500',
    to: '14.7600,-17.4400',
    coords: { lat: 14.733, lon: -17.447 },
    pointsChauds: ['Rond-point 26', 'Stade Léopold Sédar Senghor'],
  },
  {
    id: 'ter-dakar',
    nom: 'Train Express Régional (TER)',
    origine: 'Gare de Dakar',
    destination: 'Diamniadio',
    type: 'ferroviaire',
    sens: 'bidirectionnel',
    tempsHabituelMin: 20,
    distanceKm: 36,
    from: null,
    to: null,
    coords: null,
    pointsChauds: ['Gare Thiaroye', 'Gare Rufisque'],
  },
  {
    id: 'brt-dakar',
    nom: 'Bus Rapid Transit (BRT)',
    origine: 'Petersen (Gare Papa Guèye Fall)',
    destination: 'Préfecture de Guédiawaye',
    type: 'bus_site_propre',
    sens: 'bidirectionnel',
    tempsHabituelMin: 45,
    distanceKm: 18,
    from: null,
    to: null,
    coords: null,
    pointsChauds: ['Voies dédiées 100% séparées'],
  },
];

// Pause utilitaire pour respecter le burst rate limit TomTom (5 requêtes/seconde max)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cache mémoire serveur avec TTL (6 min) pour respecter strictement les 2 500 requêtes gratuites/jour TomTom
const CACHE_TTL_MS = 6 * 60 * 1000;
let cacheTraficTomTom = {
  timestamp: 0,
  axesData: new Map(),
  incidents: [],
};

/**
 * Interroger TomTom Routing avec trafic en temps réel pour un corridor
 * @param {string} from - 'lat,lon'
 * @param {string} to - 'lat,lon'
 * @param {string} apiKey
 * @returns {Promise<Object|null>}
 */
async function interrogerTomTomCorridor(from, to, apiKey) {
  if (!apiKey || !from || !to) return null;
  try {
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${from}:${to}/json?traffic=true&computeTravelTimeFor=all&key=${encodeURIComponent(apiKey)}`;
    const res = await axios.get(url, { timeout: 4500 });
    const s = res.data?.routes?.[0]?.summary;
    if (!s) return null;

    const distanceKm = Math.round(s.lengthInMeters / 100) / 10;
    const tempsEstimeMin = Math.round(s.travelTimeInSeconds / 60);
    const tempsSansTraficMin = Math.round(s.noTrafficTravelTimeInSeconds / 60) || tempsEstimeMin;
    const retardMin = Math.round(s.trafficDelayInSeconds / 60);
    const vitesseReelleKmH = s.travelTimeInSeconds > 0 ? Math.round(distanceKm / (s.travelTimeInSeconds / 3600)) : 50;
    const vitesseNormaleKmH = s.noTrafficTravelTimeInSeconds > 0 ? Math.round(distanceKm / (s.noTrafficTravelTimeInSeconds / 3600)) : vitesseReelleKmH;

    return {
      distanceKm,
      tempsEstimeMin,
      tempsSansTraficMin,
      retardMin,
      vitesseReelleKmH,
      vitesseNormaleKmH,
      trafficLengthMeters: s.trafficLengthInMeters || 0,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Récupérer les incidents TomTom récents sur la presqu'île de Dakar
 * @param {string} apiKey
 * @returns {Promise<Array>}
 */
async function interrogerTomTomIncidents(apiKey) {
  if (!apiKey) return [];
  try {
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=-17.53,14.65,-17.25,14.80&fields={incidents{type,properties{iconCategory,magnitudeOfDelay,events{description},from,to,length}}}&language=fr-FR&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11,14&key=${encodeURIComponent(apiKey)}`;
    const res = await axios.get(url, { timeout: 4000 });
    const incidentsRaw = res.data?.incidents || [];
    return incidentsRaw.slice(0, 5).map((inc, i) => {
      const p = inc.properties || {};
      const desc = p.events?.[0]?.description || 'Incident de circulation signalé';
      return {
        id: 'tt-inc-' + i,
        description: desc,
        delaySec: p.magnitudeOfDelay || 0,
        from: p.from || '',
        to: p.to || '',
      };
    });
  } catch {
    return [];
  }
}

/**
 * Actualiser le cache TomTom Live si le TTL est dépassé
 * @param {string} apiKey
 */
async function actualiserDonneesTomTomSiNecessaire(apiKey) {
  const maintenant = Date.now();
  if (maintenant - cacheTraficTomTom.timestamp < CACHE_TTL_MS && cacheTraficTomTom.axesData.size > 0) {
    return cacheTraficTomTom;
  }

  const mapAxes = new Map();
  const axesRoutiers = AXES_ROUTIERS_DAKAR.filter((a) => a.from && a.to);

  // Exécution séquencée avec petite pause pour ne jamais dépasser le burst limit (QPS <= 5)
  for (const axe of axesRoutiers) {
    const data = await interrogerTomTomCorridor(axe.from, axe.to, apiKey);
    if (data) {
      mapAxes.set(axe.id, data);
    }
    await sleep(220);
  }

  const incidents = await interrogerTomTomIncidents(apiKey);

  if (mapAxes.size > 0) {
    cacheTraficTomTom = {
      timestamp: maintenant,
      axesData: mapAxes,
      incidents,
    };
  }

  return cacheTraficTomTom;
}

/**
 * Calcul déterministe de l'état du trafic selon l'heure à Dakar (UTC/GMT)
 * @param {Object} axe
 * @param {Date} [dateRef]
 * @returns {{ niveau: 'fluide'|'dense'|'bouche', tempsEstimeMin: number, cause: string }}
 */
function evaluerEtatTheoriqueAxe(axe, dateRef = new Date()) {
  const heures = dateRef.getUTCHours();
  const minutes = dateRef.getUTCMinutes();
  const heureDecimale = heures + minutes / 60;
  const jourSemaine = dateRef.getUTCDay(); // 0 = Dimanche, 6 = Samedi

  // Le TER et le BRT roulent sur site propre dédié (fluides par défaut sauf incident)
  if (axe.type === 'ferroviaire' || axe.type === 'bus_site_propre') {
    return {
      niveau: 'fluide',
      tempsEstimeMin: axe.tempsHabituelMin,
      cause: 'Voie dédiée indépendante du trafic routier',
    };
  }

  // Le dimanche à Dakar : circulation généralement fluide
  if (jourSemaine === 0) {
    return {
      niveau: 'fluide',
      tempsEstimeMin: axe.tempsHabituelMin,
      cause: 'Circulation dominicale fluide',
    };
  }

  // Du lundi au samedi : heures de pointe à Dakar
  const estPointeMatin = heureDecimale >= 7.0 && heureDecimale <= 9.5;
  const estPointeSoir = heureDecimale >= 17.0 && heureDecimale <= 20.0;
  const estMidi = heureDecimale >= 13.0 && heureDecimale <= 14.5;

  if (estPointeMatin) {
    if (axe.sens === 'entrant') {
      const tempsEstime = Math.round(axe.tempsHabituelMin * 2.3);
      return {
        niveau: 'bouche',
        tempsEstimeMin: tempsEstime,
        cause: 'Heure de pointe matinale vers le Plateau',
      };
    }
    if (axe.sens === 'carrefour') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.8),
        cause: 'Ralentissement au carrefour stratégique',
      };
    }
  }

  if (estPointeSoir) {
    if (axe.sens === 'sortant') {
      const tempsEstime = Math.round(axe.tempsHabituelMin * 2.2);
      return {
        niveau: 'bouche',
        tempsEstimeMin: tempsEstime,
        cause: 'Heure de pointe du soir vers la banlieue',
      };
    }
    if (axe.sens === 'carrefour') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.7),
        cause: 'Sortie de ville encombrée',
      };
    }
  }

  if (estMidi) {
    if (axe.id === 'patte-doie-echangeur' || axe.id === 'rn1-rufisque') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.4),
        cause: 'Trafic soutenu en milieu de journée',
      };
    }
  }

  return {
    niveau: 'fluide',
    tempsEstimeMin: axe.tempsHabituelMin,
    cause: 'Conditions de circulation fluides',
  };
}

/**
 * Récupérer l'état de tous les axes avec prise en compte du flux TomTom Live et des signalements récents
 * @param {Object} [options]
 * @param {Date} [options.dateRef]
 * @param {string} [options.apiKey]
 * @returns {Promise<{ axes: Array, incidents: Array, source: 'tomtom_live'|'previsionnel', derniereMiseAJour: string }>}
 */
async function getEtatTraficComplet(options = {}) {
  const apiKey = options.apiKey || process.env.TOMTOM_API_KEY || null;
  const dateRef = options.dateRef || new Date();

  // 1. Tenter le chargement TomTom Live si la clé est fournie
  let tomtomData = null;
  if (apiKey) {
    try {
      tomtomData = await actualiserDonneesTomTomSiNecessaire(apiKey);
    } catch (e) {
      // TomTom hors ligne -> bascule automatique
    }
  }

  // 2. Charger les signalements communautaires récents (< 45 minutes)
  const signalementsRecents = new Map();
  if (pool) {
    try {
      const resSig = await pool.query(`
        SELECT axe_id, type_signalement, commentaire, created_at
        FROM surga_trafic_signalements
        WHERE created_at >= NOW() - INTERVAL '45 minutes'
        ORDER BY created_at DESC
      `);
      for (const row of resSig.rows) {
        if (!signalementsRecents.has(row.axe_id)) {
          signalementsRecents.set(row.axe_id, row);
        }
      }
    } catch (e) {
      // Tolérance offline / fallback
    }
  }

  let nbAxesLive = 0;

  const axes = AXES_ROUTIERS_DAKAR.map((axe) => {
    const theorique = evaluerEtatTheoriqueAxe(axe, dateRef);
    const signalement = signalementsRecents.get(axe.id);
    const liveCorridor = tomtomData?.axesData?.get(axe.id);

    let niveauFinal = theorique.niveau;
    let tempsFinal = theorique.tempsEstimeMin;
    let causeFinale = theorique.cause;
    let incident = null;
    let source = 'previsionnel';
    let vitesseReelleKmH = null;
    let vitesseNormaleKmH = null;
    let distanceFinale = axe.distanceKm;

    // Prise en compte prioritaire du flux TomTom Live
    if (liveCorridor) {
      nbAxesLive++;
      source = 'tomtom_live';
      tempsFinal = liveCorridor.tempsEstimeMin;
      distanceFinale = liveCorridor.distanceKm;
      vitesseReelleKmH = liveCorridor.vitesseReelleKmH;
      vitesseNormaleKmH = liveCorridor.vitesseNormaleKmH;

      if (liveCorridor.retardMin >= 15 || (vitesseNormaleKmH > 0 && vitesseReelleKmH / vitesseNormaleKmH <= 0.45)) {
        niveauFinal = 'bouche';
        causeFinale = `Bouchon mesuré en direct : +${liveCorridor.retardMin} min de retard (${vitesseReelleKmH} km/h)`;
      } else if (liveCorridor.retardMin >= 5 || (vitesseNormaleKmH > 0 && vitesseReelleKmH / vitesseNormaleKmH <= 0.75)) {
        niveauFinal = 'dense';
        causeFinale = `Ralentissement direct : +${liveCorridor.retardMin} min (${vitesseReelleKmH} km/h)`;
      } else {
        niveauFinal = 'fluide';
        causeFinale = `Circulation fluide en direct (${vitesseReelleKmH} km/h mesurés)`;
      }
    }

    // Les signalements communautaires récents d'accidents restent prioritaires pour alerter
    if (signalement) {
      if (signalement.type_signalement === 'accident' || signalement.type_signalement === 'bloque') {
        niveauFinal = 'bouche';
        tempsFinal = Math.max(tempsFinal, Math.round(axe.tempsHabituelMin * 2.5));
        causeFinale = signalement.commentaire || 'Accident ou blocage signalé';
        incident = 'accident';
      } else if (signalement.type_signalement === 'dense') {
        if (niveauFinal === 'fluide') niveauFinal = 'dense';
        tempsFinal = Math.max(tempsFinal, Math.round(axe.tempsHabituelMin * 1.5));
        causeFinale = signalement.commentaire || 'Ralentissement signalé par les usagers';
        incident = 'ralentissement';
      } else if (signalement.type_signalement === 'fluide' && !liveCorridor) {
        niveauFinal = 'fluide';
        tempsFinal = axe.tempsHabituelMin;
        causeFinale = 'Axe signalé fluide récemment';
      }
    }

    return {
      id: axe.id,
      nom: axe.nom,
      origine: axe.origine,
      destination: axe.destination,
      type: axe.type,
      sens: axe.sens,
      niveau: niveauFinal,
      tempsEstimeMin: tempsFinal,
      tempsHabituelMin: axe.tempsHabituelMin,
      distanceKm: distanceFinale,
      pointsChauds: axe.pointsChauds,
      incident,
      cause: causeFinale,
      source,
      vitesseReelleKmH,
      vitesseNormaleKmH,
      signalementRecent: signalement
        ? {
            type: signalement.type_signalement,
            commentaire: signalement.commentaire,
            date: signalement.created_at,
          }
        : null,
      updatedAt: new Date().toISOString(),
    };
  });

  const sourceGlobale = nbAxesLive > 0 ? 'tomtom_live' : 'previsionnel';
  const incidents = tomtomData?.incidents || [];

  return {
    axes,
    incidents,
    source: sourceGlobale,
    derniereMiseAJour: new Date().toISOString(),
  };
}

/**
 * Rédiger une synthèse concise et oralisable du trafic pour le briefing quotidien
 * Respect strict de la décision D19 (vouvoiement) et zéro émoji.
 * @param {Array} etatAxes
 * @param {string} [quartier]
 * @returns {string}
 */
function genererSyntheseBriefingTrafic(etatAxes, quartier = 'Dakar') {
  if (!Array.isArray(etatAxes)) return 'Circulation normale à Dakar.';

  const axesBouchés = etatAxes.filter((a) => a.niveau === 'bouche');
  const axesDenses = etatAxes.filter((a) => a.niveau === 'dense');
  const ter = etatAxes.find((a) => a.id === 'ter-dakar');
  const brt = etatAxes.find((a) => a.id === 'brt-dakar');

  if (axesBouchés.length === 0 && axesDenses.length === 0) {
    return 'Circulation globale fluide ce matin sur les principaux axes de Dakar. Le TER et le BRT fonctionnent normalement.';
  }

  const morceaux = [];
  if (axesBouchés.length > 0) {
    const premier = axesBouchés[0];
    const nomAxe = premier.nom.split('(')[0].trim();
    morceaux.push(
      `Forte affluence sur ${nomAxe} avec environ ${premier.tempsEstimeMin} minutes de trajet (contre ${premier.tempsHabituelMin} minutes habituellement).`
    );
  }

  if (axesDenses.length > 0) {
    const premierDense = axesDenses[0];
    const nomAxe = premierDense.nom.split('(')[0].trim();
    morceaux.push(`Ralentissements habituels constatés sur ${nomAxe}.`);
  }

  if (ter && ter.niveau === 'fluide' && brt && brt.niveau === 'fluide') {
    morceaux.push('Les lignes TER et BRT restent recommandées pour vos déplacements rapides.');
  }

  return morceaux.join(' ');
}

/**
 * Enregistrer un signalement communautaire d'usager
 * @param {Object} donnees
 * @param {string} donnees.axeId
 * @param {string} donnees.typeSignalement - 'fluide' | 'dense' | 'bloque' | 'accident' | 'travaux'
 * @param {string} [donnees.commentaire]
 * @param {string} [donnees.userId]
 * @returns {Promise<Object>}
 */
async function enregistrerSignalement({ axeId, typeSignalement, commentaire, userId }) {
  const axeExiste = AXES_ROUTIERS_DAKAR.find((a) => a.id === axeId);
  if (!axeExiste) {
    throw new Error('Axe routier non reconnu');
  }

  const typesValides = ['fluide', 'dense', 'bloque', 'accident', 'travaux'];
  if (!typesValides.includes(typeSignalement)) {
    throw new Error('Type de signalement invalide');
  }

  const comPropre = commentaire ? commentaire.replace(/<[^>]*>/g, '').slice(0, 180).trim() : '';

  if (pool) {
    const res = await pool.query(
      `INSERT INTO surga_trafic_signalements (axe_id, user_id, type_signalement, commentaire)
       VALUES ($1, $2, $3, $4)
       RETURNING id, axe_id, type_signalement, commentaire, created_at`,
      [axeId, userId || null, typeSignalement, comPropre]
    );
    return res.rows[0];
  }

  return {
    id: 'sig-local-' + Date.now(),
    axe_id: axeId,
    type_signalement: typeSignalement,
    commentaire: comPropre,
    created_at: new Date().toISOString(),
  };
}

module.exports = {
  AXES_ROUTIERS_DAKAR,
  evaluerEtatTheoriqueAxe,
  getEtatTraficComplet,
  genererSyntheseBriefingTrafic,
  enregistrerSignalement,
  interrogerTomTomCorridor,
  interrogerTomTomIncidents,
};
