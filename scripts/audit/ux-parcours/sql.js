// Requête SQL en LECTURE SEULE sur la base d'audit (transaction READ ONLY).
// Usage : node scripts/audit/ux-parcours/sql.js "<requête>" [base]   (base par défaut : nopalou_audit_data)
const { Client } = require('pg');
const db = process.argv[3] || 'nopalou_audit_data';
const url = (process.env.DATABASE_URL || '').replace(/\/[^/]+$/, '/' + db);
if (!/127\.0\.0\.1:54329|localhost:54329/.test(url)) { console.error('REFUS : base non locale'); process.exit(2); }
(async () => {
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    await c.query('BEGIN READ ONLY');
    const r = await c.query(process.argv[2]);
    console.table(r.rows);
    console.log(r.rowCount, 'ligne(s)');
  } finally { await c.query('ROLLBACK').catch(() => {}); await c.end(); }
})().catch(e => { console.error('ERREUR', e.message); process.exit(1); });
