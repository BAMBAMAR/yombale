require('dotenv').config();
const { pool } = require('../../../backend/models/db');

async function main() {
  console.log('=== SCHEMA surga_video_sources & surga_video_items ===');
  const colsSrc = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'surga_video_sources' 
    ORDER BY ordinal_position
  `);
  console.log('Colonnes surga_video_sources :');
  console.table(colsSrc.rows);

  const colsItems = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'surga_video_items' 
    ORDER BY ordinal_position
  `);
  console.log('\nColonnes surga_video_items :');
  console.table(colsItems.rows);

  const sourcesExistantes = await pool.query('SELECT * FROM surga_video_sources');
  console.log('\nSources actuelles :');
  console.table(sourcesExistantes.rows);

  const countItems = await pool.query('SELECT count(*) as total, count(DISTINCT source_id) as sources_uniques FROM surga_video_items');
  console.log('\nItems actuels :', countItems.rows[0]);

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
