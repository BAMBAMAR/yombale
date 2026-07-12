// backend/scripts/fb-login-setup.js
// Ouvre un navigateur visible pour se connecter manuellement à Facebook (gère le 2FA),
// puis sauvegarde la session (cookies + storage) dans backend/.fb-session.json.
// Cette session est ensuite lue par scraper-immo-facebook.js pour scraper sans
// re-remplir le formulaire de connexion.
//
// Usage : node backend/scripts/fb-login-setup.js
//
// Pour déployer cette session sur Render (le fichier est gitignoré, il ne part pas
// avec le code) : copier le contenu de backend/.fb-session.json dans la variable
// d'environnement Render FB_SESSION_JSON (coller le JSON tel quel, sur une seule ligne).

const path = require('path');
const fs   = require('fs');

let playwright;
try { playwright = require('playwright'); }
catch {
  console.error('playwright non installé. Lancez : npm install playwright && npx playwright install chromium');
  process.exit(1);
}

const SESSION_FILE = path.join(__dirname, '../.fb-session.json');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
    locale: 'fr-FR',
  });
  const page = await ctx.newPage();

  console.log('Ouverture de facebook.com — connectez-vous manuellement (email/mot de passe + 2FA si demandé).');
  await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });

  console.log('Une fois connecté et sur votre fil d\'actualité, revenez ici et appuyez sur Entrée.');
  await new Promise(resolve => {
    process.stdin.resume();
    process.stdin.once('data', () => resolve());
  });

  await ctx.storageState({ path: SESSION_FILE });
  console.log('Session sauvegardée dans', SESSION_FILE);
  console.log('Pour la déployer sur Render : copiez le contenu de ce fichier dans la variable d\'env FB_SESSION_JSON.');

  await browser.close();
  process.exit(0);
})();
