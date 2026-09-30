import { launch, BASE, swReady, cacheReport, state, out } from './lib.mjs';
const S = state(); const res = {};
const { browser, ctx, page, logs } = await launch();
// Suivi des noms de caches pendant l'installation du SW
await page.addInitScript(() => {
  window.__cacheNamesSeen = {}; window.__t0 = Date.now();
  const tick = async () => { try { for (const n of await caches.keys()) { if (!window.__cacheNamesSeen[n]) window.__cacheNamesSeen[n] = { firstSeenMs: Date.now() - window.__t0 }; } const now = new Set(await caches.keys()); for (const n of Object.keys(window.__cacheNamesSeen)) { if (!now.has(n) && !window.__cacheNamesSeen[n].goneMs) window.__cacheNamesSeen[n].goneMs = Date.now() - window.__t0; } } catch {} };
  setInterval(tick, 10);
});
const bad = []; page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace(BASE, '')); });
await page.goto(BASE + '/', { waitUntil: 'load' });
await swReady(page); await page.waitForTimeout(6000);
res.cacheNamesSeen_during_install = await page.evaluate(() => window.__cacheNamesSeen);
res.cacheNames_now = Object.keys(await cacheReport(page));
res.http_errors_first_load = bad.slice(0, 15);
// Après reload : chunks JS passent-ils par le SW ? sont-ils mis en cache ?
const js = []; page.on('response', r => { if (r.url().includes('/_next/static/chunks/')) js.push({ fromSW: r.fromServiceWorker() }); });
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(3000);
res.js_chunks_after_reload = { total: js.length, fromSW: js.filter(j => j.fromSW).length };
const cr = await cacheReport(page);
res.cache_counts_after_reload = Object.fromEntries(Object.entries(cr).map(([k, v]) => [k, v.length]));
res.js_in_any_cache = Object.values(cr).flat().filter(u => u.includes('/_next/static/chunks/')).length;
out(res); await browser.close();
