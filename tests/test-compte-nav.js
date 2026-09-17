const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');

const b64 = (s) => Buffer.from(typeof s === 'string' ? s : JSON.stringify(s)).toString('base64url');
const h = b64({ alg: 'HS256', typ: 'JWT' });
const now = Math.floor(Date.now() / 1000);
const p = b64({ userId: '198c9309-86c2-4129-926c-371d0ceec4a2', nom: 'AMAR', email: 'skyteltelecomssenegal@gmail.com', iat: now, exp: now + 7 * 86400 });
const sig = crypto.createHmac('sha256', '6WW9lNRRSvAtYuwQvx5HzSSQsOy6Syv10jpVHrrsk8g').update(h + '.' + p).digest('base64url');
const token = h + '.' + p + '.' + sig;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  await context.addCookies([{
    name: 'nopalou_session',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax'
  }]);

  const page = await context.newPage();

  // 1. Desktop /compte
  console.log('Visiting desktop /compte...');
  await page.goto('http://localhost:3001/compte', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch_compte_desktop.png' });

  // 2. Desktop /compte?tab=mes-annonces
  console.log('Visiting desktop /compte?tab=mes-annonces...');
  await page.goto('http://localhost:3001/compte?tab=mes-annonces', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch_annonces_desktop.png' });

  // 3. Mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  console.log('Visiting mobile /compte...');
  await page.goto('http://localhost:3001/compte', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch_compte_mobile.png' });

  const mobileCompteInfo = await page.evaluate(() => {
    return {
      sidebarVisible: document.querySelector('.account-sidebar')?.offsetParent !== null,
      identityCardVisible: document.querySelector('.account-sidebar-identity-card')?.offsetParent !== null,
      bottomSheetNavVisible: document.querySelector('.mobile-nav-compact--account')?.offsetParent !== null,
      mobileHeaderVisible: document.querySelector('.account-mobile-header')?.offsetParent !== null,
      publicHeaderVisible: document.querySelector('header[role="banner"]')?.offsetParent !== null,
      publicBottomNavVisible: document.querySelector('.mobile-bottom-nav')?.offsetParent !== null,
    };
  });
  console.log('Mobile /compte info:', JSON.stringify(mobileCompteInfo, null, 2));

  // 4. Mobile /compte?tab=mes-annonces
  console.log('Visiting mobile /compte?tab=mes-annonces...');
  await page.goto('http://localhost:3001/compte?tab=mes-annonces', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch_annonces_mobile.png' });

  const mobileAnnoncesInfo = await page.evaluate(() => {
    return {
      sidebarVisible: document.querySelector('.account-sidebar')?.offsetParent !== null,
      sidebarSubVisible: document.querySelector('.account-sidebar--sub')?.offsetParent !== null,
      identityCardVisible: document.querySelector('.account-sidebar-identity-card')?.offsetParent !== null,
      bottomSheetNavVisible: document.querySelector('.mobile-nav-compact--account')?.offsetParent !== null,
      mobileHeaderVisible: document.querySelector('.account-mobile-header')?.offsetParent !== null,
      backLinkVisible: document.querySelector('.account-back-link')?.offsetParent !== null,
      dashboardBackBtnVisible: Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Tableau de bord') && b.offsetParent !== null),
      publicHeaderVisible: document.querySelector('header[role="banner"]')?.offsetParent !== null,
      publicBottomNavVisible: document.querySelector('.mobile-bottom-nav')?.offsetParent !== null,
    };
  });
  console.log('Mobile /compte?tab=mes-annonces info:', JSON.stringify(mobileAnnoncesInfo, null, 2));

  // 5. Mobile /compte?tab=profil
  console.log('Visiting mobile /compte?tab=profil...');
  await page.goto('http://localhost:3001/compte?tab=profil', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch_profil_mobile.png' });

  // 6. Mobile /favoris
  console.log('Visiting mobile /favoris...');
  await page.goto('http://localhost:3001/favoris', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch_favoris_mobile.png' });

  await browser.close();
  console.log('AUDIT DIAGNOSTIC COMPLETED SUCCESSFULLY');
})();
