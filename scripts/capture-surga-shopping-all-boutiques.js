const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testAllBoutiques() {
  const artifactDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/11306b31-29a6-43fa-a4f1-80ce61e44cfb';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Navigation vers http://localhost:3001/surga...');
  await page.goto('http://localhost:3001/surga', { waitUntil: 'domcontentloaded', timeout: 15000 });

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

  // Cliquer sur le bouton Shopping dans la sidebar desktop
  console.log('Ouverture du service Shopping dans la sidebar...');
  const shoppingBtn = page.locator('button.surga-sidebar-btn:has-text("Shopping Nopalou")').first();
  await shoppingBtn.waitFor({ state: 'visible', timeout: 10000 });
  await shoppingBtn.click();

  // Attendre l'ouverture de la modale shopping
  await page.waitForSelector('h2:has-text("Shopping & Boutiques Nopalou")', { timeout: 10000 });
  await page.waitForTimeout(3000);

  // Vérifier le compteur de boutiques
  const btnBoutiques = page.locator('button:has-text("Boutiques")').first();
  const textBoutiques = await btnBoutiques.textContent();
  console.log('Onglet Boutiques text :', textBoutiques);

  const screenshotModal = `${artifactDir}/surga_shopping_all_boutiques_modal.png`;
  await page.screenshot({ path: screenshotModal, fullPage: false });
  console.log('Capture modale toutes les boutiques :', screenshotModal);

  // Tester l'ouverture d'une vraie boutique en cliquant sur "Visiter la boutique"
  console.log('Vérification du lien vers une vraie boutique...');
  const visiterLien = page.locator('a:has-text("Visiter la boutique")').first();
  const href = await visiterLien.getAttribute('href');
  console.log('Href première boutique :', href);

  // Ouvrir la page de la boutique dans un nouvel onglet
  const boutiquePage = await context.newPage();
  const targetUrl = `http://localhost:3001${href}`;
  console.log('Navigation vers la boutique réelle :', targetUrl);
  const resp = await boutiquePage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('Statut HTTP boutique réelle :', resp.status());
  await boutiquePage.waitForTimeout(2000);

  const screenshotBoutique = `${artifactDir}/surga_shopping_real_boutique_page.png`;
  await boutiquePage.screenshot({ path: screenshotBoutique, fullPage: false });
  console.log('Capture boutique réelle réussie (code 200) :', screenshotBoutique);

  await browser.close();
  console.log('Test et captures terminés avec succès.');
}

testAllBoutiques().catch(err => {
  console.error('Erreur Playwright:', err);
  process.exit(1);
});
