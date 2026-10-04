const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'biens_immo' 
    ORDER BY ordinal_position;
  `);
  console.log('Columns of biens_immo:', cols.rows.map(r => r.column_name));
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
