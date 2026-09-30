import { launch, BASE, login, state, readIDB, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = { poll: [] };
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id;
const { browser, ctx, page } = await launch();
await ctx.addInitScript(() => { window.open = () => null; window.print = () => {}; });
await ctx.addInitScript(() => { window.__idbLog = []; const t0 = Date.now(); const P = IDBObjectStore.prototype.put, D = IDBObjectStore.prototype.delete; IDBObjectStore.prototype.put = function (v, k) { if (this.name === 'ventes_queue') window.__idbLog.push((Date.now() - t0) + ' PUT ' + (v && v.id_temporaire) + ' status=' + (v && v.status)); return P.apply(this, arguments); }; IDBObjectStore.prototype.delete = function (k) { if (this.name === 'ventes_queue') window.__idbLog.push((Date.now() - t0) + ' DELETE ' + k); return D.apply(this, arguments); }; });
const reqs = []; page.on('request', r => { if (/pos-vente|credits-clients|pos-sessions|depenses/.test(r.url()) && r.method() === 'POST') reqs.push(Date.now() + ' ' + r.method() + ' ' + r.url().replace(BASE, '')); });
await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
const nBase = sql(`SELECT count(*) n FROM ventes WHERE boutique_id='${bid}'`)[0].n;
await ctx.setOffline(true); await page.waitForTimeout(4500);
const vente = async (nom, n = 1) => { for (let i = 0; i < n; i++) { await page.getByText(nom).first().click(); await page.waitForTimeout(250); } await page.getByRole('button', { name: /Encaisser/ }).first().click(); await page.waitForTimeout(2200); };
await vente('Boubou Off'); await vente('Boubou Off'); await vente('Boubou Off');
const q = await readIDB(page, ['ventes_queue']); res.offline_queue = q.ventes_queue.length;
await ctx.setOffline(false); const t0 = Date.now();
for (let i = 0; i < 40; i++) { await page.waitForTimeout(1000); const r = await readIDB(page, ['ventes_queue']); res.poll.push(`${Date.now() - t0}ms ${r.ventes_queue.map(v => v.status).join(',') || '(vide)'}`); if (!r.ventes_queue.length) break; }
res.poll = res.poll.filter((x, i, a) => i === 0 || i === a.length - 1 || x.split(' ')[1] !== a[i - 1].split(' ')[1]);
res.posts_sync = reqs;
res.ventes_ajoutees_en_base = Number(sql(`SELECT count(*) n FROM ventes WHERE boutique_id='${bid}'`)[0].n) - Number(nBase);
res.doublons = sql(`SELECT reference, count(*) FROM ventes WHERE boutique_id='${bid}' GROUP BY reference HAVING count(*) > 1`);
res.idb_log = (await page.evaluate(() => window.__idbLog)).slice(-14);
out(res); await browser.close();

