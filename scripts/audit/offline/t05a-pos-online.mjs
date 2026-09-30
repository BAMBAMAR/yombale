import { launch, BASE, login, state } from './lib.mjs';
export async function openPos(page, S) {
  await page.goto(BASE + '/boutique/caisse', { waitUntil: 'load' }); await page.waitForTimeout(3500);
  const pins = page.locator('input[type="password"]');
  if (await pins.count() >= 2) { await pins.nth(0).fill('1357'); await pins.nth(1).fill('2468'); await page.getByText('Activer la Sécurité & Ouvrir le POS').click(); await page.waitForTimeout(1500); }
  if (await page.locator('button', { hasText: 'Gérant Off M' }).count()) {
    await page.locator('button', { hasText: 'Gérant Off M' }).first().click();
    await page.locator('input[type=password]').first().fill('1357'); await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
  }
  if (await page.getByText('Ouvrir la Session de Caisse').count() && await page.getByText('Ouvrir la Session de Caisse').first().isVisible().catch(() => false)) {
    // le modal d'ouverture est parfois déjà ouvert
  }
  if (await page.getByText('Démarrer la Session').count()) { await page.getByText('Démarrer la Session').first().click(); await page.waitForTimeout(2000); }
  else if (await page.getByText('Ouvrir la Session de Caisse').count()) { await page.getByText('Ouvrir la Session de Caisse').first().click(); await page.waitForTimeout(800); await page.getByText('Démarrer la Session').first().click(); await page.waitForTimeout(2000); }
}
export async function addProduct(page, nom, times = 1) { for (let i = 0; i < times; i++) { await page.locator('div,button,article', { hasText: new RegExp('^' + nom) }).first().click(); await page.waitForTimeout(250); } }
if (process.argv[1].endsWith('t05a-pos-online.mjs')) {
  const T = process.env.AUDIT_TMP; const S = state();
  const { browser, ctx, page, logs } = await launch();
  await login(page, S.M.email, S.pw); await openPos(page, S);
  await page.screenshot({ path: T + '/pos-open.png' });
  await page.getByText('Robe Bazin Off').first().click(); await page.waitForTimeout(600);
  console.log('ticket:', (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').match(/Ticket en cours.{0,250}/)?.[0]);
  await page.screenshot({ path: T + '/pos-cart.png' });
  await page.getByRole('button', { name: /Encaisser/ }).first().click(); await page.waitForTimeout(2500);
  await page.screenshot({ path: T + '/pos-after-encaisser.png' });
  console.log('buttons:', JSON.stringify(await page.$$eval('button', bs => bs.filter(b => b.offsetParent).map(b => b.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 30))));
  console.log('logs', logs.slice(0, 6));
  await browser.close();
}
