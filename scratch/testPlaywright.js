const { chromium } = require('playwright');

async function testPlaywright() {
  console.log("Launching playwright...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'fr-FR'
  });
  const page = await context.newPage();
  
  try {
    console.log("Navigating to decathlon.sn...");
    const response = await page.goto('https://www.decathlon.sn', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log("Status:", response.status());
    
    // Check if Cloudflare blocked us
    const title = await page.title();
    console.log("Title:", title);
    
    if (title.includes('Just a moment') || title.includes('Cloudflare')) {
      console.log("❌ Blocked by Cloudflare challenge.");
    } else {
      console.log("✅ Playwright bypassed successfully!");
    }
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    await browser.close();
  }
}

testPlaywright();
