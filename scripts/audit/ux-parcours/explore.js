// Exploration d'une page en mobile : liste les éléments interactifs visibles (texte, taille, position) et capture.
// Usage : node scripts/audit/ux-parcours/explore.js <url> <capture.png> [--full] [--desktop] [--storage=<state.json>]
const { chromium } = require('playwright');
const [, , url, shot, ...flags] = process.argv;
const desktop = flags.includes('--desktop');
const storage = (flags.find(f => f.startsWith('--storage=')) || '').slice(10) || undefined;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(desktop ? { viewport: { width: 1366, height: 768 }, storageState: storage } : {
    viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR', storageState: storage,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message.slice(0, 160)));
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  console.log('status', resp && resp.status(), 'final', page.url());
  const items = await page.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
    return [...document.querySelectorAll('a,button,[role=button],input,select,textarea,h1,h2,h3')].filter(vis).map(e => {
      const r = e.getBoundingClientRect();
      const txt = (e.innerText || e.getAttribute('aria-label') || e.getAttribute('placeholder') || e.value || e.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 70);
      return `${e.tagName.toLowerCase()}${e.getAttribute('href') ? '[' + e.getAttribute('href').slice(0, 60) + ']' : ''} y=${Math.round(r.top + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)} "${txt}"`;
    });
  });
  console.log(items.join('\n'));
  await page.screenshot({ path: shot, fullPage: flags.includes('--full') });
  await browser.close();
})();
