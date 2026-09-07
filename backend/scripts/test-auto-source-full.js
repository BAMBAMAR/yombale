const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  try {
    console.log('=== TEST autoSourcerDepuisAnnonces ===');
    
    // Charger le service complet
    const { autoSourcerDepuisAnnonces } = require('../services/prospection');
    
    console.log('Lancement de autoSourcerDepuisAnnonces...');
    const result = await autoSourcerDepuisAnnonces();
    console.log('✅ SUCCÈS:', JSON.stringify(result, null, 2));
    
  } catch (err) {
    console.error('❌ ERREUR CAPTURÉE:');
    console.error('  Message:', err.message);
    console.error('  Code:', err.code);
    console.error('  Detail:', err.detail);
    console.error('  Stack:', err.stack);
  }
  process.exit(0);
}

run();
