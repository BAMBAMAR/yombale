require('dotenv').config();
const { Client } = require('pg');

// Connexion directe (sans pool) pour tester les credentials
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function main() {
  console.log('Tentative connexion directe (sans pool)...');
  try {
    await client.connect();
    const r = await client.query('SELECT COUNT(*) as nb FROM offres LIMIT 1');
    console.log('✅ Connexion OK! Nombre d\'offres:', r.rows[0].nb);
    await client.end();
  } catch (e) {
    console.error('❌ Erreur:', e.message, e.code);
  }
  process.exit();
}

main();
