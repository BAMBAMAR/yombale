// Parcours compte (mobile) : inscription e-mail -> état connecté -> déconnexion -> mauvais mot de passe -> connexion
// -> mot de passe oublié -> retour au contexte (redirect). Compte de test créé dans la base d'audit LOCALE.
// Usage : node scripts/audit/ux-parcours/05-compte.js <sortieDir> <email>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [, , out, email] = process.argv;
const pwd = 'AuditUx!2026';
const base = 'http://localhost:3001';
fs.mkdirSync(out, { recursive: true });
const log = (...a) => console.log('[C]', ...a);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR' });
  const page = await ctx.newPage();
  page.on('pageerror', e => log('PAGEERROR', e.message.slice(0, 150)));
  const shot = n => page.screenshot({ path: path.join(out, `c-${n}.png`) });
  const main = async () => (await page.locator('main').first().innerText().catch(() => page.locator('body').innerText())).replace(/\n+/g, ' | ').slice(0, 500);

  // 1. Inscription e-mail en partant d'une page protégée (contexte à conserver)
  await page.goto(base + '/deposer-annonce', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  log('1. /deposer-annonce non connecté ->', page.url().replace(base, ''));
  const lienInscr = page.locator('main a[href*="inscription"]').first();
  log('   lien inscription :', await lienInscr.getAttribute('href').catch(() => 'absent'));
  await lienInscr.click().catch(() => page.goto(base + '/inscription'));
  await page.waitForTimeout(2000);
  log('   page inscription :', page.url().replace(base, ''));
  await page.locator('main button', { hasText: /E-?mail/i }).first().click();
  await page.waitForTimeout(600);
  await shot('1-inscription-email');
  log('   champs :', await page.locator('main input:visible').evaluateAll(es => es.map(e => `${e.type}:${e.placeholder}${e.required ? '*' : ''}`)));
  // soumission avec mot de passe faible pour lire les messages
  const ins = page.locator('main input:visible');
  const n = await ins.count();
  for (let i = 0; i < n; i++) {
    const t = await ins.nth(i).getAttribute('type');
    const ph = (await ins.nth(i).getAttribute('placeholder')) || '';
    if (t === 'checkbox') continue;
    if (t === 'email' || /mail/i.test(ph)) await ins.nth(i).fill(email);
    else if (t === 'password') await ins.nth(i).fill('123');
    else if (/77|tél|Tél/i.test(ph)) await ins.nth(i).fill('770000002');
    else await ins.nth(i).fill('Awa Test Audit');
  }
  const btn = page.locator('main button[type=submit]').first();
  log('   bouton :', await btn.innerText());
  await btn.click();
  await page.waitForTimeout(2500);
  log('   mot de passe "123" ->', await main());
  await shot('2-mdp-faible');
  for (const pw of await page.locator('main input[type=password]').all()) await pw.fill(pwd);
  const cb = page.locator('main input[type=checkbox]');
  if (await cb.count()) await cb.first().check().catch(() => {});
  await btn.click();
  await page.waitForTimeout(5000);
  log('2. après inscription ->', page.url().replace(base, ''), '\n   ', await main());
  await shot('3-apres-inscription');
  await ctx.storageState({ path: path.join(out, 'state-acheteur.json') });

  // 3. Où suis-je ? menu compte
  await page.goto(base + '/compte', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  log('3. /compte ->', page.url().replace(base, ''), '\n   ', (await main()).slice(0, 400));
  await shot('4-compte');

  // 4. Déconnexion
  const deco = page.getByRole('button', { name: /Déconnexion|Se déconnecter/ }).first();
  const decoA = page.getByRole('link', { name: /Déconnexion|Se déconnecter/ }).first();
  if (await deco.count()) await deco.click(); else if (await decoA.count()) await decoA.click(); else log('   AUCUN bouton de déconnexion visible sur /compte (mobile)');
  await page.waitForTimeout(3000);
  log('4. après déconnexion ->', page.url().replace(base, ''));
  await shot('5-apres-deconnexion');

  // 5. Mauvais mot de passe puis bon, avec redirect
  await page.goto(base + '/connexion?redirect=%2Fdeposer-annonce', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const emailTab = page.locator('main button', { hasText: /E-?mail/i }).first();
  if (await emailTab.count()) { await emailTab.click(); await page.waitForTimeout(500); }
  await page.locator('main input[type=email], main input[name=email]').first().fill(email);
  await page.locator('main input[type=password]').first().fill('MauvaisMdp1!');
  await page.locator('main button[type=submit]').first().click();
  await page.waitForTimeout(2500);
  log('5. mauvais mdp ->', await main());
  await shot('6-mauvais-mdp');
  await page.locator('main input[type=password]').first().fill(pwd);
  await page.locator('main button[type=submit]').first().click();
  await page.waitForTimeout(4000);
  log('   bon mdp -> URL', page.url().replace(base, ''));

  // 6. Mot de passe oublié (nouveau contexte)
  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, locale: 'fr-FR' })).newPage();
  await p2.goto(base + '/mot-de-passe-oublie', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1500);
  await p2.locator('main input').first().fill(email);
  await p2.locator('main button[type=submit]').first().click();
  await p2.waitForTimeout(3000);
  log('6. mot de passe oublié ->', (await p2.locator('main').innerText()).replace(/\n+/g, ' | ').slice(0, 300));
  await p2.locator('main input').first().fill('inconnu-xyz@exemple.sn').catch(() => {});
  await browser.close();
})();


