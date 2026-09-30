import { launch, BASE, login, state, readIDB, cacheReport, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
const S = state(); const res = {};
const { browser, ctx, page } = await launch();
await ctx.addInitScript(() => { window.open = () => null; window.print = () => {}; });
await login(page, S.M.email, S.pw);
for (const u of ['/compte', '/boutique', '/boutique/caisse', '/boutique/carnet']) { await page.goto(BASE + u, { waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(3500); }
await openPos(page, S); await page.waitForTimeout(2500);
const avant = await cacheReport(page);
res.caches_avant_logout = Object.fromEntries(Object.entries(avant).map(([k, v]) => [k, v.length]));
// Déconnexion par le bouton de l'interface
await page.goto(BASE + '/compte', { waitUntil: 'load' }); await page.waitForTimeout(2500);
await page.locator('button[aria-label="Se déconnecter"]').first().click().catch(async () => { await page.getByRole('button', { name: /déconnecter|Déconnexion/i }).first().click(); });
await page.waitForTimeout(4000);
res.url_apres_logout = page.url();
const apres = await cacheReport(page);
res.caches_apres_logout = Object.fromEntries(Object.entries(apres).map(([k, v]) => [k, v.length]));
const prives = Object.values(apres).flat().filter(u => /\/api\/(boutiques|comptabilite|agences|auth)|\/boutique|\/compte/.test(u));
res.entrees_privees_encore_en_cache = prives.slice(0, 20);
res.localStorage_apres_logout = await page.evaluate(() => Object.keys(localStorage).filter(k => /^nopalou/.test(k)));
const idb = await readIDB(page, ['produits', 'clients', 'caissiers', 'marchand_boutiques', 'ventes_queue']);
res.indexedDB_apres_logout = Object.fromEntries(['produits', 'clients', 'caissiers', 'marchand_boutiques', 'ventes_queue'].map(k => [k, (idb[k] || []).length]));
// Hors-ligne, déconnecté : les pages privées du marchand sont-elles servies ?
await ctx.setOffline(true);
res.hors_ligne_deconnecte = [];
for (const u of ['/boutique/caisse', '/boutique', '/compte']) {
  const r = await page.goto(BASE + u, { waitUntil: 'load' }).catch(e => null); await page.waitForTimeout(2500);
  const t = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
  res.hors_ligne_deconnecte.push({ url: u, titre: await page.title(), contientBoutiqueDuMarchand: t.includes('Boutique Off M'), contientNomMarchand: t.includes('Off M'), extrait: t.slice(0, 120) });
}
out(res); await browser.close();
