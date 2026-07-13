#!/usr/bin/env node
// Lance le scraper Facebook (services/scraper-immo-facebook.js) depuis la machine
// locale, en écrivant directement dans la base de production (via DATABASE_URL du
// .env local). À exécuter manuellement quand on veut enrichir /annonces.
//
// Pourquoi en local et pas via le bouton admin (qui appelle la même fonction côté
// serveur) : le plan Render free (512 Mo RAM) ne supporte pas de façon fiable un
// navigateur Chromium headless en plus du reste du service — testé en conditions
// réelles, le service redémarrait (OOM) en pleine exécution du scraping, sans
// jamais insérer d'annonce. Une machine locale a largement assez de RAM.
//
// Prérequis : backend/.fb-session.json doit exister (généré via
// node backend/scripts/fb-login-setup.js).
//
// Usage :
//   node backend/scripts/scraper-facebook-local.js              (5 groupes, insertion réelle)
//   node backend/scripts/scraper-facebook-local.js --dry-run     (aperçu, aucune écriture)
//   node backend/scripts/scraper-facebook-local.js --tout        (les 16 groupes en un seul run)

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { scraperImmo } = require('../services/scraper-immo-facebook');

const dryRun    = process.argv.includes('--dry-run');
const tout      = process.argv.includes('--tout');
const maxGroupes = tout ? 16 : 5;

// Résumé texte écrit à part (pas dans le log complet) — lu par
// scraper-facebook-auto.bat pour construire la notification Windows de fin d'exécution.
const RESUME_FILE = path.join(__dirname, '../.fb-scraper-resume.txt');

(async () => {
  console.log(dryRun ? '[DRY-RUN] Aperçu — aucune écriture en base' : '[LIVE] Insertion réelle en base');
  console.log(`Groupes visités ce run : ${maxGroupes}${tout ? ' (tous)' : ' (relancez la commande pour couvrir les suivants)'}`);

  const stats = await scraperImmo({ dryRun, maxGroupes });
  console.log('\nRésultat :', JSON.stringify(stats, null, 2));

  const resume = stats.erreurs.length > 0
    ? `Erreur : ${stats.erreurs[0]}`
    : `${stats.inseres} annonce(s) ajoutee(s), ${stats.doublons} doublon(s), ${stats.ignores} ignoree(s)`;
  try { fs.writeFileSync(RESUME_FILE, resume); } catch {}

  process.exit(stats.erreurs.length > 0 ? 1 : 0);
})().catch(err => {
  try { fs.writeFileSync(RESUME_FILE, `Erreur fatale : ${err.message}`); } catch {}
  console.error('[FATAL]', err);
  process.exit(1);
});
