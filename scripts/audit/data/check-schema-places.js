require('dotenv').config();
const { pool } = require('../../../backend/models/db');

async function main() {
  const r = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'surga_places' 
    ORDER BY ordinal_position
  `);
  console.log('Colonnes surga_places :');
  console.table(r.rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
