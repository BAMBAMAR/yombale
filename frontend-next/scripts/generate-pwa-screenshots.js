const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop Screenshot (1280x720)
    console.log('Capturing Desktop Screenshot...');
    const desktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopCtx.newPage();
    await desktopPage.goto('https://nopalou.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await desktopPage.waitForTimeout(2000);
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-1.png'),
      type: 'png',
    });
    await desktopCtx.close();
    console.log('Desktop captured.');

    // 2. Mobile Screenshot (750x1334)
    console.log('Capturing Mobile Screenshot...');
    const mobileCtx = await browser.newContext({
      viewport: { width: 750, height: 1334 },
      deviceScaleFactor: 1,
      isMobile: true,
    });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto('https://nopalou.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await mobilePage.waitForTimeout(2000);
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-1.png'),
      type: 'png',
    });
    await mobileCtx.close();
    console.log('Mobile captured.');

    console.log('✅ PWA Screenshots generated successfully.');
  } catch (err) {
    console.error('Error capturing screenshots:', err);
  } finally {
    await browser.close();
  }
})();
