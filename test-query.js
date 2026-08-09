require('dotenv').config({path: 'backend/.env'});
const { pool } = require('./backend/models/db');
async function run() {
  const { rows } = await pool.query("SELECT categorie_slug, titre FROM annonces_classifiees WHERE categorie_slug = 'divers' LIMIT 15");
  console.log("=== DIVERS ===");
  rows.forEach(r => console.log(r.titre));
  
  const { rows: rows2 } = await pool.query("SELECT categorie_slug, titre FROM annonces_classifiees WHERE categorie_slug = 'emploi' LIMIT 15");
  console.log("=== EMPLOI ===");
  rows2.forEach(r => console.log(r.titre));
  
  process.exit(0);
}
run();
