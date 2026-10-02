// Localise un écart d'hydratation : texte rendu serveur (JS désactivé) contre texte après hydratation, ligne à ligne.
// Usage : node scripts/audit/ux-parcours/15-hydratation-diff.js <chemin>
const { chromium } = require('playwright');
const p = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const lire = async (js) => {
    const ctx = await browser.newContext({ javaScriptEnabled: js, viewport: { width: 375, height: 812 }, locale: 'fr-FR' });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
    await page.goto('http://localhost:3001' + p, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(js ? 5000 : 500);
    const t = (await page.locator('main').first().innerText().catch(() => page.locator('body').innerText())).split('\n').map(s => s.trim()).filter(Boolean);
    await ctx.close();
    return { t, errs };
  };
  const ssr = await lire(false), csr = await lire(true);
  const a = new Set(ssr.t), b = new Set(csr.t);
  console.log(p, 'erreurs:', csr.errs.join(' | ') || 'aucune');
  console.log('  seulement serveur :', ssr.t.filter(x => !b.has(x)).slice(0, 12));
  console.log('  seulement client  :', csr.t.filter(x => !a.has(x)).slice(0, 12));
  await browser.close();
})();
