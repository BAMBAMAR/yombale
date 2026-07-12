// backend/lib/scrapingLock.js
// Verrou global en mémoire pour empêcher deux scrapers lourds (Chromium/axios,
// consommateurs de RAM) de tourner en même temps sur le plan Render free (512 Mo) —
// un OOM kill en cours d'exécution a été constaté quand le cron produits et le
// scraper Facebook (navigateur headless) se chevauchaient.

let enCours = null; // nom du scraper actif, ou null

function tenterAcquerir(nom) {
  if (enCours) return false;
  enCours = nom;
  return true;
}

function relacher() {
  enCours = null;
}

function actif() {
  return enCours;
}

module.exports = { tenterAcquerir, relacher, actif };
