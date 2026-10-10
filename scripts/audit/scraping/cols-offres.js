const { Client } = require('pg');

const dbName = process.env.AUDIT_DATA_DB || 'nopalou_audit_data';
const url = process.env.DATABASE_URL.replace(/\/[^/]+$/, '/' + dbName);

(async () => {
  const client = new Client({ connectionString: url });
  await client.connect();
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'offres' ORDER BY ordinal_position
  `);
  console.log('Colonnes de offres:', cols.rows.map(c => c.column_name).join(', '));
  await client.end();
})();
