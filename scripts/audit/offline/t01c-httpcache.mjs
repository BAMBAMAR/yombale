import { launch, BASE, swReady, state, out } from './lib.mjs';
const S = state(); const res = {}; const slug = S.M.boutique.slug, pid = S.prod.A.id;
const { browser, ctx, page, logs } = await launch();
await page.goto(BASE + '/', { waitUntil: 'load' }); await swReady(page); await page.reload({ waitUntil: 'load' });
const url = `/boutiques/${slug}/produits/${pid}`;
await page.goto(BASE + url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
res.buttons_online = await page.$$eval('button', bs => bs.map(b => b.innerText.trim()).filter(Boolean).slice(0, 12));
// Cas A : hors-ligne, cache HTTP intact
await ctx.setOffline(true);
await page.goto(BASE + url, { waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(2500);
const add = page.getByRole('button', { name: /ajouter au panier/i }).first();
res.A_http_cache_intact = { addButtonVisible: await add.isVisible().catch(() => false) };
if (res.A_http_cache_intact.addButtonVisible) { await add.click().catch(() => {}); await page.waitForTimeout(800); res.A_http_cache_intact.cartStorage = await page.evaluate(() => localStorage.getItem('nopalou_carts')); }
// Cas B : cache HTTP vidé (éviction mobile, « vider le cache »), toujours hors-ligne
await page.evaluate(() => localStorage.removeItem('nopalou_carts'));
const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.clearBrowserCache');
const failed = []; page.on('requestfailed', r => { if (r.url().includes('/_next/')) failed.push(r.url().replace(BASE, '').slice(0, 70)); });
const resp = []; page.on('response', r => { if (r.url().includes('/_next/static/chunks/')) resp.push(r.status()); });
await page.goto(BASE + url, { waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(3000);
const add2 = page.getByRole('button', { name: /ajouter au panier/i }).first();
res.B_http_cache_cleared = { htmlStillServed: (await page.title()).length > 0, title: await page.title(), addButtonVisible: await add2.isVisible().catch(() => false), chunkResponses: resp.length, chunkFailed: failed.length };
if (res.B_http_cache_cleared.addButtonVisible) { await add2.click().catch(() => {}); await page.waitForTimeout(1000); res.B_http_cache_cleared.cartStorage = await page.evaluate(() => localStorage.getItem('nopalou_carts')); res.B_http_cache_cleared.drawerOpen = await page.getByText(/votre panier|mon panier/i).first().isVisible().catch(() => false); }
out(res); await browser.close();
