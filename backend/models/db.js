const { Pool } = require('pg');
const Redis    = require('ioredis');

// Pool PostgreSQL — garde plusieurs connexions ouvertes
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Client Redis — cache ultra-rapide
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redis.on('connect', () => console.log('✅ Redis connecté'));
redis.on('error',   e  => console.error('❌ Redis:', e.message));

// Cache-aside : Redis d'abord, PostgreSQL ensuite
async function queryWithCache(cacheKey, sql, params, ttlSeconds = 1800) {
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const result = await pool.query(sql, params);
  await redis.setex(cacheKey, ttlSeconds, JSON.stringify(result.rows));
  return result.rows;
}

pool.connect()
  .then(c => { console.log('✅ PostgreSQL connecté'); c.release(); })
  .catch(e => console.error('❌ PostgreSQL:', e.message));

module.exports = { pool, redis, queryWithCache };