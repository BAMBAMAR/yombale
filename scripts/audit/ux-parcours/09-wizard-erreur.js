// Assistant boutique, étape 2 (mobile) : message d'erreur après « Continuer » — texte, position dans l'écran, réponse API OTP.
// Usage : node scripts/audit/ux-parcours/09-wizard-erreur.js <capture.png> <state.json> <telephone>
const { chromium } = require('playwright');
const [, , shot, state, tel] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR', storageState: state })).newPage();
  page.on('response', async r => { if (/whatsapp-otp/.test(r.url())) console.log('API', r.url().replace(/^https?:\/\/[^/]+/, ''), r.status(), (await r.text().catch(() => '')).slice(0, 200)); });
  await page.goto('http://localhost:3001/creer-boutique', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.locator('main input').first().fill('Awa Mode Audit');
  await page.locator('main button', { hasText: 'Continuer' }).click();
  await page.waitForTimeout(1500);
  await page.locator('main input[type=tel]').fill(tel);
  // le clavier mobile et le défilement amènent le bouton à l'écran, comme pour un vrai utilisateur
  await page.locator('main button', { hasText: 'Continuer' }).scrollIntoViewIfNeeded();
  await page.locator('main button', { hasText: 'Continuer' }).tap();
  await page.waitForTimeout(3000);
  const e = await page.evaluate(() => { const s = [...document.querySelectorAll('span,div,p')].find(x => x.children.length === 0 && /indisponible/i.test(x.textContent)); if (!s) return null; const r = s.getBoundingClientRect(); return { texte: s.textContent.trim(), top: Math.round(r.top), bottom: Math.round(r.bottom), visibleDansEcran: r.bottom > 0 && r.top < innerHeight, scrollY: Math.round(scrollY) }; });
  console.log('message d\'erreur :', JSON.stringify(e));
  console.log('titre affiché :', await page.locator('main h1').first().innerText());
  await page.screenshot({ path: shot });
  await browser.close();
})();

