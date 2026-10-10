const { Client } = require('pg');

async function testDb(dbName) {
  const url = process.env.DATABASE_URL.replace(/\/[^/]+$/, '/' + dbName);
  try {
    const client = new Client({ connectionString: url });
    await client.connect();
    console.log(`\n=== CHECK BASE ${dbName} ===`);
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));
    for (const t of ['scraping_runs', 'offres', 'produits', 'annonces_immo']) {
      if (tables.rows.some(r => r.table_name === t)) {
        const c = await client.query(`SELECT count(*) FROM ${t}`);
        console.log(`  ${t}: ${c.rows[0].count}`);
      }
    }
    await client.end();
  } catch (e) {
    console.log(`Base ${dbName} non accessible:`, e.message);
  }
}

(async () => {
  await testDb('nopalou_audit');
  await testDb('nopalou_scrap_audit');
  await testDb('nopalou_fresh');
})();
