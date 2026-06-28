const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const RENDER_URL = process.argv[2]
const SQL_FILE  = process.argv[3]

if (!RENDER_URL || !SQL_FILE) {
  console.error('Usage: node restore-render.js <RENDER_URL> <backup.sql>')
  process.exit(1)
}

const pool = new Pool({ connectionString: RENDER_URL, ssl: { rejectUnauthorized: false } })

async function main() {
  console.log('🔌 Connexion à Render...')
  await pool.query('SELECT 1')
  console.log('✅ Connecté\n')

  const sql = fs.readFileSync(SQL_FILE, 'utf8')

  // Découper par table
  const blocks = sql.split(/\n-- TABLE: (\w+)/).filter(Boolean)

  let table = null
  let inserted = 0, errors = 0

  for (const block of blocks) {
    // Détecte si c'est un nom de table
    if (/^\w+$/.test(block.trim()) && !block.includes('\n')) {
      table = block.trim()
      console.log(`\n📦 Restauration : ${table}`)
      inserted = 0; errors = 0
      continue
    }

    // Extraire les INSERT un par un
    const inserts = block.match(/INSERT INTO [^\n]+;/g) || []
    for (const stmt of inserts) {
      try {
        await pool.query(stmt)
        inserted++
      } catch (err) {
        // Ignorer les doublons (ON CONFLICT DO NOTHING) et autres erreurs mineures
        if (!err.message.includes('duplicate') && !err.message.includes('unique')) {
          errors++
          if (errors <= 3) console.log(`  ⚠️  ${err.message.slice(0, 80)}`)
        }
      }
    }
    if (table && inserts.length) {
      console.log(`  ✅ ${inserted} lignes insérées, ${errors} erreurs`)
    }
  }

  console.log('\n✅ Restore terminé !')
  await pool.end()
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
