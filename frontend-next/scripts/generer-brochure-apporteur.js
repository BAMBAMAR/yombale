// Génère public/brochure-apporteur.pdf à partir de la route HTML /assets/brochure-apporteur.
// Usage : lancer `npm run dev` dans un terminal, puis `node scripts/generer-brochure-apporteur.js` dans un autre.
// Ce script n'est JAMAIS exécuté en build/CI — Playwright ne doit pas tourner sur Render (voir CLAUDE.md).
const { chromium } = require('playwright');
const path = require('path');

const URL = process.env.BROCHURE_URL || 'http://localhost:3001/assets/brochure-apporteur';
const OUT = path.join(__dirname, '..', 'public', 'brochure-apporteur.pdf');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const res = await page.goto(URL, { waitUntil: 'networkidle' });
  if (!res || !res.ok()) {
    throw new Error(`Impossible de charger ${URL} — code ${res ? res.status() : 'aucune réponse'}. Le serveur npm run dev tourne-t-il sur le port 3001 ?`);
  }
  await page.pdf({ path: OUT, format: 'A4', printBackground: true });
  await browser.close();
  console.log(`Brochure générée : ${OUT}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
