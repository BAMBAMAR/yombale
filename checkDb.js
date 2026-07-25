require('dotenv').config();
const { pool } = require('./backend/models/db');

async function check() {
  try {
    console.log("--- OFFRES PAR MARCHAND ---");
    const res = await pool.query(`
      SELECT m.nom as source, COUNT(o.id) as count, MAX(o.scraped_at) as last_update
      FROM offres o
      JOIN marchands m ON o.marchand_id = m.id
      GROUP BY m.nom
      ORDER BY count DESC
    `);
    console.table(res.rows);
    
    console.log("\n--- ANNONCES CLASSÉES (Facebook, Expat, CoinAfrique...) ---");
    const acRes = await pool.query(`
      SELECT source, COUNT(*) as count, MAX(created_at) as last_update
      FROM annonces_classifiees
      GROUP BY source
      ORDER BY count DESC
    `);
    console.table(acRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
