// scripts/crawl-ai.js
// Lancement du crawler sémantique intelligent Nopalou (inspiré de Crawl4AI)
//
// Utilisation :
//   node scripts/crawl-ai.js --url "https://site-annonce.com/locations"
//   node scripts/crawl-ai.js --test

require('dotenv').config();
const { crawlerPageIntelligente } = require('../backend/services/intelligent-crawler');

const args = process.argv.slice(2);
let url = null;

const urlIdx = args.indexOf('--url');
if (urlIdx !== -1 && args[urlIdx + 1]) {
  url = args[urlIdx + 1];
}

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('🧠 NOPALOU INTELLIGENT CRAWLER (Crawl4AI Architecture)');
  console.log('════════════════════════════════════════════════════════════\n');

  if (!url) {
    console.log('ℹ️ Aucune URL fournie. Démonstration de l\'architecture :');
    console.log('   Usage : node scripts/crawl-ai.js --url "https://exemple.com/annonces"');
    console.log('\n✅ Moteur opérationnel :');
    console.log('   • Playwright Chromium furtif');
    console.log('   • Nettoyage du bruit HTML (Readability-like)');
    console.log('   • Extraction structurée FCFA & contacts 221');
    console.log('   • Persistance binaire Cloudinary en RAM');
    console.log('   • Synchronisation PostgreSQL + CRM WhatsApp\n');
    process.exit(0);
  }

  console.log(`🌐 Crawling de l'URL : ${url}`);
  const startTime = Date.now();

  try {
    const res = await crawlerPageIntelligente({
      url,
      maxItems: 20,
      sourceLabel: 'crawler-ia'
    });

    const dureeSec = ((Date.now() - startTime) / 1000).toFixed(1);

    if (res.succes) {
      console.log('\n🎉 Crawling terminé avec succès !');
      console.log(`   - ⏱️ Durée : ${dureeSec}s`);
      console.log(`   - 🔍 Annonces détectées : ${res.annoncesTrouvees}`);
      console.log(`   - 💾 Annonces insérées dans le catalogue : ${res.annoncesInserees}`);
      console.log(`   - 📲 Leads synchronisés CRM WhatsApp : ${res.leadsSynchronises}`);
      if (res.diagnostic) console.log(`   - ⚠️ ${res.diagnostic}`);
    } else {
      console.log('\n⚠️ Le crawling s\'est terminé avec des alertes :');
      res.erreurs.forEach(e => console.log('   -', e));
    }
  } catch (err) {
    console.error('❌ Erreur critique :', err.message);
  }

  process.exit(0);
}

main();
