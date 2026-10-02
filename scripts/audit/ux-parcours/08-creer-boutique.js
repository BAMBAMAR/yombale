// Parcours vendeur (mobile, connecté) : assistant /creer-boutique étape par étape. À chaque étape : titre, champs, boutons,
// remplissage plausible, clic sur l'action principale. Base d'audit LOCALE uniquement.
// Usage : node scripts/audit/ux-parcours/08-creer-boutique.js <sortieDir> <state.json> <nomBoutique>
const { chromium } = require('playwright');
const path = require('path');
const [, , out, state, nom] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR', storageState: state });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message.slice(0, 150)));
  page.on('response', async r => { if (/\/api\/boutiques(\/taf-taf)?$/.test(r.url()) && r.request().method() === 'POST') console.log('API POST', r.url().replace(/^https?:\/\/[^/]+/, ''), r.status(), (await r.text().catch(() => '')).slice(0, 250)); });
  await page.goto('http://localhost:3001/creer-boutique', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  for (let step = 1; step <= 12; step++) {
    const info = await page.evaluate(() => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      const m = document.querySelector('main') || document.body;
      return {
        titre: [...m.querySelectorAll('h1,h2')].filter(vis).map(h => h.innerText.trim()).slice(0, 2).join(' / '),
        champs: [...m.querySelectorAll('input,select,textarea')].filter(vis).map(i => `${i.tagName.toLowerCase()}:${i.type}:${i.placeholder || i.name || ''}${i.required ? '*' : ''}`),
        boutons: [...m.querySelectorAll('button,a')].filter(vis).map(b => b.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 25),
      };
    });
    console.log(`\n== étape ${step} : ${info.titre}\n   champs: ${info.champs.join(' ; ')}\n   boutons: ${info.boutons.join(' | ')}`);
    await page.screenshot({ path: path.join(out, `v-etape-${step}.png`) });
    if (/félicitations|boutique est (prête|créée|en ligne)|bienvenue/i.test(await page.locator('body').innerText())) { console.log('-> écran final détecté'); break; }
    for (const el of await page.locator('main input:visible, main textarea:visible').all()) {
      const t = await el.getAttribute('type'); const ph = (await el.getAttribute('placeholder')) || ''; const v = await el.inputValue().catch(() => '');
      if (v || ['checkbox', 'radio', 'file', 'range'].includes(t)) continue;
      if (/77|tél|whatsapp|WhatsApp/i.test(ph) || t === 'tel') await el.fill('770000003');
      else if (t === 'email') await el.fill('audit.ux.vendeur@exemple.sn');
      else if (/quartier|adresse|ville/i.test(ph)) await el.fill('Médina, Dakar');
      else await el.fill(step === 1 ? nom : 'Vêtements et accessoires à Dakar');
    }
    for (const s of await page.locator('main select:visible').all()) { if (!(await s.inputValue())) await s.selectOption({ index: 1 }).catch(() => {}); }
    const choix = page.locator('main [role=radio]:visible, main button[aria-pressed=false]:visible').first();
    if (step > 1 && (await choix.count()) && !info.champs.length) await choix.click().catch(() => {});
    const next = page.locator('main button:visible', { hasText: /Continuer|Suivant|Créer|Valider|Lancer|Terminer|Ouvrir ma boutique|Commencer/i }).last();
    if (!(await next.count())) { console.log('-> aucune action principale trouvée'); break; }
    const label = (await next.innerText()).trim().replace(/\s+/g, ' ');
    const dis = await next.isDisabled();
    console.log(`   -> clic "${label}" (désactivé=${dis})`);
    if (dis) { const c = page.locator('main button:visible').filter({ hasNot: page.locator('svg[class*=chevron-left]') }).nth(1); await c.click().catch(() => {}); await page.waitForTimeout(500); if (await next.isDisabled()) { console.log('-> bloqué : bouton désactivé sans explication visible ?'); break; } }
    await next.click();
    await page.waitForTimeout(3500);
  }
  console.log('URL finale :', page.url());
  await browser.close();
})();
