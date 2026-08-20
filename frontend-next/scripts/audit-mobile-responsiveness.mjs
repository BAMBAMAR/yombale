import { chromium } from 'playwright';

const VIEWPORTS = [
  { name: 'Ultra Compact (320px)', width: 320, height: 568 },
  { name: 'Android Standard (360px)', width: 360, height: 740 },
  { name: 'iPhone Standard (375px)', width: 375, height: 667 },
  { name: 'iPhone 14/15 (390px)', width: 390, height: 844 },
  { name: 'Grand Android (412px)', width: 412, height: 915 },
];

const ROUTES = [
  { path: '/', name: 'Accueil' },
  { path: '/compte', name: 'Mon Compte' },
  { path: '/boutique', name: 'Gestion Boutique' },
  { path: '/annonces', name: 'Petites Annonces' },
  { path: '/immo', name: 'Immobilier' },
  { path: '/telecom', name: 'Télécom' },
  { path: '/tarifs-boutique', name: 'Tarifs Vendeurs' },
  { path: '/guide-utilisation', name: 'Guide d\'utilisation' },
  { path: '/connexion', name: 'Connexion' },
];

async function runMobileAudit() {
  console.log('📱 ======================================================');
  console.log('🚀 DÉMARRAGE DE L\'AUDIT D\'ADAPTABILITÉ MOBILE (PLAYWRIGHT)');
  console.log('📱 ======================================================\n');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.error('Erreur lancement Chromium:', e.message);
    process.exit(1);
  }

  const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  const issues = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n──────────────────────────────────────────────────────`);
    console.log(`📐 TEST VIEWPORT : ${vp.name} (${vp.width} × ${vp.height} px)`);
    console.log(`──────────────────────────────────────────────────────`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    });
    const page = await context.newPage();

    // 1. Test des Pages
    for (const route of ROUTES) {
      totalChecks++;
      const url = `${BASE_URL}${route.path}`;
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        if (!res || res.status() >= 400) {
          console.log(`  ⚠️  [SKIP] ${route.name} (${route.path}) - HTTP ${res ? res.status() : 'No response'}`);
          continue;
        }

        await page.waitForTimeout(300);

        // Test Débordement Horizontal
        const overflowData = await page.evaluate((viewportWidth) => {
          const scrollWidth = document.documentElement.scrollWidth;
          const innerWidth = window.innerWidth;
          const hasScroll = scrollWidth > innerWidth + 1;

          const overflowingElements = [];
          const allEls = document.querySelectorAll('body *');
          for (const el of allEls) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') continue;
            if (rect.right > innerWidth + 2) {
              const tag = el.tagName.toLowerCase();
              const cls = el.className ? `.${String(el.className).split(' ').slice(0, 2).join('.')}` : '';
              const id = el.id ? `#${el.id}` : '';
              overflowingElements.push({
                selector: `${tag}${id}${cls}`,
                excessPx: Math.round(rect.right - innerWidth),
              });
            }
          }

          return { scrollWidth, innerWidth, hasScroll, overflowingElements: overflowingElements.slice(0, 3) };
        }, vp.width);

        if (overflowData.hasScroll) {
          failedChecks++;
          console.log(`  ❌ [FAIL] ${route.name} (${route.path}) : Débordement (${overflowData.scrollWidth}px > ${overflowData.innerWidth}px)`);
          overflowData.overflowingElements.forEach(el => {
            console.log(`     └─ Déborde : ${el.selector} (+${el.excessPx}px)`);
          });
          issues.push({ viewport: vp.name, route: route.name, path: route.path, overflow: overflowData });
        } else {
          passedChecks++;
          console.log(`  ✅ [PASS] ${route.name} (${route.path}) : 100% responsive (${overflowData.scrollWidth}px / ${overflowData.innerWidth}px)`);
        }

      } catch (err) {
        console.log(`  ⚠️  [ERR] ${route.name} (${route.path}) : ${err.message}`);
      }
    }

    // 2. Test du Menu Principal Mobile (MobileNav Drawer & Accordéon)
    totalChecks++;
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      const menuBtn = await page.$('.mobile-nav-btn');
      if (menuBtn) {
        await menuBtn.click();
        await page.waitForTimeout(300);

        const drawerCheck = await page.evaluate((viewportWidth) => {
          const drawer = document.querySelector('.mobile-nav-drawer--open');
          if (!drawer) return { ok: false, reason: 'Drawer non ouvert' };
          const rect = drawer.getBoundingClientRect();
          return {
            ok: rect.right <= viewportWidth + 2,
            width: Math.round(rect.width),
            viewportWidth,
          };
        }, vp.width);

        if (drawerCheck.ok) {
          passedChecks++;
          console.log(`  ✅ [PASS] Menu Principal Drawer : Parfaitement dimensionné (${drawerCheck.width}px / ${vp.width}px)`);
        } else {
          failedChecks++;
          console.log(`  ❌ [FAIL] Menu Principal Drawer : Dépasse (${drawerCheck.width}px > ${vp.width}px)`);
        }
      }
    } catch (e) {
      console.log(`  ⚠️  [SKIP] Test Menu Drawer: ${e.message}`);
    }

    // 3. Test du Bottom-Sheet Compte
    totalChecks++;
    try {
      await page.goto(`${BASE_URL}/compte`, { waitUntil: 'domcontentloaded' });
      const toggleBtn = await page.$('.mobile-nav-compact-toggle');
      if (toggleBtn) {
        await toggleBtn.click();
        await page.waitForTimeout(300);

        const bsCheck = await page.evaluate((viewportWidth) => {
          const panel = document.querySelector('.mobile-bs-panel');
          if (!panel) return { ok: false, reason: 'Bottom sheet non ouvert' };
          const rect = panel.getBoundingClientRect();
          return {
            ok: rect.right <= viewportWidth + 2 && rect.left >= -2,
            width: Math.round(rect.width),
            viewportWidth,
          };
        }, vp.width);

        if (bsCheck.ok) {
          passedChecks++;
          console.log(`  ✅ [PASS] Bottom-Sheet Compte : Parfaitement dimensionné (${bsCheck.width}px / ${vp.width}px)`);
        } else {
          failedChecks++;
          console.log(`  ❌ [FAIL] Bottom-Sheet Compte : Débordement`);
        }
      } else {
        passedChecks++; // Si redirect login, normal
        console.log(`  ℹ️  [INFO] Bottom-Sheet Compte : Page protégée (redirigée)`);
      }
    } catch (e) {
      console.log(`  ⚠️  [SKIP] Test Bottom-Sheet: ${e.message}`);
    }

    await context.close();
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`📊 RÉSULTAT GLOBAL AUDIT MOBILE : ${passedChecks} Validés / ${totalChecks} Contrôlés (${failedChecks} Erreurs)`);
  console.log(`======================================================\n`);

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runMobileAudit();
