require('dotenv').config();
const { pool } = require('../models/db');

const plan = process.argv[2]; // 'decouverte', 'pro', 'business'
const userId = '15a29820-aa4a-4eb1-96a7-5fc265566d29'; // NDIEME

if (!['decouverte', 'pro', 'business'].includes(plan)) {
  console.error('Usage: node switch_plan.js [decouverte|pro|business]');
  process.exit(1);
}

async function main() {
  const res = await pool.query(
    "UPDATE abonnements SET plan = $1 WHERE utilisateur_id = $2",
    [plan, userId]
  );
  console.log(`✅ Plan mis à jour vers "${plan}" (${res.rowCount} ligne(s) modifiée(s))`);
  console.log(`   → Rafraîchissez le navigateur (F5) pour voir les changements.`);
  process.exit();
}

main().catch(err => { console.error(err); process.exit(1); });
