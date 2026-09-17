// scripts/qa-campaign/02-mobile-responsive-audit.mjs
// Audit Responsive Multi-Écrans (9 Viewports) & PWA Manifest
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

const VIEWPORTS = [
  { name: 'iPhone SE (Ultra Compact)', width: 320, height: 568 },
  { name: 'Android Standard', width: 360, height: 740 },
  { name: 'iPhone Standard (8/SE)', width: 375, height: 667 },
  { name: 'iPhone Moderne (14/15)', width: 390, height: 844 },
  { name: 'iPhone Plus (XR/11)', width: 414, height: 896 },
  { name: 'iPhone Pro Max (15/16)', width: 430, height: 932 },
  { name: 'iPad Portrait (Tablette)', width: 768, height: 1024 },
  { name: 'iPad Paysage (Laptop Mini)', width: 1024, height: 768 },
  { name: 'Desktop Standard', width: 1280, height: 800 },
];

const PAGES_TO_TEST = [
  { path: '/', name: 'Accueil Marketplace' },
  { path: '/immo', name: 'Portail Immobilier' },
  { path: '/connexion', name: 'Connexion' },
  { path: '/inscription', name: 'Inscription' },
  { path: '/telecom', name: 'Comparateur Télécom' },
  { path: '/guide-utilisation', name: 'Guide Utilisateur' },
  { path: '/recherche?q=appartement', name: 'Recherche Biens/Produits' },
  { path: '/tarifs-boutique', name: 'Grille Tarifs Boutique' },
  { path: '/pourquoi-nopalou', name: 'Pourquoi Nopalou' }
];

async function run() {
  console.log('======================================================================');
  console.log('📱 AUDIT PLAYWRIGHT RESPONSIVE SUR 9 VIEWPORTS & VALIDATION PWA');
  console.log(`🌐 Cible: ${BASE_URL}`);
  console.log('======================================================================\n');

  const report = {
    testedAt: new Date().toISOString(),
    viewportsTested: VIEWPORTS.length,
    pagesTested: PAGES_TO_TEST.length,
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    manifestCheck: null,
    anomalies: []
  };

  // 1. Audit PWA Web Manifest
  console.log('--- 1. AUDIT PWA MANIFEST ---');
  try {
    const res = await fetch(`${BASE_URL}/manifest.json`);
    if (res.status === 200) {
      const manifest = await res.json();
      const hasName = Boolean(manifest.name || manifest.short_name);
      const hasIcons = Array.isArray(manifest.icons) && manifest.icons.length > 0;
      const hasStartUrl = Boolean(manifest.start_url);

      if (hasName && hasIcons && hasStartUrl) {
        console.log(`✅ [PWA-01] Manifest PWA valide (Nom: "${manifest.name || manifest.short_name}", ${manifest.icons.length} icônes, start_url: "${manifest.start_url}")`);
        report.manifestCheck = { status: 'PASS', details: manifest };
      } else {
        console.log(`⚠️  [PWA-01] Manifest PWA incomplet :`, manifest);
        report.manifestCheck = { status: 'PARTIAL', details: manifest };
      }
    } else {
      console.log(`❌ [PWA-01] Erreur chargement manifest.json : HTTP ${res.status}`);
      report.manifestCheck = { status: 'FAIL', statusHttp: res.status };
    }
  } catch (err) {
    console.log(`❌ [PWA-01] Exception fetch manifest : ${err.message}`);
    report.manifestCheck = { status: 'ERROR', error: err.message };
  }

  // 2. Audit Responsive Multi-Écrans
  console.log('\n--- 2. AUDIT DÉBORDEMENT HORIZONTAL & ADAPTABILITÉ MULTI-ÉCRANS ---');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error('❌ Impossible de lancer Playwright Chromium :', err.message);
    process.exit(1);
  }

  for (const vp of VIEWPORTS) {
    console.log(`\n🔎 [Viewport ${vp.width}x${vp.height}] ${vp.name}`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await context.newPage();

    for (const p of PAGES_TO_TEST) {
      report.totalChecks++;
      const url = `${BASE_URL}${p.path}`;
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (!response || response.status() >= 400) {
          console.log(`   ⚠️  [HTTP ${response ? response.status() : 'NONE'}] ${p.name}`);
          continue;
        }

        await page.waitForTimeout(200);

        const checkResult = await page.evaluate((expectedWidth) => {
          const scrollW = document.documentElement.scrollWidth;
          const clientW = document.documentElement.clientWidth;
          const bodyScrollW = document.body ? document.body.scrollWidth : 0;
          const effectiveScrollW = Math.max(scrollW, bodyScrollW);
          const hasOverflow = effectiveScrollW > clientW + 1;

          let offenders = [];
          if (hasOverflow) {
            const allElements = document.querySelectorAll('body *');
            for (const el of allElements) {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && r.right > clientW + 1) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
                const id = el.id ? `#${el.id}` : '';
                offenders.push({
                  elem: `${tag}${id}${cls}`,
                  right: Math.round(r.right),
                  excessPx: Math.round(r.right - clientW)
                });
              }
            }
          }

          return {
            scrollW: effectiveScrollW,
            clientW,
            hasOverflow,
            offenders: offenders.slice(0, 3)
          };
        }, vp.width);

        if (checkResult.hasOverflow) {
          report.failedChecks++;
          console.log(`   ❌ [FAIL] ${p.name.padEnd(25)} : Débordement (+${checkResult.scrollW - checkResult.clientW}px)`);
          checkResult.offenders.forEach(o => console.log(`      ↳ Éléments en cause : ${o.elem} (+${o.excessPx}px)`));
          report.anomalies.push({
            viewport: vp.name,
            width: vp.width,
            page: p.name,
            path: p.path,
            scrollWidth: checkResult.scrollW,
            clientWidth: checkResult.clientW,
            offenders: checkResult.offenders
          });
        } else {
          report.passedChecks++;
          console.log(`   ✅ [PASS] ${p.name.padEnd(25)} : Conforme (${checkResult.scrollW}px / ${checkResult.clientW}px)`);
        }
      } catch (navErr) {
        console.log(`   ⚠️  [TIMEOUT] ${p.name} : ${navErr.message.slice(0, 50)}`);
      }
    }

    await context.close();
  }

  await browser.close();

  console.log('\n======================================================================');
  console.log('📊 SYNTHÈSE DE L\'AUDIT RESPONSIVE & MOBILE');
  console.log('======================================================================');
  console.log(`Total vérifications     : ${report.totalChecks}`);
  console.log(`✅ Conformes (PASS)     : ${report.passedChecks}`);
  console.log(`❌ Débordements (FAIL)  : ${report.failedChecks}`);
  console.log(`📱 PWA Manifest Status  : ${report.manifestCheck?.status || 'N/A'}`);

  const outPath = path.resolve('scripts/qa-campaign/report-mobile-responsive.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`💾 Rapport responsive sauvegardé dans : ${outPath}\n`);
}

run();
