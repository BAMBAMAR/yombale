import { launch, BASE, swReady, cacheReport, visitOffline, state, out } from './lib.mjs';
const S = state(); const res = { };
const { browser, ctx, page, logs } = await launch();
await page.goto(BASE + '/', { waitUntil: 'load' });
res.sw_after_first_load = await swReady(page);
await page.reload({ waitUntil: 'load' });
res.sw_after_reload = await swReady(page);
// Pages à visiter en ligne (mise en cache par le SW)
const slug = S.M.boutique.slug, pid = S.prod.A.id;
const visited = ['/', '/boutiques', `/boutiques/${slug}`, `/boutiques/${slug}/produits/${pid}`, '/recherche?q=robe', '/tarifs-boutique'];
for (const u of visited) { await page.goto(BASE + u, { waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(2500); }
const cr = await cacheReport(page);
res.caches = Object.fromEntries(Object.entries(cr).map(([k, v]) => [k, v.length]));
res.html_cached = (cr['nopalou-html-cache-v29'] || []);
res.api_cached = (cr['nopalou-api-cache-v29'] || []).slice(0, 25);
res.precache_names = Object.keys(cr).filter(k => /precache/.test(k));
// Hors-ligne
await ctx.setOffline(true);
res.offline = [];
for (const [u, t] of [['/', null], ['/boutiques', null], [`/boutiques/${slug}`, 'Robe Bazin Off'], [`/boutiques/${slug}/produits/${pid}`, 'Robe Bazin Off'], ['/recherche?q=robe', null], ['/recherche?q=boubou', null], ['/tarifs-boutique', null], ['/immo', null], ['/annonces', null]]) res.offline.push(await visitOffline(page, u, t));
out(res); console.log('console:', logs.slice(0, 10)); await browser.close();

