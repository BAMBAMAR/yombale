// backend/scripts/maintenance-reconcilier-donnees.js
// Script de réconciliation et assainissement des anomalies de données administratives
require('dotenv').config();
const { pool } = require('../models/db');

async function reconcilier() {
  console.log('🚀 [MAINTENANCE RECONCILIATION] Démarrage...');
  const bilan = {};

  // 1. Réconciliation des Abonnements Expirés
  try {
    const abmtCols = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'abonnements'
    `);
    const hasUpdatedAt = abmtCols.rows.some(c => c.column_name === 'updated_at');

    const updateSql = hasUpdatedAt
      ? `UPDATE abonnements SET statut = 'expire', updated_at = NOW() WHERE statut = 'actif' AND fin <= NOW() RETURNING id`
      : `UPDATE abonnements SET statut = 'expire' WHERE statut = 'actif' AND fin <= NOW() RETURNING id`;

    const resAbmt = await pool.query(updateSql);
    bilan.abonnements_expires_reconcilies = resAbmt.rowCount;
    console.log(`✅ ${resAbmt.rowCount} abonnements expirés passés de 'actif' à 'expire'`);
  } catch (err) {
    console.error('❌ Erreur réconciliation abonnements:', err.message);
    bilan.abonnements_erreur = err.message;
  }

  // 2. Désactivation des Boutiques Orphelines (sans utilisateur existant)
  try {
    const resBq = await pool.query(`
      UPDATE boutiques
      SET actif = FALSE
      WHERE actif = TRUE
        AND utilisateur_id NOT IN (SELECT id FROM utilisateurs)
      RETURNING id, nom
    `);
    bilan.boutiques_orphelines_desactivees = resBq.rowCount;
    console.log(`✅ ${resBq.rowCount} boutiques orphelines désactivées (actif=false)`);
  } catch (err) {
    console.error('❌ Erreur désactivation boutiques orphelines:', err.message);
    bilan.boutiques_erreur = err.message;
  }

  // 3. Correction des 3 produits marchands à prix 0 FCFA
  try {
    const resProd = await pool.query(`
      UPDATE boutique_produits
      SET en_stock = FALSE
      WHERE prix <= 0 AND en_stock = TRUE
      RETURNING id, nom
    `);
    bilan.produits_prix_zero_retires_stock = resProd.rowCount;
    console.log(`✅ ${resProd.rowCount} produits marchands à prix <= 0 retirés de la vente (en_stock=false)`);
  } catch (err) {
    console.error('❌ Erreur assainissement produits prix zéro:', err.message);
    bilan.produits_erreur = err.message;
  }

  console.log('\n📊 [BILAN FINAL]:', JSON.stringify(bilan, null, 2));
  await pool.end();
}

reconcilier().catch(console.error);
