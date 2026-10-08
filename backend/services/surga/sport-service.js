// backend/services/surga/sport-service.js
// Service Sport Universel en Temps Réel pour Surga :
// Données réelles ESPN Live Scoreboards : Ligue des Champions, Premier League, LaLiga, Ligue 1, Serie A, Saudi Pro League,
// Calendrier officiel FIFA des Lions du Sénégal. La Ligue 1 sénégalaise n'a pas de source (D53).

const axios = require('axios');
const sources = require('./sources-externes');

// Cache mémoire pour préserver les quotas et assurer une latence < 30ms
let cacheMatchs = null;
let dernierFetchMs = 0;
// Vrai quand aucun des flux du fournisseur n'a répondu au dernier chargement : « indisponible », pas « aucun match ».
let sourceMuette = false;
const TTL_CACHE_MS = 10 * 60 * 1000; // 10 minutes

const LISTE_EQUIPES_DISPONIBLES = [
  // --- Équipe Nationale ---
  { id: 'senegal', nom: 'Sénégal (Lions de la Teranga)', categorie: 'nationale', championnat: 'Sélections CAF', pays: 'Sénégal' },

  // --- Grands Clubs Européens & Mondiaux ---
  { id: 'real_madrid', nom: 'Real Madrid', categorie: 'laliga', championnat: 'LaLiga & UCL', pays: 'Espagne' },
  { id: 'barcelona', nom: 'FC Barcelone', categorie: 'laliga', championnat: 'LaLiga & UCL', pays: 'Espagne' },
  { id: 'atletico', nom: 'Atlético de Madrid', categorie: 'laliga', championnat: 'LaLiga & UCL', pays: 'Espagne' },
  { id: 'man_city', nom: 'Manchester City', categorie: 'premier_league', championnat: 'Premier League & UCL', pays: 'Angleterre' },
  { id: 'arsenal', nom: 'Arsenal FC', categorie: 'premier_league', championnat: 'Premier League & UCL', pays: 'Angleterre' },
  { id: 'liverpool', nom: 'Liverpool FC', categorie: 'premier_league', championnat: 'Premier League & UCL', pays: 'Angleterre' },
  { id: 'chelsea', nom: 'Chelsea FC (Nicolas Jackson)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'tottenham', nom: 'Tottenham (Pape Matar Sarr)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'man_united', nom: 'Manchester United', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'everton', nom: 'Everton (Iliman Ndiaye, I. Gueye)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'crystal_palace', nom: 'Crystal Palace (Ismaïla Sarr)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'psg', nom: 'Paris Saint-Germain', categorie: 'ligue1_fr', championnat: 'Ligue 1 & UCL', pays: 'France' },
  { id: 'marseille', nom: 'Olympique de Marseille', categorie: 'ligue1_fr', championnat: 'Ligue 1', pays: 'France' },
  { id: 'monaco', nom: 'AS Monaco', categorie: 'ligue1_fr', championnat: 'Ligue 1 & UCL', pays: 'France' },
  { id: 'lyon', nom: 'Olympique Lyonnais', categorie: 'ligue1_fr', championnat: 'Ligue 1', pays: 'France' },
  { id: 'bayern', nom: 'Bayern Munich', categorie: 'ucl', championnat: 'Bundesliga & UCL', pays: 'Allemagne' },
  { id: 'inter_milan', nom: 'Inter Milan', categorie: 'serie_a', championnat: 'Serie A & UCL', pays: 'Italie' },
  { id: 'juventus', nom: 'Juventus Turin', categorie: 'serie_a', championnat: 'Serie A & UCL', pays: 'Italie' },
  { id: 'milan_ac', nom: 'AC Milan', categorie: 'serie_a', championnat: 'Serie A & UCL', pays: 'Italie' },
  { id: 'al_nassr', nom: 'Al Nassr (Sadio Mané)', categorie: 'saudi_pro', championnat: 'Saudi Pro League', pays: 'Arabie Saoudite' },
  { id: 'al_hilal', nom: 'Al Hilal (Kalidou Koulibaly)', categorie: 'saudi_pro', championnat: 'Saudi Pro League', pays: 'Arabie Saoudite' },

  // --- Ligue 1 Sénégalaise ---
  { id: 'jaraaf', nom: 'ASC Jaraaf de Dakar', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'teungueth', nom: 'Teungueth FC', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'generation_foot', nom: 'Génération Foot', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'guediawaye', nom: 'Guédiawaye FC', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'casa_sports', nom: 'Casa Sports de Ziguinchor', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'as_pikine', nom: 'AS Pikine', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'dakar_sc', nom: 'Dakar Sacré-Cœur', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'us_goree', nom: 'US Gorée', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
];

/**
 * Extrait un score numérique fiable depuis les données ESPN (objet ou valeur directe)
 */
function extraireScoreESPN(competitor) {
  if (!competitor) return null;
  const s = competitor.score;
  if (s === null || s === undefined) return null;
  if (typeof s === 'object') {
    if (s.displayValue !== undefined && !isNaN(Number(s.displayValue))) return Number(s.displayValue);
    if (s.value !== undefined && !isNaN(Number(s.value))) return Number(s.value);
    return null;
  }
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/**
 * Normalise un événement ESPN en SportEventItem avec détection stricte des scores et du statut
 */
function normaliserEvenementESPN(event, competitionNom, categorie, diffuseurDefaut = null) {
  try {
    const comp = event.competitions?.[0];
    if (!comp) return null;

    const home = comp.competitors?.find((c) => c.homeAway === 'home') || comp.competitors?.[0];
    const away = comp.competitors?.find((c) => c.homeAway === 'away') || comp.competitors?.[1];

    if (!home || !away) return null;

    // Détection robuste du statut depuis comp.status ou event.status
    const statusObj = comp.status || event.status || {};
    const type = statusObj.type || {};
    const state = type.state; // 'pre', 'in', 'post'
    const completed = Boolean(type.completed);
    const matchDate = new Date(event.date || Date.now());
    const isPast = matchDate.getTime() < Date.now() - 3 * 3600 * 1000;
    const isLive = state === 'in';
    const isTermine = completed || state === 'post' || (!isLive && isPast);

    const scoreDom = isLive || isTermine ? extraireScoreESPN(home) : null;
    const scoreExt = isLive || isTermine ? extraireScoreESPN(away) : null;

    // Chaîne de diffusion
    let diffuseur = diffuseurDefaut;
    if (comp.broadcasts?.[0]?.names?.[0]) {
      diffuseur = comp.broadcasts[0].names[0];
    }

    return {
      id: String(event.id || `${home.team?.id}-${away.team?.id}`),
      competition: competitionNom,
      categorie: categorie,
      equipe_domicile: home.team?.displayName || home.team?.name || 'Équipe 1',
      equipe_exterieur: away.team?.displayName || away.team?.name || 'Équipe 2',
      score_domicile: scoreDom,
      score_exterieur: scoreExt,
      statut: isLive ? 'EN_DIRECT' : isTermine ? 'TERMINE' : 'A_VENIR',
      minute_jeu: isLive ? statusObj.displayClock || 'En cours' : isTermine ? 'Fin' : null,
      date_debut: event.date || new Date().toISOString(),
      diffuseur: diffuseur,
      logo_domicile: home.team?.logo,
      logo_exterieur: away.team?.logo,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Récupère les données réelles en temps réel depuis les APIs sportives officielles
 */
async function chargerDonneesSportEnDirect(force = false) {
  if (!force && cacheMatchs && Date.now() - dernierFetchMs < TTL_CACHE_MS) {
    return cacheMatchs;
  }

  let resultats = [];

  const endpoints = [
    // Lions du Sénégal — Calendrier direct officiel & éliminatoires en temps réel
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.friendly/teams/654/schedule', nom: 'Match Amical', cat: 'nationale' },
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations_qual/teams/654/schedule', nom: 'Éliminatoires CAN', cat: 'nationale' },
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldq.caf/teams/654/schedule', nom: 'Éliminatoires Mondial', cat: 'nationale' },

    // Grands championnats et coupes en direct
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard', nom: 'Ligue des Champions', cat: 'ucl' },
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', nom: 'Premier League', cat: 'premier_league' },
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard', nom: 'LaLiga', cat: 'laliga' },
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard', nom: 'Ligue 1', cat: 'ligue1_fr' },
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard', nom: 'Serie A', cat: 'serie_a' },
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ksa.1/scoreboard', nom: 'Saudi Pro League', cat: 'saudi_pro' },
    // D74 : coupes africaines des clubs, où jouent des clubs sénégalais (même source, sans clé).
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.champions/scoreboard', nom: 'Ligue des Champions CAF', cat: 'caf' },
    { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.confed/scoreboard', nom: 'Coupe de la Confédération CAF', cat: 'caf' },
  ];

  try {
    const requetes = endpoints.map((ep) =>
      axios.get(ep.url, { timeout: 3500 }).catch(() => null)
    );

    // D65 : la Ligue 1 du Sénégal vient d'une autre source, lue en même temps (liste vide si elle n'est pas branchée).
    const [reponses, ligue1] = await Promise.all([Promise.all(requetes), sources.lireLigue1Senegal().catch(() => [])]);
    sourceMuette = reponses.every((res) => !res);
    resultats.push(...ligue1);

    reponses.forEach((res, idx) => {
      if (!res?.data?.events) return;
      const config = endpoints[idx];

      res.data.events.forEach((ev) => {
        const item = normaliserEvenementESPN(ev, config.nom, config.cat);
        if (item) {
          resultats.push(item);
        }
      });
    });
  } catch (err) {
    console.warn('[SURGA SPORT API WARN]:', err.message);
  }

  // Filtrer les événements de plus d'1 an dans le passé pour éliminer les archives obsolètes
  const unAnMs = 365 * 24 * 3600 * 1000;
  resultats = resultats.filter((m) => {
    const t = new Date(m.date_debut).getTime();
    return t > Date.now() - unAnMs;
  });

  // SRG-A4-014 / D53 : quatre rencontres de Ligue 1 sénégalaise étaient ajoutées ici, écrites dans le code et datées
  // du jour de l'appel. Elles viennent maintenant de la source lue plus haut ; sans elle, la catégorie « ligue1_sn »
  // reste vide et l'écran affiche « indisponible ».

  // Dédoublonnage strict par identifiant ou par paire d'équipes + date
  const vus = new Set();
  resultats = resultats.filter((m) => {
    const cle = `${m.equipe_domicile}__${m.equipe_exterieur}__${m.date_debut?.slice(0, 10)}`;
    if (vus.has(cle) || (m.id && vus.has(m.id))) return false;
    if (m.id) vus.add(m.id);
    vus.add(cle);
    return true;
  });

  // Tri universel :
  // 1. Matchs EN_DIRECT en tête absolue
  // 2. Matchs A_VENIR par ordre chronologique croissant (le prochain match en premier)
  // 3. Matchs TERMINE par ordre antéchronologique (le résultat le plus récent en premier)
  resultats.sort((a, b) => {
    if (a.statut === 'EN_DIRECT' && b.statut !== 'EN_DIRECT') return -1;
    if (b.statut === 'EN_DIRECT' && a.statut !== 'EN_DIRECT') return 1;

    if (a.statut === 'A_VENIR' && b.statut === 'A_VENIR') {
      return new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime();
    }
    if (a.statut === 'A_VENIR' && b.statut === 'TERMINE') return -1;
    if (a.statut === 'TERMINE' && b.statut === 'A_VENIR') return 1;

    return new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime();
  });

  cacheMatchs = resultats;
  dernierFetchMs = Date.now();
  return resultats;
}

/**
 * Filtre les matchs selon les équipes sélectionnées ou la catégorie
 */
async function filtrerMatchsSport({ equipesSuivies = [], categorie = 'tous', limit = 25, force = false }) {
  const tous = await chargerDonneesSportEnDirect(force);

  let resultats = tous;

  // Filtre par catégorie de ligue
  if (categorie && categorie !== 'tous' && categorie !== 'mes_equipes') {
    resultats = resultats.filter((m) => m.categorie === categorie);
  }

  // Priorisation globale :
  // 1. Équipes / Joueurs suivis du compte
  // 2. Ligue 1 sénégalaise et Équipes nationales
  // 3. Reste des rencontres
  const estSnOuL1 = (m) => {
    if (m.categorie === 'ligue1_sn' || m.categorie === 'nationale') return true;
    const txt = `${m.competition} ${m.equipe_domicile} ${m.equipe_exterieur}`.toLowerCase();
    return /sénégal|senegal|jaraaf|teungueth|génération foot|casa sports|guédiawaye|pikine|dakar sacré|gorée/i.test(txt);
  };

  const termesMinuscules = Array.isArray(equipesSuivies) && equipesSuivies.length > 0
    ? equipesSuivies.map((eq) => eq.toLowerCase().trim())
    : [];

  const estFavori = (m) => {
    if (termesMinuscules.length === 0) return false;
    const dom = (m.equipe_domicile || '').toLowerCase();
    const ext = (m.equipe_exterieur || '').toLowerCase();
    const but = (m.buteurs || '').toLowerCase();
    return termesMinuscules.some((terme) =>
      dom.includes(terme) || ext.includes(terme) || but.includes(terme) || terme.includes(dom) || terme.includes(ext)
    );
  };

  const trouverRaisonPresence = (m) => {
    if (termesMinuscules.length === 0) return null;
    const dom = (m.equipe_domicile || '').toLowerCase();
    const ext = (m.equipe_exterieur || '').toLowerCase();
    const but = (m.buteurs || '').toLowerCase();
    const terme = termesMinuscules.find((t) => dom.includes(t) || ext.includes(t) || but.includes(t) || t.includes(dom) || t.includes(ext));
    if (!terme) return null;
    const eqDef = LISTE_EQUIPES_DISPONIBLES.find((e) => e.id === terme || e.nom.toLowerCase().includes(terme));
    return eqDef ? eqDef.nom : terme.charAt(0).toUpperCase() + terme.slice(1);
  };

  const enrichirMatch = (m) => {
    const raison = trouverRaisonPresence(m);
    return {
      ...m,
      raison_presence: raison ? `Vous suivez ${raison}` : null,
    };
  };

  if (categorie === 'mes_equipes') {
    const correspondants = tous.filter(estFavori).map(enrichirMatch);
    if (correspondants.length > 0) {
      resultats = correspondants;
    }
  } else {
    const favoris = resultats.filter(estFavori).map(enrichirMatch);
    const snL1 = resultats.filter((m) => !estFavori(m) && estSnOuL1(m)).map((m) => ({ ...m, raison_presence: null }));
    const autres = resultats.filter((m) => !estFavori(m) && !estSnOuL1(m)).map((m) => ({ ...m, raison_presence: null }));
    resultats = [...favoris, ...snL1, ...autres];
  }

  return resultats.slice(0, limit);
}

module.exports = {
  LISTE_EQUIPES_DISPONIBLES,
  chargerDonneesSportEnDirect,
  filtrerMatchsSport,
  sportSourceMuette: () => sourceMuette,
  // Vrai quand la Ligue 1 du Sénégal n'a pas de source branchée, ou que cette source n'a pas répondu.
  ligue1SenegalIndisponible: () => !sources.ligue1SenegalBranchee() || sources.ligue1SenegalRepond() === false,
};
