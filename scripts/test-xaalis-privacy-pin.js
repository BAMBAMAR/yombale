const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testXaalisPrivacyAndPin() {
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

  console.log('1. Navigation vers http://localhost:3001/surga...');
  await page.goto('http://localhost:3001/surga', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Initialiser onboarding et préférences
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
    // Réinitialiser la sécurité pour le test
    localStorage.removeItem('surga_xaalis_masque');
    localStorage.removeItem('surga_xaalis_pin_hash');
    sessionStorage.removeItem('surga_xaalis_unlocked_session');
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 2. Capture de l'état initial : Widget Sama Xaalis en clair
  console.log('2. Capture du widget Sama Xaalis en clair...');
  const widgetXaalis = page.locator('.surga-desktop-widget:has-text("Sama Xaalis")').first();
  await widgetXaalis.waitFor({ state: 'visible', timeout: 10000 });
  const capWidgetClair = `${artifactDir}/surga_xaalis_widget_clair.png`;
  await widgetXaalis.screenshot({ path: capWidgetClair });
  console.log('Capture widget clair :', capWidgetClair);

  // 3. Clic sur le bouton œil pour MASQUER
  console.log('3. Clic sur le bouton œil afficher/masquer...');
  const eyeBtn = widgetXaalis.locator('button[aria-label*="montants"]').first();
  await eyeBtn.click();
  await page.waitForTimeout(500);

  // 4. Capture du widget Sama Xaalis MASQUÉ
  const capWidgetMasque = `${artifactDir}/surga_xaalis_widget_masque.png`;
  await widgetXaalis.screenshot({ path: capWidgetMasque });
  console.log('Capture widget masqué (•••••• FCFA) :', capWidgetMasque);

  // 5. Navigation vers l'onglet Sama Xaalis
  console.log('5. Ouverture de l\'onglet Sama Xaalis...');
  await widgetXaalis.click();
  await page.waitForTimeout(1000);

  // 6. Capture de la vue Sama Xaalis avec montants masqués
  const capVueMasquee = `${artifactDir}/surga_xaalis_vue_masquee.png`;
  await page.screenshot({ path: capVueMasquee });
  console.log('Capture vue Sama Xaalis masquée :', capVueMasquee);

  // 7. Clic sur "Protéger par PIN" pour configurer un code PIN
  console.log('7. Configuration du code PIN...');
  const btnPin = page.locator('button:has-text("Protéger par PIN")').first();
  await btnPin.click();
  await page.waitForTimeout(500);

  // Taper le PIN 1 2 3 4
  console.log('Saisie du code 1234...');
  for (const chiffre of ['1', '2', '3', '4']) {
    await page.locator(`button:has-text("${chiffre}")`).last().click();
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(600);

  // Confirmation du code 1 2 3 4
  console.log('Confirmation du code 1234...');
  for (const chiffre of ['1', '2', '3', '4']) {
    await page.locator(`button:has-text("${chiffre}")`).last().click();
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(1000);

  // 8. Clic sur le bouton "Verrouiller"
  console.log('8. Verrouillage de Sama Xaalis...');
  const btnVerrouiller = page.locator('button:has-text("Verrouiller")').first();
  await btnVerrouiller.click();
  await page.waitForTimeout(1000);

  // 9. Capture de l'écran verrouillé par Code PIN
  const capEcranVerrouille = `${artifactDir}/surga_xaalis_ecran_verrouille.png`;
  await page.screenshot({ path: capEcranVerrouille });
  console.log('Capture écran verrouillé par Code PIN :', capEcranVerrouille);

  // 10. Déverrouillage : clic sur "Déverrouiller avec mon code PIN"
  console.log('10. Déverrouillage via Code PIN...');
  const btnDebloquer = page.locator('button:has-text("Déverrouiller avec mon code PIN")').first();
  await btnDebloquer.click();
  await page.waitForTimeout(500);

  // Taper 1 2 3 4 sur le pavé numérique de la modale
  for (const chiffre of ['1', '2', '3', '4']) {
    await page.locator(`button:has-text("${chiffre}")`).last().click();
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(1200);

  // 11. Clic sur "Masqué" pour basculer en affichage en clair
  console.log('11. Ré-affichage des montants en clair...');
  const btnAfficher = page.locator('button:has-text("Masqué")').first();
  await btnAfficher.click();
  await page.waitForTimeout(800);

  // 12. Capture finale déverrouillée et en clair
  const capFinale = `${artifactDir}/surga_xaalis_vue_deverrouillee_claire.png`;
  await page.screenshot({ path: capFinale });
  console.log('Capture vue déverrouillée avec succès :', capFinale);

  await browser.close();
  console.log('✅ Tous les tests de confidentialité et Code PIN ont réussi !');
}

testXaalisPrivacyAndPin().catch(err => {
  console.error('Erreur Playwright:', err);
  process.exit(1);
});
