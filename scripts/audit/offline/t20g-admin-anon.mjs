import { launch, BASE, out } from './lib.mjs';
const T = process.env.AUDIT_TMP; const { browser, page } = await launch();
const res = {};
for (const u of ['/admin', '/admin/produits', '/admin/comptes']) {
  const r = await page.goto(BASE + u, { waitUntil: 'load' }); await page.waitForTimeout(3500);
  const t = (await page.evaluate(() => document.querySelector('main')?.innerText || document.body.innerText)).replace(/\s+/g, ' ');
  res[u] = { http: r.status(), url_finale: page.url().replace(BASE, ''), titre: await page.title(), extrait_visible: t.slice(0, 260) };
}
await page.goto(BASE + '/admin', { waitUntil: 'load' }); await page.waitForTimeout(3000); await page.screenshot({ path: T + '/admin-anon.png' });
out(res); await browser.close();
