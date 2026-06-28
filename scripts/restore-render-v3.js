const { Pool } = require('pg')
const fs = require('fs')

const RENDER_URL = process.argv[2]
const SQL_FILE   = process.argv[3]

if (!RENDER_URL || !SQL_FILE) { console.error('Usage: node restore-render-v3.js <URL> <file.sql>'); process.exit(1) }

const pool = new Pool({ connectionString: RENDER_URL, ssl: { rejectUnauthorized: false } })

// Ordre d'insertion pour respecter les dépendances
const ORDER = ['categories', 'marchands', 'produits', 'offres', 'forfaits_telecom', 'annonces_immo', 'boutiques', 'alertes']

async function dropFK(client) {
  const fks = await client.query(`
    SELECT tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  `)
  for (const { table_name, constraint_name } of fks.rows) {
    try { await client.query(`ALTER TABLE "${table_name}" DROP CONSTRAINT IF EXISTS "${constraint_name}"`) } catch {}
  }
  console.log(`  Supprimé ${fks.rows.length} contraintes FK`)
}

async function restoreTable(client, name, inserts) {
  let ok = 0, skip = 0
  for (const stmt of inserts) {
    try { await client.query(stmt); ok++ } catch { skip++ }
  }
  return { ok, skip }
}

async function main() {
  console.log('🔌 Connexion à Render...')
  const client = await pool.connect()
  console.log('✅ Connecté\n')

  // Parser le fichier backup par table
  const sql = fs.readFileSync(SQL_FILE, 'utf8')
  const tables = {}
  const regex = /-- TABLE: (\w+) \((\d+) lignes\)\n([\s\S]*?)(?=\n-- TABLE:|\nSET session_replication_role)/g
  let m
  while ((m = regex.exec(sql)) !== null) {
    const inserts = m[3].match(/INSERT INTO[^;]+;/g) || []
    tables[m[1]] = { expected: parseInt(m[2]), inserts }
  }
  console.log(`Tables trouvées dans le backup : ${Object.keys(tables).join(', ')}\n`)

  // Vider les tables dans l'ordre inverse (pour éviter les FK)
  console.log('🗑️  Vidage des tables existantes...')
  for (const t of [...ORDER].reverse()) {
    try { await client.query(`TRUNCATE TABLE ${t} CASCADE`) } catch {}
  }

  // Supprimer toutes les FK
  console.log('🔓 Suppression temporaire des contraintes FK...')
  await dropFK(client)

  // Insérer dans le bon ordre
  console.log('\n📦 Restauration dans l\'ordre correct :')
  for (const t of ORDER) {
    if (!tables[t]) { console.log(`  ⏭  ${t}: pas dans le backup`); continue }
    const { expected, inserts } = tables[t]
    process.stdout.write(`  ${t} (${expected} attendues)... `)
    const { ok, skip } = await restoreTable(client, t, inserts)
    const icon = ok >= expected * 0.9 ? '✅' : ok > 0 ? '⚠️ ' : '❌'
    console.log(`${icon} ${ok} insérées, ${skip} ignorées`)
  }

  client.release()

  // Vérification finale
  console.log('\n📊 Vérification finale :')
  for (const t of ORDER) {
    try {
      const r = await pool.query(`SELECT COUNT(*) FROM ${t}`)
      console.log(`  ${t}: ${r.rows[0].count} lignes`)
    } catch {}
  }

  console.log('\n✅ Restore terminé !')
  await pool.end()
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
