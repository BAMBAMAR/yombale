// Rejeu AUD-108 / AUD-109 sur la pile isolée (backend :4100, base nopalou_audit).
// Usage : . scripts\audit\audit-env.ps1 ; powershell -File scripts\audit\start-stack.ps1 ; node scripts/audit/croissance/rejeu-taf-taf.js
// Numéros factices 77000xxxx uniquement. Sort avec le code 1 si une assertion échoue.
const { Pool } = require('pg');
const crypto = require('crypto');

if (!/127\.0\.0\.1:54329|localhost:54329/.test(process.env.DATABASE_URL || '')) {
  console.error('REFUS : base non isolée'); process.exit(2);
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

// Dépose un OTP connu (l'envoi WhatsApp réel est neutralisé dans cet environnement).
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

(async () => {
  const stamp = Date.now().toString().slice(-4);
  const A = '77000' + stamp; // 9 chiffres
  const B = '77001' + stamp;

  // --- AUD-108 ---
  let r = await post('/boutiques/taf-taf', { nom: 'Audit A', telephone: A });
  ok(r.status === 401 && !r.body.token, 'AUD-108 sans preuve : 401 et aucun jeton');

  const preuveA = await preuvePour(A);
  ok(!!preuveA, 'AUD-108 whatsapp-otp-verify (type boutique) renvoie une preuve');

  r = await post('/boutiques/taf-taf', { nom: 'Audit A', telephone: A, preuve_telephone: preuveA });
  ok(r.status === 200 && !!r.body.token && !!r.body.boutiqueId, 'AUD-108 avec preuve : boutique créée et session émise');
  const boutiqueA = r.body.boutiqueId;

  const preuveB = await preuvePour(B);
  r = await post('/boutiques/taf-taf', { nom: 'Usurpation', telephone: A, preuve_telephone: preuveB });
  ok(r.status === 401 && !r.body.token, 'AUD-108 preuve d\'un autre numéro refusée (pas de jeton pour le compte A)');

  const { rows: [uA] } = await pool.query(`SELECT id, email FROM utilisateurs WHERE telephone LIKE '%' || $1`, [A]);
  r = await post('/boutiques/taf-taf', { nom: 'Usurpation par email', telephone: B, email: uA.email, preuve_telephone: preuveB });
  const payload = r.body.token ? JSON.parse(Buffer.from(r.body.token.split('.')[1], 'base64url').toString()) : {};
  ok(r.status === 200 && payload.userId !== uA.id, 'AUD-108 un e-mail connu ne donne pas le compte d\'un tiers');

  // --- AUD-109 ---
  r = await post('/boutiques/taf-taf', { nom: 'Audit A', telephone: A, preuve_telephone: preuveA });
  ok(r.body.deja_existante === true && r.body.boutiqueId === boutiqueA, 'AUD-109 rejeu du wizard : même boutique renvoyée');

  r = await post('/boutiques/taf-taf', { nom: 'Audit A bis', telephone: A, preuve_telephone: preuveA });
  const { rows: abos } = await pool.query(`SELECT statut, is_trial FROM abonnements WHERE utilisateur_id = $1`, [uA.id]);
  ok(abos.length === 1 && abos[0].statut === 'actif', `AUD-109 une seule ligne d'essai active après 3 appels (lignes: ${abos.length})`);

  // abonnement payant actif : jamais annulé
  await pool.query(`UPDATE abonnements SET is_trial = FALSE, plan = 'pro' WHERE utilisateur_id = $1`, [uA.id]);
  await post('/boutiques/taf-taf', { nom: 'Audit A ter', telephone: A, preuve_telephone: preuveA });
  const { rows: apres } = await pool.query(`SELECT statut, plan FROM abonnements WHERE utilisateur_id = $1`, [uA.id]);
  ok(apres.length === 1 && apres[0].statut === 'actif' && apres[0].plan === 'pro', 'AUD-109 un abonnement payant actif n\'est ni annulé ni remplacé');

  await pool.end();
  console.log(echecs ? `\n${echecs} ECHEC(S)` : '\nTOUT OK');
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
