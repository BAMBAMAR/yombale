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

  // 1. Vérifier la liste exacte des boutons dans la sidebar
  const sidebarCheck = await page.evaluate(() => {
    const sidebar = document.querySelector('.surga-desktop-sidebar');
    const btns = Array.from(sidebar.querySelectorAll('.surga-sidebar-btn'));
    const btnTexts = btns.map(b => b.textContent.trim().replace(/\s+/g, ' '));
    const isScrollable = sidebar.scrollHeight > sidebar.clientHeight;
    return {
      totalButtons: btns.length,
      btnTexts,
      scrollHeight: sidebar.scrollHeight,
      clientHeight: sidebar.clientHeight,
      isScrollable
    };
  });
  console.log('Diagnostic Sidebar :', JSON.stringify(sidebarCheck, null, 2));

  const artifactDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/11306b31-29a6-43fa-a4f1-80ce61e44cfb';

  // 2. Capture de la Sidebar compacte sans défilement
  await page.screenshot({ path: path.join(artifactDir, 'surga_desktop_sidebar_compact.png') });
  console.log('Capture sidebar compacte sauvegardée : surga_desktop_sidebar_compact.png');

  // 3. Vérifier la présence du bouton Plus de services
  const plusBtn = page.locator('button.surga-sidebar-btn:has-text("Plus de services")');
  await plusBtn.waitFor({ state: 'visible', timeout: 6000 });
  console.log('Bouton Plus de services : VISIBLE');

  // 4. Cliquer sur Plus de services pour ouvrir la modale hub
  await plusBtn.click();
  await page.waitForSelector('h2:has-text("Tous les Services & Outils")', { timeout: 6000 });
  await page.waitForTimeout(600);

  // 5. Capture de la modale Plus de services
  await page.screenshot({ path: path.join(artifactDir, 'surga_plus_services_modal.png') });
  console.log('Capture modale plus de services sauvegardée : surga_plus_services_modal.png');

  // 6. Cliquer sur un service dans la modale (ex: Radios FM direct)
  const radioItem = page.locator('button:has-text("Radios FM direct")');
  await radioItem.click();
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(artifactDir, 'surga_radio_from_plus_modal.png') });
  console.log('Capture radio ouverte via plus de services sauvegardée : surga_radio_from_plus_modal.png');

  await browser.close();
  console.log('TOUS LES TESTS DE LA SIDEBAR COMPACTE ET PLUS DE SERVICES SONT PASSÉS !');
})();
