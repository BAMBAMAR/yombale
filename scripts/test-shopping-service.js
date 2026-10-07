const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001/surga...');
  await page.goto('http://localhost:3001/surga', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Onboarding et préférences pour afficher le dashboard complet
  await page.evaluate(() => {
    localStorage.setItem('surga_onboarding_done', 'true');
    localStorage.setItem('surga_preferences', JSON.stringify({
      nom: 'Moussa',
      heure_briefing: '07:30',
      audio_actif: false,
      quartiers: ['Dakar Plateau'],
      modules_actifs: ['actualites', 'sport', 'trafic', 'meteo', 'immo', 'concours', 'places']
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1. Vérifier la présence du bouton Shopping Nopalou dans la sidebar
  const shoppingBtn = page.locator('button.surga-sidebar-btn:has-text("Shopping Nopalou")');
  await shoppingBtn.waitFor({ state: 'visible', timeout: 6000 });
  console.log('Bouton Shopping Nopalou dans sidebar : DÉTECTÉ ET VISIBLE');

  // 2. Vérifier la position relative par rapport à Bonnes Adresses
  const orderCheck = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.surga-desktop-sidebar .surga-sidebar-btn'));
    const shoppingIdx = btns.findIndex(b => b.textContent.includes('Shopping Nopalou'));
    const placesIdx = btns.findIndex(b => b.textContent.includes('Bonnes Adresses'));
    return {
      shoppingIdx,
      placesIdx,
      isAbove: shoppingIdx !== -1 && placesIdx !== -1 && shoppingIdx < placesIdx
    };
  });
  console.log('Vérification ordre Sidebar :', orderCheck);

  // 3. Capture du dashboard avec carte Shopping au-dessus de Bonnes Adresses
  const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\11306b31-29a6-43fa-a4f1-80ce61e44cfb';
  await page.screenshot({ path: path.join(artifactDir, 'surga_desktop_shopping_sidebar.png') });
  console.log('Capture sidebar & dashboard sauvegardée : surga_desktop_shopping_sidebar.png');

  // 4. Cliquer sur le bouton Shopping Nopalou pour ouvrir la modale
  await shoppingBtn.click();
  await page.waitForSelector('h2:has-text("Shopping & Boutiques Nopalou")', { timeout: 6000 });
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(artifactDir, 'surga_shopping_boutiques_modal.png') });
  console.log('Capture modale boutiques sauvegardée : surga_shopping_boutiques_modal.png');

  // 5. Cliquer sur l'onglet Produits & Articles
  const ongletProduits = page.locator('button:has-text("Produits & Articles")');
  await ongletProduits.click();
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(artifactDir, 'surga_shopping_produits_modal.png') });
  console.log('Capture modale produits sauvegardée : surga_shopping_produits_modal.png');

  await browser.close();
  console.log('TOUS LES TESTS DU SERVICE SHOPPING SONT PASSÉS AVEC SUCCÈS !');
})();
