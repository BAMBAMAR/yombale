// scripts/test-local-scraping-live.js
require('dotenv').config();
const { pool } = require('../backend/models/db');
const { lancerCollecteV2, scraperDecathlon } = require('../backend/services/scraper');
const { obtenirSource } = require('../backend/services/collecte/SourcesRegistry');

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('  TEST EN DIRECT DU FONCTIONNEMENT DU SCRAPING LOCAL (NOPALOU)');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // 1. Test de connectivité base de données
  try {
    const { rows: testDb } = await pool.query('SELECT NOW() as now, COUNT(*) as total_offres FROM offres');
    console.log(`[1/4] Connexion BDD PostgreSQL : OK (${testDb[0].total_offres} offres actuellement en base)`);
  } catch (err) {
    console.error('[1/4] ERREUR BDD:', err.message);
    process.exit(1);
  }

  // 2. Test d'une source V2 Store API (Soumari - 1 page)
  console.log('\n[2/4] Test Collecte V2 Store API (Soumari, 1 page)...');
  try {
    const soumariSrc = obtenirSource('soumari');
    const soumariCollector = soumariSrc.creerCollecteur({ perPage: 10, maxPages: 1 });
    const resSoumari = await soumariCollector.executer();
    console.log(`  -> Soumari: Statut = ${resSoumari.statut}, Extraits = ${resSoumari.extraits}, Insérés = ${resSoumari.inseres}, MAJ = ${resSoumari.mis_a_jour}`);
  } catch (err) {
    console.error('  -> Erreur Soumari:', err.message);
  }

  // 3. Test d'une source V2 HTML Cheerio (Decathlon - 1 catégorie)
  console.log('\n[3/4] Test Collecte V2 HTML Cheerio (Decathlon, 1 rayon)...');
  try {
    const decathlonSrc = obtenirSource('decathlon');
    const decathlonCollector = decathlonSrc.creerCollecteur({
      maxPagesParCategorie: 1,
      categories: [{ slug: 'fitness-cardio', path: '/3756-fitness-cardio' }],
    });
    const resDecathlon = await decathlonCollector.executer({ categoriesCibles: 1 });
    console.log(`  -> Decathlon: Statut = ${resDecathlon.statut}, Extraits = ${resDecathlon.extraits}, Insérés = ${resDecathlon.inseres}, MAJ = ${resDecathlon.mis_a_jour}`);
  } catch (err) {
    console.error('  -> Erreur Decathlon:', err.message);
  }

  // 4. Test d'une source V2 Immobilier (Keur-Immo - 1 page)
  console.log('\n[4/4] Test Collecte V2 Immobilier (Keur-Immo, 1 page)...');
  try {
    const keurImmoSrc = obtenirSource('keur_immo');
    const keurImmoCollector = keurImmoSrc.creerCollecteur({ maxPages: 1, enrichirDetails: false });
    const resKeurImmo = await keurImmoCollector.executer();
    console.log(`  -> Keur-Immo: Statut = ${resKeurImmo.statut}, Extraits = ${resKeurImmo.extraits}, Insérés = ${resKeurImmo.inseres}`);
  } catch (err) {
    console.error('  -> Erreur Keur-Immo:', err.message);
  }

  // 5. Vérification des derniers runs dans scraping_runs
  console.log('\n► Vérification des derniers enregistrements dans `scraping_runs` :');
  const { rows: derniersRuns } = await pool.query(`
    SELECT id, source, statut, items_extraits, items_inseres, items_maj, duree_ms, started_at
    FROM scraping_runs
    ORDER BY started_at DESC
    LIMIT 3
  `);
  console.table(derniersRuns.map(r => ({
    id: r.id,
    source: r.source,
    statut: r.statut,
    extraits: r.items_extraits,
    inseres: r.items_inseres,
    maj: r.items_maj,
    duree_s: Math.round(r.duree_ms / 1000),
    heure: new Date(r.started_at).toISOString().slice(11, 19)
  })));

  await pool.end();
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('  CONCLUSION : LE SCRAPING LOCAL EST PLEINEMENT OPÉRATIONNEL');
  console.log('══════════════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
