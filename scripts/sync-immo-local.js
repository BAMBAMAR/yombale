// scripts/sync-immo-local.js
// Lancer le scraper immo DEPUIS VOTRE MACHINE (pas Railway)
// → Votre IP n'est pas bloquée par expat-dakar
//
// Utilisation :
//   1. Mettez DATABASE_URL=<URL Railway Postgres> dans .env
//   2. node scripts/sync-immo-local.js
//   3. node scripts/sync-immo-local.js --dry   (dry-run, pas d'insertion)
//   4. node scripts/sync-immo-local.js --coinafrique

require('dotenv').config();
const path = require('path');

const source = process.argv.includes('--coinafrique') ? 'coinafrique' : 'expat-dakar';
const dryRun = process.argv.includes('--dry');

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL manquant dans .env');
  console.error('    Ajoutez la ligne : DATABASE_URL=postgresql://...<URL Railway>...');
  process.exit(1);
}

console.log(`\n🚀  Sync immo local — source: ${source} | dry: ${dryRun}`);
console.log(`    DB: ${process.env.DATABASE_URL.replace(/:\/\/.*@/, '://*****@')}\n`);

const SCRAPERS = {
  'expat-dakar': path.join(__dirname, '../backend/services/scraper-immo-expat'),
  'coinafrique': path.join(__dirname, '../backend/services/scraper-immo-coinafrique'),
};

const { scraperImmo } = require(SCRAPERS[source]);

scraperImmo({ dryRun })
  .then(stats => {
    console.log('\n✅  Terminé !');
    console.log(`    Scrapés : ${stats.scrapes}`);
    console.log(`    ${dryRun ? 'Trouvés' : 'Insérés'} : ${stats.inseres}`);
    if (stats.erreurs?.length) console.log(`    Erreurs : ${stats.erreurs.length}`, stats.erreurs.slice(0, 3));
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌  Erreur fatale :', err.message);
    process.exit(1);
  });
