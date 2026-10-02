// Publication d'une petite annonce (mobile, connecté) : étapes, champs, validations, résultat, base.
// Usage : node scripts/audit/ux-parcours/12-annonce.js <sortieDir> <state.json> <imagePng>
const { chromium } = require('playwright');
const path = require('path');
const [, , out, state, img] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR', storageState: state })).newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message.slice(0, 150)));
  page.on('response', async r => { if (/\/api\/(annonces|upload)/.test(r.url()) && r.request().method() !== 'GET') console.log('API', r.request().method(), r.url().replace(/^https?:\/\/[^/]+/, ''), r.status(), (await r.text().catch(() => '')).slice(0, 220)); });
  await page.goto('http://localhost:3001/deposer-annonce', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  for (let step = 1; step <= 6; step++) {
    const info = await page.evaluate(() => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const m = document.querySelector('main') || document.body;
      return { t: [...m.querySelectorAll('h1,h2,h3')].filter(vis).map(h => h.innerText.trim()).slice(0, 3).join(' / '), champs: [...m.querySelectorAll('input,select,textarea')].filter(vis).map(i => `${i.tagName.toLowerCase()}:${i.type}:${(i.placeholder || i.name || '').slice(0, 40)}${i.required ? '*' : ''}`) };
    });
    console.log(`\n== étape ${step} : ${info.t}\n   champs : ${info.champs.join(' ; ')}`);
    await page.screenshot({ path: path.join(out, `e-${step}.png`) });
    if (step === 1) { await page.locator('main button', { hasText: 'Téléphone / Smartphone' }).first().click(); await page.waitForTimeout(800); continue; }
    // test soumission vide d'abord
    const next = page.locator('main button:visible', { hasText: /Continuer|Suivant|Publier|Valider/i }).last();
    if (!(await next.count())) { console.log('   pas d\'action principale'); break; }
    if (step === 2) { await next.click(); await page.waitForTimeout(800); const msg = await page.evaluate(() => [...document.querySelectorAll('main *')].filter(e => e.children.length === 0 && /obligatoire|requis|veuillez|saisir|indiquez/i.test(e.textContent)).map(e => e.textContent.trim()).slice(0, 4)); console.log('   soumission vide -> messages :', msg); }
    for (const el of await page.locator('main input:visible, main textarea:visible').all()) {
      const t = await el.getAttribute('type'); const ph = ((await el.getAttribute('placeholder')) || '') + ((await el.getAttribute('name')) || '');
      if (t === 'file') { await el.setInputFiles(img).catch(e => console.log('   fichier :', e.message.slice(0, 80))); continue; }
      if (['checkbox', 'radio', 'hidden'].includes(t) || (await el.inputValue().catch(() => ''))) continue;
      if (/prix|price|FCFA/i.test(ph) || t === 'number') await el.fill('85000');
      else if (/77|tél|phone|whatsapp/i.test(ph) || t === 'tel') await el.fill('770000002');
      else if (/ville|quartier|lieu|local/i.test(ph)) await el.fill('Parcelles Assainies');
      else if ((await el.evaluate(e => e.tagName)) === 'TEXTAREA') await el.fill('Samsung Galaxy A15 128 Go, très bon état, chargeur fourni. Vendu car changement de téléphone.');
      else await el.fill('Samsung Galaxy A15 128 Go');
    }
    for (const s of await page.locator('main select:visible').all()) if (!(await s.inputValue())) await s.selectOption({ index: 1 }).catch(() => {});
    await page.waitForTimeout(400);
    const lbl = (await next.innerText()).trim().replace(/\s+/g, ' ');
    console.log(`   -> clic "${lbl}"`);
    await next.click();
    await page.waitForTimeout(3500);
    const body = (await page.locator('main').innerText()).replace(/\n+/g, ' | ');
    if (/publiée|en ligne|succès|merci|validation|modération|attente/i.test(body) && /Publier/i.test(lbl)) { console.log('   résultat :', body.slice(0, 600)); await page.screenshot({ path: path.join(out, 'e-final.png') }); break; }
  }
  console.log('URL finale :', page.url());
  await browser.close();
})();
