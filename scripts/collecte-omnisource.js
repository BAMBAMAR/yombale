// scripts/collecte-omnisource.js
// Lancement direct de la collecte Omnisource (Google Search, Maps, Instagram, TikTok, Facebook)
//
// Utilisation :
//   node scripts/collecte-omnisource.js              → Collecte globale toutes verticales
//   node scripts/collecte-omnisource.js --immo       → Focus Immobilier (Google + Réseaux)
//   node scripts/collecte-omnisource.js --tech       → Focus Smartphones & High-Tech
//   node scripts/collecte-omnisource.js --mode       → Focus Mode & Prêt-à-Porter
//   node scripts/collecte-omnisource.js --places     → Scanner Commerces Physiques Dakar (Google Places)

// SRG-A5-011 : les tâches de collecte lisent .env.collecte quand il existe, sinon .env (scripts/lib/charger-env.js).
const FICHIER_DE_CONFIGURATION = require('./lib/charger-env').chargerEnvCollecte();
console.log(`Configuration lue : ${FICHIER_DE_CONFIGURATION}`);
const { lancerCollecteOmnisource } = require('../backend/services/omnisource-collector');

const args = process.argv.slice(2);
let verticale = 'all';
let mode = 'all';

if (args.includes('--immo'))       verticale = 'immo';
else if (args.includes('--tech'))  verticale = 'smartphones';
else if (args.includes('--mode'))  verticale = 'mode';
else if (args.includes('--beaute')) verticale = 'beaute';

if (args.includes('--places'))     mode = 'local';
else if (args.includes('--social')) mode = 'reseaux';

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('🌐 NOPALOU OMNISOURCE COLLECTOR (Google, Maps & Réseaux)');
  console.log(`   Mode : ${mode.toUpperCase()} | Verticale : ${verticale.toUpperCase()}`);
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    const res = await lancerCollecteOmnisource({ mode, verticale, limite: 50 });
    console.log('✅ Collecte terminée avec succès :');
    console.log(`   - 📢 Annonces publiques créées : ${res.totalAnnoncesCreees}`);
    console.log(`   - 👥 Leads CRM WhatsApp synchronisés : ${res.totalLeadsSynchronises}`);
    console.log(`   - 🛡️ Doublons évités : ${res.totalDoublonsEvites}`);
    console.log(`   - ⏱️ Durée : ${(res.dureeMs / 1000).toFixed(1)} secondes`);
    
    if (res.details && res.details.length > 0) {
      console.log('\n📊 Détails par canal :');
      for (const d of res.details) {
        console.log(`   • ${d.source} (${d.verticale || 'all'}) : ${d.annoncesInseres} annonces, ${d.leadsInseres} leads`);
      }
    }
  } catch (err) {
    console.error('❌ Erreur lors de la collecte :', err.message);
  }
  process.exit(0);
}

main();
