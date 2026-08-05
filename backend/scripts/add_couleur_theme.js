require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/yombale'
});

async function run() {
  try {
    await pool.query(`ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS couleur_theme VARCHAR(50) DEFAULT '#1e3a5f'`);
    console.log('Column couleur_theme added successfully!');
  } catch (err) {
    console.error('Error adding column:', err.message);
  } finally {
    await pool.end();
  }
}

run();
