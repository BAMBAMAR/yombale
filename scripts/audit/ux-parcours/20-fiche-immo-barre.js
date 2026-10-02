// AUD-228 : barre de contact fixe de la fiche immobilière (mobile 375x812) : visible sans défiler, bouton -> bloc contact.
// Usage : node scripts/audit/ux-parcours/20-fiche-immo-barre.js <idAnnonce> <capture.png> [port=3001]
const { chromium } = require('playwright');
const [, , id, shot, port = '3001'] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, locale: 'fr-FR' })).newPage();
  await page.goto(`http://localhost:${port}/immo/${id}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(6000);
  const barre = await page.evaluate(() => { const b = document.querySelector('.fiche-barre-contact'); if (!b) return null; const r = b.getBoundingClientRect(); return { visible: getComputedStyle(b).display !== 'none', top: Math.round(r.top), bottom: Math.round(r.bottom), texte: b.innerText.replace(/\s+/g, ' ') }; });
  console.log('barre au chargement :', JSON.stringify(barre), '(hauteur de l\'écran : 812)');
  await page.screenshot({ path: shot });
  await page.locator('.fiche-barre-contact__btn').tap();
  await page.waitForTimeout(1200);
  const apres = await page.evaluate(() => { const ancre = document.getElementById('contact-annonce'); const r = ancre.getBoundingClientRect(); const appeler = [...document.querySelectorAll('button')].find(b => /Appeler/.test(b.innerText)); const a = appeler && appeler.getBoundingClientRect(); return { scrollY: Math.round(scrollY), ancreTop: Math.round(r.top), boutonAppelerVisible: !!a && a.top >= 0 && a.bottom <= innerHeight }; });
  console.log('après « Contacter » :', JSON.stringify(apres));
  await browser.close();
})();
