const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                                    // Réduire le max pour éviter la saturation
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: process.env.NODE_ENV === 'production' } : false,
  connectionTimeoutMillis: 30000,            // 30s (Render.com peut être lent depuis localhost)
  statement_timeout:       30000,            // 30s
  idle_in_transaction_session_timeout: 30000,// 30s
  idleTimeoutMillis: 60000,                  // Garder les connexions idle 60s avant de fermer
  allowExitOnIdle: false,
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
