// scripts/audit/scraping/audit-a3-verifier-decathlon-fix.js
require('dotenv').config();
const path = require('path');
const { pool } = require(path.join(__dirname, '../../../backend/models/db'));
const DecathlonCollector = require(path.join(__dirname, '../../../backend/services/collecte/DecathlonCollector'));

(async () => {
  console.log('Testing Decathlon fix with live execution on 1 category...');
  const collector = new DecathlonCollector({
    delaiMs: 800,
    maxPagesParCategorie: 1,
    categories: [{ slug: 'fitness-cardio', path: '/3756-fitness-cardio' }],
  });

  // Collecter et persister 1 catégorie
  const result = await collector.executer({ categoriesCibles: 1 });
  console.log('Resultat executer():', result);

  // Vérifier en base les dernières offres insérées
  const { rows: offres } = await pool.query(`
    SELECT o.id, o.prix, o.titre_marchand, p.nom, o.scraped_at
    FROM offres o
    JOIN produits p ON p.id = o.produit_id
    WHERE o.marchand_id = (SELECT id FROM marchands WHERE nom = 'Decathlon')
    ORDER BY o.scraped_at DESC
    LIMIT 10
  `);
  console.log('\nDernières offres Decathlon en BDD :');
  console.table(offres.map(o => ({
    titre_marchand: o.titre_marchand,
    produit_nom: o.nom,
    prix: Number(o.prix),
    scraped_at: o.scraped_at ? new Date(o.scraped_at).toISOString().slice(11, 19) : null,
  })));

  // Vérifier scraping_runs
  const { rows: lastRun } = await pool.query(`
    SELECT id, source, statut, started_at, items_extraits, items_inseres, items_maj, duree_ms
    FROM scraping_runs
    WHERE source = 'Decathlon'
    ORDER BY started_at DESC
    LIMIT 1
  `);
  console.log('\nDernier run Decathlon dans scraping_runs :');
  console.table(lastRun);

  await pool.end();
  process.exit(0);
})();
