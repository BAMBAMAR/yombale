import { launch, BASE, out } from './lib.mjs';
const T = process.env.AUDIT_TMP; const { browser, page } = await launch(); const res = {};
await page.goto(BASE + '/admin/login', { waitUntil: 'load' }); await page.waitForTimeout(2500);
res.champs = await page.$$eval('input', is => is.filter(i => i.offsetParent).map(i => ({ t: i.type, n: i.name, ph: i.placeholder })));
const secret = page.locator('input[type="password"]').first(); await secret.fill('audit-admin-secret');
await page.locator('button[type="submit"], button:has-text("Connexion")').first().click(); await page.waitForTimeout(6000);
res.apres_connexion = page.url().replace(BASE, '');
res.pages = [];
for (const u of ['/admin', '/admin/comptes', '/admin/boutiques', '/admin/produits', '/admin/commandes', '/admin/abonnements', '/admin/system']) { const r = await page.goto(BASE + u, { waitUntil: 'load' }).catch(() => null); await page.waitForTimeout(3000); const t = (await page.evaluate(() => document.querySelector('main')?.innerText || '')).replace(/\s+/g, ' '); res.pages.push({ u, http: r && r.status(), final: page.url().replace(BASE, ''), titre: await page.title(), erreur: /erreur|Erreur|403|401|indisponible/.test(t.slice(0, 400)), extrait: t.slice(0, 110) }); }
res.contient_donnees_du_test = (await (await page.goto(BASE + '/admin/comptes')).text()).includes('audit.test');
out(res); await browser.close();
