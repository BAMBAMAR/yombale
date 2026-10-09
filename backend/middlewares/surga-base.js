// backend/middlewares/surga-base.js
// Disponibilité de la base pour les routes de Surga.
// SRG-A1-017 / SRG-A2-009 : quand la base ne répond pas, une quarantaine de replis en mémoire servaient des catalogues
// écrits dans le code (tarifs, concours, adresses, démarches, statistiques à zéro) avec un code 200. Le contenu pouvait
// différer de celui de la base (prix modifiés par l'administration, fiches non publiées) sans que rien ne le dise.
// Ce contrôle répond 503 à l'entrée du routeur : aucun repli n'est atteint tant que la base est absente.

const { pool } = require('../models/db');

const DUREE_MEMOIRE_MS = 5000;
const DELAI_SONDE_MS = 3000;

let dernier = { quand: 0, ok: true };
let sondeEnCours = null;

function sonder() {
  const delai = new Promise((resolve) => setTimeout(() => resolve(false), DELAI_SONDE_MS));
  const requete = pool.query('SELECT 1').then(() => true, () => false);
  return Promise.race([requete, delai]);
}

async function baseRepond() {
  if (Date.now() - dernier.quand < DUREE_MEMOIRE_MS) return dernier.ok;
  if (!sondeEnCours) {
    sondeEnCours = sonder().then((ok) => {
      dernier = { quand: Date.now(), ok };
      sondeEnCours = null;
      return ok;
    });
  }
  return sondeEnCours;
}

// Lectures qui ne dépendent pas de la base : météo, scores, liste et flux des radios.
const SANS_BASE = /^\/(meteo|radios|sport)(\/|$)/;

async function exigerBase(req, res, next) {
  if (process.env.NODE_ENV === 'test') return next();
  if (req.method === 'GET' && SANS_BASE.test(req.path)) return next();
  if (await baseRepond()) return next();
  return res.status(503).json({
    success: false,
    code: 'SERVICE_INDISPONIBLE',
    error: 'Service momentanément indisponible, veuillez réessayer.',
  });
}

module.exports = { exigerBase };
