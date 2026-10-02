// AUD-219 : avertissement e-mail dès l'ouverture + brouillon conservé au rechargement et au retour étape 3 -> 2.
// Usage : node scripts/audit/ux-parcours/13-annonce-brouillon.js <state.json> [capture.png]
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, locale: 'fr-FR', storageState: process.argv[2] })).newPage();
  await page.goto('http://localhost:3001/deposer-annonce', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const avis = await page.locator('[role=status]').allInnerTexts();
  console.log('avis dès l\'étape 1 :', JSON.stringify(avis.map(t => t.replace(/\s+/g, ' ').slice(0, 170))));
  await page.locator('main button', { hasText: 'Téléphone / Smartphone' }).first().click();
  await page.waitForTimeout(800);
  await page.locator('main input[name=titre]').fill('Samsung Galaxy A15 128 Go');
  await page.locator('main textarea[name=description]').fill('Très bon état, chargeur fourni.');
  await page.locator('main input[name=contact_tel]').fill('770000002');
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const titre = page.locator('main input[name=titre]');
  console.log('après rechargement : étape 2 affichée =', (await titre.count()) > 0, '; titre =', (await titre.count()) ? await titre.inputValue() : '-', '; tel =', (await page.locator('main input[name=contact_tel]').count()) ? await page.locator('main input[name=contact_tel]').inputValue() : '-');
  console.log('message de reprise :', JSON.stringify((await page.locator('[role=status]').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').slice(0, 110))));
  // aller à l'étape 3 puis revenir : rien ne doit être perdu
  await page.locator('main input[name=marque], main input[placeholder*="Samsung"]').first().fill('Samsung').catch(() => {});
  const etat = page.locator('main select').filter({ hasText: /Neuf/ }).first();
  if (await etat.count()) await etat.selectOption({ index: 1 });
  await page.locator('button.annonce-next-btn').click();
  await page.waitForTimeout(800);
  console.log('étape suivante :', (await page.locator('main').innerText()).match(/\d \/ 3/)?.[0]);
  await page.locator('main button.annonce-back').click();
  await page.waitForTimeout(600);
  console.log('retour étape 2 : titre conservé =', await page.locator('main input[name=titre]').inputValue());
  if (process.argv[3]) await page.screenshot({ path: process.argv[3] });
  await browser.close();
})();
