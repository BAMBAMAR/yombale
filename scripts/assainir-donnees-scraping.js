// scripts/assainir-donnees-scraping.js
// Nettoyage et assainissement des anomalies de scraping identifiées lors de l'audit Nopalou

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { pool } = require('../backend/models/db');

async function assainir() {
  console.log('🚀 Démarrage du nettoyage des données de scraping...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Assainissement Annonces Immo (CoinAfrique & Expat-Dakar)
    console.log('\n--- 1. ASSAINISSEMENT IMMOBILIER ---');
    const resImmoCoin = await client.query(`
      UPDATE annonces_immo
      SET actif = false, rejete = true, motif_rejet = 'Données scrapées corrompues ou sans numéro de contact'
      WHERE source = 'coinafrique' 
        AND (quartier ILIKE '%CFA%' OR contact_tel IS NULL OR trim(contact_tel) = '')
      RETURNING id
    `);
    console.log(`✅ Annonces CoinAfrique Immo désactivées : ${resImmoCoin.rowCount}`);

    const resImmoExpat = await client.query(`
      UPDATE annonces_immo
      SET actif = false, rejete = true, motif_rejet = 'Annonce obsolète sans numéro de contact'
      WHERE source = 'expat-dakar'
        AND (contact_tel IS NULL OR trim(contact_tel) = '')
      RETURNING id
    `);
    console.log(`✅ Annonces Expat-Dakar Immo sans contact désactivées : ${resImmoExpat.rowCount}`);

    // Nettoyer le champ quartier s'il reste des 'CFA' sur les rares annonces actives
    const resCleanQuartier = await client.query(`
      UPDATE annonces_immo
      SET quartier = NULL
      WHERE quartier ILIKE '%CFA%'
      RETURNING id
    `);
    console.log(`✅ Quartiers résiduels avec 'CFA' nettoyés : ${resCleanQuartier.rowCount}`);

    // 2. Assainissement Annonces Classifiées (Facebook)
    console.log('\n--- 2. ASSAINISSEMENT ANNONCES CLASSIFIÉES ---');
    // Retirer la contrainte NOT NULL bloquante sur contact_tel
    await client.query(`ALTER TABLE annonces_classifiees ALTER COLUMN contact_tel DROP NOT NULL`);

    // Remplacer 'Voir sur Facebook' par NULL
    const resTelFb = await client.query(`
      UPDATE annonces_classifiees
      SET contact_tel = NULL
      WHERE contact_tel ILIKE '%facebook%' OR contact_tel ILIKE '%voir%'
      RETURNING id
    `);
    console.log(`✅ Numéros 'Voir sur Facebook' nettoyés en NULL : ${resTelFb.rowCount}`);

    // Désactiver les annonces Facebook sans prix ou sans téléphone ou polluées
    const resFbInactive = await client.query(`
      UPDATE annonces_classifiees
      SET actif = false, rejete = true
      WHERE source LIKE 'facebook%'
        AND (
          prix IS NULL 
          OR prix <= 0 
          OR contact_tel IS NULL 
          OR trim(contact_tel) = ''
          OR titre ILIKE '%Participant(e) anonyme%'
          OR titre ILIKE 'Suivre %'
          OR length(trim(titre)) < 4
        )
      RETURNING id
    `);
    console.log(`✅ Annonces Facebook inexploitables désactivées : ${resFbInactive.rowCount}`);

    // 3. Assainissement E-Commerce (Offres aberrantes & sans URL)
    console.log('\n--- 3. ASSAINISSEMENT E-COMMERCE ---');
    // Mettre en quarantaine les prix aberrants (> 50 millions FCFA)
    const resQuarantineOutliers = await client.query(`
      UPDATE offres
      SET quarantinee = true
      WHERE (prix > 50000000 OR prix < 200) AND (quarantinee IS FALSE OR quarantinee IS NULL)
      RETURNING id, produit_id, prix
    `);
    console.log(`✅ Offres aux prix aberrants mises en quarantaine : ${resQuarantineOutliers.rowCount}`);

    // Offres sans URL d'achat : passer stock = false
    const resOffresSansUrl = await client.query(`
      UPDATE offres
      SET stock = false
      WHERE (url_achat IS NULL OR trim(url_achat) = '' OR url_achat NOT LIKE 'http%')
        AND stock = true
      RETURNING id
    `);
    console.log(`✅ Offres sans URL d'achat désactivées : ${resOffresSansUrl.rowCount}`);

    // 4. Recalculer les prix_min et nb_offres des produits affectés
    console.log('\n--- 4. RECALCUL CATALOGUE PRODUITS ---');
    const resRecalc = await client.query(`
      UPDATE produits p
      SET 
        nb_offres = sub.active_offres,
        prix_min = sub.min_p
      FROM (
        SELECT produit_id,
               count(id) FILTER (WHERE stock = true AND (quarantinee IS FALSE OR quarantinee IS NULL)) as active_offres,
               min(prix) FILTER (WHERE stock = true AND (quarantinee IS FALSE OR quarantinee IS NULL)) as min_p
        FROM offres
        GROUP BY produit_id
      ) sub
      WHERE p.id = sub.produit_id
        AND (p.nb_offres != sub.active_offres OR p.prix_min != sub.min_p)
      RETURNING p.id
    `);
    console.log(`✅ Produits resynchronisés avec offres actives : ${resRecalc.rowCount}`);

    await client.query('COMMIT');
    console.log('\n🎉 ASSAINISSEMENT TERMINÉ AVEC SUCCÈS !');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur assainissement :', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

assainir().catch(err => {
  console.error(err);
  process.exit(1);
});
