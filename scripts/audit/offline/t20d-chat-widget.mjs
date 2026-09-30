import { launch, BASE, state, out } from './lib.mjs';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const { browser, ctx, page } = await launch();
await page.goto(BASE + '/', { waitUntil: 'load' }); await page.waitForTimeout(3000);
await page.locator('button', { hasText: 'Assistant Nopalou' }).first().click().catch(() => {}); await page.waitForTimeout(1500);
const champ = page.locator('input[placeholder*="essage" i], textarea[placeholder*="essage" i], input[placeholder*="Écri" i], input[placeholder*="question" i], input[placeholder*="Posez" i]').first();
res.widget_ouvert = await champ.count() > 0;
if (res.widget_ouvert) {
  const lire = async () => (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
  await champ.fill('robe bazin'); await champ.press('Enter'); await page.waitForTimeout(6000);
  const t = await lire(); res.en_ligne = { repond_avec_le_produit: t.includes('Robe Bazin Off'), prix_affiche: /15\s?000/.test(t) };
  await ctx.setOffline(true); await page.waitForTimeout(1500);
  await champ.fill('boubou'); await champ.press('Enter'); await page.waitForTimeout(6000);
  const t2 = await lire(); res.hors_ligne = { message_erreur_ou_indication: t2.match(/(hors[- ]?ligne|connexion|réseau|impossible|réessay|indisponible)[^]{0,80}/i)?.[0] || 'AUCUN message visible', champ_bloque: await champ.isDisabled().catch(() => null) };
  await page.screenshot({ path: T + '/chat-offline.png' });
}
out(res); await browser.close();
