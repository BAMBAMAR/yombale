// Parcours A suite : panier -> quantité -> (mode whatsapp | formulaire) -> message WhatsApp / confirmation -> base.
// Usage : node scripts/audit/ux-parcours/03-panier-commande.js <sortieDir> <whatsapp|formulaire|vide> [slug] [zoneIndex]
// Base d'audit LOCALE uniquement ; notifications sortantes bloquées par audit-guard.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [, , out, mode = 'whatsapp', slug = 'dievo-style', zoneIdx] = process.argv;
const base = 'http://localhost:3001';
fs.mkdirSync(out, { recursive: true });
const log = (...a) => console.log(`[${mode}]`, ...a);
const shot = (page, n) => page.screenshot({ path: path.join(out, `${mode}-${n}.png`) });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36' });
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
  page.on('pageerror', e => log('PAGEERROR', e.message.slice(0, 150)));
  page.on('response', async r => { if (/\/api\/comptabilite\/[^/]+\/commandes$/.test(r.url()) && r.request().method() === 'POST') { let b = ''; try { b = (await r.text()).slice(0, 400); } catch {} log('API POST commandes ->', r.status(), b); } });

  await page.goto(`${base}/boutiques/${slug}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Ajouter au panier' }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Ajouter au panier' }).nth(1).click(); // deuxième produit (placeholder « à modifier » si présent)
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Panier/ }).first().click();
  await page.waitForTimeout(1500);

  const lire = () => page.evaluate(() => {
    const d = document.querySelector('[role=dialog]') || document.body;
    return d.innerText.replace(/\n+/g, ' | ').slice(0, 900);
  });
  log('panier initial :', await lire());
  await page.getByRole('button', { name: 'Augmenter' }).first().click();
  await page.waitForTimeout(700);
  log('après + :', (await lire()).match(/Sous-total[^|]*\|[^|]*|Total[^|]*\|[^|]*/g));

  if (zoneIdx) {
    const sel = page.locator('[role=dialog] select, select').filter({ hasText: 'Retrait' }).first();
    const opts = await sel.locator('option').allInnerTexts();
    log('zones proposées :', opts.join(' / '));
    await sel.selectOption({ index: Number(zoneIdx) });
    await page.waitForTimeout(500);
    log('zone choisie :', opts[Number(zoneIdx)], '->', (await lire()).match(/Total[^|]*\|[^|]*/g));
  }
  await shot(page, '1-panier');

  if (mode === 'vide') {
    // suppression jusqu'au panier vide
    for (let i = 0; i < 3; i++) { const b = page.getByRole('button', { name: /Supprimer|Retirer/ }).first(); if (await b.count()) { await b.click(); await page.waitForTimeout(500); } }
    log('après suppressions :', await lire());
    await shot(page, '2-vide');
  } else if (mode === 'whatsapp') {
    const t0 = Date.now();
    await page.getByRole('button', { name: /Commander via WhatsApp/ }).click();
    await page.waitForTimeout(3500);
    const opened = await page.evaluate(() => window.__opened);
    log('window.open appelé :', opened.length, 'fois, après', Date.now() - t0, 'ms');
    for (const u of opened) { const m = new URL(u); log('  numéro :', m.pathname, '\n  message :\n' + decodeURIComponent(m.searchParams.get('text') || '')); }
    await shot(page, '2-apres-envoi');
    log('écran après envoi :', await lire());
  } else {
    await page.getByText('En Ligne', { exact: false }).first().click();
    await page.waitForTimeout(800);
    await shot(page, '2-formulaire');
    log('formulaire :', await lire());
    // soumission vide
    const submit = page.locator('[role=dialog] button[type=submit], form button[type=submit]').last();
    log('bouton de validation :', await submit.innerText().catch(() => '?'), 'désactivé =', await submit.isDisabled().catch(() => '?'));
    await submit.click({ trial: false }).catch(e => log('clic impossible :', e.message.slice(0, 80)));
    await page.waitForTimeout(1000);
    log('après soumission vide :', (await lire()).slice(0, 300));
    await shot(page, '3-soumission-vide');
    await page.getByPlaceholder(/Babacar|nom|Nom/).first().fill('Test Audit UX');
    await page.getByPlaceholder(/Ex: 77|Téléphone|téléphone/).first().fill('770000001');
    const adr = page.getByPlaceholder(/Sacré|adresse|Adresse|quartier/).first();
    if (await adr.count()) await adr.fill('Sacré-Coeur 3, villa 12');
    if (process.env.PAIEMENT) { await page.getByText(process.env.PAIEMENT, { exact: true }).first().click(); await page.waitForTimeout(400); log('paiement choisi :', process.env.PAIEMENT, '; bouton :', await submit.innerText()); }
    const t0 = Date.now();
    await submit.dblclick().catch(() => submit.click());
    await page.waitForTimeout(4000);
    log('après validation (' + (Date.now() - t0) + ' ms) :', await lire());
    await shot(page, '4-confirmation');
  }
  await browser.close();
})();

