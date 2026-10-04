const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const agencesCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'agences_immo' 
    ORDER BY ordinal_position;
  `);
  console.log('Columns agences_immo:', agencesCols.rows.map(r => r.column_name));

  const membresCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'agence_membres' 
    ORDER BY ordinal_position;
  `);
  console.log('Columns agence_membres:', membresCols.rows.map(r => r.column_name));

  const bauxCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'baux_immo' 
    ORDER BY ordinal_position;
  `);
  console.log('Columns baux_immo:', bauxCols.rows.map(r => r.column_name));

  const agences = await pool.query('SELECT id, nom, slug, utilisateur_id FROM agences_immo LIMIT 5');
  console.log('Agences sample:', agences.rows);

  const baux = await pool.query('SELECT id, bien_id, locataire_id, agence_id FROM baux_immo LIMIT 5');
  console.log('Baux sample:', baux.rows);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
