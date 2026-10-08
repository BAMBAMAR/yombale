// backend/services/surga/trafic-service.js
// Service de suivi, prévision déterministe et signalements du trafic routier à Dakar
// Mesures par l'API d'itinéraires de Google sur six axes (trafic-mesures.js, D71) et signalements des usagers
// Conforme philosophie Surga / Nopalou : Low-Data, Zéro Emoji, Vouvoiement strict D19

const axios = require('axios');
const mesuresTrafic = require('./trafic-mesures');

let pool = null;
try {
  const dbModule = require('../../models/db');
  pool = dbModule.pool || dbModule;
} catch {
  // Mode offline ou test unitaire sans DB
}

/**
 * Corridors routiers et transports structurants majeurs de la presqu'île de Dakar
 * Avec coordonnées d'origine et de destination, pour les axes dont le temps de parcours est mesuré.
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
    id: 'front-de-terre',
    nom: 'Route du Front de Terre (Khar Yalla ➔ Castors / EMG)',
    origine: 'Grand Yoff / Khar Yalla',
    destination: 'Castors / A1 / EMG',
    type: 'voie_express',
    sens: 'mixte',
    tempsHabituelMin: 11,
    distanceKm: 5.2,
    from: '14.7250,-17.4560',
    to: '14.7088,-17.4372',
    coords: { lat: 14.717, lon: -17.446 },
    pointsChauds: ['Croisement Khar Yalla', 'HLM Grand Yoff', 'Castors', 'Raccordement EMG / A1'],
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

// A5-108 : le connecteur TomTom a été retiré. À Dakar, ce fournisseur rend le temps de la route vide.

/**
 * Calcul déterministe de l'état du trafic selon l'heure à Dakar (UTC/GMT)
 * Calibré sur la réalité urbaine dakaroise :
 * - Pointe du matin (06h45 - 10h15) : Sens Entrant saturé vers le Plateau.
 * - Activité continue de milieu de journée (11h30 - 15h00) : RN1 et Patte d'Oie denses.
 * - Grandes sorties d'après-midi & pointe du soir (15h00 - 20h45) : RN1 (Rouge foncé), A1 sortant et Patte d'Oie bouchés.
 * @param {Object} axe
 * @param {Date} [dateRef]
 * @returns {{ niveau: 'fluide'|'dense'|'bouche', tempsEstimeMin: number, vitesseReelleKmH: number, cause: string }}
 */
// D53 : ce modèle n'est plus servi par getEtatTraficComplet. Il reste ici pour l'étalonnage d'une future source.
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
      vitesseReelleKmH: axe.type === 'ferroviaire' ? 100 : 25,
      cause: 'Voie dédiée indépendante du trafic routier',
    };
  }

  // Le dimanche à Dakar : circulation généralement fluide, sauf la Corniche Ouest en fin d'après-midi
  if (jourSemaine === 0) {
    if ((axe.id === 'corniche-ouest-sud' || axe.id === 'corniche-ouest-nord') && heureDecimale >= 16.5 && heureDecimale <= 20.5) {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.5),
        vitesseReelleKmH: 30,
        cause: 'Afflux dominical vers les plages et la Corniche Ouest',
      };
    }
    return {
      niveau: 'fluide',
      tempsEstimeMin: axe.tempsHabituelMin,
      vitesseReelleKmH: Math.round(axe.distanceKm / (axe.tempsHabituelMin / 60)),
      cause: 'Circulation dominicale fluide',
    };
  }

  // Du lundi au samedi : heures de pointe à Dakar
  const estPointeMatin = heureDecimale >= 6.75 && heureDecimale <= 10.25;
  const estMidi = heureDecimale >= 11.5 && heureDecimale < 15.0;
  const estPointeSoir = heureDecimale >= 15.0 && heureDecimale <= 20.75;
  const estSoiree = heureDecimale > 20.75 && heureDecimale <= 22.5;

  // 1. Pointe du Matin (06h45 - 10h15) : afflux massif de la banlieue vers le Plateau
  if (estPointeMatin) {
    if (axe.id === 'a1-entrant') {
      return {
        niveau: 'bouche',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 2.1), // ~59 min
        vitesseReelleKmH: 34,
        cause: 'Heure de pointe matinale vers le Plateau : péage Thiaroye et Maristes saturés',
      };
    }
    if (axe.id === 'rn1-rufisque') {
      return {
        niveau: 'bouche',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 3.3), // ~73 min
        vitesseReelleKmH: 15,
        cause: 'Saturation matinale majeure : camions du Port et transit vers Colobane',
      };
    }
    if (axe.id === 'patte-doie-echangeur') {
      return {
        niveau: 'bouche',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 2.2), // ~33 min
        vitesseReelleKmH: 14,
        cause: 'Ralentissement au carrefour stratégique et Pont Sénégal 92 vers le centre',
      };
    }
    if (axe.id === 'front-de-terre') {
      return {
        niveau: 'bouche',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 2.3), // ~25 min
        vitesseReelleKmH: 12,
        cause: 'Afflux matinal massif vers Castors, HLM et raccordement Autoroute A1',
      };
    }
    if (axe.id === 'vdn-sud') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 2.2), // ~18 min
        vitesseReelleKmH: 22,
        cause: 'Ralentissement matinal soutenu : Mermoz et Sacré-Cœur',
      };
    }
    if (axe.id === 'corniche-ouest-sud') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.6), // ~29 min
        vitesseReelleKmH: 28,
        cause: 'Afflux matinal vers Fann et le tunnel de Soumbédioune',
      };
    }
    return {
      niveau: 'fluide',
      tempsEstimeMin: axe.tempsHabituelMin,
      vitesseReelleKmH: Math.round(axe.distanceKm / (axe.tempsHabituelMin / 60)),
      cause: 'Circulation fluide dans le sens sortant',
    };
  }

  // 2. Grandes Sorties d'après-midi & Pointe du Soir (15h00 - 20h45) : sortie de Dakar vers banlieue & retards centre
  if (estPointeSoir) {
    if (axe.id === 'rn1-rufisque') {
      return {
        niveau: 'bouche',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 3.5), // ~77 min
        vitesseReelleKmH: 14,
        cause: 'Bouchon très dense du soir : saturation majeure Colobane ➔ Dalifort ➔ Thiaroye',
      };
    }
    if (axe.id === 'front-de-terre') {
      return {
        niveau: 'bouche',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 2.5), // ~28 min
        vitesseReelleKmH: 11,
        cause: 'Saturation sévère du soir : congestion entre Khar Yalla, Grand Yoff et Castors/EMG',
      };
    }
    if (axe.id === 'a1-sortant') {
      return {
        niveau: 'bouche',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 2.2), // ~57 min
        vitesseReelleKmH: 33,
        cause: 'Heure de pointe du soir vers la banlieue : goulots Dalifort, Pikine et péage Thiaroye',
      };
    }
    if (axe.id === 'patte-doie-echangeur') {
      return {
        niveau: 'bouche',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 2.3), // ~35 min
        vitesseReelleKmH: 14,
        cause: 'Sortie de ville encombrée : Échangeur et Pont Sénégal 92 saturés vers Grand Yoff',
      };
    }
    if (axe.id === 'vdn-nord') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.9), // ~21 min
        vitesseReelleKmH: 26,
        cause: 'Ralentissement soutenu du soir vers l’Échangeur Foire, CICES et Golf',
      };
    }
    if (axe.id === 'vdn-sud') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 2.1), // ~17 min
        vitesseReelleKmH: 23,
        cause: 'Ralentissements en soirée : croisement Exclusive VDN, CICES et Sacré-Cœur',
      };
    }
    if (axe.id === 'corniche-ouest-nord') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.5), // ~27 min
        vitesseReelleKmH: 30,
        cause: 'Flux dense du soir en direction de Ouakam et des Almadies',
      };
    }
    if (axe.id === 'a1-entrant') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.5), // ~42 min
        vitesseReelleKmH: 45,
        cause: 'Ralentissement soutenu du soir : goulots EMG, Hann Maristes et entrée Colobane',
      };
    }
    return {
      niveau: 'fluide',
      tempsEstimeMin: axe.tempsHabituelMin,
      vitesseReelleKmH: Math.round(axe.distanceKm / (axe.tempsHabituelMin / 60)),
      cause: 'Circulation normale sur cet axe',
    };
  }

  // 3. Milieu de journée (11h30 - 15h00) : activité économique, marchés et transit portuaire
  if (estMidi) {
    if (axe.id === 'rn1-rufisque') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 2.2), // ~48 min
        vitesseReelleKmH: 24,
        cause: 'Trafic soutenu en milieu de journée : transit portuaire et marché Colobane',
      };
    }
    if (axe.id === 'patte-doie-echangeur') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.5), // ~22 min
        vitesseReelleKmH: 22,
        cause: 'Ralentissements réguliers aux abords du Rond-point 26 et du Stade LSS',
      };
    }
    if (axe.id === 'front-de-terre') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.8), // ~20 min
        vitesseReelleKmH: 16,
        cause: 'Circulation soutenue en milieu de journée vers les marchés et commerces',
      };
    }
    return {
      niveau: 'fluide',
      tempsEstimeMin: axe.tempsHabituelMin,
      vitesseReelleKmH: Math.round(axe.distanceKm / (axe.tempsHabituelMin / 60)),
      cause: 'Circulation normale en milieu de journée',
    };
  }

  // 4. Soirée de décrue (20h45 - 22h30)
  if (estSoiree) {
    if (axe.id === 'rn1-rufisque') {
      return {
        niveau: 'dense',
        tempsEstimeMin: Math.round(axe.tempsHabituelMin * 1.6), // ~35 min
        vitesseReelleKmH: 30,
        cause: 'Trafic résiduel en cours de résorption vers Rufisque',
      };
    }
    return {
      niveau: 'fluide',
      tempsEstimeMin: axe.tempsHabituelMin,
      vitesseReelleKmH: Math.round(axe.distanceKm / (axe.tempsHabituelMin / 60)),
      cause: 'Circulation fluide en soirée',
    };
  }

  // 5. Nuit (22h30 - 06h45) : fluide partout
  return {
    niveau: 'fluide',
    tempsEstimeMin: axe.tempsHabituelMin,
    vitesseReelleKmH: Math.round(axe.distanceKm / (axe.tempsHabituelMin / 60)),
    cause: 'Conditions de circulation fluides',
  };
}

/**
 * État de tous les axes : mesures du créneau en cours (six axes) et signalements récents des usagers
 * @param {Object} [options]
 * @param {Date} [options.dateRef]
 * @returns {Promise<{ axes: Array, incidents: Array, source: 'google_maps'|'signalements'|'aucune', disponible: boolean, derniereMiseAJour: string|null }>}
 */
async function getEtatTraficComplet(options = {}) {
  // SRG-A4-016 / D53 : une valeur n'est rendue que si elle vient d'une mesure du fournisseur ou d'un signalement daté.
  // Le modèle horaire (evaluerEtatTheoriqueAxe) n'est plus servi : il donnait chaque jour les mêmes durées à la même
  // heure, datées de l'instant de l'appel. Les mesures viennent de trafic-mesures.js : sans clé, hors horaires ou
  // plafond mensuel atteint, il n'y en a pas.
  let releve = { etat: 'eteint', releveLe: null, mesures: new Map() };
  try {
    releve = await mesuresTrafic.lireMesures(pool, AXES_ROUTIERS_DAKAR, options.dateRef || new Date());
  } catch (e) {
    console.warn('[SurgaTrafic] Mesures indisponibles :', e.message);
  }

  // Signalements des usagers de moins de 45 minutes
  const signalementsRecents = new Map();
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
    console.warn('[SurgaTrafic] Signalements illisibles :', e.message);
  }

  let nbMesures = 0;
  let nbSignales = 0;
  let dernierReleve = null;

  const axes = AXES_ROUTIERS_DAKAR.map((axe) => {
    const signalement = signalementsRecents.get(axe.id);
    const mesure = releve.mesures.get(axe.id) || null;

    let niveau = 'indisponible';
    let tempsEstimeMin = null;
    let cause = null;
    let incident = null;
    let source = 'aucune';
    let releveLe = null;
    let vitesseReelleKmH = null;
    let vitesseNormaleKmH = null;
    let distanceKm = axe.distanceKm;

    if (mesure) {
      nbMesures++;
      source = 'google_maps';
      releveLe = releve.releveLe;
      tempsEstimeMin = mesure.tempsEstimeMin;
      distanceKm = mesure.distanceKm;
      vitesseReelleKmH = mesure.vitesseReelleKmH;
      vitesseNormaleKmH = mesure.vitesseNormaleKmH;
      niveau = mesuresTrafic.niveauDeLaMesure(mesure);
      cause = niveau === 'bouche'
        ? `Bouchon mesuré : ${mesure.retardMin} min de retard (${vitesseReelleKmH} km/h)`
        : niveau === 'dense'
          ? `Ralentissement mesuré : ${mesure.retardMin} min de retard (${vitesseReelleKmH} km/h)`
          : `Circulation fluide (${vitesseReelleKmH} km/h mesurés)`;
    }

    if (signalement) {
      nbSignales++;
      const type = signalement.type_signalement;
      if (type === 'accident' || type === 'bloque') {
        niveau = 'bouche';
        cause = signalement.commentaire || 'Accident ou blocage signalé par un usager';
        incident = 'accident';
      } else if (type === 'dense') {
        if (niveau !== 'bouche') niveau = 'dense';
        cause = signalement.commentaire || 'Ralentissement signalé par un usager';
        incident = 'ralentissement';
      } else if (type === 'travaux') {
        cause = signalement.commentaire || 'Travaux signalés par un usager';
        incident = 'travaux';
      } else if (type === 'fluide' && !mesure) {
        niveau = 'fluide';
        cause = 'Axe signalé fluide par un usager';
      }
      if (!mesure) {
        source = 'signalement';
        releveLe = new Date(signalement.created_at).toISOString();
      }
    }

    if (releveLe && (!dernierReleve || releveLe > dernierReleve)) dernierReleve = releveLe;

    return {
      id: axe.id,
      nom: axe.nom,
      origine: axe.origine,
      destination: axe.destination,
      type: axe.type,
      sens: axe.sens,
      niveau,
      tempsEstimeMin,
      tempsHabituelMin: axe.tempsHabituelMin,
      distanceKm,
      pointsChauds: axe.pointsChauds,
      incident,
      cause,
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
      updatedAt: releveLe,
    };
  });

  return {
    axes,
    incidents: [],
    source: nbMesures > 0 ? 'google_maps' : nbSignales > 0 ? 'signalements' : 'aucune',
    disponible: nbMesures + nbSignales > 0,
    derniereMiseAJour: dernierReleve,
    // Ce que l'écran doit pouvoir dire des mesures : qui mesure, quand, et pourquoi il n'y en a pas.
    mesures: { fournisseur: mesuresTrafic.FOURNISSEUR, horaires: mesuresTrafic.HORAIRES, etat: releve.etat, axes: mesuresTrafic.axesMesures() },
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
  // Sans mesure ni signalement, il n'y a rien à dire : l'ancienne phrase « Circulation globale fluide » était fixe.
  if (!Array.isArray(etatAxes)) return '';
  const nomCourt = (a) => a.nom.split('(')[0].trim();
  const bouches = etatAxes.filter((a) => a.niveau === 'bouche');
  const denses = etatAxes.filter((a) => a.niveau === 'dense');
  const fluides = etatAxes.filter((a) => a.niveau === 'fluide');

  const morceaux = [];
  if (bouches.length > 0) {
    const premier = bouches[0];
    morceaux.push(
      premier.tempsEstimeMin
        ? `Forte affluence sur ${nomCourt(premier)} avec environ ${premier.tempsEstimeMin} minutes de trajet.`
        : `Blocage signalé sur ${nomCourt(premier)}.`
    );
  }
  if (denses.length > 0) {
    morceaux.push(`Ralentissements constatés sur ${nomCourt(denses[0])}.`);
  }
  if (morceaux.length === 0 && fluides.length > 0) {
    morceaux.push(`Circulation signalée fluide sur ${nomCourt(fluides[0])}.`);
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

  // SRG-A1-017 : un signalement non écrit n'est pas un signalement reçu. L'ancien repli rendait un faux identifiant
  // « sig-local-… » et un code 201 quand la base était en erreur.
  try {
    const res = await pool.query(
      `INSERT INTO surga_trafic_signalements (axe_id, user_id, type_signalement, commentaire)
       VALUES ($1, $2, $3, $4)
       RETURNING id, axe_id, type_signalement, commentaire, created_at`,
      [axeId, userId || null, typeSignalement, comPropre]
    );
    return res.rows[0];
  } catch (dbErr) {
    console.error('[SurgaTrafic] Signalement non enregistré :', dbErr.message);
    const err = new Error('Votre signalement n\'a pas pu être enregistré. Veuillez réessayer dans un instant.');
    err.code = 'ENREGISTREMENT_IMPOSSIBLE';
    throw err;
  }
}

module.exports = {
  AXES_ROUTIERS_DAKAR,
  evaluerEtatTheoriqueAxe,
  getEtatTraficComplet,
  genererSyntheseBriefingTrafic,
  enregistrerSignalement,
};
