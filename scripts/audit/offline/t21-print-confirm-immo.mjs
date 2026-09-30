import { launch, BASE, login, state, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
const S = state(); const res = {};
// H-1 : impression automatique hors-ligne, écouteur "online -> reload" neutralisé ou non
for (const variante of ['TEL_QUEL', 'ECOUTEUR_RELOAD_NEUTRALISE']) {
  const { browser, ctx, page } = await launch();
  await ctx.addInitScript((neutraliser) => { if (neutraliser) { const A = window.addEventListener; window.addEventListener = function (t, h, o) { if (t === 'online' && String(h).includes('location.reload')) return; return A.call(this, t, h, o); }; } }, variante === 'ECOUTEUR_RELOAD_NEUTRALISE');
  await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
  await page.evaluate(() => { window.__m = 'avant'; });
  await ctx.setOffline(true); await page.waitForTimeout(4500);
  await page.getByText('T-Shirt Coton').first().click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: /Encaisser/ }).first().click(); await page.waitForTimeout(4000);
  res['H1_impression_hors_ligne__' + variante] = { page_rechargee: (await page.evaluate(() => window.__m).catch(() => null)) !== 'avant' };
  await browser.close();
}
// Immobilier : liste -> fiche -> contact
const { browser, page } = await launch();
await page.goto(BASE + '/immo', { waitUntil: 'load' }); await page.waitForTimeout(4000);
const liens = await page.$$eval('a[href^="/immo/"]', as => [...new Set(as.map(a => a.getAttribute('href')))].filter(h => /\/immo\/[^/]+$/.test(h)));
res.immo_liste = { fiches_liees: liens.length };
if (liens.length) { await page.goto(BASE + liens[0], { waitUntil: 'load' }); await page.waitForTimeout(3500); const t = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' '); res.immo_fiche = { url: liens[0], titre: await page.title(), prix_affiche: /\d[\d  ]+\s*FCFA/.test(t), telephone_masque: /••/.test(t), bouton_afficher: /Afficher/.test(t) }; }
out(res); await browser.close();
