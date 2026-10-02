// Activité réseau après chargement (mobile) : requêtes émises entre 3 s et 23 s, regroupées par URL ; poids total transféré.
// Usage : node scripts/audit/ux-parcours/16-reseau-continu.js <chemin>
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, locale: 'fr-FR' });
  const page = await ctx.newPage();
  const t0 = Date.now(); const tard = {}; let octets = 0; let nb = 0; const pend = new Set();
  page.on('request', r => { pend.add(r); const t = Date.now() - t0; if (t > 3000) { const k = r.method() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*/, '').slice(0, 90); tard[k] = (tard[k] || 0) + 1; } });
  page.on('requestfinished', async r => { pend.delete(r); nb++; try { const s = await r.sizes(); octets += s.responseBodySize + s.responseHeadersSize; } catch {} });
  page.on('requestfailed', r => { pend.delete(r); const k = 'ÉCHEC ' + r.url().slice(0, 90) + ' ' + (r.failure() || {}).errorText; tard[k] = (tard[k] || 0) + 1; });
  await page.goto('http://localhost:3001' + process.argv[2], { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(23000);
  console.log(process.argv[2], `: ${nb} requêtes terminées, ${(octets / 1024).toFixed(0)} Ko ; encore en vol à 23 s :`, [...pend].map(r => r.url().slice(0, 90)));
  console.log('requêtes après 3 s :', tard);
  await browser.close();
})();
