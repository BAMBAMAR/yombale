import { launch, BASE, state, out } from './lib.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const { browser, ctx, page } = await launch();
await ctx.addInitScript(() => { window.open = () => null; });
// 1. INSCRIPTION par e-mail (interface -> server action -> API -> base)
const email = `e2e.${Date.now().toString(36)}@audit.test`;
try {
  await page.goto(BASE + '/inscription', { waitUntil: 'load' }); await page.waitForTimeout(2500);
  await page.locator('button', { hasText: 'Avec mot de passe' }).first().click(); await page.waitForTimeout(800);
  res.inscription_champs = await page.$$eval('input', is => is.filter(i => i.offsetParent).map(i => ({ t: i.type, n: i.name, ph: i.placeholder })));
  for (const i of await page.locator('input:visible').all()) { const t = await i.getAttribute('type'); const n = (await i.getAttribute('name')) || ''; if (t === 'email') await i.fill(email); else if (t === 'password') await i.fill('Audit!Pass2026x'); else if (t === 'tel') await i.fill('77' + String(Math.floor(1000000 + Math.random() * 8999999))); else if (t === 'checkbox') await i.check().catch(() => {}); else if (t === 'text') await i.fill('Testeur E2E'); }
  await page.screenshot({ path: T + '/signup-filled.png' });
  await page.locator('button[type="submit"]').first().click(); await page.waitForTimeout(6000);
  res.inscription_url_apres = page.url().replace(BASE, '');
  res.inscription_en_base = sql(`SELECT email, email_verifie, role FROM utilisateurs WHERE email='${email}'`);
  res.inscription_message = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').match(/(erreur|Erreur|invalide|bienvenue|Bienvenue|vérif)[^]{0,120}/)?.[0];
} catch (e) { res.inscription_erreur = String(e.message).split('\n')[0]; }
// 2. RECHERCHE depuis la barre de navigation puis fiche produit
try {
  await page.goto(BASE + '/', { waitUntil: 'load' }); await page.waitForTimeout(2500);
  await page.locator('button[aria-label*="echerch" i], a[aria-label*="echerch" i]').first().click().catch(() => {}); await page.waitForTimeout(600);
  const champ = page.locator('input[type="search"], input[placeholder*="echerch" i], input[placeholder*="Robe" i]').first(); await champ.fill('robe bazin'); await champ.press('Enter'); await page.waitForTimeout(4500);
  res.recherche = { url: page.url().replace(BASE, ''), contient_produit_de_test: (await page.evaluate(() => document.body.innerText)).includes('Robe Bazin Off') };
  await page.getByText('Robe Bazin Off').first().click(); await page.waitForTimeout(3500);
  res.recherche_clic_produit = { url: page.url().replace(BASE, ''), titre: await page.title() };
} catch (e) { res.recherche_erreur = String(e.message).split('\n')[0]; }
out(res); await browser.close();
