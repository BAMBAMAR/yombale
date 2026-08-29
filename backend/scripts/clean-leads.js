const { pool } = require('../models/db');
const { nettoyerContactNom } = require('../services/prospection');

async function run() {
  try {
    console.log('Starting DB cleanup of prospection_leads...');
    const res = await pool.query(`SELECT id, contact_nom FROM prospection_leads WHERE contact_nom IS NOT NULL`);
    let fixed = 0;
    
    for (const row of res.rows) {
      const cleaned = nettoyerContactNom(row.contact_nom);
      
      if (cleaned !== row.contact_nom) {
        await pool.query(`UPDATE prospection_leads SET contact_nom = $1 WHERE id = $2`, [cleaned, row.id]);
        fixed++;
      }
    }
    
    console.log(`Finished! Cleaned up ${fixed} leads with bad contact names.`);
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning leads:', err);
    process.exit(1);
  }
}

run();
