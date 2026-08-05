require('dotenv').config();
const { Client } = require('pg');

// Terminer les connexions idle pour libérer la pool Render
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function main() {
  await client.connect();
  
  // Voir les connexions actives
  const { rows: connexions } = await client.query(`
    SELECT pid, state, application_name, wait_event_type, wait_event,
           now() - pg_stat_activity.query_start AS duration
    FROM pg_stat_activity
    WHERE datname = current_database()
    ORDER BY duration DESC NULLS LAST
  `);
  
  console.log(`\nConnexions actives (${connexions.length} total):`);
  connexions.forEach(c => {
    console.log(`  PID ${c.pid} | state: ${c.state} | app: ${c.application_name} | durée: ${c.duration}`);
  });

  // Terminer les connexions idle (sauf celle-ci)
  const { rows: killed } = await client.query(`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND pid <> pg_backend_pid()
      AND state = 'idle'
  `);
  
  console.log(`\n✅ ${killed.length} connexions idle terminées`);
  
  await client.end();
  process.exit();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
