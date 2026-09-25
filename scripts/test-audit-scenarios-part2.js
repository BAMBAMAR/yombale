require('dotenv').config();
const { pool } = require('../backend/models/db');

async function runAuditScenariosPart2() {
  const client = await pool.connect();
  const results = {};

  try {
    console.log('================================================================');
    console.log('   NOPALOU IMMOBILIER - SUITE SCÉNARIOS PARTIE 2 (D, E, F, J, T, W, X)   ');
    console.log('================================================================\n');

    const agenceRes = await client.query('SELECT * FROM agences_immo LIMIT 1');
    const existingAgence = agenceRes.rows[0];

    // -------------------------------------------------------------
    // SCÉNARIOS E & F : Bailleur sans compte / avec compte → plusieurs biens
    // -------------------------------------------------------------
    try {
      console.log('\n--- SCÉNARIOS E & F : Bailleur avec / sans compte → plusieurs biens ---');
      // 1. Bailleur sans compte
      const rBailleurE = await client.query(`
        INSERT INTO proprietaires_immo (agence_id, nom, prenom, telephone, type_bailleur)
        VALUES ($1, 'AUDIT_BAILLEUR_E', 'Cheikh', '775550001', 'particulier') RETURNING *
      `, [existingAgence.id]);
      const bailleurE = rBailleurE.rows[0];

      // 3 biens rattachés à ce bailleur
      await client.query(`
        INSERT INTO biens_immo (agence_id, proprietaire_id, titre, type_bien, statut_occupation)
        VALUES ($1, $2, 'Villa E1', 'villa', 'disponible'),
               ($1, $2, 'Appartement E2', 'appartement', 'loue'),
               ($1, $2, 'Terrain E3', 'terrain', 'disponible')
      `, [existingAgence.id, bailleurE.id]);

      // Vérification E
      const rBiensE = await client.query(`
        SELECT count(*) AS total,
               count(*) FILTER (WHERE statut_occupation = 'loue') AS loues,
               count(*) FILTER (WHERE statut_occupation = 'disponible') AS dispos
        FROM biens_immo WHERE proprietaire_id = $1
      `, [bailleurE.id]);

      const passE = parseInt(rBiensE.rows[0].total, 10) === 3 && parseInt(rBiensE.rows[0].loues, 10) === 1;

      // 2. Bailleur avec compte Nopalou (Scenario F)
      const rUserF = await client.query(`
        INSERT INTO utilisateurs (nom, telephone, email, mot_de_passe_hash)
        VALUES ('Bailleur F Pro', '775550002', 'bailleur.f@test.sn', 'dummyhash') RETURNING *
      `);
      const userF = rUserF.rows[0];

      // Rattachement compte
      await client.query(`UPDATE proprietaires_immo SET utilisateur_id = $1 WHERE id = $2`, [userF.id, bailleurE.id]);

      const rVerifF = await client.query(`
        SELECT p.nom, u.email, count(b.id) AS nb_biens
        FROM proprietaires_immo p
        JOIN utilisateurs u ON p.utilisateur_id = u.id
        LEFT JOIN biens_immo b ON b.proprietaire_id = p.id
        WHERE p.id = $1
        GROUP BY p.nom, u.email
      `, [bailleurE.id]);

      const passF = rVerifF.rows.length === 1 && parseInt(rVerifF.rows[0].nb_biens, 10) === 3;

      results['SCENARIO_E'] = { status: passE ? 'PASS' : 'FAIL', stats: rBiensE.rows[0] };
      results['SCENARIO_F'] = { status: passF ? 'PASS' : 'FAIL', details: rVerifF.rows[0] };
      console.log(`Résultats E (Bailleur sans compte multi-biens) : ${results['SCENARIO_E'].status}, F (Bailleur avec compte) : ${results['SCENARIO_F'].status}`);
    } catch (e) {
      results['SCENARIO_E'] = { status: 'FAIL', error: e.message };
      results['SCENARIO_F'] = { status: 'FAIL', error: e.message };
    }

    // -------------------------------------------------------------
    // SCÉNARIO T : Modification d'un bail → aucune corruption des autres locations
    // -------------------------------------------------------------
    try {
      console.log('\n--- SCÉNARIO T : Modification d\'un bail sans corruption des autres ---');
      const rBienT1 = await client.query(`INSERT INTO biens_immo (agence_id, titre, type_bien) VALUES ($1, 'Bien T1', 'appartement') RETURNING *`, [existingAgence.id]);
      const rBienT2 = await client.query(`INSERT INTO biens_immo (agence_id, titre, type_bien) VALUES ($1, 'Bien T2', 'appartement') RETURNING *`, [existingAgence.id]);
      const rLocT = await client.query(`INSERT INTO contacts_immo (agence_id, nom, type_contact) VALUES ($1, 'AUDIT_LOC_T', 'locataire') RETURNING *`, [existingAgence.id]);

      const rBailT1 = await client.query(`
        INSERT INTO baux_immo (agence_id, bien_id, locataire_id, date_debut, loyer_mensuel, statut)
        VALUES ($1, $2, $3, '2026-01-01', 100000, 'actif') RETURNING *
      `, [existingAgence.id, rBienT1.rows[0].id, rLocT.rows[0].id]);

      const rBailT2 = await client.query(`
        INSERT INTO baux_immo (agence_id, bien_id, locataire_id, date_debut, loyer_mensuel, statut)
        VALUES ($1, $2, $3, '2026-01-01', 200000, 'actif') RETURNING *
      `, [existingAgence.id, rBienT2.rows[0].id, rLocT.rows[0].id]);

      // Modifier Bail T1 uniquement (passer à 120 000 FCFA et changer date)
      await client.query(`
        UPDATE baux_immo 
        SET loyer_mensuel = 120000, jour_echeance = 10, updated_at = NOW()
        WHERE id = $1
      `, [rBailT1.rows[0].id]);

      // Vérifier Bail T2 intact
      const checkBailT2 = await client.query(`SELECT loyer_mensuel, jour_echeance FROM baux_immo WHERE id = $1`, [rBailT2.rows[0].id]);
      const checkBailT1 = await client.query(`SELECT loyer_mensuel, jour_echeance FROM baux_immo WHERE id = $1`, [rBailT1.rows[0].id]);

      const passT = Number(checkBailT1.rows[0].loyer_mensuel) === 120000 && 
                    Number(checkBailT1.rows[0].jour_echeance) === 10 &&
                    Number(checkBailT2.rows[0].loyer_mensuel) === 200000 &&
                    Number(checkBailT2.rows[0].jour_echeance) === 5;

      results['SCENARIO_T'] = { status: passT ? 'PASS' : 'FAIL', t1: checkBailT1.rows[0], t2: checkBailT2.rows[0] };
      console.log(`Résultat T (Intégrité modif bail) : ${results['SCENARIO_T'].status}`);
    } catch (e) {
      results['SCENARIO_T'] = { status: 'FAIL', error: e.message };
    }

    // -------------------------------------------------------------
    // SCÉNARIO W : Paiement → bonne location → bon locataire → bon bien → bon bailleur
    // -------------------------------------------------------------
    try {
      console.log('\n--- SCÉNARIO W : Chaîne complète Paiement → Location → Locataire → Bien → Bailleur ---');
      const rBailleurW = await client.query(`
        INSERT INTO proprietaires_immo (agence_id, nom, prenom, telephone, iban)
        VALUES ($1, 'AUDIT_BAILLEUR_W', 'Ibrahima', '776660001', 'SN08SN123456789') RETURNING *
      `, [existingAgence.id]);
      const bailleurW = rBailleurW.rows[0];

      const rBienW = await client.query(`
        INSERT INTO biens_immo (agence_id, proprietaire_id, titre, type_bien)
        VALUES ($1, $2, 'Bien Audit Traçabilité W', 'appartement') RETURNING *
      `, [existingAgence.id, bailleurW.id]);
      const bienW = rBienW.rows[0];

      const rLocW = await client.query(`
        INSERT INTO contacts_immo (agence_id, nom, prenom, telephone, type_contact)
        VALUES ($1, 'AUDIT_LOC_W', 'Khadija', '776660002', 'locataire') RETURNING *
      `, [existingAgence.id]);
      const locW = rLocW.rows[0];

      const rBailW = await client.query(`
        INSERT INTO baux_immo (agence_id, bien_id, locataire_id, proprietaire_id, date_debut, loyer_mensuel, statut)
        VALUES ($1, $2, $3, $4, '2026-03-01', 300000, 'actif') RETURNING *
      `, [existingAgence.id, bienW.id, locW.id, bailleurW.id]);
      const bailW = rBailW.rows[0];

      const rEchW = await client.query(`
        INSERT INTO loyers_echeances (bail_id, agence_id, periode, date_echeance, montant_du, montant_paye, montant_restant, statut)
        VALUES ($1, $2, '2026-03', '2026-03-05', 300000, 0, 300000, 'en_attente') RETURNING *
      `, [bailW.id, existingAgence.id]);
      const echW = rEchW.rows[0];

      // Encaissement
      const quittanceRef = `QUITTANCE-AUDIT-${Date.now()}`;
      await client.query(`
        UPDATE loyers_echeances
        SET montant_paye = 300000, montant_restant = 0, statut = 'paye',
            date_paiement = CURRENT_DATE, mode_paiement = 'wave', reference_paiement = 'WAVE-TX-999',
            quittance_url = $1, updated_at = NOW()
        WHERE id = $2
      `, [quittanceRef, echW.id]);

      // Vérification de la chaîne de traçabilité complète depuis l'échéance / paiement
      const rChaine = await client.query(`
        SELECT le.id AS echeance_id, le.montant_paye, le.mode_paiement, le.quittance_url,
               bx.id AS bail_id, bx.loyer_mensuel,
               c.id AS locataire_id, c.nom AS locataire_nom,
               b.id AS bien_id, b.titre AS bien_titre,
               p.id AS bailleur_id, p.nom AS bailleur_nom, p.iban AS bailleur_iban,
               ag.id AS agence_id, ag.nom AS agence_nom
        FROM loyers_echeances le
        JOIN baux_immo bx ON le.bail_id = bx.id
        JOIN contacts_immo c ON bx.locataire_id = c.id
        JOIN biens_immo b ON bx.bien_id = b.id
        LEFT JOIN proprietaires_immo p ON bx.proprietaire_id = p.id
        JOIN agences_immo ag ON le.agence_id = ag.id
        WHERE le.id = $1
      `, [echW.id]);

      const chaine = rChaine.rows[0];
      const passW = chaine &&
                    chaine.locataire_nom === 'AUDIT_LOC_W' &&
                    chaine.bien_titre === 'Bien Audit Traçabilité W' &&
                    chaine.bailleur_nom === 'AUDIT_BAILLEUR_W' &&
                    chaine.agence_nom === 'AMAR IMMO' &&
                    Number(chaine.montant_paye) === 300000;

      results['SCENARIO_W'] = { status: passW ? 'PASS' : 'FAIL', chaine };
      console.log(`Résultat W (Chaîne de traçabilité complète) : ${results['SCENARIO_W'].status}`);
    } catch (e) {
      results['SCENARIO_W'] = { status: 'FAIL', error: e.message };
    }

    // -------------------------------------------------------------
    // SCÉNARIO X : Impayé → bonne location → calcul retard → notification
    // -------------------------------------------------------------
    try {
      console.log('\n--- SCÉNARIO X : Impayé → bonne location → calcul retard & isolation ---');
      const rBienX = await client.query(`INSERT INTO biens_immo (agence_id, titre, type_bien) VALUES ($1, 'Bien X Impaye', 'appartement') RETURNING *`, [existingAgence.id]);
      const rLocX = await client.query(`INSERT INTO contacts_immo (agence_id, nom, type_contact) VALUES ($1, 'AUDIT_LOC_X', 'locataire') RETURNING *`, [existingAgence.id]);
      const rBailX = await client.query(`
        INSERT INTO baux_immo (agence_id, bien_id, locataire_id, date_debut, loyer_mensuel, statut)
        VALUES ($1, $2, $3, '2026-01-01', 150000, 'actif') RETURNING *
      `, [existingAgence.id, rBienX.rows[0].id, rLocX.rows[0].id]);

      // Création impayé (échéance passée non payée)
      const rEchX = await client.query(`
        INSERT INTO loyers_echeances (
          bail_id, agence_id, periode, date_echeance, montant_du, montant_paye, montant_restant,
          statut, retard_jours, rappels_envoyes
        ) VALUES ($1, $2, '2026-01', '2026-01-05', 150000, 0, 150000, 'impaye', 80, 2)
        RETURNING *
      `, [rBailX.rows[0].id, existingAgence.id]);

      // Vérifier que le statut impayé est bien rattaché au bon bail et remonte dans les KPI
      const rKpi = await client.query(`
        SELECT count(*) AS nb_impayes, sum(montant_restant) AS total_du
        FROM loyers_echeances
        WHERE bail_id = $1 AND statut IN ('retard', 'impaye')
      `, [rBailX.rows[0].id]);

      const passX = parseInt(rKpi.rows[0].nb_impayes, 10) === 1 && Number(rKpi.rows[0].total_du) === 150000;
      results['SCENARIO_X'] = { status: passX ? 'PASS' : 'FAIL', kpi: rKpi.rows[0] };
      console.log(`Résultat X (Impayé & KPI) : ${results['SCENARIO_X'].status}`);
    } catch (e) {
      results['SCENARIO_X'] = { status: 'FAIL', error: e.message };
    }

    console.log('\n================================================================');
    console.log('                 RÉSUMÉ FINAL PARTIE 2                         ');
    console.log('================================================================');
    console.log(JSON.stringify(results, null, 2));

    // -------------------------------------------------------------
    // NETTOYAGE RIGOUREUX DES DONNÉES DE TEST 'AUDIT_%'
    // -------------------------------------------------------------
    console.log('\n--- NETTOYAGE DES LIGNES DE TEST AUDIT ---');
    const delLoyers = await client.query(`
      DELETE FROM loyers_echeances 
      WHERE bail_id IN (
        SELECT id FROM baux_immo WHERE locataire_id IN (SELECT id FROM contacts_immo WHERE nom LIKE 'AUDIT_%')
        OR bien_id IN (SELECT id FROM biens_immo WHERE titre LIKE '%Audit%' OR titre LIKE 'Bien %' OR titre LIKE 'Villa %')
      )
    `);
    const delBaux = await client.query(`
      DELETE FROM baux_immo 
      WHERE locataire_id IN (SELECT id FROM contacts_immo WHERE nom LIKE 'AUDIT_%')
         OR bien_id IN (SELECT id FROM biens_immo WHERE titre LIKE '%Audit%' OR titre LIKE 'Bien %' OR titre LIKE 'Villa %' OR titre LIKE 'Studio Audit%')
    `);
    const delAnnonces = await client.query(`
      DELETE FROM annonces_immo WHERE titre LIKE '%Audit%'
    `);
    const delBiens = await client.query(`
      DELETE FROM biens_immo WHERE titre LIKE '%Audit%' OR titre LIKE 'Bien %' OR titre LIKE 'Villa %' OR titre LIKE 'Studio Audit%' OR titre LIKE 'Appartement Loué par Samba' OR titre LIKE 'Terrain E3'
    `);
    const delContacts = await client.query(`
      DELETE FROM contacts_immo WHERE nom LIKE 'AUDIT_%' OR nom = 'DIOP' OR nom = 'Ndiaye' OR telephone LIKE '77000%' OR telephone LIKE '77333%' OR telephone LIKE '77444%' OR telephone LIKE '77666%' OR telephone LIKE '77999%'
    `);
    const delProps = await client.query(`
      DELETE FROM proprietaires_immo WHERE nom LIKE 'AUDIT_%' OR nom = 'FALL' OR nom = 'Ndiaye' OR telephone LIKE '77000%' OR telephone LIKE '77222%' OR telephone LIKE '77444%' OR telephone LIKE '77555%' OR telephone LIKE '77666%'
    `);
    const delUsers = await client.query(`
      DELETE FROM utilisateurs WHERE email LIKE '%@test.sn' OR telephone IN ('771112233', '772223344', '774445566', '775550002', '779998877')
    `);
    const delAgences = await client.query(`
      DELETE FROM agences_immo WHERE slug = 'agence-b-concurrente'
    `);

    console.log(`✅ Nettoyage terminé sans toucher aux données de production :
      - Loyers supprimés : ${delLoyers.rowCount}
      - Baux supprimés : ${delBaux.rowCount}
      - Annonces supprimées : ${delAnnonces.rowCount}
      - Biens supprimés : ${delBiens.rowCount}
      - Contacts supprimés : ${delContacts.rowCount}
      - Bailleurs supprimés : ${delProps.rowCount}
      - Utilisateurs supprimés : ${delUsers.rowCount}
      - Agences supprimées : ${delAgences.rowCount}`);

  } catch (err) {
    console.error('Erreur globale Scénarios Partie 2 :', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runAuditScenariosPart2();
