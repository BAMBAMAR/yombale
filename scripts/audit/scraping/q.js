// Usage: node q.js <db> "<sql>"  — lecture seule sur la base d'audit locale
const path = require('path');
const { Client } = require('pg');
const db = process.argv[2] || (process.env.AUDIT_DATA_DB || 'nopalou_audit_data');
const sql = process.argv[3];
const url = process.env.DATABASE_URL.replace(/\/[^/]+$/, '/' + db);
if (/render\.com|onrender/.test(url)) { console.error('REFUS prod'); process.exit(2); }
(async () => {
  const c = new Client({ connectionString: url });
  await c.connect();
  await c.query("SET default_transaction_read_only = on");
  try {
    const r = await c.query(sql);
    const rows = Array.isArray(r) ? r[r.length - 1].rows : r.rows;
    console.log(JSON.stringify(rows, (k, v) => typeof v === 'bigint' ? Number(v) : v));
  } catch (e) { console.error('ERR', e.message); process.exitCode = 1; }
  await c.end();
})();
