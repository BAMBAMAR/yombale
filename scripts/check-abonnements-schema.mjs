import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function check() {
  const res = await pool.query(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'abonnements'
    ORDER BY ordinal_position
  `)
  console.log(res.rows)

  const sample = await pool.query(`
    SELECT id, utilisateur_id, plan, statut, debut, fin, commande_ref, created_at
    FROM abonnements
    LIMIT 5
  `)
  console.log('Sample rows:', sample.rows)

  await pool.end()
}

check()
