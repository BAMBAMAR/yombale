// backend/models/db.js — VERSION SANS REDIS
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

pool.connect()
  .then(c => { console.log('✅ PostgreSQL connecté'); c.release(); })
  .catch(e => console.error('❌ PostgreSQL:', e.message));

// Sans Redis : requête directe PostgreSQL
async function queryWithCache(cacheKey, sql, params) {
  const result = await pool.query(sql, params);
  return result.rows;
}

module.exports = { pool, queryWithCache };
