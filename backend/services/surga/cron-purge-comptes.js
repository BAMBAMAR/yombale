// backend/services/surga/cron-purge-comptes.js
// SRG-A1-020 : supprime les données Surga des comptes supprimés (anonymisés, ou dont la demande de suppression a
// plus de trente jours). Aucun traitement ne le faisait : les notes, dépenses, rappels et le profil professionnel
// restaient en base après la suppression du compte.

const { purgerDonneesComptesSupprimes } = require('./donnees-service');

const PREMIER_PASSAGE_MS = 5 * 60 * 1000;
const INTERVALLE_MS = 60 * 60 * 1000;

let minuterie = null;

function demarrerCronPurgeComptes() {
  if (minuterie || process.env.NODE_ENV === 'test') return;
  const { executerTacheCron } = require('../../lib/cronLogger');
  const passer = () => {
    executerTacheCron('surga_purge_comptes_supprimes', () => purgerDonneesComptesSupprimes()).catch((err) => {
      console.warn('[CRON SURGA PURGE COMPTES] Échec :', err.message);
    });
  };
  setTimeout(passer, PREMIER_PASSAGE_MS);
  minuterie = setInterval(passer, INTERVALLE_MS);
}

function arreterCronPurgeComptes() {
  if (minuterie) {
    clearInterval(minuterie);
    minuterie = null;
  }
}

module.exports = { demarrerCronPurgeComptes, arreterCronPurgeComptes };
