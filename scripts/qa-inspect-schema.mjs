import 'dotenv/config';
import { pool } from '../backend/models/db.js';

async function main() {
  const tables = ['utilisateurs', 'boutiques', 'boutique_produits', 'commandes_boutique', 'caisse_clients_credits', 'caisse_credit_historique', 'ventes', 'boutique_pos_sessions'];
  for (const t of tables) {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", [t]);
    console.log(`\n📋 TABLE: ${t} (${res.rows.length} columns)`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }
  await pool.end();
}

main().catch(console.error);
