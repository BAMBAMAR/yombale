// Assistant boutique complet (mobile, connecté par e-mail). Seuls les 2 appels OTP WhatsApp sont simulés (envoi impossible
// dans la pile isolée) : la preuve est fabriquée avec la lib locale et le secret d'audit. Tout le reste est réel.
// Usage (après audit-env) : node scripts/audit/ux-parcours/10-wizard-complet.js <sortieDir> <state.json> <telephone> <nom>
const { chromium } = require('playwright');
const path = require('path');
const { creerPreuveTelephone } = require('../../../backend/lib/phoneProof');
const [, , out, state, tel, nom] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR', storageState: state === 'none' ? undefined : state });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message.slice(0, 150)));
  await page.route('**/api/auth/whatsapp-otp-send', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
  if (process.env.BLOQUER_ACTION) await page.route('**/creer-boutique**', r => (r.request().method() === 'POST' && r.request().headers()['next-action']) ? (console.log('  [contrôle] Server Action bloquée'), r.abort()) : r.continue());
  let telNorm = null;
  await page.route('**/api/auth/whatsapp-otp-verify', async r => { const b = JSON.parse(r.request().postData()); telNorm = b.telephone; r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, preuve_telephone: creerPreuveTelephone(b.telephone.replace(/[^0-9+]/g, '').length === 9 ? '+221' + b.telephone.replace(/\D/g, '') : b.telephone) }) }); });
  page.on('response', async r => { if (/\/api\/boutiques\/taf-taf$/.test(r.url())) console.log('API taf-taf', r.status(), (await r.text().catch(() => '')).replace(/"token":"[^"]+"/, '"token":"<jeton>"').slice(0, 300)); });
  const shot = n => page.screenshot({ path: path.join(out, `w-${n}.png`) });
  const cookieAvant = (await ctx.cookies()).find(c => /session/.test(c.name));
  await page.goto('http://localhost:3001/creer-boutique', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.locator('main input').first().fill(nom);
  await page.locator('main button', { hasText: 'Continuer' }).click(); await page.waitForTimeout(1200);
  await page.locator('main input[type=tel]').fill(tel);
  await page.locator('main button', { hasText: 'Continuer' }).click(); await page.waitForTimeout(1500);
  await shot('3-otp');
  await page.locator('main input[autocomplete=one-time-code]').fill('123456');
  await page.locator('main button', { hasText: 'Continuer' }).click(); await page.waitForTimeout(2000);
  const e4 = await page.locator('main').innerText();
  console.log('étape 4 :', e4.replace(/\n+/g, ' | ').slice(0, 1200));
  await page.screenshot({ path: path.join(out, 'w-4-formule.png'), fullPage: true });
  const cgu = page.locator('main input[type=checkbox]');
  for (const c of await cgu.all()) await c.check().catch(() => {});
  const submit = page.locator('main button[type=submit]').last();
  console.log('bouton final :', (await submit.innerText()).replace(/\s+/g, ' '));
  await submit.click();
  for (let t = 0; t < 12; t++) {
    await page.waitForTimeout(500);
    const h = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,[role=dialog] *')].filter(e => e.getBoundingClientRect().height > 0).map(e => e.innerText.trim()).filter(Boolean).slice(0, 2).join(' / ').slice(0, 120));
    console.log(`  t=${(t + 1) * 500}ms url=${page.url().replace('http://localhost:3001', '')} : ${h}`);
    if (t === 1) await shot('5a-1s');
  }
  console.log('écran final :', (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 700));
  await shot('5-final');
  const cookieApres = (await ctx.cookies()).find(c => /session/.test(c.name));
  console.log('cookie de session modifié :', !!cookieAvant && !!cookieApres && cookieAvant.value !== cookieApres.value);
  await page.goto('http://localhost:3001/compte', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
  console.log('/compte après création :', (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 400));
  await ctx.storageState({ path: path.join(out, 'state-vendeur.json') });
  await browser.close();
})();


