import { launch, BASE, login, state, out } from './lib.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const { browser, ctx, page } = await launch();
await login(page, S.Z.email, S.pw);
await page.goto(BASE + '/deposer-annonce', { waitUntil: 'load' }); await page.waitForTimeout(3500);
const avant = Number(sql("SELECT count(*) n FROM annonces_classifiees")[0].n);
await page.locator('button', { hasText: 'Informatique' }).first().click(); await page.waitForTimeout(1500);
await page.fill('input[name="titre"]', 'Ordinateur portable Audit E2E'); await page.fill('input[name="prix"]', '150000');
for (const sel of await page.locator('select:visible').all()) { const opts = await sel.locator('option').evaluateAll(os => os.map(o => o.value).filter(Boolean)); if (opts.length) await sel.selectOption(opts[0]); }
await page.fill('input[name="quartier"]', 'Plateau'); await page.fill('textarea[name="description"]', 'Portable en bon état, vendu avec chargeur. Annonce de test automatisée E2E.'); await page.fill('input[name="contact_nom"]', 'Testeur Z');
const tel = page.locator('input[type="tel"]:visible'); if (await tel.count()) await tel.first().fill('775551122');
await page.locator('button', { hasText: 'Continuer → Photos' }).click(); await page.waitForTimeout(2500);
res.etape2_boutons = await page.$$eval('button', bs => bs.filter(b => b.offsetParent).map(b => b.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(-5));
res.etape2_texte = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').match(/(Photo|photo)[^]{0,140}/)?.[0];
const pub = page.locator('button', { hasText: /Publier mon annonce|Publier l.annonce|Publier$|Soumettre|Envoyer/i }).last();
if (await pub.count() && await pub.isEnabled()) { await pub.click(); await page.waitForTimeout(5000); }
res.annonces_ajoutees_en_base = Number(sql("SELECT count(*) n FROM annonces_classifiees")[0].n) - avant;
res.url_finale = page.url().replace(BASE, ''); res.derniere_annonce = sql("SELECT titre, prix, actif, created_at FROM annonces_classifiees ORDER BY created_at DESC LIMIT 1");
res.message = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').match(/(publi[ée]e|succès|modération|vérif|erreur|requis)[^]{0,120}/i)?.[0];
out(res); await browser.close();

