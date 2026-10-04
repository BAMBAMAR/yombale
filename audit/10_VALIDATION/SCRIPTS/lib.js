// AGENT 8 — bibliothèque commune de validation indépendante (aucune modification du code du projet).
// Usage : BACKEND_URL=http://localhost:4100 LABEL=after node audit/10_VALIDATION/SCRIPTS/val-fixNNN.js
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4100';
const LABEL = process.env.LABEL || 'after'; // before = HEAD 4c02372 (port 4101) ; after = arbre de travail corrigé (port 4100)
const JWT_SECRET = process.env.JWT_SECRET || 'audit-jwt-secret-not-prod';
const PREUVES = path.join(__dirname, '..', 'PREUVES');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PW = 'Audit!Pass2026x';
const RUN = Date.now().toString(36); // unicité par exécution

async function http(method, endpoint, body = null, token = null, extraHeaders = {}) {
  const headers = { 'X-Forwarded-For': `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`, ...extraHeaders };
  if (body !== null && body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}${endpoint}`, { method, headers, body: body !== null && body !== undefined ? JSON.stringify(body) : undefined });
  const ct = res.headers.get('content-type') || '';
  let data;
  let buf = null;
  if (ct.includes('application/pdf')) { buf = Buffer.from(await res.arrayBuffer()); data = { pdf_bytes: buf.length }; }
  else { const txt = await res.text(); try { data = JSON.parse(txt); } catch { data = txt.slice(0, 500); } }
  return { status: res.status, ms: Date.now() - t0, contentType: ct, data, buf };
}

function mkToken(userId, jwtVersion = 1, extra = {}) {
  return jwt.sign({ userId, jwtVersion, ...extra }, JWT_SECRET, { expiresIn: '1h' });
}

async function inscrire(prefix, extra = {}) {
  const email = `${prefix}.${RUN}@audit8.test`;
  const r = await http('POST', '/api/auth/inscription', { nom: `Audit8 ${prefix}`, email, mot_de_passe: PW, ...extra });
  return { email, ...r, token: r.data && r.data.token, user: r.data && r.data.user };
}

async function creerBoutique(token, nom, tel) {
  tel = `77${String(Math.floor(Math.random() * 9000000) + 1000000)}`;
  const r = await http('POST', '/api/boutiques', { nom, telephone: tel, ville: 'Dakar', categorie: 'mode' }, token);
  return { ...r, id: r.data && ((r.data.boutique && r.data.boutique.id) || r.data.id) };
}

async function abonnement(userId) {
  await pool.query(
    `INSERT INTO abonnements (utilisateur_id, plan, statut, fin, is_trial, prix_mensuel)
     VALUES ($1,'business','actif', NOW() + interval '30 days', false, 15000) ON CONFLICT DO NOTHING`, [userId]);
}

class Suite {
  constructor(fix) { this.fix = fix; this.tests = []; this.extra = {}; }
  // expected/observed : libres (sérialisés) ; pass : booléen (null = NON ÉVALUABLE)
  rec(id, titre, pass, expected, observed, note = '') {
    const status = pass === true ? 'PASS' : pass === false ? 'FAIL' : 'NOT EVALUABLE';
    this.tests.push({ id, titre, status, expected, observed, note });
    console.log(`[${this.fix}/${LABEL}] ${id} ${status} — ${titre}`);
  }
  save() {
    const dir = path.join(PREUVES, this.fix, LABEL, 'tests');
    fs.mkdirSync(dir, { recursive: true });
    const out = {
      session: process.env.AUDIT_SESSION || 'AUDIT-08-20261004-1150',
      fix: this.fix, label: LABEL, base_url: BASE_URL, date: new Date().toISOString(),
      resume: { total: this.tests.length, pass: this.tests.filter(t => t.status === 'PASS').length, fail: this.tests.filter(t => t.status === 'FAIL').length, na: this.tests.filter(t => t.status === 'NOT EVALUABLE').length },
      tests: this.tests, extra: this.extra,
    };
    const f = path.join(dir, `${this.fix}_validation${this.suffix || ''}_${LABEL}.json`);
    fs.writeFileSync(f, JSON.stringify(out, null, 2));
    console.log(`=> ${f}  (${out.resume.pass}/${out.resume.total} PASS, ${out.resume.fail} FAIL)`);
    return out;
  }
}

function saveEvidence(fix, sub, name, data) {
  const dir = path.join(PREUVES, fix, sub);
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, name);
  fs.writeFileSync(f, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 2));
  return f;
}

module.exports = { BASE_URL, LABEL, PW, RUN, pool, http, mkToken, inscrire, creerBoutique, abonnement, Suite, saveEvidence, PREUVES };
