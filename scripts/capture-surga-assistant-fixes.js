const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const artifactDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/11306b31-29a6-43fa-a4f1-80ce61e44cfb';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Navigation initiale vers http://localhost:3001/surga...');
  await page.goto('http://localhost:3001/surga', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Initialisation du localStorage pour accéder directement au dashboard actif
  await page.evaluate(() => {
    localStorage.setItem('surga_onboarding_done', 'true');
    localStorage.setItem('surga_preferences', JSON.stringify({
      nom: 'Moussa',
      quartiers: ['Dakar Plateau'],
      sources: ['aps', 'seneweb'],
      centresInteret: ['actualite', 'economie'],
      heureBriefing: '07:30',
      voixActivee: false
    }));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const inputSelector = '.surga-command-input';
  await page.waitForSelector(inputSelector, { timeout: 10000 });

  // 1. Test Reformulation
  console.log('Test 1 : Requête reformulation...');
  const reqReformulation = "reformule :c'est avec une grande tristesse que je quitte ce service";
  await page.fill(inputSelector, reqReformulation);
  await page.press(inputSelector, 'Enter');

  // Attendre la modal de réponse
  await page.waitForSelector('.surga-modal-backdrop', { timeout: 10000 });
  await page.waitForTimeout(2500);

  const screenshotReformulation = `${artifactDir}/surga_assistant_reformulation_tristesse.png`;
  await page.screenshot({ path: screenshotReformulation, fullPage: false });
  console.log('Capture 1 enregistrée :', screenshotReformulation);

  // Fermer la modale
  const closeBtn = page.locator('button[aria-label="Fermer"]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(1000);

  // 2. Test Dette 3000
  console.log('Test 2 : Requête dette 3000...');
  await page.fill(inputSelector, 'dette 3000');
  await page.press(inputSelector, 'Enter');

  await page.waitForSelector('.surga-modal-backdrop', { timeout: 10000 });
  await page.waitForTimeout(2500);

  const screenshotDette = `${artifactDir}/surga_assistant_action_dette_3000.png`;
  await page.screenshot({ path: screenshotDette, fullPage: false });
  console.log('Capture 2 enregistrée :', screenshotDette);

  await browser.close();
  console.log('Tests et captures terminés avec succès.');
}

run().catch(err => {
  console.error('Erreur Playwright:', err);
  process.exit(1);
});
