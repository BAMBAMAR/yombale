require('dotenv').config();
const { pool } = require('../backend/models/db');

async function run() {
  try {
    const res = await pool.query(
      `SELECT id, nom, whatsapp_catalog_id FROM boutiques`
    );
    console.log("=== CATALOGUES PAR BOUTIQUE ===");
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
