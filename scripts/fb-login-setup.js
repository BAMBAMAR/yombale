// scripts/fb-login-setup.js
// Connexion manuelle unique à Facebook (gère le 2FA) → sauvegarde la session
// dans backend/.fb-session.json, réutilisée ensuite par le scraper Facebook.
//
// Utilisation :
//   node scripts/fb-login-setup.js

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { chromium } = require('playwright');

const SESSION_FILE = path.join(__dirname, '../backend/.fb-session.json');

async function main() {
  console.log('🌐 Ouverture du navigateur Chromium...');
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
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

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Appuyez sur Entrée une fois connecté > ', () => {
    rl.close();
    resolveDone('enter_pressed');
  });

  // Détection automatique de la présence du cookie de connexion
  const pollInterval = setInterval(async () => {
    try {
      const cookies = await ctx.cookies();
      if (cookies.some(c => c.name === 'c_user')) {
        console.log('✨ Session utilisateur Facebook détectée (c_user).');
      }
    } catch {}
  }, 3000);

  await donePromise;
  clearInterval(pollInterval);
  try { rl.close(); } catch {}

  try {
    await ctx.storageState({ path: SESSION_FILE });
    console.log(`\n✅ Session sauvegardée avec succès dans ${SESSION_FILE}`);
    console.log('   Vous pouvez maintenant lancer : node scripts/sync-immo-local.js --facebook --dry');
  } catch (err) {
    console.error('Erreur lors de la sauvegarde de la session:', err.message);
  }

  try { await browser.close(); } catch {}
}

main().catch(err => { console.error(err.message); process.exit(1); });
