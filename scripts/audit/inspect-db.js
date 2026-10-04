const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'utilisateurs' 
    ORDER BY ordinal_position;
  `);
  console.log('Columns of utilisateurs:', res.rows.map(r => `${r.column_name} (${r.data_type})`));
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
