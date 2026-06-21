#!/usr/bin/env node
// Script de correction batch des prix aberrants en base
// Usage : node backend/scripts/corriger-prix-outliers.js [--dry-run]
// En --dry-run, affiche ce qui serait corrigé sans rien modifier.

require('dotenv').config();
const { pool } = require('../models/db');
const { corrigerPrixParPlancher } = require('../services/scraper');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(DRY_RUN ? '[DRY-RUN] Simulation — aucune modification en base' : '[LIVE] Corrections en base');

  const { rows } = await pool.query(`
    SELECT o.id, o.prix, p.nom AS nom_produit, m.nom AS marchand
    FROM offres o
    JOIN produits p ON p.id = o.produit_id
    JOIN marchands m ON m.id = o.marchand_id
    WHERE o.stock = true AND o.prix > 0
    ORDER BY o.prix ASC
  `);

  console.log(`Analyse de ${rows.length} offres…`);

  let nbCorrigees = 0;
  for (const row of rows) {
    const prixCorrige = corrigerPrixParPlancher(row.prix, row.nom_produit);
    if (prixCorrige !== row.prix && prixCorrige > 0) {
      console.log(`[CORRECTION] "${row.nom_produit}" (${row.marchand}) : ${row.prix} → ${prixCorrige} FCFA`);
      if (!DRY_RUN) {
        await pool.query(
          `UPDATE offres SET prix=$1 WHERE id=$2`,
          [prixCorrige, row.id]
        );
        await pool.query(
          `INSERT INTO historique_prix (offre_id, prix) VALUES ($1, $2)`,
          [row.id, prixCorrige]
        );
      }
      nbCorrigees++;
    }
  }

  console.log(`\nRésultat : ${nbCorrigees} offre(s) ${DRY_RUN ? 'à corriger' : 'corrigée(s)'} sur ${rows.length} analysées.`);
  await pool.end();
}

main().catch(err => {
  console.error('[ERREUR]', err.message);
  pool.end();
  process.exit(1);
});
