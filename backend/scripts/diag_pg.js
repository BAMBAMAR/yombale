require('dotenv').config();
const { Client } = require('pg');

async function testConfig(name, config) {
  console.log(`\n--- Test : ${name} ---`);
  const client = new Client(config);
  try {
    await client.connect();
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log('✅ Succès !', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ Échec : ${err.message} (${err.code})`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  const url = process.env.DATABASE_URL;
  console.log('Target host:', url.split('@')[1]?.split('/')[0]);

  // Test 1: URL with ssl: { rejectUnauthorized: false }
  await testConfig('Standard rejectUnauthorized: false', {
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  // Test 2: URL with sslmode=require in connectionString
  const urlWithSsl = url.includes('?') ? `${url}&sslmode=require` : `${url}?sslmode=require`;
  await testConfig('URL avec ?sslmode=require + rejectUnauthorized: false', {
    connectionString: urlWithSsl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  // Test 3: Explicit servername (SNI) for Render
  const host = url.split('@')[1]?.split('/')[0]?.split(':')[0];
  await testConfig('Avec SNI servername explicite', {
    connectionString: url,
    ssl: {
      rejectUnauthorized: false,
      servername: host,
    },
    connectionTimeoutMillis: 10000,
  });

  process.exit();
}

run();
