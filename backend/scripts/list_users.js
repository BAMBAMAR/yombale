require('dotenv').config();
const { pool } = require('../models/db');

async function main() {
  const { rows } = await pool.query(`
    SELECT u.id, u.nom, u.telephone, u.email, a.plan, a.statut, a.fin
    FROM utilisateurs u
    LEFT JOIN abonnements a ON a.utilisateur_id = u.id
      AND a.statut = 'actif' AND a.fin > NOW()
    WHERE u.telephone IS NOT NULL
    ORDER BY u.created_at DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(rows, null, 2));
  process.exit();
}

main().catch(err => { console.error(err); process.exit(1); });
