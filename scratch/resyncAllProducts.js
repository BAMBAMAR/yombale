require('dotenv').config();
const { pool } = require('../backend/models/db');
const { syncProduit } = require('../backend/services/whatsapp-catalog');

async function run() {
  try {
    console.log("🔄 Récupération de tous les produits des boutiques actives...");
    const { rows } = await pool.query(
      `SELECT bp.*, b.slug AS boutique_slug, b.whatsapp_catalog_id
       FROM boutique_produits bp
       JOIN boutiques b ON b.id = bp.boutique_id
       WHERE b.actif = true`
    );

    console.log(`🚀 Lancement de la synchronisation pour ${rows.length} produit(s) vers Meta...`);

    let ok = 0;
    let ko = 0;

    for (let i = 0; i < rows.length; i++) {
      const p = rows[i];
      process.stdout.write(`[${i+1}/${rows.length}] Sync de "${p.nom}"... `);
      try {
        await syncProduit(p);
        console.log("✅ SUCCESS");
        ok++;
      } catch (err) {
        console.log("❌ FAILD :", err.message);
        ko++;
      }
    }

    console.log(`\n=== RAPPORT DE SYNCHRONISATION ===`);
    console.log(`✅ Succès : ${ok}`);
    console.log(`❌ Échecs : ${ko}`);
  } catch (err) {
    console.error("❌ Erreur générale :", err);
  } finally {
    await pool.end();
  }
}

run();
