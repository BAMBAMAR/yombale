const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.PG_MAX_CONNECTIONS ? parseInt(process.env.PG_MAX_CONNECTIONS, 10) : 20,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: process.env.NODE_ENV === 'production' } : false,
  connectionTimeoutMillis: 5000,             // Abandonne l'attente au bout de 5s au lieu de 30s
  statement_timeout:       15000,            // 15s max par requête SQL
  idle_in_transaction_session_timeout: 10000,// 10s max en transaction idle
  idleTimeoutMillis: 30000,                  // Libère les connexions inactives au bout de 30s
  allowExitOnIdle: false,
});

// Écouteur global pour éviter le crash Node.js sur déconnexion inattendue d'un client inactif
pool.on('error', (err) => {
  console.error('⚠️ [PG POOL] Erreur inattendue sur client inactif:', err.message);
});

// Tentative de connexion avec retry
async function connectWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const c = await pool.connect();
      console.log('✅ PostgreSQL connecté');
      c.release();
      return;
    } catch (e) {
      console.error(`❌ PostgreSQL (tentative ${i + 1}/${retries}):`, e.message);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 3000)); // attendre 3s avant retry
    }
  }
}

connectWithRetry();

module.exports = { pool };
