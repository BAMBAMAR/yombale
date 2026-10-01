// Requetes de lecture seule sur la copie locale nopalou_audit_data (garde: audit-env.ps1)
const path = require('path')
const { Pool } = require(path.join(__dirname, '../../../node_modules/pg'))
const url = process.env.DATABASE_URL
if (!/localhost|127\.0\.0\.1/.test(url || '') || !/54329/.test(url)) { console.error('REFUS: pas la base locale', (url||'').replace(/:[^:@]*@/, ':***@')); process.exit(2) }
const pool = new Pool({ connectionString: url })
const queries = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8').replace(/^ï»¿/, ''))
;(async () => {
  for (const [label, sql] of Object.entries(queries)) {
    try { const r = await pool.query(sql); console.log('## ' + label); console.table(r.rows.slice(0, 40)) } catch (e) { console.log('## ' + label + ' ERR ' + e.message) }
  }
  await pool.end()
})()

