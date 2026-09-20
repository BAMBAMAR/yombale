import { chromium } from 'playwright';

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Route mocking to test as authenticated agency
  await page.route('**/api/agences/amar', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        agence: { id: 'amar-id', nom: 'AMAR IMMO', slug: 'amar', ville: 'Dakar', statut: 'actif' }
      })
    });
  });

  await page.route('**/api/crm-immo/agence/amar/contacts*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        contacts: [
          { id: 'p1', nom: 'AMAR', statut_crm: 'offre', type_bien_souhaite: 'Appartement', villes_souhaitees: ['Dakar'], probabilite: 70, nb_visites: 1 }
        ]
      })
    });
  });

  await page.route('**/api/agences/agence/amar/notifications', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        notifications: [],
        compteurs: {}
      })
    });
  });

  // Capture screenshot on 360px viewport
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('http://localhost:3001/agence/amar/prospects', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('.immo-chips-scroller', { timeout: 10000 });
  await page.waitForTimeout(600);

  const screenshotPath = 'C:/Users/HP/.gemini/antigravity-ide/brain/5b4153b2-c2ab-464c-ae18-02ee58891394/prospects_chips_fixed.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Capture d'écran enregistrée dans : ${screenshotPath}`);

  await browser.close();
}

runTest().catch(err => {
  console.error('Erreur test:', err);
  process.exit(1);
});
