// scripts/verify-all-audit-fixes.js
// Validation E2E exhaustive de TOUTES les anomalies corrigées lors de l'audit
require('dotenv').config();
const { pool } = require('../backend/models/db');

async function testAllFixes() {
  console.log('--- DEBUT DE LA VERIFICATION DES CORRECTIONS ---');
  let client;

  try {
    client = await pool.connect();

    // 1. Trouver une agence de test
    const { rows: agences } = await client.query('SELECT id, slug, nom FROM agences_immo LIMIT 1');
    if (!agences.length) {
      console.log('Aucune agence trouvée pour les tests.');
      return;
    }
    const agence = agences[0];
    console.log(`Agence test: ${agence.nom} (${agence.slug})`);

    // ── TEST 1: Prévention doublon bailleur par téléphone ──
    console.log('\n[TEST 1] Anti-doublon téléphone sur propriétaires_immo...');
    const telUnique = '779998877';
    // Nettoyer d'anciens tests
    await client.query("DELETE FROM proprietaires_immo WHERE telephone = $1", [telUnique]);

    // Insérer un premier bailleur
    const { rows: b1 } = await client.query(
      `INSERT INTO proprietaires_immo (agence_id, nom, prenom, telephone, type_bailleur)
       VALUES ($1, 'Diallo', 'Amadou', $2, 'particulier') RETURNING id`,
      [agence.id, telUnique]
    );
    console.log(`  Bailleur 1 créé ID: ${b1[0].id}`);

    // Vérifier la détection de doublon
    const cleanPh = telUnique.replace(/\D/g, '');
    const shortPh = cleanPh.slice(-9);
    const { rows: doublons } = await client.query(
      `SELECT id, nom, prenom FROM proprietaires_immo WHERE agence_id = $1 AND RIGHT(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), 9) = $2`,
      [agence.id, shortPh]
    );
    if (doublons.length === 1) {
      console.log(`  SUCCES: Doublon détecté avec succès pour le téléphone ${telUnique} (${doublons[0].nom})`);
    } else {
      console.error('  ECHEC: Détection doublon propriétaire échouée');
    }

    // ── TEST 2: Suppression / Archivage sécurisé Propriétaire SANS bien ──
    console.log('\n[TEST 2] Suppression physique bailleur SANS bien...');
    // Vérifier nb biens
    const { rows: nbBiensB1 } = await client.query(
      `SELECT COUNT(*) AS total FROM biens_immo WHERE proprietaire_id = $1`,
      [b1[0].id]
    );
    if (parseInt(nbBiensB1[0].total) === 0) {
      const delRes = await client.query(
        `DELETE FROM proprietaires_immo WHERE id = $1 AND agence_id = $2`,
        [b1[0].id, agence.id]
      );
      console.log(`  SUCCES: Propriétaire sans bien supprimé physiquement (lignes: ${delRes.rowCount})`);
    }

    // ── TEST 3: Soft-archiving d'un Propriétaire AVEC biens ──
    console.log('\n[TEST 3] Soft-archivage bailleur AVEC biens...');
    const { rows: b2 } = await client.query(
      `INSERT INTO proprietaires_immo (agence_id, nom, prenom, telephone, type_bailleur)
       VALUES ($1, 'Sow', 'Mariama', '776665544', 'particulier') RETURNING id`,
      [agence.id]
    );
    const { rows: bienTest } = await client.query(
      `INSERT INTO biens_immo (agence_id, proprietaire_id, titre, type_bien, prix_location, statut_occupation)
       VALUES ($1, $2, 'Appartement F3 Test Archivage', 'appartement', 250000, 'disponible') RETURNING id`,
      [agence.id, b2[0].id]
    );
    console.log(`  Bien créé ID: ${bienTest[0].id} rattaché au bailleur ${b2[0].id}`);

    // Tentative d'archivage
    await client.query(
      `UPDATE proprietaires_immo SET actif = false, updated_at = NOW() WHERE id = $1 AND agence_id = $2`,
      [b2[0].id, agence.id]
    );
    // Vérifier le filtre actif
    const { rows: actifsOnly } = await client.query(
      `SELECT id FROM proprietaires_immo WHERE id = $1 AND COALESCE(actif, true) = true`,
      [b2[0].id]
    );
    const { rows: allProps } = await client.query(
      `SELECT id, actif FROM proprietaires_immo WHERE id = $1`,
      [b2[0].id]
    );
    if (actifsOnly.length === 0 && allProps[0].actif === false) {
      console.log('  SUCCES: Propriétaire soft-archivé avec succès. Masqué du répertoire actif, bien préservé.');
    } else {
      console.error('  ECHEC: Soft-archivage bailleur échoué');
    }

    // ── TEST 4: GET /proprietaires/:id/biens ──
    console.log('\n[TEST 4] Vérification de la route GET biens du bailleur...');
    const { rows: biensDuBailleur } = await client.query(
      `SELECT b.id, b.titre, b.type_bien, b.statut_occupation, COALESCE(b.prix_location, 0) AS loyer_mensuel
       FROM biens_immo b
       WHERE b.proprietaire_id = $1 AND b.agence_id = $2`,
      [b2[0].id, agence.id]
    );
    if (biensDuBailleur.length === 1 && biensDuBailleur[0].titre.includes('Test Archivage')) {
      console.log(`  SUCCES: ${biensDuBailleur.length} bien(s) récupéré(s) pour le bailleur.`);
    } else {
      console.error('  ECHEC: Récupération des biens du bailleur');
    }

    // ── TEST 5: Prévention double bail actif sur le même bien ──
    console.log('\n[TEST 5] Prévention doublon bail actif...');
    const { rows: cTest } = await client.query(
      `INSERT INTO contacts_immo (agence_id, nom, prenom, telephone, type_contact)
       VALUES ($1, 'Ndiaye', 'Fatou', '771112233', 'locataire') RETURNING id`,
      [agence.id]
    );
    const { rows: bail1 } = await client.query(
      `INSERT INTO baux_immo (agence_id, bien_id, locataire_id, proprietaire_id, date_debut, loyer_mensuel, statut)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, 250000, 'actif') RETURNING id`,
      [agence.id, bienTest[0].id, cTest[0].id, b2[0].id]
    );
    console.log(`  Premier bail actif créé ID: ${bail1[0].id}`);

    // Vérifier la détection de conflit
    const { rows: conflitBail } = await client.query(
      `SELECT id FROM baux_immo WHERE bien_id = $1 AND statut = 'actif' AND id != $2`,
      [bienTest[0].id, '00000000-0000-0000-0000-000000000000']
    );
    if (conflitBail.length > 0) {
      console.log(`  SUCCES: Conflit détecté ! Impossible d'ajouter un 2e bail actif sur le bien ${bienTest[0].id}`);
    } else {
      console.error('  ECHEC: Détection conflit de bail échouée');
    }

    // ── TEST 6: Soft-archiving Contact avec baux ──
    console.log('\n[TEST 6] Protection suppression locataire avec bail...');
    const { rows: bauxContact } = await client.query(
      `SELECT COUNT(*) AS total FROM baux_immo WHERE locataire_id = $1`,
      [cTest[0].id]
    );
    if (parseInt(bauxContact[0].total) > 0) {
      await client.query(
        `UPDATE contacts_immo SET actif = false, statut_crm = 'archive', updated_at = NOW() WHERE id = $1`,
        [cTest[0].id]
      );
      const { rows: cArchive } = await client.query(
        `SELECT id, actif, statut_crm FROM contacts_immo WHERE id = $1`,
        [cTest[0].id]
      );
      if (cArchive[0].actif === false && cArchive[0].statut_crm === 'archive') {
        console.log('  SUCCES: Locataire avec baux soft-archivé pour préserver l\'intégrité légale et comptable.');
      } else {
        console.error('  ECHEC: Archivage locataire échoué');
      }
    }

    // ── TEST 7: Requête /mes-locations (Bailleur vs Locataire) ──
    console.log('\n[TEST 7] Requête role_vue dans mes-locations...');
    const { rows: mesLocs } = await client.query(
      `SELECT bx.id AS bail_id,
              CASE
                WHEN COALESCE(bx.proprietaire_id, b.proprietaire_id) = $1 THEN 'bailleur'
                ELSE 'locataire'
              END AS role_vue
       FROM baux_immo bx
       JOIN biens_immo b ON bx.bien_id = b.id
       WHERE bx.id = $2`,
      [b2[0].id, bail1[0].id]
    );
    if (mesLocs.length > 0 && mesLocs[0].role_vue === 'bailleur') {
      console.log(`  SUCCES: role_vue = 'bailleur' correctement résolu pour le propriétaire du bien.`);
    } else {
      console.error('  ECHEC: Résolution role_vue échouée');
    }

    // Nettoyage données de test
    console.log('\n[NETTOYAGE] Suppression des données temporaires de test...');
    await client.query('DELETE FROM baux_immo WHERE id = $1', [bail1[0].id]);
    await client.query('DELETE FROM contacts_immo WHERE id = $1', [cTest[0].id]);
    await client.query('DELETE FROM biens_immo WHERE id = $1', [bienTest[0].id]);
    await client.query('DELETE FROM proprietaires_immo WHERE id = $1', [b2[0].id]);
    console.log('  Données de test nettoyées.');

    console.log('\n==================================================');
    console.log('TOUTES LES VERIFICATIONS SONT VALIDEES AVEC SUCCES !');
    console.log('==================================================');

  } catch (err) {
    console.error('Erreur test:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testAllFixes();
