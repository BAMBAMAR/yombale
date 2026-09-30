import { launch, BASE, login, state, readIDB, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
const S = state(); const all = [];
for (const variante of ['TEL_QUEL', 'ECOUTEUR_RELOAD_NEUTRALISE']) for (let run = 1; run <= 3; run++) {
  const { browser, ctx, page } = await launch();
  await ctx.addInitScript((neutraliser) => {
    window.open = () => null; window.print = () => {};
    if (neutraliser) { const A = window.addEventListener; window.addEventListener = function (t, h, o) { if (t === 'online' && String(h).includes('location.reload')) return; return A.call(this, t, h, o); }; }
  }, variante === 'ECOUTEUR_RELOAD_NEUTRALISE');
  const nav = []; const cdp = await ctx.newCDPSession(page); await cdp.send('Page.enable'); cdp.on('Page.frameRequestedNavigation', e => nav.push(e.reason));
  await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
  await ctx.setOffline(true); await page.waitForTimeout(4500);
  await page.getByText('T-Shirt Coton').first().click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: /Encaisser/ }).first().click(); await page.waitForTimeout(2200);
  nav.length = 0; await ctx.setOffline(false); await page.waitForTimeout(9000);
  all.push({ variante, run, recharges: nav.length, file_apres_9s: (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => v.status) });
  await browser.close();
}
out(all);
