// backend/scripts/corriger-prix-offres.js
// Script ponctuel : corrige en base les prix d'offres déjà stockés avec des
// zéros manquants (×100/×1000), via l'unique heuristique de plancher (prixPlancher).
// But : éliminer la divergence entre pages en faisant de la valeur stockée
// la SEULE source de vérité (plus de "correction" recalculée à la lecture).
//
// Usage : node backend/scripts/corriger-prix-offres.js [--dry-run]

const { Pool } = require('pg');
require('dotenv').config();
const { corrigerPrixParPlancher } = require('../services/scraper');

const dryRun = process.argv.includes('--dry-run');

// Exclusion ponctuelle : la fonction de correction ne sait multiplier que par
// ×100/×1000 ; pour ces TV 43" l'écart réel semble être ×10 (1 zéro manquant),
// et ×100 produit un prix surcorrigé/irréaliste pour leur gamme. À vérifier
// manuellement plutôt qu'à corriger automatiquement ici.
const EXCLUSIONS = [
  /t[ée]l[ée]viseur astech 43/i,
  /t[ée]l[ée]viseur samsung 43 pouces ua43au7700kxxt/i,
];

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const { rows } = await pool.query(`
    SELECT o.id, o.prix, p.nom AS produit_nom
    FROM offres o
    JOIN produits p ON p.id = o.produit_id
    WHERE o.prix > 0
  `);

  let corrigees = 0;
  for (const r of rows) {
    if (EXCLUSIONS.some(re => re.test(r.produit_nom || ''))) continue;
    const prixCorrige = corrigerPrixParPlancher(parseFloat(r.prix), r.produit_nom);
    if (prixCorrige !== parseFloat(r.prix)) {
      corrigees++;
      console.log(`[${dryRun ? 'DRY-RUN' : 'UPDATE'}] "${r.produit_nom}" : ${r.prix} → ${prixCorrige} FCFA`);
      if (!dryRun) {
        await pool.query('UPDATE offres SET prix = $1 WHERE id = $2', [prixCorrige, r.id]);
      }
    }
  }

  console.log(`\n${corrigees} offre(s) corrigée(s) sur ${rows.length} analysée(s).`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
