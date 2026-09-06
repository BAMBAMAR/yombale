import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const publicIcons = path.join(root, 'public', 'icons');
const svgAny = fs.readFileSync(path.join(publicIcons, 'icon-512.svg'), 'utf8');
const svgMaskable = fs.readFileSync(path.join(publicIcons, 'icon-maskable-512.svg'), 'utf8');

async function generate() {
  console.log('Launching headless Chromium via Playwright...');
  const browser = await chromium.launch();

  async function render(svgStr, outPath, size) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1
    });

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 100%;
        height: 100%;
        background: transparent;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    </style>
  </head>
  <body>
    ${svgStr}
  </body>
</html>`;

    await page.setContent(html);
    await page.screenshot({
      path: outPath,
      omitBackground: true,
      type: 'png'
    });
    await page.close();
    console.log(`Rendered ${path.basename(outPath)} (${size}x${size})`);
  }

  // Backup current icons before replacing
  const backupDir = path.join(publicIcons, 'backup_v13');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    for (const name of ['icon-192.png', 'icon-512.png', 'icon-1024.png', 'icon-maskable-512.png', 'icon-maskable-1024.png']) {
      const srcFile = path.join(publicIcons, name);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, path.join(backupDir, name));
      }
    }
    console.log('Backed up v13 icons to backup_v13/');
  }

  // Generate 'any' icons (transparent background, orange squircle, white N)
  await render(svgAny, path.join(publicIcons, 'icon-192.png'), 192);
  await render(svgAny, path.join(publicIcons, 'icon-512.png'), 512);
  await render(svgAny, path.join(publicIcons, 'icon-1024.png'), 1024);

  // Generate 'maskable' icons (full-bleed orange, safe zone N)
  await render(svgMaskable, path.join(publicIcons, 'icon-maskable-512.png'), 512);
  await render(svgMaskable, path.join(publicIcons, 'icon-maskable-1024.png'), 1024);

  await browser.close();
  console.log('All PWA icons generated successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
