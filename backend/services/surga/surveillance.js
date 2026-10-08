// backend/services/surga/surveillance.js
// SRG-A5-008 : une panne de Surga n'Ã©tait vue par personne (2 820 rÃ©ponses 500 en 35 secondes sans alerte, ordonnanceur
// de rappels absent de cron_executions, aucun compteur par route).
//
// Ce module compte les rÃ©ponses par famille de routes, trace les passages de l'ordonnanceur de rappels, et alerte
// l'administrateur (alerterAdmin : WhatsApp, Telegram, e-mail) dans quatre cas :
//   - taux de rÃ©ponses 5xx d'une famille de routes au-dessus du seuil sur 5 minutes ;
//   - ordonnanceur de rappels sans passage depuis 5 minutes, ou en Ã©chec trois fois de suite ;
//   - collecte de presse sans nouvel article depuis 6 heures.
// Rien de ce qui est comptÃ© ne contient de donnÃ©e personnelle : seulement la famille de route (premier segment) et le code.

const FENETRE_MS = 5 * 60 * 1000;
const MIN_REQUETES = 20;
const SEUIL_TAUX_5XX = 0.25;
const DELAI_RAPPELS_MS = 5 * 60 * 1000;
const ECHECS_CONSECUTIFS_MAX = 3;
const DELAI_PRESSE_MS = 6 * 60 * 60 * 1000;
const SIGNE_DE_VIE_MS = 60 * 60 * 1000;
const COOLDOWN_ALERTE_MS = 30 * 60 * 1000;
const NOM_CRON_RAPPELS = 'surga_rappels';

function creerSurveillance({ maintenant = () => Date.now(), alerter = null, journaliser = null, derniereCollecte = null } = {}) {
  const compteurs = new Map(); // famille -> [{ t, erreur }]
  const rappels = { demarreLe: null, dernierPassage: null, echecsConsecutifs: 0, dernierJournal: 0, dernierResultat: null };

  const elaguer = (liste, t) => {
    const limite = t - FENETRE_MS;
    let i = 0;
    while (i < liste.length && liste[i].t < limite) i++;
    if (i > 0) liste.splice(0, i);
  };

  function compter(famille, statut) {
    const cle = famille || 'racine';
    if (!compteurs.has(cle)) compteurs.set(cle, []);
    const t = maintenant();
    const liste = compteurs.get(cle);
    liste.push({ t, erreur: statut >= 500 });
    elaguer(liste, t);
  }

  // Intergiciel Express : Ã  poser en tÃªte du routeur Surga.
  function intergiciel(req, res, next) {
    const famille = String(req.path || '/').split('/')[1] || 'racine';
    res.on('finish', () => { try { compter(famille, res.statusCode); } catch { /* le suivi ne doit jamais gÃªner une rÃ©ponse */ } });
    next();
  }

  function etatRoutes() {
    const t = maintenant();
    const routes = [];
    for (const [groupe, liste] of compteurs) {
      elaguer(liste, t);
      if (liste.length === 0) continue;
      const erreurs = liste.filter((e) => e.erreur).length;
      routes.push({ groupe, total: liste.length, erreurs_5xx: erreurs, taux_5xx: Number((erreurs / liste.length).toFixed(2)) });
    }
    return routes.sort((a, b) => b.erreurs_5xx - a.erreurs_5xx || b.total - a.total);
  }

  const alerte = (opts) => {
    if (typeof alerter !== 'function') return null;
    try { return Promise.resolve(alerter({ cooldownMs: COOLDOWN_ALERTE_MS, ...opts })).catch(() => {}); } catch { return null; }
  };

  // Taux de 5xx par famille de routes, et pour l'ensemble.
  function evaluerErreurs() {
    const routes = etatRoutes();
    const total = routes.reduce((n, r) => n + r.total, 0);
    const erreurs = routes.reduce((n, r) => n + r.erreurs_5xx, 0);
    const emises = [];
    const candidats = [...routes.map((r) => ({ ...r, portee: r.groupe })), { groupe: 'toutes les routes', total, erreurs_5xx: erreurs, portee: 'global' }];
    for (const c of candidats) {
      if (c.total >= MIN_REQUETES && c.erreurs_5xx / c.total >= SEUIL_TAUX_5XX) {
        emises.push(c.portee);
        alerte({
          type: `surga_erreurs_${c.portee}`,
          titre: 'Surga : taux d\'erreurs Ã©levÃ©',
          message: `${c.erreurs_5xx} rÃ©ponses d'erreur serveur sur ${c.total} en 5 minutes (${c.groupe}).`,
          priorite: c.portee === 'global' ? 'CRITIQUE' : 'ATTENTION',
        });
      }
    }
    return emises;
  }

  function demarrerRappels() { rappels.demarreLe = maintenant(); }

  // Passage de l'ordonnanceur : { traites, succes, echecs } ou une erreur. Trace dans cron_executions toute activitÃ©,
  // toute erreur, et un signe de vie par heure (1 440 lignes par jour seraient du bruit).
  async function passageRappels(stats, erreur = null) {
    const t = maintenant();
    rappels.dernierPassage = t;
    rappels.echecsConsecutifs = erreur ? rappels.echecsConsecutifs + 1 : 0;
    rappels.dernierResultat = erreur ? { erreur: String(erreur.message || erreur).slice(0, 200) } : { traites: stats?.traites || 0, succes: stats?.succes || 0, echecs: stats?.echecs || 0 };
    if (rappels.echecsConsecutifs >= ECHECS_CONSECUTIFS_MAX) {
      alerte({
        type: 'surga_rappels_echecs',
        titre: 'Surga : l\'ordonnanceur de rappels Ã©choue',
        message: `${rappels.echecsConsecutifs} passages de suite en Ã©chec. DerniÃ¨re erreur : ${rappels.dernierResultat.erreur}`,
        priorite: 'CRITIQUE',
      });
    }
    const actif = !!stats && (stats.traites > 0 || stats.echecs > 0);
    if (typeof journaliser === 'function' && (erreur || actif || t - rappels.dernierJournal >= SIGNE_DE_VIE_MS)) {
      rappels.dernierJournal = t;
      try { await journaliser(NOM_CRON_RAPPELS, erreur ? 'erreur' : 'succes', erreur ? {} : { traites: stats?.traites || 0, succes: stats?.succes || 0, echecs: stats?.echecs || 0 }, erreur ? String(erreur.message || erreur) : null); } catch { /* journal indisponible */ }
    }
  }

  // Ordonnanceur arrÃªtÃ© (ou bloquÃ©) : plus de passage depuis 5 minutes alors qu'il est censÃ© tourner.
  function evaluerRappels() {
    if (rappels.demarreLe == null) return false;
    const t = maintenant();
    const depuis = rappels.dernierPassage ?? rappels.demarreLe;
    if (t - depuis <= DELAI_RAPPELS_MS) return false;
    alerte({
      type: 'surga_rappels_arret',
      titre: 'Surga : l\'ordonnanceur de rappels ne passe plus',
      message: `Aucun passage depuis ${Math.round((t - depuis) / 60000)} minutes. Les rappels ne sont plus envoyÃ©s.`,
      priorite: 'CRITIQUE',
    });
    return true;
  }

  // Collecte de presse : aucun nouvel article depuis 6 heures.
  async function evaluerPresse() {
    if (typeof derniereCollecte !== 'function') return false;
    let derniere = null;
    try { derniere = await derniereCollecte(); } catch { return false; }
    const age = derniere ? maintenant() - new Date(derniere).getTime() : Infinity;
    if (age <= DELAI_PRESSE_MS) return false;
    alerte({
      type: 'surga_presse_arret',
      titre: 'Surga : la collecte de presse n\'apporte plus d\'article',
      message: derniere ? `Dernier article reÃ§u il y a ${Math.round(age / 3600000)} heures.` : 'Aucun article en base.',
      priorite: 'ATTENTION',
    });
    return true;
  }

  function etat() {
    return {
      fenetre_minutes: FENETRE_MS / 60000,
      routes: etatRoutes(),
      rappels: {
        demarre_le: rappels.demarreLe ? new Date(rappels.demarreLe).toISOString() : null,
        dernier_passage: rappels.dernierPassage ? new Date(rappels.dernierPassage).toISOString() : null,
        echecs_consecutifs: rappels.echecsConsecutifs,
        dernier_resultat: rappels.dernierResultat,
      },
    };
  }

  return { intergiciel, compter, evaluerErreurs, demarrerRappels, passageRappels, evaluerRappels, evaluerPresse, etat };
}

// Instance du processus, branchÃ©e sur les services rÃ©els. Chargement diffÃ©rÃ© : ce module ne dÃ©pend pas de la base Ã  l'import.
let instance = null;
let veilleErreurs = null;
let veilleRappels = null;
function surveillance() {
  if (instance) return instance;
  instance = creerSurveillance({
    alerter: (opts) => require('../admin-alerts').alerterAdmin(opts),
    journaliser: async (nom, statut, stats, erreur) => {
      const { pool } = require('../../models/db');
      await pool.query(
        `INSERT INTO cron_executions (nom_cron, started_at, ended_at, statut, stats, erreur) VALUES ($1, NOW(), NOW(), $2, $3::jsonb, $4)`,
        [nom, statut, JSON.stringify(stats || {}), erreur]
      );
    },
    derniereCollecte: async () => {
      const { pool } = require('../../models/db');
      const { rows } = await pool.query('SELECT MAX(created_at) AS derniere FROM surga_briefing_items');
      return rows[0]?.derniere || null;
    },
  });
  return instance;
}

// Veilles pÃ©riodiques. Les erreurs de route se comptent dans le processus qui sert les requÃªtes ; l'ordonnanceur et la
// collecte de presse se surveillent dans celui qui les exÃ©cute. Les deux peuvent Ãªtre le mÃªme.
function demarrerVeille({ erreurs = false, rappels = false } = {}) {
  if (process.env.NODE_ENV === 'test') return;
  const s = surveillance();
  if (erreurs && !veilleErreurs) {
    veilleErreurs = setInterval(() => s.evaluerErreurs(), 60 * 1000);
    if (veilleErreurs.unref) veilleErreurs.unref();
  }
  if (rappels && !veilleRappels) {
    s.demarrerRappels();
    veilleRappels = setInterval(() => { s.evaluerRappels(); }, 60 * 1000);
    const presse = setInterval(() => { s.evaluerPresse().catch(() => {}); }, 30 * 60 * 1000);
    if (veilleRappels.unref) veilleRappels.unref();
    if (presse.unref) presse.unref();
  }
}

module.exports = { creerSurveillance, surveillance, demarrerVeille, NOM_CRON_RAPPELS, SEUIL_TAUX_5XX, MIN_REQUETES, FENETRE_MS };
