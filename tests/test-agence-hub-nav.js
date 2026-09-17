const { chromium } = require('playwright');
const crypto = require('crypto');

const b64 = (s) => Buffer.from(typeof s === 'string' ? s : JSON.stringify(s)).toString('base64url');
const h = b64({ alg: 'HS256', typ: 'JWT' });
const now = Math.floor(Date.now() / 1000);
const p = b64({ userId: '9f51e682-296f-4f57-ac86-98116487a3ed', nom: 'AMAR IMMO', email: 'amar@immo.sn', iat: now, exp: now + 7 * 86400 });
const sig = crypto.createHmac('sha256', '6WW9lNRRSvAtYuwQvx5HzSSQsOy6Syv10jpVHrrsk8g').update(h + '.' + p).digest('base64url');
const token = h + '.' + p + '.' + sig;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  await context.addCookies([
    { name: 'nopalou_session', value: token, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' },
    { name: 'token', value: token, domain: 'localhost', path: '/' },
    { name: 'nopalou_token', value: token, domain: 'localhost', path: '/' }
  ]);

  const page = await context.newPage();
  await page.addInitScript((tok) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('nopalou_token', tok);
    localStorage.setItem('nopalou_auth_token', tok);
  }, token);

  console.log('--- TEST 1: DESKTOP /agence ---');
  await page.goto('http://localhost:3001/agence', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch_agence_hub_desktop.png', fullPage: false });
  console.log('Saved scratch_agence_hub_desktop.png');

  console.log('--- TEST 2: MOBILE /agence ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 750 },
    isMobile: true,
    hasTouch: true
  });
  await mobileContext.addCookies([
    { name: 'nopalou_session', value: token, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' },
    { name: 'token', value: token, domain: 'localhost', path: '/' },
    { name: 'nopalou_token', value: token, domain: 'localhost', path: '/' }
  ]);
  const mobilePage = await mobileContext.newPage();
  await mobilePage.addInitScript((tok) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('nopalou_token', tok);
    localStorage.setItem('nopalou_auth_token', tok);
  }, token);

  await mobilePage.goto('http://localhost:3001/agence', { waitUntil: 'load', timeout: 20000 });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: 'scratch_agence_hub_mobile.png', fullPage: false });
  console.log('Saved scratch_agence_hub_mobile.png');

  console.log('--- TEST 3: DESKTOP /agence/amar-immo ---');
  await page.goto('http://localhost:3001/agence/amar-immo', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch_agence_dashboard_desktop.png', fullPage: false });
  console.log('Saved scratch_agence_dashboard_desktop.png');

  await browser.close();
  console.log('ALL TESTS COMPLETED OK');
})();
