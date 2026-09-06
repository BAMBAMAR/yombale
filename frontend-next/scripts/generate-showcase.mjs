import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function generateShowcase() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 2
  });

  const icon512Base64 = fs.readFileSync('C:/Users/HP/.gemini/antigravity-ide/scratch/yombale/frontend-next/public/icons/icon-512.png').toString('base64');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0F172A;
      color: #FFFFFF;
      width: 1200px;
      height: 800px;
      display: flex;
      flex-direction: column;
      padding: 40px 60px;
      justify-content: space-between;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 20px;
    }
    .title {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #FFFFFF;
    }
    .subtitle {
      font-size: 14px;
      color: #94A3B8;
      margin-top: 4px;
    }
    .badge {
      background: rgba(199, 91, 0, 0.2);
      border: 1px solid #C75B00;
      color: #FF7E22;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      display: flex;
      gap: 60px;
      align-items: center;
      justify-content: center;
      flex: 1;
    }
    /* Mobile Device Mockup */
    .phone-mockup {
      width: 300px;
      height: 600px;
      background: #FFFFFF;
      border-radius: 44px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 10px #1E293B, 0 0 0 12px #334155;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .phone-notch {
      position: absolute;
      top: 14px;
      width: 100px;
      height: 24px;
      background: #0F172A;
      border-radius: 20px;
      z-index: 10;
    }
    .splash-logo {
      width: 140px;
      height: 140px;
      animation: pulse 2s infinite ease-in-out;
    }
    .splash-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    /* Specs Column */
    .specs-col {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 540px;
    }
    .spec-card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px 24px;
      backdrop-filter: blur(10px);
    }
    .spec-title {
      font-size: 16px;
      font-weight: 600;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .spec-title span {
      color: #FF7E22;
    }
    .spec-desc {
      font-size: 13.5px;
      line-height: 1.5;
      color: #94A3B8;
    }
    .icon-zoom {
      display: flex;
      align-items: center;
      gap: 20px;
      background: rgba(255, 255, 255, 0.03);
      padding: 16px;
      border-radius: 12px;
      border: 1px dashed rgba(255,255,255,0.15);
      margin-top: 10px;
    }
    .icon-zoom img {
      width: 72px;
      height: 72px;
    }
    .icon-zoom-info {
      font-size: 12px;
      color: #CBD5E1;
      line-height: 1.6;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Nopalou — Rendu Haute Précision PWA & Splash Screen</div>
      <div class="subtitle">Architecture Native Mobile : Zéro Colmatage • Zéro Cadre Carré • Zéro Médaillon Blanc</div>
    </div>
    <div class="badge">Spécification v16 Master</div>
  </div>

  <div class="content">
    <!-- Smartphone Splash Screen Preview -->
    <div class="phone-mockup">
      <div class="phone-notch"></div>
      <div class="splash-logo">
        <img src="data:image/png;base64,${icon512Base64}" alt="Nopalou Squircle"/>
      </div>
    </div>

    <!-- Specs & Details -->
    <div class="specs-col">
      <div class="spec-card">
        <div class="spec-title">
          <span>✦</span> Splash Screen : Fond Blanc Pur & Logo Épuré
        </div>
        <div class="spec-desc">
          Conforme à votre exigence stricte : fond 100% blanc pur (<code>#FFFFFF</code>), logo officiel seul au centre de l'écran, aucun texte additionnel ("pas besoin d'écrire nopalou"). Intégration fluide sans aucune bordure ni artefact.
        </div>
      </div>

      <div class="spec-card">
        <div class="spec-title">
          <span>✦</span> Rendu Géométrique : Vraie Superellipse de Lamé (n = 5.0)
        </div>
        <div class="spec-desc">
          Courbure continue d'ordre 5 identique aux standards Apple iOS et Android One UI. Élimine les cassures angulaires des arrondis SVG classiques (rx/ry).
        </div>
        <div class="icon-zoom">
          <img src="data:image/png;base64,${icon512Base64}" alt="Icon Zoom"/>
          <div class="icon-zoom-info">
            • <b>Dégradé Solaire 4-Stops</b> : #FF7E22 → #EA580C → #C75B00 → #9E3C00<br/>
            • <b>Lueur Zénithale Glassmorphism</b> : Reflet subtil en arc supérieur<br/>
            • <b>Échantillonnage 4x SSAA</b> : 1024px & 512px ultra-net Retina
          </div>
        </div>
      </div>

      <div class="spec-card">
        <div class="spec-title">
          <span>✦</span> Conformité W3C & Standard Industriel
        </div>
        <div class="spec-desc">
          Architecture alignée sur les leaders mondiaux (Starbucks, Duolingo, Pinterest) : suppression des hacks de masquage forcé qui généraient la boîte carrée ou le médaillon blanc.
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>Nopalou PWA Engineering • Rendu Pixel-Perfect</div>
    <div>Prêt pour déploiement sur validation explicite</div>
  </div>
</body>
</html>`;

  await page.setContent(html);
  const outPath = 'C:/Users/HP/.gemini/antigravity-ide/brain/625926d7-c699-41d1-b72d-28dcfc5ffd7e/showcase_haute_qualite.png';
  await page.screenshot({ path: outPath, type: 'png' });
  await page.close();
  await browser.close();
  console.log(`Saved showcase: ${outPath}`);
}

generateShowcase().catch(console.error);
