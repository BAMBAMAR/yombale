require('dotenv').config();
const { pool } = require('../../../backend/models/db');
const { conditionImmoPubliable } = require('../../../backend/lib/immo-publiable');

async function main() {
  console.log('=== ANALYSE DE LA QUANTITE ET QUALITE IMMO & BONNES ADRESSES ===\n');

  // 1. IMMOBILIER
  console.log('--- 1. IMMOBILIER (annonces_immo) ---');
  const countTotal = await pool.query('SELECT count(*) as c FROM annonces_immo');
  console.log('Total brut annonces_immo :', countTotal.rows[0].c);

  const sqlPubliables = `SELECT count(*) as c FROM annonces_immo ai WHERE ${conditionImmoPubliable('ai')}`;
  const countPubliables = await pool.query(sqlPubliables);
  console.log('Total publiables conformes :', countPubliables.rows[0].c);

  const statsImmo = await pool.query(`
    SELECT 
      count(*) FILTER (WHERE ai.photos IS NOT NULL AND jsonb_array_length(CASE WHEN jsonb_typeof(ai.photos) = 'array' THEN ai.photos ELSE '[]'::jsonb END) > 0) as avec_photos,
      count(*) FILTER (WHERE ai.contact_tel IS NOT NULL AND length(trim(ai.contact_tel)) >= 9) as avec_telephone,
      count(*) FILTER (WHERE ai.quartier IS NOT NULL AND length(trim(ai.quartier)) > 1) as avec_quartier,
      count(*) FILTER (WHERE ai.surface_m2 IS NOT NULL AND ai.surface_m2 > 0) as avec_surface,
      count(*) FILTER (WHERE ai.prix BETWEEN 25000 AND 500000000) as avec_prix_realiste,
      count(*) FILTER (WHERE ai.type_bien IN ('appartement', 'villa', 'studio', 'chambre', 'terrain', 'bureau', 'local_commercial')) as type_standard
    FROM annonces_immo ai
    WHERE ${conditionImmoPubliable('ai')}
  `);
  console.table(statsImmo.rows);

  const repartitionQuartiers = await pool.query(`
    SELECT quartier, count(*) as c 
    FROM annonces_immo ai 
    WHERE ${conditionImmoPubliable('ai')}
    GROUP BY quartier 
    ORDER BY c DESC 
    LIMIT 15
  `);
  console.log('\nTop 15 Quartiers Immo :');
  console.table(repartitionQuartiers.rows);

  // 2. BONNES ADRESSES & BONS PLANS
  console.log('\n--- 2. BONNES ADRESSES (surga_places) ---');
  const countPlaces = await pool.query('SELECT count(*) as c FROM surga_places');
  console.log('Total surga_places en DB :', countPlaces.rows[0].c);

  const samplePlaces = await pool.query(`
    SELECT categorie, count(*) as c, 
           avg(note_moyenne) as note_moy, 
           avg(budget_moyen_xof) as budget_moy
    FROM surga_places 
    GROUP BY categorie 
    ORDER BY c DESC
  `);
  console.table(samplePlaces.rows);

  const detailsPlaces = await pool.query(`
    SELECT id, nom, categorie, quartier, budget_moyen_xof, note_moyenne, specialite, resume_honnete, contact_tel
    FROM surga_places
    LIMIT 10
  `);
  console.log('\nExemples de Bonnes Adresses :');
  console.table(detailsPlaces.rows);

  // 3. CATALOGUE LOCAL DEMO PLACES
  try {
    const jsonPlaces = require('../../../backend/data/surga-places-catalogue.json');
    console.log('\nCatalogue JSON local backend/data/surga-places-catalogue.json :', jsonPlaces.length, 'adresses');
  } catch (e) {
    console.log('Pas de catalogue JSON ou erreur :', e.message);
  }

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
