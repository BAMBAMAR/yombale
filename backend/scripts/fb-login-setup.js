// backend/scripts/fb-login-setup.js
// Ouvre un navigateur visible pour se connecter manuellement à Facebook (gère le 2FA),
// puis sauvegarde la session (cookies + storage) dans backend/.fb-session.json.

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { chromium } = require('playwright');

const SESSION_FILE = path.join(__dirname, '../.fb-session.json');

async function main() {
  console.log('🌐 Ouverture du navigateur Google Chrome...');
  let browser;
  const launchOptions = {
    headless: false,
    args: [
      '--start-maximized',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  };

  try { 
    browser = await chromium.launch({ 
      ...launchOptions,
      channel: 'chrome'
    });
  } catch (err) {
    console.log('⚠️ Google Chrome non trouvé directement via Playwright, utilisation du Chromium embarqué...');
    browser = await chromium.launch(launchOptions);
  }
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
    locale: 'fr-FR',
    viewport: null
  });
  const page = await ctx.newPage();
  await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });

  console.log('\n👉 Connectez-vous dans la fenêtre du navigateur (email, mot de passe, code 2FA si demandé).');
  console.log('   Une fois connecté sur votre fil d\'actualité :');
  console.log('   - soit fermez la fenêtre du navigateur');
  console.log('   - soit appuyez sur Entrée ici dans le terminal.\n');

  let resolveDone;
  const donePromise = new Promise(resolve => { resolveDone = resolve; });

  page.on('close', () => resolveDone('page_closed'));
  browser.on('disconnected', () => resolveDone('browser_closed'));

  const verifierSession = async () => {
    try {
      const cookies = await ctx.cookies();
      const hasCUser = cookies.some(c => c.name === 'c_user');
      const url = page.url();
      const isAuthPage = url.includes('/login') || url.includes('/checkpoint') || url.includes('two_step_verification');
      return hasCUser && !isAuthPage;
    } catch {
      return false;
    }
  };

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const attendreToucheEntree = () => {
    rl.question('Appuyez sur Entrée une fois connecté > ', async () => {
      const connecte = await verifierSession();
      if (!connecte) {
        console.log('\n⚠️  Connexion non encore finalisée : cookie de session (c_user) absent ou vous êtes encore sur la page de connexion/2FA.');
        console.log('👉  Veuillez terminer la connexion dans la fenêtre Chrome avant d\'appuyer sur Entrée.\n');
        attendreToucheEntree();
      } else {
        rl.close();
        resolveDone('enter_pressed');
      }
    });
  };
  attendreToucheEntree();

  // Détection automatique de la présence du cookie de connexion
  let detected = false;
  const pollInterval = setInterval(async () => {
    try {
      const connecte = await verifierSession();
      if (!detected && connecte) {
        detected = true;
        console.log('\n✨ Session utilisateur Facebook détectée (c_user) !');
        console.log('⏳ Finalisation et sauvegarde automatique dans 5 secondes...');
        setTimeout(() => resolveDone('c_user_auto'), 5000);
      }
    } catch {}
  }, 2000);

  await donePromise;
  clearInterval(pollInterval);
  try { rl.close(); } catch {}

  const cookiesFinaux = await ctx.cookies().catch(() => []);
  const estValide = cookiesFinaux.some(c => c.name === 'c_user');

  try {
    await ctx.storageState({ path: SESSION_FILE });
    if (estValide) {
      console.log(`\n✅ Session Facebook authentifiée sauvegardée avec succès dans ${SESSION_FILE}`);
      console.log('🚀 Vous pouvez maintenant lancer le scraping local avec progression :');
      console.log('   node scripts/sync-immo-local.js --facebook');
    } else {
      console.log(`\n⚠️ Attention : Session sauvegardée dans ${SESSION_FILE} mais sans cookie utilisateur actif (c_user).`);
      console.log('   Si le scraping échoue, relancez : node scripts/fb-login-setup.js et connectez-vous complètement.');
    }
  } catch (err) {
    console.error('Erreur lors de la sauvegarde de la session:', err.message);
  }

  try { await browser.close(); } catch {}
}

main().catch(err => { console.error(err.message); process.exit(1); });
