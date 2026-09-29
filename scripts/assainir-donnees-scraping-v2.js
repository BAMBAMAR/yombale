const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('=== DÉMARRAGE DE L\'ASSAINISSEMENT DE LA BASE SCRAPING NOPALOU ===');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. S-005 : Purge des 2 933 annonces orphelines sans contact de CoinAfrique et Expat-Dakar rejetées depuis juin 2026
    const resS005 = await client.query(`
      DELETE FROM annonces_immo 
      WHERE rejete = true 
        AND (contact_tel IS NULL OR contact_tel = '' OR length(regexp_replace(contact_tel, '[^0-9]', '', 'g')) < 9)
        AND source IN ('coinafrique', 'expat-dakar')
      RETURNING id
    `);
    console.log(`[S-005] Annonces orphelines sans contact purgées : ${resS005.rowCount}`);

    // 2. S-001 : Désactiver les annonces actives ayant pour titre des noms de personnes (auteurs FB)
    const resS001 = await client.query(`
      UPDATE annonces_immo 
      SET actif = false, rejete = true, motif_rejet = 'Titre corrompu (nom auteur Facebook)'
      WHERE actif = true 
        AND titre ~ '^[A-ZÀÂÉÈÊÙÏÎ][a-zA-ZÀ-ÿ-]+(\\s+[A-ZÀÂÉÈÊÙÏÎ][a-zA-ZÀ-ÿ-]+){1,2}$'
        AND titre NOT ILIKE '%villa%' AND titre NOT ILIKE '%studio%' AND titre NOT ILIKE '%chambre%'
        AND titre NOT ILIKE '%appartement%' AND titre NOT ILIKE '%terrain%'
      RETURNING id, titre
    `);
    console.log(`[S-001] Annonces aux titres de personnes désactivées : ${resS001.rowCount}`);

    // 3. S-009 : Rejeter les objets matériels (fenêtres, meubles, chaises) et redresser les transactions
    const resS009Objets = await client.query(`
      UPDATE annonces_immo 
      SET actif = false, rejete = true, motif_rejet = 'Accessoire matériel ou mobilier (non-immobilier)'
      WHERE actif = true AND (
        titre ILIKE '%fenetre%' OR titre ILIKE '%fenêtre%' OR titre ILIKE '%porte alu%' OR
        titre ILIKE '%table de bureau%' OR titre ILIKE '%chaise%' OR titre ILIKE '%fauteuil%' OR
        titre ILIKE '%blender%' OR titre ILIKE '%mixeur%' OR titre ILIKE '%matelas%'
      )
      RETURNING id, titre
    `);
    console.log(`[S-009] Objets matériels et meubles désactivés : ${resS009Objets.rowCount}`);

    // S-009 suite : Redresser les annonces de location vendues ou mal étiquetées
    const resS009Redress = await client.query(`
      UPDATE annonces_immo 
      SET transaction = 'location' 
      WHERE actif = true 
        AND transaction = 'vente' 
        AND prix BETWEEN 15000 AND 1500000 
        AND (titre ILIKE '%louer%' OR titre ILIKE '%location%' OR description ILIKE '%par mois%')
      RETURNING id, titre, prix
    `);
    console.log(`[S-009] Annonces de vente redressées en location : ${resS009Redress.rowCount}`);

    // S-009 suite : Désactiver les fausses ventes à prix dérisoire (< 1M FCFA) restantes
    const resS009VentesBasses = await client.query(`
      UPDATE annonces_immo
      SET actif = false, rejete = true, motif_rejet = 'Prix de vente anormalement bas (< 1M FCFA)'
      WHERE actif = true AND transaction = 'vente' AND prix < 1000000
      RETURNING id, titre, prix
    `);
    console.log(`[S-009] Ventes dérisoires (< 1M FCFA) désactivées : ${resS009VentesBasses.rowCount}`);

    // S-009 suite : Désactiver ou redresser les loyers démesurés (> 5M FCFA)
    const resS009LoyersHauts = await client.query(`
      UPDATE annonces_immo
      SET transaction = 'vente'
      WHERE actif = true AND transaction = 'location' AND prix >= 10000000
      RETURNING id, titre, prix
    `);
    console.log(`[S-009] Loyers démesurés (>= 10M FCFA) redressés en vente : ${resS009LoyersHauts.rowCount}`);

    // 4. S-007 : Désactiver Kanje (100% rupture) et Univers Cosmetix (403 Forbidden)
    const resS007Marchands = await client.query(`
      UPDATE marchands 
      SET actif = false 
      WHERE nom IN ('Kanje', 'Univers Cosmetix')
      RETURNING id, nom
    `);
    console.log(`[S-007] Marchands défaillants désactivés : ${resS007Marchands.rows.map(r => r.nom).join(', ')}`);

    const resS007Offres = await client.query(`
      UPDATE offres 
      SET stock = false 
      WHERE marchand_id IN (SELECT id FROM marchands WHERE nom IN ('Kanje', 'Univers Cosmetix'))
      RETURNING id
    `);
    console.log(`[S-007] Offres marchandes basculées hors-stock : ${resS007Offres.rowCount}`);

    // 5. S-006 : Désactivation des annonces immobilières de plus de 60 jours sans contact actif
    const resS006TTL = await client.query(`
      UPDATE annonces_immo 
      SET actif = false, rejete = true, motif_rejet = 'Expirée (âge > 60 jours sans confirmation)'
      WHERE actif = true AND created_at < NOW() - INTERVAL '60 days' AND source IN ('coinafrique', 'expat-dakar')
      RETURNING id
    `);
    console.log(`[S-006] Annonces immo obsolètes (>60j) désactivées : ${resS006TTL.rowCount}`);

    // 6. S-008 : Purge des 2 031 fiches produits e-commerce orphelines (0 offre)
    const resS008 = await client.query(`
      DELETE FROM produits 
      WHERE id NOT IN (SELECT DISTINCT produit_id FROM offres WHERE produit_id IS NOT NULL)
      RETURNING id
    `);
    console.log(`[S-008] Produits e-commerce orphelins (0 offre) purgés : ${resS008.rowCount}`);

    // Recalcul des prix_min et nb_offres sur les produits impactés
    const resRecalc = await client.query(`
      UPDATE produits SET
        prix_min = sub.prix_min,
        nb_offres = sub.nb_offres
      FROM (
        SELECT p.id,
          MIN(CASE WHEN o.stock = true AND (o.quarantinee IS FALSE OR o.quarantinee IS NULL) THEN o.prix END) AS prix_min,
          COUNT(CASE WHEN o.stock = true AND (o.quarantinee IS FALSE OR o.quarantinee IS NULL) THEN o.id END) AS nb_offres
        FROM produits p
        LEFT JOIN offres o ON o.produit_id = p.id
        GROUP BY p.id
      ) sub
      WHERE produits.id = sub.id AND (produits.prix_min IS DISTINCT FROM sub.prix_min OR produits.nb_offres IS DISTINCT FROM sub.nb_offres)
    `);
    console.log(`[RECALC] Fiches produits synchronisées avec les offres actives : ${resRecalc.rowCount}`);

    await client.query('COMMIT');
    console.log('=== ASSAINISSEMENT BASE TERMINÉ AVEC SUCCÈS (COMMIT) ===');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ERREUR ASSAINISSEMENT (ROLLBACK) :', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
