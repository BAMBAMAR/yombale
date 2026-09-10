require('dotenv').config();
const { pool } = require('./models/db');

(async () => {
  try {
    // Get columns
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'prospection_campagnes' ORDER BY ordinal_position");
    console.log("Colonnes:", cols.rows.map(r => r.column_name));

    // Get last 10 campaigns
    const res = await pool.query("SELECT * FROM prospection_campagnes ORDER BY created_at DESC LIMIT 10");
    console.log("\nDernières campagnes:");
    res.rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
