// scripts/check-unes.js
require('dotenv').config();
const { pool } = require('../backend/models/db');

async function check() {
  try {
    const { rows } = await pool.query('SELECT id, nom_journal, image_url, date_parution, created_at FROM surga_unes_presse ORDER BY date_parution DESC, created_at DESC LIMIT 15');
    console.table(rows);
    await pool.end();
  } catch (err) {
    console.error('[DB ERROR]:', err.message);
    process.exit(1);
  }
}

check();
