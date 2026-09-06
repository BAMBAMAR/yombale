import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const publicIcons = path.join(root, 'public', 'icons');
const publicDir = path.join(root, 'public');
const appDir = path.join(root, 'src', 'app');
const brainDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/625926d7-c699-41d1-b72d-28dcfc5ffd7e';

// Canonical Master Squircle SVG (Mathematical 1:1 geometry, 100% quad-symmetric, no Lamé distortion, authentic 4-stop solar gradient)
function createMasterSquircleSvg(size = 512) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <!-- Official Nopalou Luxury 4-Stop Solar Gradient (Equally balanced diagonal) -->
    <linearGradient id="nopalouBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7E22"/>
      <stop offset="35%" stop-color="#EA580C"/>
      <stop offset="70%" stop-color="#C75B00"/>
      <stop offset="100%" stop-color="#9E3C00"/>
    </linearGradient>
  </defs>

  <!-- 100% Transparent Canvas Background -->

  <!-- Brand Continuous Squircle: quad-symmetric, rx=118 (25.65% curvature), perfectly centered -->
  <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#nopalouBrandGrad)"/>

  <!-- Iconic Pure White Geometric 'N' Monogram: 100% horizontal & vertical symmetry (68px stems, 94px/82px margins) -->
  <path fill-rule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
</svg>`;
}

// Apple Touch Icon (180x180, Full-bleed solar gradient as iOS applies its own native squircle mask, centered N)
function createAppleIconSvg(size = 180) {
  const nScale = (size * 0.62) / 512;
  const nOffset = (size - 512 * nScale) / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7E22"/>
      <stop offset="35%" stop-color="#EA580C"/>
      <stop offset="70%" stop-color="#C75B00"/>
      <stop offset="100%" stop-color="#9E3C00"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#appleGrad)"/>
  <g transform="translate(${nOffset.toFixed(2)}, ${nOffset.toFixed(2)}) scale(${nScale.toFixed(4)})">
    <path fill-rule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
  </g>
</svg>`;
}

// Maskable Icon (Full-bleed solar gradient, safe-zone N)
function createMaskableSvg(size = 512) {
  const nScale = (size * 0.58) / 512;
  const nOffset = (size - 512 * nScale) / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="maskableGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7E22"/>
      <stop offset="35%" stop-color="#EA580C"/>
      <stop offset="70%" stop-color="#C75B00"/>
      <stop offset="100%" stop-color="#9E3C00"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#maskableGrad)"/>
  <g transform="translate(${nOffset.toFixed(2)}, ${nOffset.toFixed(2)}) scale(${nScale.toFixed(4)})">
    <path fill-rule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
  </g>
</svg>`;
}

async function run() {
  console.log('--- Generating Master Vector SVGs ---');
  const svgMaster = createMasterSquircleSvg(512);
  const svgApple = createAppleIconSvg(180);
  const svgMaskable = createMaskableSvg(512);

  fs.writeFileSync(path.join(publicIcons, 'icon-512.svg'), svgMaster, 'utf8');
  fs.writeFileSync(path.join(publicIcons, 'icon-192.svg'), createMasterSquircleSvg(192), 'utf8');
  fs.writeFileSync(path.join(publicIcons, 'logo-mark.svg'), svgMaster, 'utf8');
  fs.writeFileSync(path.join(publicIcons, 'icon-maskable-512.svg'), svgMaskable, 'utf8');

  console.log('--- Rendering Exact 1:1 Pixel-Perfect PNGs via Playwright Chromium ---');
  const browser = await chromium.launch();

  async function renderPng(svgContent, outPath, targetSize) {
    // deviceScaleFactor: 1 ensures EXACT 1:1 target pixel dimensions without downsampling or fuzzy interpolation
    const page = await browser.newPage({
      viewport: { width: targetSize, height: targetSize },
      deviceScaleFactor: 1
    });

    await page.setContent(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { width:${targetSize}px; height:${targetSize}px; background:transparent; overflow:hidden; display:flex; align-items:center; justify-content:center; }
      svg { width:100%; height:100%; display:block; }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
</html>`);

    await page.screenshot({
      path: outPath,
      omitBackground: true,
      type: 'png'
    });
    await page.close();

    // Verify dimensions
    const checkPage = await browser.newPage();
    await checkPage.goto('file:///' + outPath.replace(/\\/g, '/'));
    const dims = await checkPage.evaluate(() => ({
      w: document.querySelector('img').naturalWidth,
      h: document.querySelector('img').naturalHeight
    }));
    await checkPage.close();

    console.log(`Rendered: ${path.basename(outPath)} -> ${dims.w}x${dims.h} px (target: ${targetSize}x${targetSize})`);
  }

  // 1. Standalone PWA Icons (Transparent background, Squircle, Rich Gradient)
  await renderPng(svgMaster, path.join(publicIcons, 'icon-1024.png'), 1024);
  await renderPng(svgMaster, path.join(publicIcons, 'icon-512.png'), 512);
  await renderPng(svgMaster, path.join(publicIcons, 'icon-192.png'), 192);

  // 2. Favicons
  await renderPng(svgMaster, path.join(publicIcons, 'favicon-32x32.png'), 32);
  await renderPng(svgMaster, path.join(publicIcons, 'favicon-16x16.png'), 16);

  // 3. Maskable Icons (Full-bleed orange gradient, safe-zone N)
  await renderPng(svgMaskable, path.join(publicIcons, 'icon-maskable-1024.png'), 1024);
  await renderPng(svgMaskable, path.join(publicIcons, 'icon-maskable-512.png'), 512);
  await renderPng(svgMaskable, path.join(publicIcons, 'icon-maskable-192.png'), 192);

  // 4. Apple Touch Icon (Full bleed for iOS native squircle mask)
  await renderPng(svgApple, path.join(publicDir, 'apple-icon.png'), 180);
  await renderPng(svgApple, path.join(appDir, 'apple-icon.png'), 180);

  // 5. Generate Realistic Mobile Splash Screen Preview (Pure White #FFFFFF, Floating Squircle, No Text)
  const splashPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });

  const icon512Base64 = fs.readFileSync(path.join(publicIcons, 'icon-512.png')).toString('base64');

  await splashPage.setContent(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width: 100vw;
        height: 100vh;
        background-color: #FFFFFF;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .icon-container {
        width: 160px;
        height: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon-container img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <div class="icon-container">
      <img src="data:image/png;base64,${icon512Base64}" alt="Nopalou Logo" />
    </div>
  </body>
</html>`);

  const previewPath = path.join(brainDir, 'splash_master_preview.png');
  await splashPage.screenshot({ path: previewPath, type: 'png' });
  await splashPage.close();
  console.log(`Generated Splash Preview: ${previewPath}`);

  await browser.close();
  console.log('All Master Icons & Preview generated successfully with 100% exact dimensions!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
