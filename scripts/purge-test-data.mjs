import 'dotenv/config';
import { pool } from '../backend/models/db.js';

const isExecute = process.argv.includes('--execute');

async function purge() {
  console.log(`\n🧹 Lancement de la purge des données de test (${isExecute ? 'MODE EXECUTION REELLE' : 'MODE DRY-RUN SIMULATION'})...\n`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Identifier les IDs des utilisateurs de test
    const testUsersRes = await client.query(`
      SELECT id, email, nom FROM utilisateurs
      WHERE email LIKE '%@nopalou-test.sn'
         OR email LIKE '%@test-qa.com'
         OR email LIKE '%@test.sn'
         OR email LIKE '%test%@%'
         OR email LIKE '%@example.com'
         OR email = 'test-chantier3-verif@nopalou-test.local'
         OR email = 'test-nopalou-ci@mailinator.com'
         OR nom ILIKE '%Marchand A%'
         OR nom ILIKE '%Marchande B%'
         OR nom ILIKE '%Marchand QA%'
         OR nom ILIKE '%Particulier%'
         OR nom ILIKE '%Directeur Agence%'
         OR nom ILIKE '%Hybride%'
         OR nom ILIKE '%Gérant Supérette%'
         OR nom ILIKE '%Marchand Test%'
    `);
    const testUserIds = testUsersRes.rows.map(u => u.id);
    console.log(`👤 Utilisateurs de test identifiés : ${testUserIds.length}`);

    // 2. Identifier les Boutiques de test
    const testBoutiquesRes = await client.query(`
      SELECT id, nom, slug FROM boutiques
      WHERE nom ILIKE '%Électro Nopalou%'
         OR nom ILIKE '%Mode Teranga%'
         OR nom ILIKE '%Supérette Nopalou Express%'
         OR nom ILIKE '%Khadija Fashion Store%'
         OR nom ILIKE '%Boutique Électro QA%'
         OR nom ILIKE '%Boutique Hybride%'
         OR slug ILIKE '%electro-nopalou%'
         OR slug ILIKE '%mode-teranga%'
         OR slug ILIKE '%superette-nopalou-express%'
         OR slug ILIKE '%khadija-fashion-store%'
         OR slug ILIKE '%boutique-electro-qa%'
         OR utilisateur_id = ANY($1)
    `, [testUserIds.length > 0 ? testUserIds : ['00000000-0000-0000-0000-000000000000']]);
    const testBoutiqueIds = testBoutiquesRes.rows.map(b => b.id);
    console.log(`🏪 Boutiques de test identifiées : ${testBoutiqueIds.length}`);

    // 3. Identifier les Agences de test (ATTENTION: Amar Immo est canonique et strictement exclue)
    const testAgencesRes = await client.query(`
      SELECT id, nom, slug FROM agences_immo
      WHERE slug != 'amar-immo'
        AND nom NOT ILIKE '%Amar%'
        AND (
          nom ILIKE '%Agence Nopalou Immo Prestige%'
          OR nom ILIKE '%Teranga Properties%'
          OR nom ILIKE '%Khadija Immobilier Prestige%'
          OR slug ILIKE '%agence-nopalou-immo-prestige%'
          OR slug ILIKE '%agence-teranga-properties%'
          OR slug ILIKE '%khadija-immobilier-prestige%'
          OR utilisateur_id = ANY($1)
        )
    `, [testUserIds.length > 0 ? testUserIds : ['00000000-0000-0000-0000-000000000000']]);
    const testAgenceIds = testAgencesRes.rows.map(a => a.id);
    console.log(`🏢 Agences de test identifiées : ${testAgenceIds.length}`);

    // 4. Identifier les Biens de test
    const testBiensRes = await client.query(`
      SELECT id, titre, agence_id FROM biens_immo
      WHERE titre = 'APPART FOIRE TEST E2E'
         OR titre ILIKE '%Villa Contemporaine 5 Pièces Piscine%'
         OR titre ILIKE '%Appartement Vue Mer Ngor 3 Pièces%'
         OR agence_id = ANY($1)
    `, [testAgenceIds.length > 0 ? testAgenceIds : ['00000000-0000-0000-0000-000000000000']]);
    const testBienIds = testBiensRes.rows.map(b => b.id);
    console.log(`🏡 Biens de test identifiés : ${testBienIds.length}`);

    // 5. Supprimer les tables dépendantes des biens de test
    let delVisites = { rowCount: 0 };
    let delBaux = { rowCount: 0 };
    let delMandats = { rowCount: 0 };
    let delOffresImmo = { rowCount: 0 };
    let delAnnoncesImmo = { rowCount: 0 };
    let delLoyers = { rowCount: 0 };
    let delContactsImmo = { rowCount: 0 };
    let delAgenceMembres = { rowCount: 0 };

    if (testBienIds.length > 0 || testAgenceIds.length > 0) {
      delVisites = await client.query(`DELETE FROM visites_immo WHERE bien_id = ANY($1) OR agence_id = ANY($2)`, [
        testBienIds.length > 0 ? testBienIds : ['00000000-0000-0000-0000-000000000000'],
        testAgenceIds.length > 0 ? testAgenceIds : ['00000000-0000-0000-0000-000000000000']
      ]);
      delBaux = await client.query(`DELETE FROM baux_immo WHERE bien_id = ANY($1) OR agence_id = ANY($2)`, [
        testBienIds.length > 0 ? testBienIds : ['00000000-0000-0000-0000-000000000000'],
        testAgenceIds.length > 0 ? testAgenceIds : ['00000000-0000-0000-0000-000000000000']
      ]);
      delMandats = await client.query(`DELETE FROM mandats_immo WHERE bien_id = ANY($1) OR agence_id = ANY($2)`, [
        testBienIds.length > 0 ? testBienIds : ['00000000-0000-0000-0000-000000000000'],
        testAgenceIds.length > 0 ? testAgenceIds : ['00000000-0000-0000-0000-000000000000']
      ]);
      delLoyers = await client.query(`DELETE FROM loyers_echeances WHERE agence_id = ANY($1)`, [
        testAgenceIds.length > 0 ? testAgenceIds : ['00000000-0000-0000-0000-000000000000']
      ]);
      delContactsImmo = await client.query(`DELETE FROM contacts_immo WHERE agence_id = ANY($1)`, [
        testAgenceIds.length > 0 ? testAgenceIds : ['00000000-0000-0000-0000-000000000000']
      ]);
      delAgenceMembres = await client.query(`DELETE FROM agence_membres WHERE agence_id = ANY($1) OR utilisateur_id = ANY($2)`, [
        testAgenceIds.length > 0 ? testAgenceIds : ['00000000-0000-0000-0000-000000000000'],
        testUserIds.length > 0 ? testUserIds : ['00000000-0000-0000-0000-000000000000']
      ]);
    }
    console.log(`  - Supprimé visites_immo : ${delVisites.rowCount}`);
    console.log(`  - Supprimé baux_immo : ${delBaux.rowCount}`);
    console.log(`  - Supprimé mandats_immo : ${delMandats.rowCount}`);
    console.log(`  - Supprimé loyers_echeances : ${delLoyers.rowCount}`);
    console.log(`  - Supprimé contacts_immo : ${delContactsImmo.rowCount}`);
    console.log(`  - Supprimé agence_membres : ${delAgenceMembres.rowCount}`);

    // 6. Supprimer les Biens de test
    const delBiens = await client.query(`DELETE FROM biens_immo WHERE id = ANY($1)`, [
      testBienIds.length > 0 ? testBienIds : ['00000000-0000-0000-0000-000000000000']
    ]);
    console.log(`🏡 Biens de test supprimés : ${delBiens.rowCount}`);

    // 7. Supprimer les Agences de test
    const delAgences = await client.query(`DELETE FROM agences_immo WHERE id = ANY($1)`, [
      testAgenceIds.length > 0 ? testAgenceIds : ['00000000-0000-0000-0000-000000000000']
    ]);
    console.log(`🏢 Agences de test supprimées : ${delAgences.rowCount}`);

    // 8. Supprimer les Annonces classifiées de test
    const delAnnonces = await client.query(`
      DELETE FROM annonces_classifiees 
      WHERE titre ILIKE 'Table à manger en bois massif%'
         OR utilisateur_id = ANY($1)
    `, [testUserIds.length > 0 ? testUserIds : ['00000000-0000-0000-0000-000000000000']]);
    console.log(`📢 Annonces classifiées supprimées : ${delAnnonces.rowCount}`);

    // 9. Supprimer Carnet de dettes de test (caisse_credit_plans, caisse_credit_historique, caisse_clients_credits)
    const delDettePlans = await client.query(`
      DELETE FROM caisse_credit_plans 
      WHERE boutique_id = ANY($1) 
         OR client_id IN (SELECT id FROM caisse_clients_credits WHERE nom ILIKE '%Ibrahima%' OR nom ILIKE '%Test%')
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);

    const delDetteHisto = await client.query(`
      DELETE FROM caisse_credit_historique 
      WHERE boutique_id = ANY($1)
         OR client_id IN (SELECT id FROM caisse_clients_credits WHERE nom ILIKE '%Ibrahima%' OR nom ILIKE '%Test%')
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);

    const delDetteClients = await client.query(`
      DELETE FROM caisse_clients_credits 
      WHERE boutique_id = ANY($1)
         OR nom ILIKE '%Ibrahima Débiteur%'
         OR nom ILIKE '%Ibrahima Dettes Test%'
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);
    console.log(`📒 Clients carnet de dettes supprimés : ${delDetteClients.rowCount} (historique: ${delDetteHisto.rowCount})`);

    // 10. Supprimer Commandes boutique de test
    const delCmdItems = await client.query(`
      DELETE FROM commandes_boutique_items
      WHERE commande_id IN (
        SELECT id FROM commandes_boutique
        WHERE boutique_id = ANY($1)
           OR client_nom ILIKE '%Fatou Diop Acheteuse%'
           OR client_nom ILIKE '%Double Clic%'
           OR client_nom ILIKE '%Awa Acheteuse%'
           OR client_nom ILIKE '%Test%'
           OR client_telephone LIKE '%1234567%'
           OR client_telephone = '770000000'
      )
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);

    const delCmds = await client.query(`
      DELETE FROM commandes_boutique
      WHERE boutique_id = ANY($1)
         OR client_nom ILIKE '%Fatou Diop Acheteuse%'
         OR client_nom ILIKE '%Double Clic%'
         OR client_nom ILIKE '%Awa Acheteuse%'
         OR client_nom ILIKE '%Test%'
         OR client_telephone LIKE '%1234567%'
         OR client_telephone = '770000000'
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);
    console.log(`🛍️ Commandes boutique supprimées : ${delCmds.rowCount} (items: ${delCmdItems.rowCount})`);

    // 11. Supprimer POS de test (sessions & mouvements)
    const delMouvementsPos = await client.query(`
      DELETE FROM boutique_pos_mouvements_caisse
      WHERE boutique_id = ANY($1)
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);

    const delSessionsPos = await client.query(`
      DELETE FROM boutique_pos_sessions
      WHERE boutique_id = ANY($1)
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);
    console.log(`💳 Sessions POS supprimées : ${delSessionsPos.rowCount} (mouvements: ${delMouvementsPos.rowCount})`);

    // 12. Supprimer Produits & Variantes des boutiques de test
    const delVariantes = await client.query(`
      DELETE FROM boutique_produit_variantes
      WHERE boutique_id = ANY($1)
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);

    const delProduits = await client.query(`
      DELETE FROM boutique_produits
      WHERE boutique_id = ANY($1)
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);
    console.log(`📦 Produits boutique supprimés : ${delProduits.rowCount} (variantes: ${delVariantes.rowCount})`);

    // 13. Supprimer les Boutiques de test
    const delBoutiques = await client.query(`
      DELETE FROM boutiques WHERE id = ANY($1)
    `, [testBoutiqueIds.length > 0 ? testBoutiqueIds : ['00000000-0000-0000-0000-000000000000']]);
    console.log(`🏪 Boutiques de test supprimées : ${delBoutiques.rowCount}`);

    // 14. Supprimer les liaisons boutique_utilisateurs pour les utilisateurs de test
    const delBoutiqueUsers = await client.query(`
      DELETE FROM boutique_utilisateurs WHERE utilisateur_id = ANY($1)
    `, [testUserIds.length > 0 ? testUserIds : ['00000000-0000-0000-0000-000000000000']]);
    console.log(`🔗 Liaisons boutique_utilisateurs supprimées : ${delBoutiqueUsers.rowCount}`);

    // 15. Supprimer abonnements ou parrainages liés aux utilisateurs de test s'il y en a
    await client.query(`DELETE FROM abonnements WHERE utilisateur_id = ANY($1)`, [
      testUserIds.length > 0 ? testUserIds : ['00000000-0000-0000-0000-000000000000']
    ]);
    await client.query(`DELETE FROM parrainages WHERE referrer_id = ANY($1) OR referred_id = ANY($1)`, [
      testUserIds.length > 0 ? testUserIds : ['00000000-0000-0000-0000-000000000000']
    ]);

    // 16. Supprimer les Utilisateurs de test
    const delUsers = await client.query(`
      DELETE FROM utilisateurs WHERE id = ANY($1)
    `, [testUserIds.length > 0 ? testUserIds : ['00000000-0000-0000-0000-000000000000']]);
    console.log(`👤 Utilisateurs de test supprimés : ${delUsers.rowCount}`);

    // 17. Validation des données Canoniques & Vérification zéro résidu
    console.log('\n--- VERIFICATION DE L INTEGRITE DES DONNEES CANONIQUES & RESIDUS ZERO ---');
    const checkAmar = await client.query(`SELECT id, nom, slug FROM agences_immo WHERE slug = 'amar-immo'`);
    console.log(`🏢 Amar Immo statut: ${checkAmar.rows.length === 1 ? 'OK (PRESERVEE)' : 'ERREUR !'}`);

    const checkAmarBien = await client.query(`SELECT id, titre FROM biens_immo WHERE agence_id = $1`, [checkAmar.rows[0]?.id]);
    console.log(`🏡 Biens sous Amar Immo: ${checkAmarBien.rows.length} (ex: ${checkAmarBien.rows.map(b => b.titre).join(', ')})`);

    const residualAgences = await client.query(`SELECT count(*) as total FROM agences_immo WHERE slug != 'amar-immo'`);
    console.log(`🏢 Agences résiduelles de test: ${residualAgences.rows[0].total} (attendu: 0)`);

    const residualBiens = await client.query(`SELECT count(*) as total FROM biens_immo WHERE agence_id NOT IN (SELECT id FROM agences_immo WHERE slug = 'amar-immo') OR titre ILIKE '%TEST%'`);
    console.log(`🏡 Biens résiduels de test: ${residualBiens.rows[0].total} (attendu: 0)`);

    const residualUsers = await client.query(`SELECT count(*) as total FROM utilisateurs WHERE email LIKE '%@nopalou-test.sn' OR email LIKE '%@test-qa.com' OR email LIKE '%@test.sn' OR email LIKE '%@example.com'`);
    console.log(`👤 Utilisateurs résiduels de test: ${residualUsers.rows[0].total} (attendu: 0)`);

    const residualAds = await client.query(`SELECT count(*) as total FROM annonces_classifiees WHERE titre ILIKE 'Table à manger en bois massif%'`);
    console.log(`📢 Annonces résiduelles de test: ${residualAds.rows[0].total} (attendu: 0)`);

    const residualCredits = await client.query(`SELECT count(*) as total FROM caisse_clients_credits WHERE nom ILIKE '%Ibrahima Débiteur%' OR nom ILIKE '%Ibrahima Dettes Test%'`);
    console.log(`📒 Dettes résiduelles de test: ${residualCredits.rows[0].total} (attendu: 0)`);

    const residualBoutiques = await client.query(`SELECT count(*) as total FROM boutiques WHERE slug ILIKE '%electro-nopalou%' OR slug ILIKE '%mode-teranga%' OR slug ILIKE '%superette-nopalou%'`);
    console.log(`🏪 Boutiques résiduelles de test: ${residualBoutiques.rows[0].total} (attendu: 0)`);

    const countBoutiques = await client.query(`SELECT count(*) as total FROM boutiques`);
    console.log(`🏪 Total boutiques réelles restantes en base: ${countBoutiques.rows[0].total}`);

    const countUsers = await client.query(`SELECT count(*) as total FROM utilisateurs`);
    console.log(`👤 Total utilisateurs réels restants en base: ${countUsers.rows[0].total}`);

    const countAds = await client.query(`SELECT count(*) as total FROM annonces_classifiees`);
    console.log(`📢 Total annonces réelles restantes en base: ${countAds.rows[0].total}`);

    if (isExecute) {
      await client.query('COMMIT');
      console.log('\n✅ COMMIT EFFECTUE AVEC SUCCES ! TOUTES LES DONNEES DE TEST ONT ETE SUPPRIMEES DE LA BASE !');
    } else {
      await client.query('ROLLBACK');
      console.log('\n🔒 ROLLBACK EFFECTUE (DRY-RUN). AUCUNE MODIFICATION REELLE N A ETE COMMITTED.');
      console.log('👉 Pour exécuter réellement la suppression, lancez : node scripts/purge-test-data.mjs --execute');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERREUR LORS DU NETTOYAGE (ROLLBACK AUTOMATIQUE) :', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

purge();
