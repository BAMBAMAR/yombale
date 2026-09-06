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

// Superellipse path generator (Lamé curve, n=5 continuous curvature)
function generateSuperellipsePath(cx, cy, rx, ry, n = 5.0, segments = 720) {
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const x = cx + Math.sign(cosT) * rx * Math.pow(Math.abs(cosT), 2 / n);
    const y = cy + Math.sign(sinT) * ry * Math.pow(Math.abs(sinT), 2 / n);
    pts.push((i === 0 ? 'M' : 'L') + x.toFixed(3) + ' ' + y.toFixed(3));
  }
  pts.push('Z');
  return pts.join(' ');
}

// Generate Master SVG for Brand Squircle (Transparent background, Superellipse n=5, 4-stop luxury gradient, subtle sheen, white N)
function createMasterSquircleSvg(size = 512) {
  const pad = 24; // breathing room around the squircle
  const radius = (size - pad * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const pathData = generateSuperellipsePath(cx, cy, radius, radius, 5.0, 720);

  // Scaled N geometry inside squircle (N occupies ~60% of squircle for optimal optical weight)
  const nScale = ((radius * 2) * 0.62) / 512;
  const nOffset = (size - 512 * nScale) / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Official Nopalou Luxury 4-Stop Solar Gradient -->
    <linearGradient id="nopalouBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7E22"/>
      <stop offset="35%" stop-color="#EA580C"/>
      <stop offset="70%" stop-color="#C75B00"/>
      <stop offset="100%" stop-color="#9E3C00"/>
    </linearGradient>

    <!-- Subtle Ambient Top Sheen for Depth & Premium Feel -->
    <linearGradient id="nopalouTopSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.00"/>
    </linearGradient>

    <!-- Clip path for the squircle to contain the top sheen -->
    <clipPath id="squircleClip">
      <path d="${pathData}"/>
    </clipPath>
  </defs>

  <!-- 100% Transparent Canvas Background -->

  <!-- Brand Superellipse (Squircle n=5) -->
  <path d="${pathData}" fill="url(#nopalouBrandGrad)"/>

  <!-- Top Glass/Sheen Lighting Layer -->
  <path d="${pathData}" fill="url(#nopalouTopSheen)" clip-path="url(#squircleClip)"/>

  <!-- Iconic Pure White Geometric 'N' Monogram -->
  <g transform="translate(${nOffset.toFixed(2)}, ${nOffset.toFixed(2)}) scale(${nScale.toFixed(4)})">
    <path fill-rule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
  </g>
</svg>`;
}

// Generate Apple Touch Icon (180x180, Full-bleed gradient because iOS applies its own squircle mask)
function createAppleIconSvg(size = 180) {
  const nScale = (size * 0.65) / 512;
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
    <linearGradient id="appleSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.20"/>
      <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.00"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#appleGrad)"/>
  <rect width="${size}" height="${size}" fill="url(#appleSheen)"/>
  <g transform="translate(${nOffset.toFixed(2)}, ${nOffset.toFixed(2)}) scale(${nScale.toFixed(4)})">
    <path fill-rule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
  </g>
</svg>`;
}

async function run() {
  console.log('Generating Master Vector SVGs...');
  const svg512 = createMasterSquircleSvg(512);
  const svg192 = createMasterSquircleSvg(192);
  const svgApple = createAppleIconSvg(180);

  fs.writeFileSync(path.join(publicIcons, 'icon-512.svg'), svg512, 'utf8');
  fs.writeFileSync(path.join(publicIcons, 'icon-192.svg'), svg192, 'utf8');

  console.log('Rendering 4x SSAA High-DPI PNGs via Playwright Chromium...');
  const browser = await chromium.launch();

  async function renderPng(svgContent, outPath, targetSize) {
    // 2x device scale factor for super-sampled anti-aliasing
    const page = await browser.newPage({
      viewport: { width: targetSize, height: targetSize },
      deviceScaleFactor: 2
    });

    await page.setContent(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { width:100%; height:100%; background:transparent; overflow:hidden; display:flex; align-items:center; justify-content:center; }
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
    console.log(`Rendered: ${path.basename(outPath)} (${targetSize}x${targetSize})`);
  }

  // Generate Maskable Icons (Full-bleed brand gradient, safe zone 60% N, no white borders)
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
    <linearGradient id="maskableSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.20"/>
      <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.00"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#maskableGrad)"/>
  <rect width="${size}" height="${size}" fill="url(#maskableSheen)"/>
  <g transform="translate(${nOffset.toFixed(2)}, ${nOffset.toFixed(2)}) scale(${nScale.toFixed(4)})">
    <path fill-rule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
  </g>
</svg>`;
  }

  const svgMaskable = createMaskableSvg(512);
  fs.writeFileSync(path.join(publicIcons, 'icon-maskable-512.svg'), svgMaskable, 'utf8');

  // Render Standalone PWA Icons (Transparent background, Superellipse, Rich Gradient)
  await renderPng(svg512, path.join(publicIcons, 'icon-1024.png'), 1024);
  await renderPng(svg512, path.join(publicIcons, 'icon-512.png'), 512);
  await renderPng(svg192, path.join(publicIcons, 'icon-192.png'), 192);

  // Render Maskable Icons (Full-bleed orange gradient, safe-zone N)
  await renderPng(svgMaskable, path.join(publicIcons, 'icon-maskable-1024.png'), 1024);
  await renderPng(svgMaskable, path.join(publicIcons, 'icon-maskable-512.png'), 512);

  // Render Apple Touch Icon (Full bleed for iOS native squircle mask)
  await renderPng(svgApple, path.join(publicDir, 'apple-icon.png'), 180);
  await renderPng(svgApple, path.join(appDir, 'apple-icon.png'), 180);

  // Generate Realistic Mobile Splash Screen Preview (Pure White #FFFFFF, Floating Squircle, No Text)
  const splashPage = await browser.newPage({
    viewport: { width: 390, height: 844 }, // iPhone / Modern Android aspect ratio
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

  const previewPath = 'C:/Users/HP/.gemini/antigravity-ide/brain/625926d7-c699-41d1-b72d-28dcfc5ffd7e/splash_master_preview.png';
  await splashPage.screenshot({ path: previewPath, type: 'png' });
  await splashPage.close();
  console.log(`Generated Splash Preview: ${previewPath}`);

  await browser.close();
  console.log('All Master Icons & Preview generated successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
