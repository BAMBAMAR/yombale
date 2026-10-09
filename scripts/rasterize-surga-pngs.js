// scripts/rasterize-surga-pngs.js
// Rendu haute fidélité des assets SVG de Surga en PNG via Playwright headless
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../frontend-next/public/surga/icons');

async function rasterize() {
  console.log('[START] Lancement du moteur Chromium pour la rastérisation PNG haute fidélité...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const tasks = [
    { svg: 'icon-512.svg', png: 'icon-512.png', width: 512, height: 512 },
    { svg: 'icon-192.svg', png: 'icon-192.png', width: 192, height: 192 },
    { svg: 'icon-maskable-512.svg', png: 'icon-maskable-512.png', width: 512, height: 512 },
    { svg: 'icon-maskable-192.svg', png: 'icon-maskable-192.png', width: 192, height: 192 },
    { svg: 'icon-512.svg', png: 'surga-whatsapp-avatar.png', width: 512, height: 512 },
    { svg: 'surga-symbol.svg', png: 'surga-symbol.png', width: 512, height: 512 },
  ];

  for (const task of tasks) {
    const svgPath = path.join(iconsDir, task.svg);
    const pngPath = path.join(iconsDir, task.png);

    if (!fs.existsSync(svgPath)) {
      console.warn(`[WARN] Fichier introuvable : ${svgPath}`);
      continue;
    }

    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { width: ${task.width}px; height: ${task.height}px; background: transparent; overflow: hidden; }
            svg { width: 100%; height: 100%; display: block; }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `;

    await page.setViewportSize({ width: task.width, height: task.height });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: pngPath, omitBackground: true });
    const stat = fs.statSync(pngPath);
    console.log(`[OK] PNG généré avec succès : ${task.png} (${stat.size} octets)`);
  }

  await browser.close();
  console.log('[FIN] Tous les PNGs ont été générés avec une netteté absolue.');
}

rasterize().catch((err) => {
  console.error('[ERREUR]', err);
  process.exit(1);
});
