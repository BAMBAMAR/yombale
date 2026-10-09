// scripts/audit/data/appliquer-migrations-data.js
// Migration ciblée pour la correction des anomalies de données de production Surga
require('dotenv').config();
const { pool } = require('../../../backend/models/db');

async function appliquerMigrations() {
  console.log('=== APPLICATION DES MIGRATIONS DE DONNÉES SURGA ===\n');

  // 1. Colonne statut sur surga_trafic_signalements (DAT-ANO-07)
  console.log('1. Mise à jour de surga_trafic_signalements...');
  try {
    await pool.query(`
      ALTER TABLE surga_trafic_signalements 
      ADD COLUMN IF NOT EXISTS statut VARCHAR(20) NOT NULL DEFAULT 'en_attente',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    console.log('   ✅ Colonne statut et updated_at ajoutées à surga_trafic_signalements');
  } catch (err) {
    console.error('   ❌ Erreur sur surga_trafic_signalements:', err.message);
  }

  // 2. Publication des 20 démarches administratives (DAT-ANO-05)
  console.log('\n2. Activation des démarches au statut PUBLIE...');
  try {
    const demRes = await pool.query(`
      UPDATE surga_demarches
      SET statut = 'PUBLIE', updated_at = NOW()
      WHERE statut = 'BROUILLON';
    `);
    console.log(`   ✅ ${demRes.rowCount} fiches démarches passées au statut PUBLIE`);
  } catch (err) {
    console.error('   ❌ Erreur sur surga_demarches:', err.message);
  }

  // 3. Mise à jour des données réelles du CESTI 2026 (DAT-ANO-01, DAT-ANO-02, DAT-ANO-03)
  console.log('\n3. Rectification des données officielles du concours CESTI 2026...');
  try {
    const piecesOfficielles = [
      'Demande manuscrite adressée au Directeur du CESTI',
      'Fiche individuelle de candidature dûment remplie',
      'Photocopie certifiée conforme de la CNI ou extrait d acte de naissance',
      'Une photo d identité récente',
      'Photocopie légalisée de l attestation du Baccalauréat (ou certificat de scolarité et relevés de notes de 2nde et 1ère pour les candidats en classe de Terminale)',
      'Quittance de versement des frais de dossier (10 000 FCFA dans les CAOSP régionaux / 10 100 FCFA au CESTI Dakar)',
      'Pour les professionnels : contrat de travail ou bulletins de salaire justifiant 4 années d expérience',
      'Pour les titulaires d un Master (admission en L2) : copie légalisée du diplôme de Master'
    ];

    const descriptionExacte = 'Formation d excellence aux métiers du journalisme (presse écrite, radio, télévision, journalisme numérique). Inscriptions ouvertes aux bacheliers de 17 à 24 ans et aux professionnels des médias sans limite d âge.';

    await pool.query(`
      UPDATE surga_concours
      SET statut = 'termine',
          date_ouverture = '2026-05-02T08:00:00.000Z',
          date_cloture = '2026-06-25T17:00:00.000Z',
          date_epreuves = '2026-09-03T08:00:00.000Z',
          date_resultats = '2026-09-24T14:00:00.000Z',
          age_max = 24,
          frais_dossier_xof = 10000,
          description = $1,
          pieces_a_fournir = $2,
          updated_at = NOW()
      WHERE id = 'concours-cesti-2026';
    `, [descriptionExacte, JSON.stringify(piecesOfficielles)]);
    console.log('   ✅ Concours CESTI 2026 rectifié en base avec succès (statut: termine, vraies pièces et dates)');
  } catch (err) {
    console.error('   ❌ Erreur sur surga_concours CESTI:', err.message);
  }

  process.exit(0);
}

appliquerMigrations().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
