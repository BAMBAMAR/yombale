// t25 : le sélecteur Acheter / Vendre / Agences ne doit tronquer aucun libellé, à aucune largeur.
import { chromium } from '../../../node_modules/playwright/index.mjs';
const BASE = process.env.AUDIT_BASE || 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const res = [];
for (const w of [1440, 1280, 1024, 900, 800, 720, 640, 480, 390, 360]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hero-mode-tabs-pill', { timeout: 20000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('.hero-mode-tab-btn > span')].filter(s => getComputedStyle(s).display !== 'none');
    const pill = document.querySelector('.hero-mode-tabs-pill');
    return {
      pill: pill ? Math.round(pill.getBoundingClientRect().width) : null,
      libelles: spans.map(s => s.textContent.trim()),
      tronques: spans.filter(s => s.scrollWidth > s.clientWidth + 1).map(s => s.textContent.trim()),
      debordePage: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  res.push({ largeur: w, ...r });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(res, null, 1));
console.log('VERDICT aucune troncature :', res.every(r => r.tronques.length === 0 && !r.debordePage));
