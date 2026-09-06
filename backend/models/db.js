const dns = require('dns');
if (dns.setDefaultResultOrder) {
  try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}
}
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.PG_MAX_CONNECTIONS ? parseInt(process.env.PG_MAX_CONNECTIONS, 10) : 20,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000,            // 15s max pour établir une connexion (réseau distant/Render)
  statement_timeout:       30000,            // 30s max par requête SQL
  idle_in_transaction_session_timeout: 15000,// 15s max en transaction idle
  idleTimeoutMillis: 30000,                  // Libère les connexions inactives au bout de 30s
  keepAlive: true,                           // Évite les déconnexions intempestives par les pare-feux
  allowExitOnIdle: false,
});

// Écouteur global pour éviter le crash Node.js sur déconnexion inattendue d'un client inactif
pool.on('error', (err) => {
  console.error('⚠️ [PG POOL] Erreur inattendue sur client inactif:', err.message);
  try {
    const { alerterAdmin } = require('../services/admin-alerts');
    alerterAdmin({
      type: 'db_pool_error',
      priorite: 'CRITIQUE',
      titre: 'Déconnexion PostgreSQL Inattendue',
      message: `La base de données PostgreSQL a rencontré une déconnexion inattendue : ${err.message}`,
      details: err.stack,
      cooldownMs: 30 * 60 * 1000,
    }).catch(() => {});
  } catch {}
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

  try {
    const { alerterAdmin } = require('../services/admin-alerts');
    alerterAdmin({
      type: 'db_connection_fail',
      priorite: 'CRITIQUE',
      titre: 'Échec Total de Connexion PostgreSQL',
      message: 'Impossible de joindre la base de données PostgreSQL après 3 tentatives. Le site ne peut plus charger les données.',
      cooldownMs: 30 * 60 * 1000,
    }).catch(() => {});
  } catch {}
}

connectWithRetry();

module.exports = { pool };
