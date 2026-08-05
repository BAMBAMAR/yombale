require('dotenv').config();
const { pool } = require('../models/db');

async function main() {
  // Récupère le dernier OTP généré (dans les 10 dernières minutes)
  const { rows } = await pool.query(`
    SELECT telephone, code, expires_at, created_at
    FROM otp_codes
    ORDER BY created_at DESC
    LIMIT 5
  `);
  console.log('Derniers OTP générés:');
  console.log(JSON.stringify(rows, null, 2));
  process.exit();
}

main().catch(err => { console.error(err); process.exit(1); });
