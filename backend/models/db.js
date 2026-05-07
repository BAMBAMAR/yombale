// backend/models/db.js
const { Pool } = require('pg');

// Pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

pool.connect()
  .then(c => { console.log('✅ PostgreSQL connecté'); c.release(); })
  .catch(e => console.error('❌ PostgreSQL:', e.message));

// Redis optionnel — fonctionne sans
let redis = null;
if (process.env.REDIS_URL) {
  try {
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      retryStrategy: () => null  // ne pas réessayer si échec
    });
    redis.on('connect', () => console.log('✅ Redis connecté'));
    redis.on('error', () => {
      redis = null; // désactiver si erreur
    });
  } catch (e) {
    console.warn('⚠️ Redis non disponible');
  }
} else {
  console.warn('⚠️ Redis désactivé — REDIS_URL manquant');
}

// Cache-aside : Redis si disponible, sinon direct PostgreSQL
async function queryWithCache(cacheKey, sql, params, ttl = 1800) {
  // Si Redis disponible → chercher en cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) { /* ignorer erreur Redis */ }
  }

  // Interroger PostgreSQL
  const result = await pool.query(sql, params);

  // Mettre en cache si Redis disponible
  if (redis) {
    try {
      await redis.setex(cacheKey, ttl, JSON.stringify(result.rows));
    } catch (e) { /* ignorer erreur Redis */ }
  }

  return result.rows;
}

module.exports = { pool, redis, queryWithCache };
