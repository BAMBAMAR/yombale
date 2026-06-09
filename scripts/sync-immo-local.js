// scripts/sync-immo-local.js
// Lancer les scrapers immo DEPUIS VOTRE MACHINE (pas Railway)
// → Votre IP n'est pas bloquée par expat-dakar / coinafrique
//
// Utilisation :
//   node scripts/sync-immo-local.js                   → expat-dakar
//   node scripts/sync-immo-local.js --coinafrique      → coinafrique
//   node scripts/sync-immo-local.js --facebook         → facebook (nécessite FB_EMAIL + FB_PASSWORD dans .env)
//   node scripts/sync-immo-local.js --all              → les 3 sources en séquence
//   node scripts/sync-immo-local.js --dry              → dry-run (affiche sans insérer)

require('dotenv').config();
const path = require('path');

const args   = process.argv.slice(2);
const dryRun = args.includes('--dry');
const all    = args.includes('--all');

let sources;
if (all) {
  sources = ['expat-dakar', 'coinafrique', 'facebook'];
} else if (args.includes('--coinafrique')) {
  sources = ['coinafrique'];
} else if (args.includes('--facebook')) {
  sources = ['facebook'];
} else {
  sources = ['expat-dakar'];
}

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL manquant dans .env');
  console.error('    Ajoutez : DATABASE_URL=postgresql://postgres:MOT_DE_PASSE@monorail.proxy.rlwy.net:PORT/railway');
  process.exit(1);
}

if (sources.includes('facebook') && !process.env.FB_EMAIL) {
  console.warn('⚠️   Facebook : FB_EMAIL et FB_PASSWORD non définis dans .env — cette source sera ignorée');
  sources = sources.filter(s => s !== 'facebook');
  if (!sources.length) process.exit(0);
}

const SCRAPERS = {
  'expat-dakar': path.join(__dirname, '../backend/services/scraper-immo-expat'),
  'coinafrique': path.join(__dirname, '../backend/services/scraper-immo-coinafrique'),
  'facebook':    path.join(__dirname, '../backend/services/scraper-immo-facebook'),
};

async function runSource(source) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🚀  ${source.toUpperCase()} | dry: ${dryRun}`);
  console.log(`    DB: ${process.env.DATABASE_URL.replace(/:\/\/.*@/, '://*****@')}`);
  console.log(`${'─'.repeat(50)}`);

  const { scraperImmo } = require(SCRAPERS[source]);
  const stats = await scraperImmo({ dryRun });

  console.log(`\n✅  ${source} terminé`);
  console.log(`    Scrapés : ${stats.scrapes}`);
  console.log(`    ${dryRun ? 'Trouvés' : 'Insérés'} : ${stats.inseres}`);
  if (stats.erreurs?.length) {
    console.log(`    Erreurs : ${stats.erreurs.length}`);
    stats.erreurs.slice(0, 3).forEach(e => console.log('    -', e));
  }
  return stats;
}

async function main() {
  const totaux = { scrapes: 0, inseres: 0, erreurs: 0 };

  for (const src of sources) {
    try {
      const s = await runSource(src);
      totaux.scrapes  += s.scrapes  || 0;
      totaux.inseres  += s.inseres  || 0;
      totaux.erreurs  += s.erreurs?.length || 0;
    } catch (err) {
      console.error(`\n❌  ${src} — erreur fatale :`, err.message);
      totaux.erreurs++;
    }
  }

  if (sources.length > 1) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📊  TOTAL — ${sources.join(' + ')}`);
    console.log(`    Scrapés : ${totaux.scrapes}`);
    console.log(`    ${dryRun ? 'Trouvés' : 'Insérés'} : ${totaux.inseres}`);
    console.log(`    Erreurs : ${totaux.erreurs}`);
  }

  process.exit(totaux.erreurs > 0 && totaux.inseres === 0 ? 1 : 0);
}

main().catch(err => { console.error(err.message); process.exit(1); });
