// Suivi de commande public : saisie d'une référence / d'un téléphone, lecture du résultat (mobile).
// Usage : node scripts/audit/ux-parcours/04-suivi.js <capture.png> <valeur1> [valeur2 ...]
const { chromium } = require('playwright');
const [, , shot, ...vals] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, locale: 'fr-FR' });
  const page = await ctx.newPage();
  page.on('response', async r => { if (/\/api\/.*(suivi|track|commandes)/i.test(r.url())) console.log('API', r.request().method(), r.url().replace(/^https?:\/\/[^/]+/, ''), r.status()); });
  for (const v of vals) {
    await page.goto('http://localhost:3001/suivi-commande', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const inputs = page.locator('main input:visible');
    console.log('champs :', await inputs.evaluateAll(es => es.map(e => e.placeholder || e.name)));
    await inputs.first().fill(v);
    await inputs.first().press('Enter');
    await page.waitForTimeout(3000);
    const txt = await page.locator('main').innerText();
    console.log(`--- "${v}" ->\n` + txt.replace(/\n+/g, ' | ').slice(0, 700));
    await page.screenshot({ path: shot.replace('.png', `-${vals.indexOf(v)}.png`), fullPage: true });
  }
  await browser.close();
})();
