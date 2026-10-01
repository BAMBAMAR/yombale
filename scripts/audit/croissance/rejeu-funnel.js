// Rejeu AUD-108 / AUD-109 sur la pile isolÃ©e (backend :4100, base nopalou_audit).
// Usage : . scripts\audit\audit-env.ps1 ; powershell -File scripts\audit\start-stack.ps1 ; node scripts/audit/croissance/rejeu-funnel.js
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
  const sid = 'audit' + Date.now().toString(36);
  const ev = (b) => post('/analytics/funnel', b);
  let r = await ev({ type: 'wizard_etape', session_id: sid, etape: 1, plan: 'decouverte', utm_source: 'tiktok' });
  ok(r.status === 200, 'AUD-116 événement wizard_etape accepté sans boutique ni authentification');
  await ev({ type: 'wizard_etape', session_id: sid, etape: 2, utm_source: 'tiktok' });
  await ev({ type: 'wizard_cree', session_id: sid, plan: 'decouverte', utm_source: 'tiktok' });
  const autre = 'audit2' + Date.now().toString(36);
  await ev({ type: 'wizard_etape', session_id: autre, etape: 1 });
  r = await ev({ type: 'inconnu', session_id: sid });
  ok(r.status === 400, 'type inconnu refusé');
  r = await ev({ type: 'tarifs_vue', session_id: 'x' });
  ok(r.status === 400, 'identifiant de session invalide refusé');

  const res = await fetch(API + '/analytics/funnel/resume?jours=7', { headers: { 'X-Admin-Secret': process.env.ADMIN_SECRET } });
  ok(res.status === 200, `synthèse admin accessible avec le secret admin (HTTP ${res.status})`);
  const j = await res.json();
  const etape1 = (j.etapes || []).find(e => e.type === 'wizard_etape' && e.etape === 1);
  ok(etape1 && etape1.sessions >= 2, `étape 1 : ${etape1 && etape1.sessions} session(s) distincte(s)`);
  const tt = (j.sources || []).find(s => s.source === 'tiktok');
  ok(tt && tt.sessions >= 1 && tt.boutiques_creees >= 1, 'la source tiktok est rattachée à une boutique créée');

  const sans = await fetch(API + '/analytics/funnel/resume');
  ok(sans.status === 401 || sans.status === 403, `synthèse refusée sans authentification admin (HTTP ${sans.status})`);

  await pool.end();
  console.log(echecs ? `\n${echecs} ECHEC(S)` : '\nTOUT OK');
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });