import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const q = async (sql) => (await pool.query(sql)).rows

async function run() {
  try {
    const tables = await q(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`)
    console.log('=== TABLES ===', tables.map(r => r.tablename).join(', '))

    // Agences immo
    try {
      const ag = await q(`SELECT COUNT(*) as total, 
        COUNT(CASE WHEN sponsoring_actif = true THEN 1 END) as avec_sponsoring,
        COUNT(CASE WHEN multi_agence_actif = true THEN 1 END) as multi_agence
        FROM agences_immo`)
      console.log('=== AGENCES IMMO ===', JSON.stringify(ag, null, 2))
    } catch(e) { console.log('agences_immo error:', e.message) }

    // Boutiques
    try {
      const bq = await q(`SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as actives FROM boutiques`)
      console.log('=== BOUTIQUES ===', JSON.stringify(bq, null, 2))
    } catch(e) { console.log('boutiques error:', e.message) }

    // Plans
    try {
      const pl = await q(`SELECT * FROM plans ORDER BY prix_mensuel`)
      console.log('=== PLANS DB ===', JSON.stringify(pl, null, 2))
    } catch(e) { console.log('plans error:', e.message) }

    // Users total
    try {
      const us = await q(`SELECT COUNT(*) as total_users FROM utilisateurs`)
      console.log('=== USERS ===', JSON.stringify(us, null, 2))
    } catch(e) { console.log('utilisateurs error:', e.message) }

    // Annonces
    try {
      const ann = await q(`SELECT COUNT(*) as total, COUNT(CASE WHEN est_payante = true THEN 1 END) as payantes, COUNT(CASE WHEN est_sponsorisee = true THEN 1 END) as sponsorisees FROM annonces`)
      console.log('=== ANNONCES ===', JSON.stringify(ann, null, 2))
    } catch(e) { console.log('annonces error:', e.message) }

    // Settings
    try {
      const s = await q(`SELECT * FROM settings LIMIT 50`)
      console.log('=== SETTINGS ===', JSON.stringify(s, null, 2))
    } catch(e) { console.log('settings error:', e.message) }

    // Abonnements boutique actifs  
    try {
      const ab = await q(`SELECT plan, statut, COUNT(*) as nb FROM abonnements WHERE statut = 'actif' AND date_fin > NOW() GROUP BY plan, statut ORDER BY plan`)
      console.log('=== ABONNEMENTS ACTIFS NON EXPIRES ===', JSON.stringify(ab, null, 2))
    } catch(e) { console.log('abonnements error:', e.message) }

    // Abonnements agences immo
    try {
      const aba = await q(`SELECT plan, statut, COUNT(*) as nb FROM abonnements_immo WHERE statut = 'actif' GROUP BY plan, statut`)
      console.log('=== ABONNEMENTS IMMO ACTIFS ===', JSON.stringify(aba, null, 2))
    } catch(e) { console.log('abonnements_immo error:', e.message) }

    // Paiements manuels en attente
    try {
      const pm = await q(`SELECT * FROM paiements_manuels WHERE statut = 'en_attente' ORDER BY created_at DESC LIMIT 5`)
      console.log('=== PAIEMENTS MANUELS EN ATTENTE ===', JSON.stringify(pm, null, 2))
    } catch(e) { console.log('paiements_manuels error:', e.message) }

  } catch(e) {
    console.error('FATAL:', e.message)
  } finally {
    await pool.end()
  }
}

run()
