const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 } // Mobile viewport (iPhone 11)
  });
  const page = await context.newPage();

  const artifactsDir = 'C:\\Users\\bamba\\.gemini\\antigravity-ide\\brain\\4ea78295-74d7-41a7-89b6-4f935d3746a8';

  console.log('Navigating to nopalou.com...');
  await page.goto('https://nopalou.com', { waitUntil: 'networkidle' });
  
  console.log('Taking screenshot of home page...');
  await page.screenshot({ path: path.join(artifactsDir, 'nopalou_home.png') });

  console.log('Navigating to tarifs...');
  await page.goto('https://nopalou.com/tarifs-boutique', { waitUntil: 'networkidle' });
  
  console.log('Taking screenshot of pricing page...');
  await page.screenshot({ path: path.join(artifactsDir, 'nopalou_pricing.png'), fullPage: true });

  console.log('Navigating to promo...');
  try {
    await page.goto('https://nopalou.com/promo', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(artifactsDir, 'nopalou_promo.png'), fullPage: true });
  } catch (e) {
    console.log('Promo page might not be deployed yet.');
  }

  await browser.close();
  console.log('Screenshots saved.');
})();
