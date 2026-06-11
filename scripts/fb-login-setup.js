// scripts/fb-login-setup.js
// Connexion manuelle unique à Facebook (gère le 2FA) → sauvegarde la session
// dans backend/.fb-session.json, réutilisée ensuite par le scraper Facebook.
//
// Utilisation :
//   node scripts/fb-login-setup.js
//   → un navigateur s'ouvre, connectez-vous (email + mot de passe + code 2FA si demandé)
//   → une fois sur le fil d'actualité Facebook, revenez ici et appuyez sur Entrée

require('dotenv').config();
const path = require('path');
const readline = require('readline');
const { chromium } = require('playwright');

const SESSION_FILE = path.join(__dirname, '../backend/.fb-session.json');

async function main() {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
    locale: 'fr-FR',
  });
  const page = await ctx.newPage();
  await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });

  console.log('\n👉 Connectez-vous dans la fenêtre du navigateur (email, mot de passe, code 2FA si demandé).');
  console.log('   Une fois sur votre fil d\'actualité Facebook, revenez ici et appuyez sur Entrée...\n');

  await new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Appuyez sur Entrée une fois connecté > ', () => { rl.close(); resolve(); });
  });

  await ctx.storageState({ path: SESSION_FILE });
  console.log(`\n✅ Session sauvegardée dans ${SESSION_FILE}`);
  console.log('   Vous pouvez maintenant lancer : node scripts/sync-immo-local.js --facebook --dry');

  await browser.close();
}

main().catch(err => { console.error(err.message); process.exit(1); });
