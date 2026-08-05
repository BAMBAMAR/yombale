require('dotenv').config();
const { pool } = require('../models/db');

async function main() {
  const res = await pool.query("UPDATE abonnements SET plan = 'decouverte' WHERE utilisateur_id = '15a29820-aa4a-4eb1-96a7-5fc265566d29'");
  console.log('Mis a jour:', res.rowCount);
  process.exit();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
