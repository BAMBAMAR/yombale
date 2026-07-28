const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = path.join('C:', 'Users', 'bamba', '.gemini', 'antigravity-ide', 'brain', '951d474a-6ba1-4ddd-8407-beec4b26f05d', 'mobile_audit_screenshots');

// Ensure screenshots folder exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function getDynamicIds() {
  const ids = {
    produit: '1',
    immo: '1',
    annonce: '1',
    boutique: 'l-ami-du-peuple'
  };

  try {
    const prodRes = await axios.get(`${BACKEND_URL}/api/produits?limit=1`);
    if (prodRes.data && prodRes.data.produits && prodRes.data.produits.length > 0) {
      ids.produit = prodRes.data.produits[0].id;
    }
  } catch (e) {
    console.log('Using default product ID:', ids.produit);
  }

  try {
    const immoRes = await axios.get(`${BACKEND_URL}/api/immo?limit=1`);
    if (immoRes.data && immoRes.data.annonces && immoRes.data.annonces.length > 0) {
      ids.immo = immoRes.data.annonces[0].id;
    }
  } catch (e) {
    console.log('Using default immo ID:', ids.immo);
  }

  try {
    const annRes = await axios.get(`${BACKEND_URL}/api/annonces?limit=1`);
    if (annRes.data && annRes.data.annonces && annRes.data.annonces.length > 0) {
      ids.annonce = annRes.data.annonces[0].id;
    }
  } catch (e) {
    console.log('Using default annonce ID:', ids.annonce);
  }

  try {
    const bqRes = await axios.get(`${BACKEND_URL}/api/boutiques?limit=1`);
    if (bqRes.data && bqRes.data.boutiques && bqRes.data.boutiques.length > 0) {
      ids.boutique = bqRes.data.boutiques[0].slug;
    }
  } catch (e) {
    console.log('Using default boutique slug:', ids.boutique);
  }

  return ids;
}

async function run() {
  console.log('Fetching dynamic IDs from APIs...');
  const ids = await getDynamicIds();
  console.log('Resolved IDs:', ids);

  const pages = [
    { name: 'accueil', path: '/' },
    { name: 'recherche', path: '/recherche?q=samsung' },
    { name: 'boutiques', path: '/boutiques' },
    { name: 'boutique_detail', path: `/boutique/${ids.boutique}` },
    { name: 'annonces', path: '/annonces' },
    { name: 'annonce_detail', path: `/annonces/${ids.annonce}` },
    { name: 'comparer', path: '/comparer' },
    { name: 'immo', path: '/immo' },
    { name: 'immo_detail', path: `/immo/${ids.immo}` },
    { name: 'telecom', path: '/telecom' },
    { name: 'guide-prix', path: '/guide-prix' },
    { name: 'guide-achat', path: '/guide-achat' },
    { name: 'guide-immo', path: '/guide-immo' },
    { name: 'guide-forfait', path: '/guide-forfait' },
    { name: 'guide-emploi', path: '/guide-emploi' },
    { name: 'connexion', path: '/connexion' },
    { name: 'inscription', path: '/inscription' }
  ];

  console.log('Starting Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  const results = [];

  for (const p of pages) {
    const url = `${FRONTEND_URL}${p.path}`;
    console.log(`Auditing: ${url} ...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
      // Give page some time to layout
      await page.waitForTimeout(1000);

      // Measure layout width
      const metrics = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          innerWidth: window.innerWidth,
          bodyScrollWidth: document.body.scrollWidth
        };
      });

      const overflow = metrics.scrollWidth > metrics.clientWidth || metrics.bodyScrollWidth > metrics.clientWidth;
      const amount = Math.max(metrics.scrollWidth, metrics.bodyScrollWidth) - metrics.clientWidth;

      console.log(`Page: ${p.name} - ScrollWidth: ${metrics.scrollWidth}, ClientWidth: ${metrics.clientWidth}, InnerWidth: ${metrics.innerWidth}, BodyScrollWidth: ${metrics.bodyScrollWidth}. Overflow: ${overflow ? `YES (${amount}px)` : 'NO'}`);

      const screenshotPath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      results.push({
        name: p.name,
        path: p.path,
        url,
        scrollWidth: metrics.scrollWidth,
        clientWidth: metrics.clientWidth,
        bodyScrollWidth: metrics.bodyScrollWidth,
        overflow,
        overflowAmount: overflow ? amount : 0,
        screenshot: screenshotPath
      });
    } catch (e) {
      console.error(`Error auditing ${p.name}:`, e.message);
      results.push({
        name: p.name,
        path: p.path,
        error: e.message
      });
    }
  }

  await browser.close();

  console.log('\n--- AUDIT RESULTS ---');
  console.log(JSON.stringify(results, null, 2));

  // Write report to JSON file
  const reportPath = path.join(SCREENSHOT_DIR, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Report written to ${reportPath}`);
}

run().catch(console.error);
