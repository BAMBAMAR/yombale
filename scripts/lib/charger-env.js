// scripts/lib/charger-env.js
// Configuration des tâches de collecte lancées sur un poste (tâches planifiées Windows, scripts/run-scraper-task.bat).
//
// SRG-A5-011 : le fichier `.env` du dépôt portait la configuration de production. Tout ce qui était lancé depuis ce
// dossier agissait donc sur la vraie base, et un backend démarré sur le poste rejouait les tâches planifiées de
// production. Les tâches de collecte lisent maintenant leur propre fichier, `.env.collecte`, quand il existe ; le
// `.env` du dépôt peut alors pointer une base locale. Tant que `.env.collecte` n'existe pas, rien ne change.
//
// Les deux fichiers sont ignorés par git. Mise en place : scripts/poste/separer-configuration.ps1.

const fs = require('fs');
const path = require('path');

function chargerEnvCollecte() {
  const racine = path.resolve(__dirname, '../..');
  const propre = path.join(racine, '.env.collecte');
  const fichier = fs.existsSync(propre) ? propre : path.join(racine, '.env');
  // Chargé en premier : un `.env` lu ensuite par un module du backend ne remplace pas ces valeurs.
  require('dotenv').config({ path: fichier });
  return path.basename(fichier);
}

module.exports = { chargerEnvCollecte };
