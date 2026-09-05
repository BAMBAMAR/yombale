// backend/scripts/assainir-prix-outliers.js
// ═══════════════════════════════════════════════════════════════
// Script d'assainissement et de réparation de la qualité des prix
// 1. Détecte et met en quarantaine les offres aberrantes rattachées
//    à un produit (faux matching d'accessoire ou article incompatible)
// 2. Répare les prix historiques WooCommerce divisés par 100
// 3. Recalcule prix_min et nb_offres sur la table produits
// ═══════════════════════════════════════════════════════════════

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
}

const { pool } = require('../models/db');
const { corrigerPrixParPlancher } = require('../services/scraper');

async function assainirDonnees() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 DÉMARRAGE DE L\'ASSAINISSEMENT DES PRIX ET OFFRES');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // ── 1. RÉPARATION DES PRIX DIVISÉS PAR 100 (WooCommerce historique) ──
    console.log('--- 1. Réparation des prix historiques divisés par 100 ---');
    const wcRes = await pool.query(`
      SELECT o.id, o.prix, o.titre_marchand, o.url_achat, m.nom as marchand, p.nom as produit_nom
      FROM offres o
      JOIN marchands m ON m.id = o.marchand_id
      JOIN produits p ON p.id = o.produit_id
      WHERE m.nom IN ('Soumari', 'Master Office Déco', 'Kanje', 'Electronic Corp SN', 'Univers Cosmetix', 'Univers Cosmétix')
        AND o.prix < 15000
    `);

    let reparerCount = 0;
    for (const row of wcRes.rows) {
      const pActuel = parseFloat(row.prix);
      const nomReference = row.titre_marchand || row.produit_nom || '';
      const pCorrige = corrigerPrixParPlancher(pActuel, nomReference);

      if (pCorrige !== pActuel && pCorrige === pActuel * 100) {
        await pool.query('UPDATE offres SET prix = $1 WHERE id = $2', [pCorrige, row.id]);
        console.log(`  [RÉPARÉ ×100] ${row.marchand} : ${pActuel} → ${pCorrige} FCFA ("${nomReference.slice(0, 45)}")`);
        reparerCount++;
      }
    }
    console.log(`✅ ${reparerCount} prix d'offres historiques corrigés (×100)\n`);

    // ── 2. DÉTECTION ET QUARANTAINE DES OFFRES HORS FOURCHETTE MÉDIANE ──
    console.log('--- 2. Quarantaine des offres aberrantes / faux rapprochements ---');
    const outliersRes = await pool.query(`
      WITH stats_produit AS (
        SELECT produit_id,
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY prix) as mediane,
               COUNT(*) as nb_offres
        FROM offres
        WHERE stock = true AND quarantinee = false
        GROUP BY produit_id
        HAVING COUNT(*) >= 2
      )
      SELECT o.id, o.produit_id, p.nom as produit_nom, o.prix, sp.mediane, sp.nb_offres,
             m.nom as marchand, o.titre_marchand, o.url_achat
      FROM offres o
      JOIN stats_produit sp ON sp.produit_id = o.produit_id
      JOIN produits p ON p.id = o.produit_id
      JOIN marchands m ON m.id = o.marchand_id
      WHERE o.stock = true AND o.quarantinee = false
        AND (o.prix < sp.mediane * 0.35 OR o.prix > sp.mediane * 3.0)
      ORDER BY (sp.mediane / NULLIF(o.prix, 0)) DESC
    `);

    let quarantines = 0;
    let reparerViaMediane = 0;

    for (const r of outliersRes.rows) {
      const prix = parseFloat(r.prix);
      const mediane = parseFloat(r.mediane);

      // Si le prix × 100 tombe parfaitement dans la médiane [0.5× - 2.0×], c'est un prix divisé par 100
      const prixFois100 = Math.round(prix * 100);
      if (prixFois100 >= mediane * 0.5 && prixFois100 <= mediane * 2.0) {
        await pool.query('UPDATE offres SET prix = $1 WHERE id = $2', [prixFois100, r.id]);
        console.log(`  [RÉPARÉ VIA MÉDIANE ×100] ${r.marchand} : ${prix} → ${prixFois100} FCFA (médiane: ${Math.round(mediane)})`);
        reparerViaMediane++;
        continue;
      }

      // Sinon, c'est un produit/accessoire incompatible (ex: lampe de poche sur TV) ➔ Quarantaine
      await pool.query(`
        UPDATE offres
        SET quarantinee = true
        WHERE id = $1
      `, [r.id]);

      // Enregistrer dans le log de quarantaine si la table existe
      try {
        await pool.query(`
          INSERT INTO quarantines_log (offre_id, raison, prix, prix_moyen_30j)
          VALUES ($1, $2, $3, $4)
        `, [r.id, `hors_fourchette_mediane_${mediane.toFixed(0)}`, prix, mediane]);
      } catch {
        // Table optionnelle
      }

      console.log(`  [QUARANTINÉE] ${r.marchand} : ${prix} FCFA vs Médiane ${Math.round(mediane)} FCFA ("${(r.titre_marchand || r.produit_nom).slice(0, 45)}")`);
      quarantines++;
    }

    console.log(`✅ ${reparerViaMediane} offres réparées (×100) car proches de la médiane`);
    console.log(`✅ ${quarantines} offres aberrantes mises en quarantaine\n`);

    // ── 3. RECALCUL GLOBAL DE PRIX_MIN ET NB_OFFRES SUR PRODUITS ──
    console.log('--- 3. Recalcul des champs prix_min et nb_offres sur les produits ---');
    const updateRes = await pool.query(`
      UPDATE produits p
      SET prix_min = sub.prix_min,
          nb_offres = sub.nb_offres
      FROM (
        SELECT p2.id,
               MIN(CASE WHEN o.stock = true AND o.quarantinee = false THEN o.prix END) as prix_min,
               COUNT(CASE WHEN o.stock = true AND o.quarantinee = false THEN o.id END) as nb_offres
        FROM produits p2
        LEFT JOIN offres o ON o.produit_id = p2.id
        GROUP BY p2.id
      ) sub
      WHERE p.id = sub.id
        AND (p.prix_min IS DISTINCT FROM sub.prix_min OR p.nb_offres IS DISTINCT FROM sub.nb_offres)
      RETURNING p.id, p.nom, p.prix_min, p.nb_offres
    `);

    console.log(`✅ ${updateRes.rowCount} produits mis à jour avec leurs prix réels corrigés !\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 ASSAINISSEMENT TERMINÉ AVEC SUCCÈS !');
    console.log('═══════════════════════════════════════════════════════');

  } catch (err) {
    console.error('❌ Erreur lors de l\'assainissement :', err);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  assainirDonnees().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { assainirDonnees };
