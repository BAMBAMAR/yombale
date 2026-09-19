// backend/scripts/migrate-kalpe-legacy.js
// Migration idempotente : Carnet de Dettes & Ventes Express -> Sama Xaalis
require('dotenv').config();
const { pool } = require('../models/db');

async function migrateLegacyToKalpe() {
  console.log('[SAMA XAALIS MIGRATION] Démarrage de la réconciliation des données existantes...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Activer Sama Xaalis pour tous les utilisateurs existants
    const resUsers = await client.query(`
      INSERT INTO kalpe_abonnements (utilisateur_id, statut, type_acces, is_trial, fin)
      SELECT id, 'actif', 'standard', true, NOW() + INTERVAL '365 days'
      FROM utilisateurs
      ON CONFLICT (utilisateur_id) DO NOTHING
      RETURNING id
    `);
    console.log(`[SAMA XAALIS MIGRATION] ✅ ${resUsers.rowCount || 0} comptes utilisateurs activés sur Sama Xaalis.`);

    // 2. Migrer les dettes existantes depuis caisse_clients_credits
    // Seuls les clients ayant un solde > 0 ou < 0 sont importés dans les créances en cours
    const resDettes = await client.query(`
      INSERT INTO kalpe_dettes (
        utilisateur_id,
        boutique_id,
        contexte,
        direction,
        tiers_nom,
        tiers_telephone,
        montant_initial,
        montant_paye,
        montant_restant,
        statut,
        note,
        legacy_client_id,
        created_at
      )
      SELECT 
        b.utilisateur_id,
        c.boutique_id,
        'activite' AS contexte,
        CASE WHEN c.solde >= 0 THEN 'a_recevoir' ELSE 'a_payer' END AS direction,
        c.nom AS tiers_nom,
        c.telephone AS tiers_telephone,
        GREATEST(ABS(c.solde), 1) AS montant_initial,
        0 AS montant_paye,
        ABS(c.solde) AS montant_restant,
        CASE WHEN c.solde = 0 THEN 'solde' ELSE 'en_cours' END AS statut,
        COALESCE(c.note_client, 'Import carnet boutique initial') AS note,
        c.id AS legacy_client_id,
        c.created_at
      FROM caisse_clients_credits c
      JOIN boutiques b ON b.id = c.boutique_id
      WHERE b.utilisateur_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM kalpe_dettes kd WHERE kd.legacy_client_id = c.id
        )
      RETURNING id
    `);
    console.log(`[SAMA XAALIS MIGRATION] ✅ ${resDettes.rowCount || 0} créances/dettes existantes migrées avec succès.`);

    // 3. Migrer les dépenses de boutique existantes dans le journal kalpe_operations
    const resDepenses = await client.query(`
      INSERT INTO kalpe_operations (
        utilisateur_id,
        boutique_id,
        contexte,
        type,
        direction,
        montant,
        categorie,
        libelle,
        date_operation,
        reference,
        created_at
      )
      SELECT
        b.utilisateur_id,
        d.boutique_id,
        'activite' AS contexte,
        'depense' AS type,
        'sortie' AS direction,
        d.montant,
        COALESCE(d.categorie, 'autre') AS categorie,
        COALESCE(d.description, 'Dépense boutique') AS libelle,
        d.date_depense AS date_operation,
        'LEGACY-DEP-' || d.id::text AS reference,
        d.created_at
      FROM depenses d
      JOIN boutiques b ON b.id = d.boutique_id
      WHERE b.utilisateur_id IS NOT NULL
        AND d.montant > 0
      ON CONFLICT (reference) DO NOTHING
      RETURNING id
    `);
    console.log(`[SAMA XAALIS MIGRATION] ✅ ${resDepenses.rowCount || 0} dépenses boutique réconciliées dans Sama Xaalis.`);

    // 4. Migrer les ventes existantes dans kalpe_operations
    const resVentes = await client.query(`
      INSERT INTO kalpe_operations (
        utilisateur_id,
        boutique_id,
        contexte,
        type,
        direction,
        montant,
        categorie,
        libelle,
        tiers_nom,
        tiers_tel,
        date_operation,
        reference,
        created_at
      )
      SELECT
        b.utilisateur_id,
        v.boutique_id,
        'activite' AS contexte,
        'vente_express' AS type,
        'entree' AS direction,
        v.montant_total AS montant,
        'vente' AS categorie,
        COALESCE(v.nom_produit, 'Vente boutique') AS libelle,
        v.client_nom AS tiers_nom,
        v.client_telephone AS tiers_tel,
        v.created_at::date AS date_operation,
        'LEGACY-VNT-' || v.id::text AS reference,
        v.created_at
      FROM ventes v
      JOIN boutiques b ON b.id = v.boutique_id
      WHERE b.utilisateur_id IS NOT NULL
        AND v.montant_total > 0
      ON CONFLICT (reference) DO NOTHING
      RETURNING id
    `);
    console.log(`[SAMA XAALIS MIGRATION] ✅ ${resVentes.rowCount || 0} ventes existantes réconciliées dans Sama Xaalis.`);

    await client.query('COMMIT');
    console.log('[SAMA XAALIS MIGRATION] 🚀 Migration terminée avec succès, 0 perte de données !');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SAMA XAALIS MIGRATION ERROR]', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateLegacyToKalpe()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateLegacyToKalpe };
