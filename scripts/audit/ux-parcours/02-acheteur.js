// Parcours A (acheteur mobile) : recherche accueil -> boutique -> ajout panier -> panier -> quantité -> WhatsApp / formulaire.
// Usage : node scripts/audit/ux-parcours/02-acheteur.js <sortieDir> [slugBoutique]
// Écrit des commandes dans la base d'audit LOCALE uniquement (les notifications sortantes sont bloquées par audit-guard).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const out = process.argv[2];
const slug = process.argv[3] || 'dievo-style';
const base = 'http://localhost:3001';
fs.mkdirSync(out, { recursive: true });
const log = (...a) => console.log('[A]', ...a);
const shot = (page, n) => page.screenshot({ path: path.join(out, n + '.png') });

async function visibles(page, sel = 'button,a,input,select,textarea,[role=dialog] *') {
  return page.evaluate((sel) => [...document.querySelectorAll(sel)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(e).visibility !== 'hidden'; })
    .map(e => `${e.tagName.toLowerCase()} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)} "${(e.innerText || e.getAttribute('aria-label') || e.placeholder || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 60)}"`)
    .filter(s => !s.endsWith('""')), sel);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36' });
  const page = await ctx.newPage();
  const popups = [];
  ctx.on('page', p => popups.push(p));
  await page.addInitScript(() => { window.__opened = []; const o = window.open; window.open = (u, ...r) => { window.__opened.push(String(u)); return null; }; });
  page.on('pageerror', e => log('PAGEERROR', e.message.slice(0, 150)));
  const apiCalls = [];
  page.on('response', r => { if (/\/api\/(comptabilite\/[^/]+\/commandes|boutiques\/[^/]+\/paniers)/.test(r.url())) apiCalls.push(`${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')} -> ${r.status()}`); });

  // 1. Recherche depuis l'accueil
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const homeInput = page.locator('input[type=search], input[placeholder*="Samsung"], input[placeholder*="Rechercher"]').first();
  await homeInput.fill('iphone 13');
  await homeInput.press('Enter');
  await page.waitForTimeout(4000);
  log('1. recherche accueil "iphone 13" ->', page.url().replace(base, ''));
  await shot(page, 'a1-recherche-accueil');
  log('   cartes visibles :', (await visibles(page, 'a h3, a p, article h3, [class*=card] h3')).slice(0, 8).join(' | '));

  // 2. Boutique : ajout au panier
  await page.goto(`${base}/boutiques/${slug}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const addBtn = page.getByRole('button', { name: 'Ajouter au panier' }).first();
  await addBtn.scrollIntoViewIfNeeded();
  const t0 = Date.now();
  await addBtn.click();
  await page.waitForTimeout(800);
  log('2. ajout panier : feedback après 800 ms ->', (await visibles(page, '[role=status],[role=alert],[class*=toast],[class*=Toast],[role=dialog]')).slice(0, 5).join(' | ') || 'AUCUN élément de feedback visible');
  await shot(page, 'a2-apres-ajout');
  const cartBtn = page.getByRole('button', { name: /Panier/ }).first();
  log('   bouton panier :', await cartBtn.getAttribute('aria-label'));

  // 3. Persistance après rechargement
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  log('3. après rechargement, bouton panier :', await page.getByRole('button', { name: /Panier/ }).first().getAttribute('aria-label'));

  // 4. Ouverture du panier
  await page.getByRole('button', { name: /Panier/ }).first().click();
  await page.waitForTimeout(1500);
  await shot(page, 'a4-panier-ouvert');
  log('4. panier ouvert, éléments :\n   ' + (await visibles(page)).join('\n   '));
  fs.writeFileSync(path.join(out, 'a4-panier.html'), await page.content());
  await browser.close();
  log('appels API :', apiCalls.join(' ; '));
})();
