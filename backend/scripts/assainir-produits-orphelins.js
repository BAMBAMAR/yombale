#!/usr/bin/env node
/**
 * backend/scripts/assainir-produits-orphelins.js
 * 
 * Assainissement sécurisé des fiches `produits` orphelines (générées par les échecs
 * d'upsert lors de re-scrapings avant la correction d'idempotence).
 * 
 * RÈGLE STRICTE :
 * - Ne touche qu'aux produits ayant STRICTEMENT 0 offre, 0 clic d'affiliation, 0 alerte.
 * - Ne supprime AUCUN produit actif ni aucune donnée marchand.
 * 
 * Usage :
 *   node backend/scripts/assainir-produits-orphelins.js           (Mode Dry-Run par défaut)
 *   node backend/scripts/assainir-produits-orphelins.js --execute (Exécution réelle)
 */

require('dotenv').config();
const { pool } = require('../models/db');

const EXECUTE = process.argv.includes('--execute');

async function main() {
  console.log('=== ASSAINISSEMENT DES PRODUITS ORPHELINS ===');
  console.log(`Mode : ${EXECUTE ? '🔴 EXÉCUTION RÉELLE' : '🟡 SIMULATION (DRY-RUN - aucune écriture)'}\n`);

  try {
    const totalProduits = await pool.query('SELECT COUNT(*) FROM produits');
    const totalOffres = await pool.query('SELECT COUNT(*) FROM offres');

    console.log(`État initial DB : ${totalProduits.rows[0].count} produits, ${totalOffres.rows[0].count} offres.`);

    // 1. Dénombrement strict des orphelins sans AUCUNE offre, clic ou alerte
    const { rows: rCompte } = await pool.query(`
      SELECT COUNT(*) AS total_orphelins
      FROM produits p
      WHERE p.id NOT IN (SELECT DISTINCT produit_id FROM offres WHERE produit_id IS NOT NULL)
        AND p.id NOT IN (SELECT DISTINCT produit_id FROM clics_affiliation WHERE produit_id IS NOT NULL)
        AND p.id NOT IN (
          SELECT DISTINCT produit_id FROM alertes WHERE produit_id IS NOT NULL
        )
    `);

    const totalOrphelins = parseInt(rCompte[0].total_orphelins, 10);
    console.log(`\nFiches orphelines identifiées (0 offre, 0 clic, 0 alerte) : ${totalOrphelins}`);

    if (totalOrphelins === 0) {
      console.log('✅ Aucun produit orphelin à purger. La base est saine.');
      await pool.end();
      return;
    }

    // Top 10 des catégories / noms parmi ces orphelins
    const { rows: topExemples } = await pool.query(`
      SELECT LOWER(TRIM(p.nom)) AS nom_norm, COUNT(*) AS nb
      FROM produits p
      WHERE p.id NOT IN (SELECT DISTINCT produit_id FROM offres WHERE produit_id IS NOT NULL)
        AND p.id NOT IN (SELECT DISTINCT produit_id FROM clics_affiliation WHERE produit_id IS NOT NULL)
      GROUP BY LOWER(TRIM(p.nom))
      ORDER BY nb DESC
      LIMIT 10
    `);

    console.log('\nTop 10 des scories orphelines prêtes à être nettoyées :');
    topExemples.forEach(r => console.log(`  ${String(r.nb).padStart(5)}x : ${r.nom_norm.slice(0, 60)}`));

    if (!EXECUTE) {
      console.log('\nℹ️ [DRY-RUN] Aucune suppression effectuée.');
      console.log('Pour exécuter la purge réelle, relancer avec : node backend/scripts/assainir-produits-orphelins.js --execute');
      return;
    }

    // Exécution par lots de 5 000 pour ne pas bloquer PostgreSQL
    console.log('\nDébut de la purge par lots de 5 000...');
    let supprimes = 0;
    const BATCH_SIZE = 5000;

    while (true) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const res = await client.query(`
          DELETE FROM produits
          WHERE id IN (
            SELECT p.id FROM produits p
            WHERE p.id NOT IN (SELECT DISTINCT produit_id FROM offres WHERE produit_id IS NOT NULL)
              AND p.id NOT IN (SELECT DISTINCT produit_id FROM clics_affiliation WHERE produit_id IS NOT NULL)
              AND p.id NOT IN (SELECT DISTINCT produit_id FROM alertes WHERE produit_id IS NOT NULL)
            LIMIT $1
          )
        `, [BATCH_SIZE]);
        await client.query('COMMIT');

        supprimes += res.rowCount;
        console.log(`  -> Lot supprimé : ${res.rowCount} (Cumul : ${supprimes} / ${totalOrphelins})`);

        if (res.rowCount === 0) break;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur lot :', err.message);
        break;
      } finally {
        client.release();
      }
    }

    const { rows: finP } = await pool.query('SELECT COUNT(*) FROM produits');
    const { rows: finO } = await pool.query('SELECT COUNT(*) FROM offres');

    console.log(`\n🎉 Nettoyage terminé avec succès !`);
    console.log(`  Fiches supprimées : ${supprimes}`);
    console.log(`  Catalogue final : ${finP[0].count} produits (avec ${finO[0].count} offres associées).`);

  } catch (err) {
    console.error('Erreur globale :', err.message);
  } finally {
    await pool.end();
  }
}

main();
