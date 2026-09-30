const fs = require('fs'); const path = require('path');
const B = 'http://localhost:4100';
async function j(method, url, body, token, extraHeaders = {}) {
  const r = await fetch(B + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}), ...extraHeaders }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let d; try { d = JSON.parse(t); } catch { d = t; }
  return { s: r.status, d };
}
const { Client } = require('../../../node_modules/pg');
async function db() {
  const pw = fs.readFileSync(path.join(__dirname,'..','.local','pgpass.txt'), 'utf8').trim();
  const c = new Client({ connectionString: `postgresql://postgres:${pw}@127.0.0.1:54329/nopalou_audit`, ssl: false });
  await c.connect(); return c;
}
const STATE = path.join(__dirname,'..','.local','commerce-state.json');
const load = () => JSON.parse(fs.readFileSync(STATE, 'utf8'));
const save = (o) => fs.writeFileSync(STATE, JSON.stringify(o, null, 1));
module.exports = { j, db, load, save, B };
