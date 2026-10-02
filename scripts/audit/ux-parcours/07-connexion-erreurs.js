// Messages de connexion e-mail (mobile) : compte existant + mauvais mot de passe, compte inexistant, champs vides,
// puis bonne connexion avec redirect. Usage : node scripts/audit/ux-parcours/07-connexion-erreurs.js <email> <motdepasse>
const { chromium } = require('playwright');
const [, , email, pwd] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, locale: 'fr-FR' })).newPage();
  const essai = async (label, mail, mdp) => {
    await page.goto('http://localhost:3001/connexion?redirect=%2Fdeposer-annonce', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.locator('main button', { hasText: /E-?mail/i }).first().click();
    await page.waitForTimeout(400);
    await page.locator('main input[type=email]').first().fill(mail);
    await page.locator('main input[type=password]').first().fill(mdp);
    const t0 = Date.now();
    await page.locator('main button[type=submit]').first().click();
    const pendant = await page.locator('main button[type=submit]').first().innerText().catch(() => '');
    await page.waitForTimeout(3000);
    const err = await page.evaluate(() => [...document.querySelectorAll('main [role=alert], main [class*=error], main [class*=Error], main p, main div')].filter(e => e.children.length === 0 && /incorrect|invalide|autoris|erreur|introuvable|aucun|mot de passe|réessayez/i.test(e.textContent)).map(e => e.textContent.trim()).slice(0, 3));
    const zone = (await page.locator('main').innerText()).replace(/\n+/g, ' | ');
    const i = zone.indexOf('Avec mot de passe');
    console.log('   texte :', zone.slice(i, i + 170));
    console.log(`${label} -> url=${page.url().replace('http://localhost:3001', '')} ; bouton pendant envoi="${pendant}" ; messages=${JSON.stringify(err)}`);
  };
  await essai('A. existant + mauvais mdp', email, 'MauvaisMdp1!');
  await essai('B. inexistant', 'personne-xyz@exemple.sn', 'MauvaisMdp1!');
  await essai('C. bon mdp + redirect', email, pwd);
  await browser.close();
})();

