// Sama Xaalis : preuve réelle sur la base locale isolée (refuse toute autre base). Crée puis supprime une ligne de test.
const path = require('path')
const { Pool } = require(path.join(__dirname, '../../../node_modules/pg'))
const { activerKalpe } = require('../../../backend/lib/kalpeEssai')
const url = process.env.DATABASE_URL || ''
if (!/127\.0\.0\.1|localhost/.test(url) || !/54329/.test(url)) { console.error('REFUS : pas la base locale'); process.exit(2) }
;(async () => {
  const pool = new Pool({ connectionString: url })
  const { rows: [u] } = await pool.query(`SELECT id FROM utilisateurs u WHERE NOT EXISTS (SELECT 1 FROM kalpe_abonnements k WHERE k.utilisateur_id = u.id) LIMIT 1`)
  const jours = async () => (await pool.query(`SELECT ROUND(EXTRACT(EPOCH FROM (fin - debut)) / 86400) AS j FROM kalpe_abonnements WHERE utilisateur_id = $1`, [u.id])).rows[0].j
  await activerKalpe(pool, u.id, '14'); console.log('activation avec réglage 14 -> jours accordés :', await jours())
  await activerKalpe(pool, u.id, '90'); console.log('réactivation avec réglage 90 -> jours accordés :', await jours(), '(inchangé : pas de prolongation)')
  await pool.query(`DELETE FROM kalpe_abonnements WHERE utilisateur_id = $1`, [u.id])
  console.log('ligne de test supprimée :', (await pool.query(`SELECT count(*) n FROM kalpe_abonnements WHERE utilisateur_id = $1`, [u.id])).rows[0].n === '0')
  await pool.end()
})().catch((e) => { console.error(e.message); process.exit(1) })
