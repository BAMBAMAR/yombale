require('dotenv').config();
const { pool } = require('../backend/models/db');

async function run() {
  try {
    const res = await pool.query(
      `UPDATE boutiques SET whatsapp_catalog_id = NULL RETURNING id, nom, whatsapp_catalog_id`
    );
    console.log("=== BOUTIQUES APRES MISE A JOUR ===");
    console.table(res.rows);
    console.log("✅ Les catalogues ont bien été mis à NULL pour utiliser le catalogue global Render !");
  } catch (err) {
    console.error("❌ Erreur de mise à jour :", err);
  } finally {
    await pool.end();
  }
}

run();
