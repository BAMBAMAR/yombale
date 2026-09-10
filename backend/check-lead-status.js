require('dotenv').config();
const { pool } = require('./models/db');

(async () => {
  try {
    const res = await pool.query("SELECT statut, count(*) as cnt FROM prospection_leads GROUP BY statut ORDER BY cnt DESC");
    console.log('Répartition des leads par statut:');
    res.rows.forEach(r => console.log('  ', r.statut, ':', r.cnt));
    process.exit(0);
  } catch(e) { console.error(e); process.exit(1); }
})();
