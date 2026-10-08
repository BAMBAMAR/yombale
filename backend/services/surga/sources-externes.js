// backend/services/surga/sources-externes.js
// Sources externes de Surga branchées après la campagne d'audit (décisions D43, D53, D57, D65).
//   Météo            : MET Norway, Locationforecast 2.0. Sans clé, licence CC BY 4.0, usage commercial admis.
//   Marées           : Open-Meteo Marine, niveau de la mer heure par heure. Calcul par modèle, pas un marégraphe.
//   Qualité de l'air : Open-Meteo Air Quality (modèle CAMS). Estimation par modèle, pas une station de mesure.
//   Ligue 1 du Sénégal : TheSportsDB, base tenue par des contributeurs.
// Chaque lecture rend une donnée datée par sa source, ou null. Rien n'est inventé quand la source ne répond pas :
// l'écran affiche « indisponible ». Les fonctions « interpreter… » sont pures, pour être testées sans réseau.

const axios = require('axios');
const interrupteurs = require('./interrupteurs');

const agent = () => process.env.SURGA_SOURCES_CONTACT || 'Surga/1.0 (https://nopalou.com; contact@nopalou.com)';
const arrondi = (v) => (Number.isFinite(v) ? Math.round(v) : null);
const deuxChiffres = (n) => String(n).padStart(2, '0');
const jourDe = (date) => date.toISOString().slice(0, 10); // Dakar est à l'heure universelle toute l'année
const virgule = (n, decimales) => n.toFixed(decimales).replace('.', ',');

// Petite mémoire par clé : une source n'est pas rappelée avant la fin du délai.
const memoire = new Map();
async function avecMemoire(cle, dureeMs, lire) {
  const garde = memoire.get(cle);
  if (garde && Date.now() - garde.le < dureeMs) return garde.valeur;
  const valeur = await lire();
  if (valeur !== null && valeur !== undefined) memoire.set(cle, { le: Date.now(), valeur });
  return valeur;
}

// ───────────────────────── Météo : MET Norway ─────────────────────────

const ROSE_DES_VENTS = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest'];
const directionVent = (degres) => (Number.isFinite(degres) ? ROSE_DES_VENTS[Math.round((((degres % 360) + 360) % 360) / 45) % 8] : null);
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Symboles de MET Norway (« partlycloudy_day », « lightrainshowers_night »…) vers les codes d'icône de l'écran.
function interpreterSymbole(symbole) {
  if (!symbole) return null;
  const nuit = /_night$/.test(symbole);
  const s = String(symbole).replace(/_(day|night|polartwilight)$/, '');
  if (s.includes('thunder')) return { code: 'orage', texte: 'Orage' };
  if (s.includes('showers')) return { code: 'averse', texte: 'Averses' };
  if (/rain|sleet|snow/.test(s)) return { code: 'pluie', texte: s.startsWith('light') ? 'Pluie faible' : s.startsWith('heavy') ? 'Forte pluie' : 'Pluie' };
  if (s === 'fog') return { code: 'nuageux', texte: 'Brouillard' };
  if (s === 'cloudy') return { code: 'nuageux', texte: 'Couvert' };
  if (s === 'partlycloudy') return { code: 'partiellement_nuageux', texte: 'Éclaircies' };
  if (s === 'fair') return { code: 'partiellement_nuageux', texte: 'Peu nuageux' };
  if (s === 'clearsky') return { code: 'soleil', texte: nuit ? 'Ciel dégagé' : 'Ensoleillé' };
  return null;
}

// Au-delà de ce délai depuis son calcul, une prévision n'est plus présentée comme à jour.
const DELAI_FRAICHEUR_METEO_MS = 12 * 3600 * 1000;

function interpreterMetNo(json, maintenant = new Date()) {
  const serie = json?.properties?.timeseries;
  if (!Array.isArray(serie) || serie.length === 0) return null;
  const t = maintenant.getTime();
  // L'entrée de l'heure en cours : la dernière dont l'heure est passée, sinon la première.
  let courante = serie[0];
  for (const e of serie) { if (new Date(e.time).getTime() <= t) courante = e; else break; }
  const d = courante?.data?.instant?.details || {};
  if (!Number.isFinite(d.air_temperature)) return null;
  const symbole = courante.data.next_1_hours?.summary?.symbol_code || courante.data.next_6_hours?.summary?.symbol_code;
  const condition = interpreterSymbole(symbole);
  if (!condition) return null;

  // Une journée n'a de minimum et de maximum que si la série la couvre du matin (6 h au plus tard) au soir (18 h au moins).
  const parJour = new Map();
  for (const e of serie) {
    const jour = e.time.slice(0, 10);
    if (!parJour.has(jour)) parJour.set(jour, []);
    parJour.get(jour).push(e);
  }
  const resumeDuJour = (jour) => {
    const entrees = parJour.get(jour);
    if (!entrees) return null;
    const heures = entrees.map((e) => Number(e.time.slice(11, 13)));
    if (Math.min(...heures) > 6 || Math.max(...heures) < 18) return null;
    const temperatures = [];
    for (const e of entrees) {
      const inst = e.data?.instant?.details?.air_temperature;
      const six = e.data?.next_6_hours?.details || {};
      for (const v of [inst, six.air_temperature_min, six.air_temperature_max]) if (Number.isFinite(v)) temperatures.push(v);
    }
    const midi = entrees.find((e) => e.time.slice(11, 13) === '12') || entrees.find((e) => e.time.slice(11, 13) === '06') || entrees[0];
    const cond = interpreterSymbole(midi.data?.next_6_hours?.summary?.symbol_code || midi.data?.next_12_hours?.summary?.symbol_code || midi.data?.next_1_hours?.summary?.symbol_code);
    if (temperatures.length === 0 || !cond) return null;
    return { temp_min: Math.round(Math.min(...temperatures)), temp_max: Math.round(Math.max(...temperatures)), condition_code: cond.code, condition_texte: cond.texte };
  };

  const aujourdhui = jourDe(maintenant);
  const previsions_3j = [];
  for (let i = 0; i < 5 && previsions_3j.length < 3; i++) {
    const date = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate() + i));
    const jour = jourDe(date);
    const r = resumeDuJour(jour);
    if (r) previsions_3j.push({ jour: jour === aujourdhui ? "Aujourd'hui" : JOURS[date.getUTCDay()], date: jour, ...r });
  }
  const duJour = previsions_3j.find((p) => p.date === aujourdhui) || null;

  const calculeLe = new Date(json.properties?.meta?.updated_at || courante.time);
  const calculValide = !Number.isNaN(calculeLe.getTime());
  return {
    temperature: Math.round(d.air_temperature),
    ressenti: null, // la source ne publie pas de température ressentie
    temp_min: duJour ? duJour.temp_min : null,
    temp_max: duJour ? duJour.temp_max : null,
    condition_code: condition.code,
    condition_texte: condition.texte,
    humidite: arrondi(d.relative_humidity),
    vent_vitesse_kmh: Number.isFinite(d.wind_speed) ? Math.round(d.wind_speed * 3.6) : null,
    vent_direction: directionVent(d.wind_from_direction),
    indice_uv: arrondi(d.ultraviolet_index_clear_sky),
    previsions_3j,
    source: 'MET Norway',
    updated_at: (calculValide ? calculeLe : maintenant).toISOString(),
    non_actualise: calculValide ? t - calculeLe.getTime() > DELAI_FRAICHEUR_METEO_MS : false,
  };
}

async function lireMeteo(lat, lon) {
  // La source demande au plus quatre décimales et un agent qui identifie l'application.
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  const res = await axios.get(url, { timeout: 6000, headers: { 'User-Agent': agent(), Accept: 'application/json' } });
  return interpreterMetNo(res.data);
}

// ───────────────────────── Open-Meteo : marées et qualité de l'air ─────────────────────────
// L'accès gratuit d'Open-Meteo est réservé à un usage non commercial (D57). Rien n'est appelé sans décision :
// SURGA_OPEN_METEO_CLE (abonnement, serveurs « customer- ») ou SURGA_OPEN_METEO_ESSAI=true (essais non commerciaux).

function adresseOpenMeteo(service, chemin, parametres) {
  const acces = interrupteurs.openMeteo();
  if (!acces) return null;
  const hote = `${acces.cle ? 'customer-' : ''}${service}.open-meteo.com`;
  return `https://${hote}${chemin}?${parametres}${acces.cle ? `&apikey=${encodeURIComponent(acces.cle)}` : ''}`;
}

function interpreterMaree(json, maintenant = new Date()) {
  const heures = json?.hourly?.time;
  const niveaux = json?.hourly?.sea_level_height_msl;
  if (!Array.isArray(heures) || !Array.isArray(niveaux) || heures.length !== niveaux.length) return null;
  const temps = heures.map((h) => new Date(`${h}:00Z`).getTime());
  const t = maintenant.getTime();
  let i0 = -1;
  for (let i = 0; i < temps.length; i++) { if (temps[i] <= t) i0 = i; else break; }
  if (i0 < 0 || i0 + 2 >= temps.length) return null; // la série ne couvre pas l'heure en cours
  if (![niveaux[i0], niveaux[i0 + 1]].every(Number.isFinite)) return null; // point à l'intérieur des terres
  // Prochain sommet ou creux de la courbe horaire, affiné par la parabole qui passe par ses trois points.
  for (let j = Math.max(1, i0); j + 1 < niveaux.length; j++) {
    const a = niveaux[j - 1], b = niveaux[j], c = niveaux[j + 1];
    if (![a, b, c].every(Number.isFinite)) return null;
    const sommet = b >= a && b > c;
    const creux = b <= a && b < c;
    if (!sommet && !creux) continue;
    const courbure = a - 2 * b + c;
    const decalageH = courbure === 0 ? 0 : (0.5 * (a - c)) / courbure;
    const instant = new Date(temps[j] + decalageH * 3600 * 1000);
    if (instant.getTime() <= t) continue;
    const minutes = Math.round((instant.getUTCHours() * 60 + instant.getUTCMinutes()) / 10) * 10;
    const hauteur = b - 0.25 * (a - c) * decalageH;
    return {
      etat: sommet ? 'Marée montante' : 'Marée descendante',
      prochaine_type: sommet ? 'Pleine mer' : 'Basse mer',
      prochaine_heure: `${deuxChiffres(Math.floor(minutes / 60) % 24)} h ${deuxChiffres(minutes % 60)}`,
      prochaine_le: instant.toISOString(),
      hauteur_m: `${hauteur >= 0 ? '+' : '−'}${virgule(Math.abs(hauteur), 1)}`,
      spot_reference: 'niveau moyen de la mer',
      estimation: true,
      source: 'Open-Meteo Marine',
    };
  }
  return null;
}

async function lireMaree(lat, lon) {
  const url = adresseOpenMeteo('marine-api', '/v1/marine', `latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&hourly=sea_level_height_msl&timezone=GMT&forecast_days=3`);
  if (!url) return null;
  try {
    // La courbe de trois jours est gardée six heures ; la prochaine marée est recalculée à chaque appel.
    const cle = `maree_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const json = await avecMemoire(cle, 6 * 3600 * 1000, async () => (await axios.get(url, { timeout: 6000 })).data);
    const maree = interpreterMaree(json);
    if (!maree) memoire.delete(cle);
    return maree;
  } catch (err) {
    console.warn('[SURGA MAREE] Source indisponible :', err.message);
    return null;
  }
}

// Indice américain (AQI US) : six paliers publiés par l'agence américaine de l'environnement.
function niveauAqi(aqi) {
  if (aqi <= 50) return 'Bonne';
  if (aqi <= 100) return 'Modérée';
  if (aqi <= 150) return 'Mauvaise pour les personnes sensibles';
  if (aqi <= 200) return 'Mauvaise';
  if (aqi <= 300) return 'Très mauvaise';
  return 'Dangereuse';
}

function interpreterQualiteAir(json, maintenant = new Date()) {
  const c = json?.current;
  if (!c || !Number.isFinite(c.us_aqi)) return null;
  const le = new Date(`${c.time}:00Z`);
  if (Number.isNaN(le.getTime()) || maintenant.getTime() - le.getTime() > 3 * 3600 * 1000) return null; // estimation trop ancienne
  const particules = [Number.isFinite(c.pm2_5) ? `PM2,5 : ${Math.round(c.pm2_5)} µg/m³` : null, Number.isFinite(c.pm10) ? `PM10 : ${Math.round(c.pm10)} µg/m³` : null].filter(Boolean).join(' · ');
  return {
    aqi: Math.round(c.us_aqi),
    indice: 'AQI US',
    niveau: niveauAqi(c.us_aqi),
    particules,
    conseil: '',
    estimation: true,
    source: 'Open-Meteo, modèle CAMS',
    updated_at: le.toISOString(),
  };
}

async function lireQualiteAir(lat, lon) {
  const url = adresseOpenMeteo('air-quality-api', '/v1/air-quality', `latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current=us_aqi,pm2_5,pm10&timezone=GMT`);
  if (!url) return null;
  try {
    const cle = `air_${lat.toFixed(1)}_${lon.toFixed(1)}`;
    const json = await avecMemoire(cle, 30 * 60 * 1000, async () => (await axios.get(url, { timeout: 6000 })).data);
    return interpreterQualiteAir(json);
  } catch (err) {
    console.warn('[SURGA AIR] Source indisponible :', err.message);
    return null;
  }
}

// ───────────────────────── Ligue 1 du Sénégal : TheSportsDB ─────────────────────────

const LIGUE1_SENEGAL_ID = 4754;
const STATUTS_TERMINES = new Set(['FT', 'AET', 'PEN', 'AP', 'Match Finished']);
const STATUTS_EN_COURS = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']);
const STATUTS_SANS_DATE = new Set(['PST', 'CANC', 'ABD', 'AWD', 'WO', 'SUSP', 'Postponed', 'Cancelled']);

function interpreterTheSportsDb(evenements, maintenant = new Date()) {
  if (!Array.isArray(evenements)) return [];
  const t = maintenant.getTime();
  const matchs = [];
  for (const e of evenements) {
    if (!e || !e.strHomeTeam || !e.strAwayTeam || !e.dateEvent) continue;
    if (e.strPostponed === 'yes' || STATUTS_SANS_DATE.has(e.strStatus)) continue; // reporté ou annulé : plus de date fiable
    const heure = e.strTime && /^\d\d:\d\d/.test(e.strTime) && !/^00:00/.test(e.strTime) ? e.strTime.slice(0, 5) : null;
    const debut = new Date(`${e.dateEvent}T${heure || '12:00'}:00Z`);
    if (Number.isNaN(debut.getTime())) continue;
    const scoreDom = e.intHomeScore === null || e.intHomeScore === undefined || e.intHomeScore === '' ? null : Number(e.intHomeScore);
    const scoreExt = e.intAwayScore === null || e.intAwayScore === undefined || e.intAwayScore === '' ? null : Number(e.intAwayScore);
    const aScore = Number.isFinite(scoreDom) && Number.isFinite(scoreExt);
    const enCours = STATUTS_EN_COURS.has(e.strStatus);
    const termine = !enCours && (STATUTS_TERMINES.has(e.strStatus) || aScore || debut.getTime() < t - 3 * 3600 * 1000);
    matchs.push({
      id: `tsdb-${e.idEvent}`,
      competition: e.intRound ? `Ligue 1 Sénégal · Journée ${e.intRound}` : 'Ligue 1 Sénégal',
      categorie: 'ligue1_sn',
      equipe_domicile: e.strHomeTeam,
      equipe_exterieur: e.strAwayTeam,
      score_domicile: (enCours || termine) && aScore ? scoreDom : null,
      score_exterieur: (enCours || termine) && aScore ? scoreExt : null,
      statut: enCours ? 'EN_DIRECT' : termine ? 'TERMINE' : 'A_VENIR',
      minute_jeu: enCours ? 'En cours' : termine ? 'Fin' : null,
      date_debut: debut.toISOString(),
      heure_inconnue: !heure,
      diffuseur: null, // la source ne le publie pas
      logo_domicile: e.strHomeTeamBadge || undefined,
      logo_exterieur: e.strAwayTeamBadge || undefined,
      source: 'TheSportsDB',
    });
  }
  return matchs;
}

// Seules les rencontres proches sont servies : trois semaines de résultats, un mois de calendrier.
const FENETRE_PASSE_MS = 21 * 24 * 3600 * 1000;
const FENETRE_AVENIR_MS = 31 * 24 * 3600 * 1000;
function dansLaFenetre(matchs, maintenant = new Date()) {
  const t = maintenant.getTime();
  return matchs.filter((m) => { const d = new Date(m.date_debut).getTime(); return d > t - FENETRE_PASSE_MS && d < t + FENETRE_AVENIR_MS; });
}

// Vrai, faux ou null (jamais interrogée) : la route s'en sert pour dire « indisponible » plutôt que « aucun match ».
let ligue1Repond = null;

async function lireLigue1Senegal() {
  const cle = interrupteurs.theSportsDbCle();
  if (!cle) { ligue1Repond = null; return []; }
  const base = `https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(cle)}`;
  const lire = (chemin, plus = '') => axios.get(`${base}/${chemin}?id=${LIGUE1_SENEGAL_ID}${plus}`, { timeout: 5000 }).then((r) => r.data?.events || []).catch(() => null);
  // Le calendrier de la saison (d'août à juillet), complété par les deux listes courtes de la source. Une clé d'essai
  // ne rend que quelques rencontres ; une clé d'abonnement rend la saison entière.
  const maintenant = new Date();
  const annee = maintenant.getUTCFullYear() - (maintenant.getUTCMonth() >= 7 ? 0 : 1);
  const listes = await Promise.all([lire('eventsseason.php', `&s=${annee}-${annee + 1}`), lire('eventsnextleague.php'), lire('eventspastleague.php')]);
  ligue1Repond = listes.some((l) => l !== null);
  const vus = new Set();
  const uniques = listes.flatMap((l) => l || []).filter((e) => e && e.idEvent && !vus.has(e.idEvent) && vus.add(e.idEvent));
  return dansLaFenetre(interpreterTheSportsDb(uniques, maintenant), maintenant);
}

module.exports = {
  lireMeteo,
  lireMaree,
  lireQualiteAir,
  lireLigue1Senegal,
  ligue1SenegalBranchee: () => Boolean(interrupteurs.theSportsDbCle()),
  ligue1SenegalRepond: () => ligue1Repond,
  interpreterMetNo,
  interpreterSymbole,
  interpreterMaree,
  interpreterQualiteAir,
  interpreterTheSportsDb,
  dansLaFenetre,
  directionVent,
  viderMemoire: () => memoire.clear(),
};
