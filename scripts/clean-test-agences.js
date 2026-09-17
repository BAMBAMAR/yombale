require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('../backend/models/db');

const AMAR_AGENCE_ID = 'b896e4f8-cbc9-4291-abb6-d577942f1b61';

async function cleanTestData() {
  const client = await pool.connect();

  try {
    console.log('🚀 Début du nettoyage des agences et biens de test...');
    await client.query('BEGIN');

    // 1. Loyers échéances
    const rLoyers = await client.query(`
      DELETE FROM loyers_echeances
      WHERE agence_id != $1
         OR bail_id IN (SELECT id FROM baux_immo WHERE agence_id != $1)
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ loyers_echeances supprimés : ${rLoyers.rowCount}`);

    // 2. Baux immo
    const rBaux = await client.query(`
      DELETE FROM baux_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ baux_immo supprimés : ${rBaux.rowCount}`);

    // 3. Maintenance immo
    const rMaint = await client.query(`
      DELETE FROM maintenance_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ maintenance_immo supprimés : ${rMaint.rowCount}`);

    // 4. Factures immo
    const rFact = await client.query(`
      DELETE FROM factures_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ factures_immo supprimées : ${rFact.rowCount}`);

    // 5. Crédits immo
    const rCred = await client.query(`
      DELETE FROM credits_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ credits_immo supprimés : ${rCred.rowCount}`);

    // 6. Commissions immo
    const rComm = await client.query(`
      DELETE FROM commissions_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ commissions_immo supprimées : ${rComm.rowCount}`);

    // 7. Transactions immo
    const rTrans = await client.query(`
      DELETE FROM transactions_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ transactions_immo supprimées : ${rTrans.rowCount}`);

    // 8. Offres immo
    const rOffres = await client.query(`
      DELETE FROM offres_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ offres_immo supprimées : ${rOffres.rowCount}`);

    // 9. Visites immo
    const rVisites = await client.query(`
      DELETE FROM visites_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ visites_immo supprimées : ${rVisites.rowCount}`);

    // 10. Mandats immo
    const rMandats = await client.query(`
      DELETE FROM mandats_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ mandats_immo supprimés : ${rMandats.rowCount}`);

    // 11. Annonces immo de test (ne touche JAMAIS aux annonces scrapées coinafrique / expat-dakar, ni à AMAR IMMO)
    const rAnnonces = await client.query(`
      DELETE FROM annonces_immo
      WHERE source NOT IN ('coinafrique', 'expat-dakar')
        AND (agence_id != $1 OR (agence_id IS NULL AND source = 'utilisateur'))
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ annonces_immo de test supprimées : ${rAnnonces.rowCount}`);

    // 12. Biens immo
    const rBiens = await client.query(`
      DELETE FROM biens_immo
      WHERE agence_id != $1 OR agence_id IS NULL
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ biens_immo de test supprimés : ${rBiens.rowCount}`);

    // 13. Contacts immo
    const rContacts = await client.query(`
      DELETE FROM contacts_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ contacts_immo supprimés : ${rContacts.rowCount}`);

    // 14. Propriétaires immo
    const rProps = await client.query(`
      DELETE FROM proprietaires_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ proprietaires_immo supprimés : ${rProps.rowCount}`);

    // 15. Membres d'agence
    const rMembres = await client.query(`
      DELETE FROM agence_membres
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ agence_membres supprimés : ${rMembres.rowCount}`);

    // 16. Logs d'agence
    const rLogs = await client.query(`
      DELETE FROM agence_logs
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ agence_logs supprimés : ${rLogs.rowCount}`);

    // 17. Notifications immo
    const rNotifs = await client.query(`
      DELETE FROM notifications_immo
      WHERE agence_id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ notifications_immo supprimées : ${rNotifs.rowCount}`);

    // 18. Agences immo de test
    const rAgences = await client.query(`
      DELETE FROM agences_immo
      WHERE id != $1
    `, [AMAR_AGENCE_ID]);
    console.log(`✅ agences_immo de test supprimées : ${rAgences.rowCount}`);

    // 19. Utilisateurs de test spécifiques aux agences de tests
    const rUsers = await client.query(`
      DELETE FROM utilisateurs
      WHERE email LIKE '%@test.nopalou.sn'
         OR email LIKE '%@nopalou-test.sn'
         OR email LIKE 'client.%@example.com'
    `);
    console.log(`✅ utilisateurs de test supprimés : ${rUsers.rowCount}`);

    await client.query('COMMIT');
    console.log('🎉 NETTOYAGE EFFECTUÉ AVEC SUCCÈS !');

    // Vérification finale
    const finalAgences = await client.query('SELECT id, nom, slug FROM agences_immo');
    console.log('\n--- Agences restantes ---');
    console.table(finalAgences.rows);

    const finalBiens = await client.query('SELECT id, titre, type_bien FROM biens_immo');
    console.log('\n--- Biens restants ---');
    console.table(finalBiens.rows);

    const finalScraped = await client.query("SELECT source, count(*) FROM annonces_immo GROUP BY source");
    console.log('\n--- Annonces restantes par source ---');
    console.table(finalScraped.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors du nettoyage, ROLLBACK appliqué :', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

cleanTestData();
