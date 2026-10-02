// Balayage UX objectif des pages publiques (mobile 375x812 puis desktop 1366x768).
// Usage : node scripts/audit/ux-parcours/01-sweep.js <sortieDir> [baseUrl]
// Mesures : statut HTTP, temps jusqu'au premier contenu et au chargement, H1, débordement horizontal,
// cibles tactiles < 44 px (mobile), champs sans libellé, images sans alt, textes tronqués, erreurs console.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const out = process.argv[2];
const base = process.argv[3] || 'http://localhost:3001';
fs.mkdirSync(out, { recursive: true });

const pages = (process.env.PAGES || [
  '/', '/recherche?q=iphone', '/boutiques', '/immo', '/annonces', '/agences', '/telecom',
  '/assistant-whatsapp', '/whatsapp', '/tarifs-boutique', '/creer-boutique', '/sama-xaalis',
  '/connexion', '/inscription', '/mot-de-passe-oublie', '/suivi-commande', '/aide', '/payer-loyer',
  '/deposer-annonce', '/compte', '/favoris', '/pos', '/boutique', '/comparer', '/promo',
  '/annonces/00000000-0000-0000-0000-000000000000', '/produit/99999999', '/page-qui-nexiste-pas',
].join(',')).split(',');

const viewports = {
  mobile: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36' },
  desktop: { viewport: { width: 1366, height: 768 } },
};

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const [vpName, vp] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ ...vp, locale: 'fr-FR' });
    for (const p of pages) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
      page.on('pageerror', e => errors.push('PAGEERROR ' + String(e.message).slice(0, 200)));
      const t0 = Date.now();
      let status = null, finalUrl = null;
      try {
        const resp = await page.goto(base + p, { waitUntil: 'domcontentloaded', timeout: 60000 });
        status = resp && resp.status();
        const tDom = Date.now() - t0;
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
        const tIdle = Date.now() - t0;
        finalUrl = page.url().replace(base, '');
        const m = await page.evaluate((isMobile) => {
          const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
          const label = el => (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
          const h1 = [...document.querySelectorAll('h1')].filter(vis).map(h => h.innerText.trim().slice(0, 90));
          const docW = document.documentElement.scrollWidth, winW = window.innerWidth;
          const overflowers = docW > winW + 1 ? [...document.querySelectorAll('body *')].filter(e => vis(e) && e.getBoundingClientRect().right > winW + 2).slice(0, 5).map(e => e.tagName + '.' + String(e.className).slice(0, 40)) : [];
          const clickables = [...document.querySelectorAll('a,button,[role=button],input,select,textarea')].filter(vis);
          const small = isMobile ? clickables.filter(e => { const r = e.getBoundingClientRect(); return (r.height < 44 && r.width < 44) || r.height < 32; }) : [];
          const inputs = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis);
          const unlabeled = inputs.filter(i => !(i.labels && i.labels.length) && !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby')).map(i => (i.name || i.id || i.placeholder || i.type || '').slice(0, 30));
          const imgsNoAlt = [...document.querySelectorAll('img')].filter(i => vis(i) && !i.hasAttribute('alt')).length;
          const truncated = [...document.querySelectorAll('button,a,h1,h2,h3,span,p,label')].filter(e => vis(e) && e.children.length === 0 && e.scrollWidth > e.clientWidth + 2 && ['hidden', 'clip'].includes(getComputedStyle(e).overflowX)).slice(0, 8).map(e => e.innerText.trim().slice(0, 50));
          const bodyText = document.body.innerText;
          return {
            title: document.title, h1, overflowPx: docW - winW, overflowers,
            nbClickables: clickables.length, smallTargets: small.length, smallSample: small.slice(0, 6).map(label),
            unlabeled, imgsNoAlt, truncated, pageHeightScreens: +(document.documentElement.scrollHeight / window.innerHeight).toFixed(1),
            textLen: bodyText.length, emptyish: bodyText.trim().length < 200, robots: (document.querySelector('meta[name=robots]') || {}).content || null,
            aboveFoldButtons: clickables.filter(e => e.getBoundingClientRect().top < window.innerHeight && e.getBoundingClientRect().bottom > 0).length,
          };
        }, vpName === 'mobile');
        const shot = path.join(out, `${vpName}${p.replace(/[^a-z0-9]+/gi, '_').slice(0, 60) || '_home'}.png`);
        await page.screenshot({ path: shot, fullPage: false });
        results.push({ vp: vpName, page: p, status, finalUrl, tDom, tIdle, errors: errors.slice(0, 5), nbErrors: errors.length, ...m });
        console.log(vpName, p, status, `dom=${tDom}ms idle=${tIdle}ms`, 'h1=', JSON.stringify(m.h1), 'ovf=', m.overflowPx, 'small=', m.smallTargets, 'err=', errors.length);
      } catch (e) {
        results.push({ vp: vpName, page: p, status, error: String(e.message).slice(0, 200) });
        console.log(vpName, p, 'ERROR', e.message.slice(0, 120));
      }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(out, 'sweep.json'), JSON.stringify(results, null, 1));
})();
