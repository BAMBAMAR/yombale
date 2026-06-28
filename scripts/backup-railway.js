// Export des tables critiques de Railway vers un fichier SQL
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const DB_URL = process.argv[2]
if (!DB_URL) { console.error('Usage: node backup-railway.js <DATABASE_URL>'); process.exit(1) }

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })

// Tables critiques (données utilisateurs, non-scrapables)
const TABLES_CRITIQUES = ['users', 'annonces', 'annonces_immo', 'boutiques', 'alertes', 'paiements']
// Tables scrapables (optionnel, volumineuses)
const TABLES_OPTIONNELLES = ['produits', 'offres', 'marchands', 'categories', 'forfaits_telecom']

async function getTableCount(table) {
  try {
    const r = await pool.query(`SELECT COUNT(*) FROM ${table}`)
    return parseInt(r.rows[0].count)
  } catch { return -1 }
}

async function exportTable(table, outStream) {
  try {
    const r = await pool.query(`SELECT * FROM ${table}`)
    if (!r.rows.length) { console.log(`  ${table}: vide — skip`); return 0 }

    outStream.write(`\n-- TABLE: ${table} (${r.rows.length} lignes)\n`)

    // Générer les INSERT
    for (const row of r.rows) {
      const cols = Object.keys(row).map(c => `"${c}"`).join(', ')
      const vals = Object.values(row).map(v => {
        if (v === null) return 'NULL'
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
        if (typeof v === 'number') return v
        if (v instanceof Date) return `'${v.toISOString()}'`
        if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`
        return `'${String(v).replace(/'/g, "''")}'`
      }).join(', ')
      outStream.write(`INSERT INTO ${table} (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`)
    }
    console.log(`  ✅ ${table}: ${r.rows.length} lignes exportées`)
    return r.rows.length
  } catch (err) {
    console.log(`  ⚠️  ${table}: ${err.message}`)
    return 0
  }
}

async function main() {
  console.log('🔌 Connexion à Railway...')
  await pool.query('SELECT 1')
  console.log('✅ Connecté\n')

  // Inventaire
  console.log('📊 Inventaire des tables :')
  for (const t of [...TABLES_CRITIQUES, ...TABLES_OPTIONNELLES]) {
    const n = await getTableCount(t)
    if (n >= 0) console.log(`   ${t}: ${n} lignes`)
  }

  const outPath = path.join(__dirname, '..', `backup-railway-${new Date().toISOString().slice(0,10)}.sql`)
  const out = fs.createWriteStream(outPath)

  out.write(`-- Backup Nopalou depuis Railway\n-- Date: ${new Date().toISOString()}\n`)
  out.write(`SET session_replication_role = 'replica';\n\n`)

  console.log('\n📦 Export tables critiques (utilisateurs, annonces, boutiques) :')
  for (const t of TABLES_CRITIQUES) await exportTable(t, out)

  console.log('\n📦 Export tables scrapables (optionnel) :')
  for (const t of TABLES_OPTIONNELLES) await exportTable(t, out)

  out.write(`\nSET session_replication_role = 'origin';\n`)
  out.end()

  console.log(`\n✅ Backup sauvegardé : ${outPath}`)
  await pool.end()
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
