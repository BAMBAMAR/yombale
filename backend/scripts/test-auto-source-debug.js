const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');

async function run() {
  try {
    // 1. Test si la table annonces_classifiees existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'annonces_classifiees'
      ) as exists
    `);
    console.log('Table annonces_classifiees existe:', tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ CAUSE DU 500 TROUVÉE: La table annonces_classifiees n\'existe pas!');
      // Lister les tables disponibles
      const tables = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log('Tables existantes:', tables.rows.map(r => r.table_name));
      process.exit(0);
    }

    // 2. Test des colonnes
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'annonces_classifiees' 
      ORDER BY ordinal_position
    `);
    console.log('\nColonnes annonces_classifiees:');
    cols.rows.forEach(r => console.log(' -', r.column_name, ':', r.data_type));

    // 3. Test count
    const cnt = await pool.query('SELECT COUNT(*) as total FROM annonces_classifiees');
    console.log('\nTotal annonces:', cnt.rows[0].total);

    // 4. Test de la requête exacte utilisée par autoSourcerDepuisAnnonces
    const testQuery = await pool.query(`
      SELECT contact_nom, contact_tel, titre, categorie_slug, quartier, ville
      FROM annonces_classifiees
      WHERE contact_tel IS NOT NULL AND contact_tel != '' AND contact_tel != 'Voir sur Facebook'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log('\nSample (5 premières):');
    testQuery.rows.forEach(r => console.log(JSON.stringify(r)));

  } catch (err) {
    console.error('ERREUR:', err.message);
    console.error('Code:', err.code);
    console.error('Detail:', err.detail);
  } finally {
    await pool.end();
  }
}

run();
