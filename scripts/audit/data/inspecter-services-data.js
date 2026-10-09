require('dotenv').config();
const { pool } = require('../../../backend/models/db');

async function main() {
  console.log('=== INSPECTION DES DONNEES LOCALES SURGA & NOPALOU ===');
  
  // 1. Lister les tables
  const resTables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  const allTables = resTables.rows.map(r => r.table_name);
  console.log('Tables totales :', allTables.length);
  
  const relevantTables = allTables.filter(t => 
    t.includes('immo') || 
    t.includes('adress') || 
    t.includes('plan') || 
    t.includes('annonce') || 
    t.includes('lieu') ||
    t.includes('surga')
  );
  console.log('Tables pertinentes :', relevantTables);
  
  for (const t of relevantTables) {
    try {
      const cnt = await pool.query(`SELECT count(*) as c FROM ${t}`);
      console.log(`- ${t} : ${cnt.rows[0].c} lignes`);
    } catch (e) {
      console.log(`- ${t} : ERREUR (${e.message})`);
    }
  }
  
  // Vérifier annonces_classifiees
  if (allTables.includes('annonces_classifiees')) {
    const cats = await pool.query(`
      SELECT categorie, count(*) as c 
      FROM annonces_classifiees 
      GROUP BY categorie 
      ORDER BY c DESC 
      LIMIT 10
    `);
    console.log('\nAnnonces classifiées par catégorie :');
    console.table(cats.rows);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
