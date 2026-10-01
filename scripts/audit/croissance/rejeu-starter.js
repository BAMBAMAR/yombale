// Rejeu AUD-108 / AUD-109 sur la pile isolÃ©e (backend :4100, base nopalou_audit).
// Usage : . scripts\audit\audit-env.ps1 ; powershell -File scripts\audit\start-stack.ps1 ; node scripts/audit/croissance/rejeu-starter.js
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
  const A = '77002' + Date.now().toString().slice(-4);
  const preuve = await preuvePour(A);
  const c = await post('/boutiques/taf-taf', { nom: 'Audit Starter', telephone: A, categorie: 'Alimentation', preuve_telephone: preuve });
  ok(c.status === 200 && !!c.body.boutiqueId, 'boutique créée avec pack de démarrage');
  const id = c.body.boutiqueId, tok = c.body.token;

  const prive = await get(`/boutiques/${id}/produits`, tok);
  const nbPrive = (prive.body.produits || []).length;
  ok(nbPrive >= 3 && prive.body.produits.every(p => p.statut_moderation === 'exemple'), `le marchand voit ${nbPrive} articles, tous « exemple »`);

  const public_ = await get(`/boutiques/${id}/produits`);
  ok((public_.body.produits || []).length === 0, 'le public ne voit aucun article d\'exemple');

  const premier = prive.body.produits[0];
  const pub = await put(`/boutiques/${id}/produits/${premier.id}`, tok, { nom: 'Riz parfumé 25 kg', prix: 18000, stock_quantite: 12 });
  ok(pub.status === 200 && pub.body.produit?.statut_moderation === 'actif', 'modifier un exemple le publie (statut actif)');

  const apres = await get(`/boutiques/${id}/produits`);
  ok((apres.body.produits || []).length === 1, 'le public voit uniquement l\'article modifié');

  const { rows: [n] } = await pool.query(`SELECT COUNT(*) FILTER (WHERE COALESCE(statut_moderation,'actif') <> 'exemple')::int reels FROM boutique_produits WHERE boutique_id = $1`, [id]);
  ok(n.reels === 1, 'indicateur « produits réels » = 1 (les exemples ne comptent pas)');

  await pool.end();
  console.log(echecs ? `\n${echecs} ECHEC(S)` : '\nTOUT OK');
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
