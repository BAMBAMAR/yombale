// Compte mobile : carte « Commencez à vendre » (chevauchement), menus (compte, bas de page), déconnexion.
// Usage : node scripts/audit/ux-parcours/06-compte-menu.js <sortieDir> <state.json>
const { chromium } = require('playwright');
const path = require('path');
const [, , out, state] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR', storageState: state });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3001/compte', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const card = page.getByText('Commencez à vendre', { exact: false }).first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'm-carte-vendre.png') });
  const geo = await page.evaluate(() => {
    const t = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /Déposez votre/.test(e.textContent));
    const b = [...document.querySelectorAll('a,button')].find(e => /^\s*Publier\s*$/.test(e.innerText));
    const r = x => x && (({ left, top, width, height }) => ({ left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) }))(x.getBoundingClientRect());
    return { texte: r(t), bouton: r(b) };
  });
  console.log('géométrie texte / bouton Publier :', JSON.stringify(geo));
  for (const nom of ['Ouvrir le menu du compte', 'Menu']) {
    const b = page.getByRole('button', { name: nom, exact: true }).first();
    if (!(await b.count())) { console.log(nom, ': absent'); continue; }
    await b.click(); await page.waitForTimeout(1000);
    const txt = await page.evaluate(() => [...document.querySelectorAll('a,button')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && r.top < innerHeight && r.bottom > 0; }).map(e => e.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean).join(' | '));
    console.log(`menu "${nom}" ->`, txt.slice(0, 900));
    await page.screenshot({ path: path.join(out, `m-menu-${nom.replace(/\W+/g, '_')}.png`) });
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    await page.goto('http://localhost:3001/compte', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
  }
  await browser.close();
})();
