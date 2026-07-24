const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: process.env.NODE_ENV === 'production' } : false,
  connectionTimeoutMillis: 15000,
  statement_timeout:       15000,
  idle_in_transaction_session_timeout: 15000
});

pool.connect()
  .then(c => { console.log('✅ PostgreSQL connecté'); c.release(); })
  .catch(e => console.error('❌ PostgreSQL:', e.message));

module.exports = { pool };
