#!/usr/bin/env node
// Script de peuplement rétroactif de offres.specs pour les offres déjà en base
// Usage : node backend/scripts/backfill-specs-offres.js [--dry-run]
// En --dry-run, affiche ce qui serait extrait sans rien modifier.

require('dotenv').config();
const { pool } = require('../models/db');
const { extraireSpecs } = require('../services/scraper');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(DRY_RUN ? '[DRY-RUN] Simulation — aucune modification en base' : '[LIVE] Backfill en base');

  const { rows } = await pool.query(`
    SELECT id, titre_marchand
    FROM offres
    WHERE specs IS NULL AND titre_marchand IS NOT NULL
  `);

  console.log(`Analyse de ${rows.length} offre(s) sans specs…`);

  let nbMisesAJour = 0;
  for (const row of rows) {
    const specs = extraireSpecs(row.titre_marchand);
    const aDesSpecs = specs.stockage_go || specs.ram_go || specs.couleur || specs.etat;
    if (aDesSpecs) {
      console.log(`[SPECS] "${row.titre_marchand}" →`, specs);
    }
    if (!DRY_RUN) {
      await pool.query('UPDATE offres SET specs=$1 WHERE id=$2', [JSON.stringify(specs), row.id]);
    }
    nbMisesAJour++;
  }

  console.log(`\nRésultat : ${nbMisesAJour} offre(s) ${DRY_RUN ? 'à mettre à jour' : 'mise(s) à jour'} sur ${rows.length} analysées.`);
  await pool.end();
}

main().catch(err => {
  console.error('[ERREUR]', err.message);
  pool.end();
  process.exit(1);
});
