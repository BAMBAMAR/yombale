// Rejeu AUD-108 / AUD-109 sur la pile isolÃ©e (backend :4100, base nopalou_audit).
// Usage : . scripts\audit\audit-env.ps1 ; powershell -File scripts\audit\start-stack.ps1 ; node scripts/audit/croissance/rejeu-paiement-initie.js
// NumÃ©ros factices 77000xxxx uniquement. Sort avec le code 1 si une assertion Ã©choue.
const { Pool } = require('pg');
const crypto = require('crypto');

if (!/127\.0\.0\.1:54329|localhost:54329/.test(process.env.DATABASE_URL || '')) {
  console.error('REFUS : base non isolÃ©e'); process.exit(2);
}
const API = 'http://127.0.0.1:4100/api';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let echecs = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'OK  ' : 'ECHEC'} ${msg}`); if (!cond) echecs++; };

async function post(path, body) {
  const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}

// DÃ©pose un OTP connu (l'envoi WhatsApp rÃ©el est neutralisÃ© dans cet environnement).
async function otpConnu(tel, action = 'boutique') {
  const code = '123456', sel = crypto.randomBytes(8).toString('hex');
  const hash = crypto.createHash('sha256').update(code + sel).digest('hex');
  await pool.query(`UPDATE auth_otp_phones SET utilise = TRUE WHERE telephone = $1`, [tel]);
  await pool.query(
    `INSERT INTO auth_otp_phones (telephone, action, code_hash, code_sel, expire_a) VALUES ($1,$2,$3,$4, NOW() + INTERVAL '10 minutes')`,
    [tel, action, hash, sel]);
  return code;
}
async function preuvePour(tel9) {
  const tel = '221' + tel9;
  const code = await otpConnu(tel);
  const r = await post('/auth/whatsapp-otp-verify', { telephone: tel, code, type: 'boutique' });
  return r.body.preuve_telephone;
}

async function get(path, token) {
  const r = await fetch(API + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
async function put(path, token, body) {
  const r = await fetch(API + path, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}

(async () => {
  const A = '77003' + Date.now().toString().slice(-4);
  const preuve = await preuvePour(A);
  const c = await post('/boutiques/taf-taf', { nom: 'Audit Paiement', telephone: A, preuve_telephone: preuve });
  const tok = c.body.token;
  const r = await fetch(API + '/abonnements/initier', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: JSON.stringify({ plan: 'pro', duree_mois: 1 }) });
  const j = await r.json();
  // Wave est neutralisé dans cet environnement : la route répond par le repli manuel et doit tracer l'échec
  ok(j.fallback_manuel === true, 'initiation Wave neutralisée → repli manuel renvoyé');
  const { rows } = await pool.query(`SELECT statut, plan, methode FROM paiements_inities WHERE reference = $1`, [j.reference]);
  ok(rows.length === 1 && rows[0].statut === 'echec_wave' && rows[0].plan === 'pro', `l'initiation est tracée (statut ${rows[0]?.statut})`);
  const { rows: idx } = await pool.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'paiements_inities'`);
  ok(idx.some(i => i.indexname === 'idx_paiements_inities_ref'), 'index unique sur la référence présent (migration appliquée)');
  await pool.end();
  console.log(echecs ? `\n${echecs} ECHEC(S)` : '\nTOUT OK');
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });