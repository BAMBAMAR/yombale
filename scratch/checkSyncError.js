require('dotenv').config();
const { pool } = require('../backend/models/db');

async function run() {
  try {
    const res = await pool.query(
      `SELECT nom, whatsapp_sync_statut, whatsapp_sync_erreur FROM boutique_produits WHERE whatsapp_sync_statut = 'echec'`
    );
    console.log("=== PRODUITS EN ECHEC WHATSAPP ===");
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
