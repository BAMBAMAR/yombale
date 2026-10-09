const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Initialisation du localStorage pour simuler un utilisateur avec onboarding terminé
  await page.addInitScript(() => {
    localStorage.setItem('surga_onboarding_done', 'true');
    localStorage.setItem('surga_preferences', JSON.stringify({
      modules_actifs: ['briefing', 'meteo', 'actualites', 'trafic', 'notes', 'depenses', 'calculatrice', 'agenda'],
      heure_briefing: '07:30',
      langue: 'fr',
      quartiers: ['Dakar Plateau'],
      equipes_suivies: [],
      audio_actif: false,
      onboarding_termine: true,
      sidebar_services: ['trafic', 'presse', 'immo', 'shopping', 'places'],
      rail_widgets: ['agenda', 'depenses', 'trafic', 'meteo', 'notes', 'radios']
    }));
  });

  console.log('Navigation vers http://localhost:3001/surga...');
  await page.goto('http://localhost:3001/surga', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const outDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/d945acfc-6c9e-4f55-b868-6b697c682587';

  // 1. Capture écran d'accueil avec rail droit contenant le widget Radio
  const pathAccueil = path.join(outDir, 'surga_desktop_radio_widget.png');
  await page.screenshot({ path: pathAccueil, fullPage: false });
  console.log('Capture 1 sauvegardée :', pathAccueil);

  // 2. Navigation vers Réglages (clic sur le bouton Réglages dans la sidebar)
  const btnReglages = page.locator('.surga-sidebar-footer button:has-text("Réglages")');
  if (await btnReglages.isVisible()) {
    await btnReglages.click();
    await page.waitForTimeout(1000);
    const pathReglages = path.join(outDir, 'surga_reglages_personnalisation.png');
    await page.screenshot({ path: pathReglages, fullPage: false });
    console.log('Capture 2 (Réglages) sauvegardée :', pathReglages);

    // Clic sur l'onglet "Bande droite"
    const btnBandeDroite = page.locator('button:has-text("Bande droite")');
    if (await btnBandeDroite.isVisible()) {
      await btnBandeDroite.click();
      await page.waitForTimeout(500);
      const pathBandeDroite = path.join(outDir, 'surga_reglages_bande_droite.png');
      await page.screenshot({ path: pathBandeDroite, fullPage: false });
      console.log('Capture 3 (Bande droite) sauvegardée :', pathBandeDroite);
    }
  }

  await browser.close();
  console.log('Test Playwright terminé avec succès !');
}

main().catch((err) => {
  console.error('Erreur Playwright :', err);
  process.exit(1);
});
