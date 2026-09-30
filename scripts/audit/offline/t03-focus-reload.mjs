import { launch, BASE, login, state } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
const S = state(); const res = {};
const { browser, ctx, page } = await launch();
const cdp = await ctx.newCDPSession(page); await cdp.send('Page.enable'); const nav = [];
cdp.on('Page.frameRequestedNavigation', e => nav.push(e.reason));
await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
const scenario = async (nom, fn, offline) => {
  await page.goto(BASE + '/boutique/caisse', { waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(3500);
  if (await page.locator('button', { hasText: 'Gérant Off M' }).count()) { await page.locator('button', { hasText: 'Gérant Off M' }).first().click(); await page.locator('input[type=password]').first().fill('1357'); await page.keyboard.press('Enter'); await page.waitForTimeout(2000); }
  await page.evaluate(() => { window.__marker = 'avant'; });
  if (offline) { await ctx.setOffline(true); await page.waitForTimeout(4500); }
  nav.length = 0; await fn(); await page.waitForTimeout(3000);
  const m = await page.evaluate(() => window.__marker).catch(() => 'ERR');
  res[nom] = { pageRechargee: m !== 'avant', raisons: [...nav] };
  if (offline) { await ctx.setOffline(false); await page.waitForTimeout(3000); }
};
const retourPremierPlan = () => page.evaluate(() => { window.dispatchEvent(new Event('blur')); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); });
await scenario('EN_LIGNE__retour_au_premier_plan', retourPremierPlan, false);
await scenario('HORS_LIGNE__retour_au_premier_plan', retourPremierPlan, true);
await scenario('HORS_LIGNE__attente_sans_action_15s', async () => { await page.waitForTimeout(12000); }, true);
console.log(JSON.stringify(res, null, 1)); await browser.close();
