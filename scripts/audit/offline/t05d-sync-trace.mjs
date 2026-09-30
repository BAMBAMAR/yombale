import { launch, BASE, login, state, readIDB, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
const S = state(); const all = [];
for (let run = 1; run <= 3; run++) {
  const { browser, ctx, page } = await launch();
  await ctx.addInitScript(() => {
    window.open = () => null; window.print = () => {};
    window.__log = []; const t0 = Date.now(); const L = (m) => window.__log.push((Date.now() - t0) + ' ' + m);
    const F = window.fetch; window.fetch = async function (u, o) { const url = String(u && u.url || u); const isSync = /pos-vente/.test(url) && o && o.method === 'POST'; if (isSync) L('FETCH start'); try { const r = await F.apply(this, arguments); if (isSync) { L('FETCH resp ' + r.status); r.clone().text().then(t => L('BODY ' + t.slice(0, 80))).catch(e => L('BODY err ' + e)); } return r; } catch (e) { if (isSync) L('FETCH throw ' + e); throw e; } };
    const P = IDBObjectStore.prototype.put, D = IDBObjectStore.prototype.delete;
    IDBObjectStore.prototype.put = function (v) { if (this.name === 'ventes_queue') { L('IDB put status=' + v.status); } return P.apply(this, arguments); };
    IDBObjectStore.prototype.delete = function (k) { if (this.name === 'ventes_queue') { L('IDB delete'); const r = D.apply(this, arguments); r.onerror = () => L('IDB delete ERROR'); r.onsuccess = () => L('IDB delete ok'); return r; } return D.apply(this, arguments); };
  });
  await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
  await ctx.setOffline(true); await page.waitForTimeout(4500);
  await page.getByText('T-Shirt Coton').first().click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: /Encaisser/ }).first().click(); await page.waitForTimeout(2200);
  await ctx.setOffline(false); await page.waitForTimeout(8000);
  const q = (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => v.status);
  all.push({ run, file_apres_8s: q, journal: (await page.evaluate(() => window.__log)).filter(x => !/FETCH start$/.test('')).slice(-12) });
  await browser.close();
}
out(all);

