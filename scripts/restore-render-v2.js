const { Pool } = require('pg')
const fs = require('fs')

const RENDER_URL = process.argv[2]
const SQL_FILE   = process.argv[3]

if (!RENDER_URL || !SQL_FILE) {
  console.error('Usage: node restore-render-v2.js <RENDER_URL> <backup.sql>')
  process.exit(1)
}

const pool = new Pool({ connectionString: RENDER_URL, ssl: { rejectUnauthorized: false } })

async function restoreTable(client, name, inserts) {
  // Désactiver les triggers/FK sur cette table
  try { await client.query(`ALTER TABLE ${name} DISABLE TRIGGER ALL`) } catch {}

  let ok = 0, skip = 0
  for (const stmt of inserts) {
    try {
      await client.query(stmt)
      ok++
    } catch { skip++ }
  }

  try { await client.query(`ALTER TABLE ${name} ENABLE TRIGGER ALL`) } catch {}
  return { ok, skip }
}

async function main() {
  console.log('🔌 Connexion à Render...')
  const client = await pool.connect()
  console.log('✅ Connecté\n')

  // Désactiver les FK globalement
  await client.query("SET session_replication_role = 'replica'")

  const sql = fs.readFileSync(SQL_FILE, 'utf8')

  // Parser le fichier par blocs TABLE
  const regex = /-- TABLE: (\w+) \((\d+) lignes\)\n([\s\S]*?)(?=\n-- TABLE:|\nSET session_replication_role)/g
  let match
  const stats = {}

  while ((match = regex.exec(sql)) !== null) {
    const [, tableName, expected, block] = match
    const inserts = block.match(/INSERT INTO[^;]+;/g) || []
    process.stdout.write(`📦 ${tableName} (${expected} lignes attendues)... `)
    const { ok, skip } = await restoreTable(client, tableName, inserts)
    console.log(`✅ ${ok} insérées, ${skip} ignorées`)
    stats[tableName] = { ok, skip, expected: parseInt(expected) }
  }

  await client.query("SET session_replication_role = 'origin'")
  client.release()

  console.log('\n📊 Résumé final :')
  for (const [t, s] of Object.entries(stats)) {
    const pct = s.expected > 0 ? Math.round(s.ok / s.expected * 100) : 0
    const icon = pct >= 90 ? '✅' : pct >= 50 ? '⚠️ ' : '❌'
    console.log(`  ${icon} ${t}: ${s.ok}/${s.expected} (${pct}%)`)
  }

  console.log('\n✅ Restore terminé !')
  await pool.end()
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
