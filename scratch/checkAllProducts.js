require('dotenv').config();
const { pool } = require('../backend/models/db');

async function run() {
  try {
    const res = await pool.query(
      `SELECT whatsapp_sync_statut, COUNT(*) as count FROM boutique_produits GROUP BY whatsapp_sync_statut`
    );
    console.log("=== SYNCHRO SUMMARY ===");
    console.table(res.rows);

    const resSync = await pool.query(
      `SELECT nom, whatsapp_sync_statut, whatsapp_sync_erreur FROM boutique_produits WHERE whatsapp_sync_statut = 'synchronise' LIMIT 15`
    );
    console.log("=== EXEMPLES SYNCHRONISÉS ===");
    console.table(resSync.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
