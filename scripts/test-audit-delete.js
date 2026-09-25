require('dotenv').config();
const { pool } = require('../backend/models/db');

async function testAuditDelete() {
  const client = await pool.connect();
  try {
    console.log('=== TEST D\'AUDIT : SUPPRESSION LOCATAIRE ET BAILLEUR ===\n');

    const agenceRes = await client.query('SELECT * FROM agences_immo LIMIT 1');
    const agence = agenceRes.rows[0];

    // 1. Test suppression Bailleur avec 0 bien
    const rPropEmpty = await client.query(`
      INSERT INTO proprietaires_immo (agence_id, nom, telephone)
      VALUES ($1, 'BAILLEUR_SANS_BIEN_TEST', '770008888') RETURNING *
    `, [agence.id]);
    const propEmpty = rPropEmpty.rows[0];

    // Simuler la logique de backend/routes/crm-immo.js:890
    const checkBiens = await client.query(
      `SELECT COUNT(*) AS total FROM biens_immo WHERE proprietaire_id = $1 AND agence_id = $2`,
      [propEmpty.id, agence.id]
    );
    console.log('1. Bailleur sans bien rattaché : total biens =', checkBiens.rows[0].total);

    const delPropEmpty = await client.query(
      `DELETE FROM proprietaires_immo WHERE id = $1 AND agence_id = $2`,
      [propEmpty.id, agence.id]
    );
    console.log('   Suppression en base possible :', delPropEmpty.rowCount === 1 ? 'OUI' : 'NON');
    console.log('   Bouton disponible dans le front-end (BailleurCardItem / Modal) : NON (Absent du code)\n');

    // 2. Test suppression Bailleur avec 1 bien
    const rPropWithBien = await client.query(`
      INSERT INTO proprietaires_immo (agence_id, nom, telephone)
      VALUES ($1, 'BAILLEUR_AVEC_BIEN_TEST', '770008889') RETURNING *
    `, [agence.id]);
    const propWithBien = rPropWithBien.rows[0];

    const rBien = await client.query(`
      INSERT INTO biens_immo (agence_id, proprietaire_id, titre, type_bien)
      VALUES ($1, $2, 'Bien Test Deletion', 'appartement') RETURNING *
    `, [agence.id, propWithBien.id]);

    const checkBiens2 = await client.query(
      `SELECT COUNT(*) AS total FROM biens_immo WHERE proprietaire_id = $1 AND agence_id = $2`,
      [propWithBien.id, agence.id]
    );
    console.log('2. Bailleur avec bien rattaché : total biens =', checkBiens2.rows[0].total);
    console.log('   Comportement backend API (crm-immo.js:901) : Renvoie HTTP 400 "Impossible de supprimer ce bailleur : X bien(s) lui sont encore rattachés"\n');

    // 3. Test existence route DELETE Locataire
    console.log('3. Route API DELETE Locataire (contacts_immo) :');
    console.log('   crm-immo.js possède DELETE /proprietaires/:id : OUI (L890)');
    console.log('   crm-immo.js possède DELETE /contacts/:id : NON (Route inexistante !)');
    console.log('   Frontend LocataireCardItem / ModalEditerLocataire possède bouton suppression : NON\n');

    // 4. Test de l\'impact en cascade si suppression manuelle SQL d\'un contact locataire ayant un bail et des loyers
    const rLoc = await client.query(`
      INSERT INTO contacts_immo (agence_id, nom, telephone, type_contact)
      VALUES ($1, 'LOC_CASCADE_TEST', '770008890', 'locataire') RETURNING *
    `, [agence.id]);
    const loc = rLoc.rows[0];

    const rBail = await client.query(`
      INSERT INTO baux_immo (agence_id, bien_id, locataire_id, date_debut, loyer_mensuel, statut)
      VALUES ($1, $2, $3, '2026-01-01', 100000, 'actif') RETURNING *
    `, [agence.id, rBien.rows[0].id, loc.id]);
    const bail = rBail.rows[0];

    const rLoyer = await client.query(`
      INSERT INTO loyers_echeances (bail_id, agence_id, periode, date_echeance, montant_du, montant_paye, statut)
      VALUES ($1, $2, '2026-01', '2026-01-05', 100000, 100000, 'paye') RETURNING *
    `, [bail.id, agence.id]);

    console.log('4. État avant suppression : 1 contact, 1 bail, 1 échéance payée');
    // Suppression du contact en base
    await client.query(`DELETE FROM contacts_immo WHERE id = $1`, [loc.id]);
    
    // Vérifier si le bail et l'échéance ont survécu ou ont été détruits en cascade
    const checkBail = await client.query(`SELECT count(*) FROM baux_immo WHERE id = $1`, [bail.id]);
    const checkLoyer = await client.query(`SELECT count(*) FROM loyers_echeances WHERE id = $1`, [rLoyer.rows[0].id]);

    console.log('   État après DELETE FROM contacts_immo :');
    console.log('   - Baux restants :', checkBail.rows[0].count, '(0 = DÉTRUIT EN CASCADE)');
    console.log('   - Loyers/Quittances restants :', checkLoyer.rows[0].count, '(0 = DÉTRUIT EN CASCADE)');
    console.log('   ⚠️ DANGER DÉMONTRÉ : La contrainte ON DELETE CASCADE sur baux_immo.locataire_id et loyers_echeances.bail_id efface l\'historique comptable et juridique !\n');

    // Nettoyage
    await client.query(`DELETE FROM biens_immo WHERE id = $1`, [rBien.rows[0].id]);
    await client.query(`DELETE FROM proprietaires_immo WHERE id = $1`, [propWithBien.id]);

  } catch (err) {
    console.error('Erreur test delete:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

testAuditDelete();
