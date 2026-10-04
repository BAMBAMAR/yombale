const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const users = await pool.query('SELECT id, email, nom, telephone FROM utilisateurs LIMIT 10');
  console.log('Users:', users.rows);
  const boutiques = await pool.query('SELECT id, nom, slug, utilisateur_id FROM boutiques LIMIT 10');
  console.log('Boutiques:', boutiques.rows);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
