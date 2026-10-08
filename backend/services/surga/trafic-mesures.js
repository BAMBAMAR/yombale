// backend/services/surga/trafic-mesures.js
// Mesure du trafic à Dakar par l'API d'itinéraires de Google (décision de l'utilisateur du 2026-10-08, D71).
// TomTom, branché auparavant, ne mesure pas Dakar (A5-108).
//
// Règles :
//   - six axes, un relevé par demi-heure, de 6 h 30 à 20 h (heure de Dakar, égale à l'heure universelle) ;
//   - le relevé d'un créneau sert tous les utilisateurs : le coût ne dépend pas de leur nombre ;
//   - un compteur mensuel en base plafonne les appels sous le seuil gratuit (5 000 par mois) : un appel n'est fait
//     qu'après avoir été réservé, et rien n'est appelé si la réservation échoue ;
//   - seul le compteur est gardé en base ; les temps de parcours ne vivent qu'en mémoire, le temps du créneau ;
//   - sans clé, hors horaires ou plafond atteint : aucune mesure, et l'écran dit « indisponible ».

const axios = require('axios');
const interrupteurs = require('./interrupteurs');

const AXES_PAR_DEFAUT = ['a1-entrant', 'a1-sortant', 'vdn-sud', 'vdn-nord', 'ouest-foire-colobane', 'rn1-rufisque'];
// Un axe « sensSelonHeure » est mesuré à l'aller avant cette heure, au retour ensuite : un seul appel par créneau.
const HEURE_DU_RETOUR = 13;
const sensInverse = (axe, creneau) => Boolean(axe.sensSelonHeure) && creneau.getUTCHours() >= HEURE_DU_RETOUR;
const DUREE_CRENEAU_MS = 30 * 60 * 1000;
const DEBUT_MIN = 6 * 60 + 30; // 6 h 30
const FIN_MIN = 20 * 60; // 20 h
const PLAFOND_PAR_DEFAUT = 4900;
const ADRESSE = 'https://routes.googleapis.com/directions/v2:computeRoutes';

const axesMesures = () => {
  const liste = (process.env.SURGA_TRAFIC_AXES_MESURES || '').split(',').map((s) => s.trim()).filter(Boolean);
  return liste.length > 0 ? liste : AXES_PAR_DEFAUT;
};
const plafondMensuel = () => {
  const n = parseInt(process.env.SURGA_TRAFIC_PLAFOND_MENSUEL, 10);
  return Number.isFinite(n) && n >= 0 ? n : PLAFOND_PAR_DEFAUT;
};

// Début du créneau en cours, ou null hors des horaires de mesure.
function creneauCourant(maintenant = new Date()) {
  const minutes = maintenant.getUTCHours() * 60 + maintenant.getUTCMinutes();
  if (minutes < DEBUT_MIN || minutes >= FIN_MIN) return null;
  return new Date(Math.floor(maintenant.getTime() / DUREE_CRENEAU_MS) * DUREE_CRENEAU_MS);
}

const secondes = (duree) => {
  const m = /^(\d+(?:\.\d+)?)s$/.exec(String(duree || ''));
  return m ? Number(m[1]) : null;
};

// Réponse de l'API : durée avec trafic (« duration »), durée sans trafic (« staticDuration »), distance.
function interpreterGoogleRoutes(json) {
  const route = json?.routes?.[0];
  const avecTrafic = secondes(route?.duration);
  const sansTrafic = secondes(route?.staticDuration);
  const metres = Number(route?.distanceMeters);
  if (!avecTrafic || !sansTrafic || !Number.isFinite(metres) || metres <= 0) return null;
  const km = metres / 1000;
  return {
    distanceKm: Math.round(km * 10) / 10,
    tempsEstimeMin: Math.round(avecTrafic / 60),
    tempsSansTraficMin: Math.round(sansTrafic / 60),
    retardMin: Math.max(0, Math.round((avecTrafic - sansTrafic) / 60)),
    vitesseReelleKmH: Math.round(km / (avecTrafic / 3600)),
    vitesseNormaleKmH: Math.round(km / (sansTrafic / 3600)),
  };
}

// Niveau tiré de la mesure : retard en minutes, ou vitesse mesurée rapportée à la vitesse sans trafic.
function niveauDeLaMesure(mesure) {
  const ratio = mesure.vitesseNormaleKmH > 0 ? mesure.vitesseReelleKmH / mesure.vitesseNormaleKmH : 1;
  if (mesure.retardMin >= 15 || ratio <= 0.45) return 'bouche';
  if (mesure.retardMin >= 5 || ratio <= 0.75) return 'dense';
  return 'fluide';
}

const point = (texte) => {
  const [latitude, longitude] = String(texte).split(',').map(Number);
  return { location: { latLng: { latitude, longitude } } };
};

async function interrogerGoogle(axe, cle, inverse = false) {
  const res = await axios.post(
    process.env.SURGA_GOOGLE_ROUTES_ADRESSE || ADRESSE,
    { origin: point(inverse ? axe.to : axe.from), destination: point(inverse ? axe.from : axe.to), travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE' },
    {
      timeout: 6000,
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': cle, 'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters' },
    }
  );
  const mesure = interpreterGoogleRoutes(res.data);
  return mesure ? { ...mesure, inverse } : null;
}

// Réserve n appels dans le compteur du mois. Rend faux si le plafond serait dépassé ou si la base ne répond pas :
// dans le doute, aucun appel payant n'est fait.
async function reserverAppels(pool, n, maintenant = new Date()) {
  const mois = maintenant.toISOString().slice(0, 7);
  const plafond = plafondMensuel();
  if (n <= 0 || n > plafond) return false;
  try {
    const { rows } = await pool.query(
      `INSERT INTO surga_trafic_appels (mois, appels) VALUES ($1, $2)
       ON CONFLICT (mois) DO UPDATE SET appels = surga_trafic_appels.appels + $2, maj_le = NOW()
         WHERE surga_trafic_appels.appels + $2 <= $3
       RETURNING appels`,
      [mois, n, plafond]
    );
    return rows.length > 0;
  } catch (err) {
    console.error('[SurgaTrafic] Compteur d’appels illisible, aucune mesure demandée :', err.message);
    return false;
  }
}

let memoire = { creneau: 0, releveLe: null, mesures: new Map() };
let enCours = null;

/**
 * Mesures du créneau en cours.
 * @returns {Promise<{ etat: 'eteint'|'hors_horaires'|'plafond'|'mesure', releveLe: string|null, mesures: Map }>}
 */
async function lireMesures(pool, axes, maintenant = new Date()) {
  const cle = interrupteurs.googleRoutesCle();
  if (!cle) return { etat: 'eteint', releveLe: null, mesures: new Map() };
  const creneau = creneauCourant(maintenant);
  if (!creneau) return { etat: 'hors_horaires', releveLe: null, mesures: new Map() };
  if (memoire.creneau === creneau.getTime()) return { etat: memoire.etat, releveLe: memoire.releveLe, mesures: memoire.mesures };
  if (enCours) return enCours;

  enCours = (async () => {
    const suivis = axesMesures().map((id) => axes.find((a) => a.id === id && a.from && a.to)).filter(Boolean);
    const mesures = new Map();
    let etat = 'plafond';
    if (suivis.length > 0 && (await reserverAppels(pool, suivis.length, maintenant))) {
      etat = 'mesure';
      const resultats = await Promise.all(suivis.map((axe) => interrogerGoogle(axe, cle, sensInverse(axe, creneau)).catch((err) => {
        console.warn(`[SurgaTrafic] Mesure indisponible pour ${axe.id} :`, err.response ? `réponse ${err.response.status}` : err.message);
        return null;
      })));
      resultats.forEach((m, i) => { if (m) mesures.set(suivis[i].id, m); });
    }
    // Le créneau est marqué fait même sans mesure : un appel en échec n'est pas rejoué avant le créneau suivant.
    memoire = { creneau: creneau.getTime(), etat, releveLe: mesures.size > 0 ? new Date().toISOString() : null, mesures };
    return { etat, releveLe: memoire.releveLe, mesures };
  })();
  try { return await enCours; } finally { enCours = null; }
}

module.exports = {
  lireMesures,
  creneauCourant,
  interpreterGoogleRoutes,
  niveauDeLaMesure,
  reserverAppels,
  axesMesures,
  sensInverse,
  HORAIRES: '6 h 30 à 20 h',
  FOURNISSEUR: 'Google Maps',
  oublier: () => { memoire = { creneau: 0, releveLe: null, mesures: new Map() }; },
};
