require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../models/db');

async function main() {
  console.log("=== APPLICATION DES CORRECTIONS SQL DU PLAN D'AUDIT ===");
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ─────────────────────────────────────────────────────────────
    // S-001 : Mise en quarantaine du prix aberrant CoinAfrique (> 20M)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[S-001] Mise en quarantaine des offres > 20M...');
    const resS001 = await client.query(`
      UPDATE offres
      SET quarantinee = true, stock = false
      WHERE prix > 20000000 AND (quarantinee = false OR stock = true)
      RETURNING id, produit_id, prix
    `);
    console.log(`  -> ${resS001.rowCount} offre(s) mise(s) en quarantaine / déstockée(s).`);

    // Recalcul des produits affectés
    if (resS001.rowCount > 0) {
      const prodIds = [...new Set(resS001.rows.map(r => r.produit_id))];
      await client.query(`
        UPDATE produits SET
          prix_min = sub.prix_min,
          nb_offres = sub.nb_offres
        FROM (
          SELECT p.id,
            MIN(CASE WHEN o.stock AND NOT o.quarantinee THEN o.prix END) AS prix_min,
            COUNT(o.id) FILTER (WHERE o.stock AND NOT o.quarantinee) AS nb_offres
          FROM produits p
          LEFT JOIN offres o ON o.produit_id = p.id
          WHERE p.id = ANY($1::uuid[])
          GROUP BY p.id
        ) sub
        WHERE produits.id = sub.id
      `, [prodIds]);
      console.log(`  -> Produits recalculés pour S-001: ${prodIds.length}`);
    }

    // ─────────────────────────────────────────────────────────────
    // S-007 : Suppression des 227 offres mortes sans URL & stock=false
    // (Electroménager Dakar & AfriQ Market)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[S-007] Purge des offres sans URL et hors stock...');
    // Vérifier les historiques de prix liés
    await client.query(`
      DELETE FROM historique_prix
      WHERE offre_id IN (
        SELECT o.id FROM offres o
        JOIN marchands m ON m.id = o.marchand_id
        WHERE o.stock = false 
          AND (o.url_achat IS NULL OR TRIM(o.url_achat) = '')
          AND m.nom IN ('Electroménager Dakar', 'AfriQ Market')
      )
    `);
    const resS007 = await client.query(`
      DELETE FROM offres
      WHERE stock = false 
        AND (url_achat IS NULL OR TRIM(url_achat) = '')
        AND marchand_id IN (
          SELECT id FROM marchands WHERE nom IN ('Electroménager Dakar', 'AfriQ Market')
        )
      RETURNING id, produit_id
    `);
    console.log(`  -> ${resS007.rowCount} offre(s) fantôme(s) supprimée(s).`);

    // Purge des produits devenus totalement orphelins sans aucune offre
    const resOrphelins = await client.query(`
      DELETE FROM produits
      WHERE id NOT IN (SELECT DISTINCT produit_id FROM offres)
        AND id NOT IN (SELECT DISTINCT produit_id FROM alertes WHERE produit_id IS NOT NULL)
      RETURNING id
    `);
    console.log(`  -> ${resOrphelins.rowCount} produit(s) orphelin(s) sans aucune offre purgé(s).`);

    // ─────────────────────────────────────────────────────────────
    // S-006 : Dé-stockage des offres Kanje (> 30 jours sans scrape)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[S-006] Dé-stockage des offres Kanje inactives > 30 jours...');
    const resS006 = await client.query(`
      UPDATE offres
      SET stock = false
      WHERE marchand_id = (SELECT id FROM marchands WHERE nom = 'Kanje')
        AND scraped_at < NOW() - INTERVAL '30 days'
        AND stock = true
      RETURNING id, produit_id
    `);
    console.log(`  -> ${resS006.rowCount} offre(s) Kanje marquée(s) stock = false.`);

    if (resS006.rowCount > 0) {
      const prodIds = [...new Set(resS006.rows.map(r => r.produit_id))];
      await client.query(`
        UPDATE produits SET
          prix_min = sub.prix_min,
          nb_offres = sub.nb_offres
        FROM (
          SELECT p.id,
            MIN(CASE WHEN o.stock AND NOT o.quarantinee THEN o.prix END) AS prix_min,
            COUNT(o.id) FILTER (WHERE o.stock AND NOT o.quarantinee) AS nb_offres
          FROM produits p
          LEFT JOIN offres o ON o.produit_id = p.id
          WHERE p.id = ANY($1::uuid[])
          GROUP BY p.id
        ) sub
        WHERE produits.id = sub.id
      `, [prodIds]);
      console.log(`  -> Produits recalculés pour Kanje: ${prodIds.length}`);
    }

    // ─────────────────────────────────────────────────────────────
    // S-008 : Dé-stockage global des offres obsolètes (> 45 jours sans scrape)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[S-008] Dé-stockage des offres non rafraîchies depuis plus de 45 jours...');
    const resS008 = await client.query(`
      UPDATE offres
      SET stock = false
      WHERE stock = true
        AND scraped_at < NOW() - INTERVAL '45 days'
        AND quarantinee = false
      RETURNING id, produit_id
    `);
    console.log(`  -> ${resS008.rowCount} offre(s) obsolète(s) dé-stockée(s).`);

    if (resS008.rowCount > 0) {
      const prodIds = [...new Set(resS008.rows.map(r => r.produit_id))];
      // Traitement par lots pour éviter d'exploser le paramètre SQL
      const batchSize = 500;
      for (let i = 0; i < prodIds.length; i += batchSize) {
        const batch = prodIds.slice(i, i + batchSize);
        await client.query(`
          UPDATE produits SET
            prix_min = sub.prix_min,
            nb_offres = sub.nb_offres
          FROM (
            SELECT p.id,
              MIN(CASE WHEN o.stock AND NOT o.quarantinee THEN o.prix END) AS prix_min,
              COUNT(o.id) FILTER (WHERE o.stock AND NOT o.quarantinee) AS nb_offres
            FROM produits p
            LEFT JOIN offres o ON o.produit_id = p.id
            WHERE p.id = ANY($1::uuid[])
            GROUP BY p.id
          ) sub
          WHERE produits.id = sub.id
        `, [batch]);
      }
      console.log(`  -> ${prodIds.length} produits recalculés pour S-008.`);
    }

    // ─────────────────────────────────────────────────────────────
    // S-005 : Remplissage des descriptions NULL/vides dans produits
    // ─────────────────────────────────────────────────────────────
    console.log('\n[S-005] Backfill des descriptions de produits vides...');
    const resS005 = await client.query(`
      UPDATE produits
      SET description = nom
      WHERE description IS NULL OR TRIM(description) = ''
      RETURNING id
    `);
    console.log(`  -> ${resS005.rowCount} produit(s) mis à jour avec description = nom.`);

    // ─────────────────────────────────────────────────────────────
    // S-009 : Normalisation de la source Facebook
    // ─────────────────────────────────────────────────────────────
    console.log('\n[S-009] Migration colonne source_detail pour Facebook...');
    await client.query(`
      ALTER TABLE annonces_classifiees 
      ADD COLUMN IF NOT EXISTS source_detail VARCHAR(255)
    `);
    const resS009 = await client.query(`
      UPDATE annonces_classifiees
      SET source_detail = source
      WHERE source LIKE 'facebook%' AND source_detail IS NULL
      RETURNING id
    `);
    console.log(`  -> ${resS009.rowCount} annonce(s) renseignée(s) avec source_detail.`);

    // ─────────────────────────────────────────────────────────────
    // S-011 : Nettoyage des titres FB avec horodatage résiduel
    // "London Bridge il y a 10 heures" -> "London Bridge"
    // ─────────────────────────────────────────────────────────────
    console.log('\n[S-011] Nettoyage des titres FB contenant des horodatages relatifs...');
    const resS011 = await client.query(`
      UPDATE annonces_classifiees
      SET titre = REGEXP_REPLACE(titre, '\\s*(?:·|•)?\\s*il\\s+y\\s+a\\s+\\d+\\s+(?:heures?|minutes?|jours?|semaines?|mois).*$', '', 'i')
      WHERE titre ~* 'il\\s+y\\s+a\\s+\\d+\\s+(?:heures?|minutes?|jours?|semaines?|mois)'
      RETURNING id, titre
    `);
    console.log(`  -> ${resS011.rowCount} titre(s) FB assaini(s).`);
    if (resS011.rows.length > 0) {
      console.log('  Exemple nettoyé:', resS011.rows[0]);
    }

    await client.query('COMMIT');
    console.log('\n✅ TRANSACTION VALIDÉE AVEC SUCCÈS (COMMIT) !');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ERREUR LORS DES CORRECTIONS SQL, ROLLBACK EFFECTUÉ :', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
