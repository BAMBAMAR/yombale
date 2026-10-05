// scripts/generate-surga-assets.js
// Générateur des Actifs Vectoriels Officiels pour l'Identité de Marque Surga
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../frontend-next/public/surga/icons');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// ==========================================================================
// DÉFINITION GÉOMÉTRIQUE VECTORIELLE DU SYMBOLE SURGA (S)
// Conçu sur grille 512×512, centré en (256, 256)
// Le ruban S est constitué de deux arcs dynamiques complémentaires :
// - Aile Supérieure (Ambre Solaire) : Éveil, écoute, briefing
// - Base Inférieure (Indigo Nuit) : Ancrage, calcul arithmétique, exécution
// - Flèche de transmission à 45° et point d'accomplissement émeraude
// ==========================================================================

// 1. SYMBOLE OFFICIEL (sur fond transparent)
const surgaSymbolSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <!-- Dégradé Ambre Solaire Sahélien (Aile Supérieure) -->
    <linearGradient id="surgaAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="45%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Dégradé Indigo Nuit Minérale (Base Inférieure) -->
    <linearGradient id="surgaIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="55%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>

    <!-- Ombre portée douce -->
    <filter id="surgaGlow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0F172A" flood-opacity="0.14"/>
    </filter>
  </defs>

  <g id="surga-symbol-mark" filter="url(#surgaGlow)">
    <!-- Base Inférieure (Indigo Nuit) : Forme de S inférieure solide -->
    <path fill="url(#surgaIndigoGrad)" d="
      M 240 268
      C 278 248, 332 258, 364 290
      C 402 328, 400 388, 360 426
      C 320 464, 252 468, 192 444
      C 150 426, 122 396, 110 368
      L 168 326
      C 178 342, 194 360, 218 372
      C 252 388, 290 384, 314 360
      C 334 340, 332 316, 312 296
      C 296 280, 268 274, 244 282
      L 182 302
      C 150 312, 122 300, 108 274
      L 176 224
      Z
    "/>

    <!-- Aile Supérieure (Ambre Solaire) : Forme de S supérieure dynamique -->
    <path fill="url(#surgaAmberGrad)" d="
      M 272 244
      C 234 264, 180 254, 148 222
      C 110 184, 112 124, 152 86
      C 192 48, 260 44, 320 68
      C 362 86, 390 116, 402 144
      L 344 186
      C 334 170, 318 152, 294 140
      C 260 124, 222 128, 198 152
      C 178 172, 180 196, 200 216
      C 216 232, 244 238, 268 230
      L 330 210
      C 362 200, 390 212, 404 238
      L 336 288
      Z
    "/>

    <!-- Cœur d'Exécution & Validation (Pastille Émeraude Teranga) -->
    <circle cx="256" cy="256" r="15" fill="#059669"/>
    <circle cx="256" cy="256" r="8" fill="#34D399" opacity="0.8"/>
  </g>
</svg>`;

// 2. SYMBOLE POUR SURFACES SOMBRES (Ambre & Blanc Bleuté)
const surgaSymbolDarkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="darkAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="darkSlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
  </defs>
  <g id="surga-symbol-dark">
    <!-- Base Inférieure (Blanc Bleuté lumineux sur fond sombre) -->
    <path fill="url(#darkSlateGrad)" d="
      M 240 268
      C 278 248, 332 258, 364 290
      C 402 328, 400 388, 360 426
      C 320 464, 252 468, 192 444
      C 150 426, 122 396, 110 368
      L 168 326
      C 178 342, 194 360, 218 372
      C 252 388, 290 384, 314 360
      C 334 340, 332 316, 312 296
      C 296 280, 268 274, 244 282
      L 182 302
      C 150 312, 122 300, 108 274
      L 176 224
      Z
    "/>
    <!-- Aile Supérieure (Ambre Doré Eclatant) -->
    <path fill="url(#darkAmberGrad)" d="
      M 272 244
      C 234 264, 180 254, 148 222
      C 110 184, 112 124, 152 86
      C 192 48, 260 44, 320 68
      C 362 86, 390 116, 402 144
      L 344 186
      C 334 170, 318 152, 294 140
      C 260 124, 222 128, 198 152
      C 178 172, 180 196, 200 216
      C 216 232, 244 238, 268 230
      L 330 210
      C 362 200, 390 212, 404 238
      L 336 288
      Z
    "/>
    <!-- Pastille Centrale -->
    <circle cx="256" cy="256" r="15" fill="#10B981"/>
    <circle cx="256" cy="256" r="8" fill="#6EE7B7"/>
  </g>
</svg>`;

// 3. SYMBOLE MONOCHROME (Noir 100% ou Blanc selon usage)
const surgaSymbolMonoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <g fill="#0F172A">
    <path d="
      M 240 268
      C 278 248, 332 258, 364 290
      C 402 328, 400 388, 360 426
      C 320 464, 252 468, 192 444
      C 150 426, 122 396, 110 368
      L 168 326
      C 178 342, 194 360, 218 372
      C 252 388, 290 384, 314 360
      C 334 340, 332 316, 312 296
      C 296 280, 268 274, 244 282
      L 182 302
      C 150 312, 122 300, 108 274
      L 176 224
      Z
    "/>
    <path d="
      M 272 244
      C 234 264, 180 254, 148 222
      C 110 184, 112 124, 152 86
      C 192 48, 260 44, 320 68
      C 362 86, 390 116, 402 144
      L 344 186
      C 334 170, 318 152, 294 140
      C 260 124, 222 128, 198 152
      C 178 172, 180 196, 200 216
      C 216 232, 244 238, 268 230
      L 330 210
      C 362 200, 390 212, 404 238
      L 336 288
      Z
    "/>
    <circle cx="256" cy="256" r="16"/>
  </g>
</svg>`;

// 4. SYMBOLE BLANC PUR (pour fonds colorés denses)
const surgaSymbolWhiteSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <g fill="#FFFFFF">
    <path d="
      M 240 268
      C 278 248, 332 258, 364 290
      C 402 328, 400 388, 360 426
      C 320 464, 252 468, 192 444
      C 150 426, 122 396, 110 368
      L 168 326
      C 178 342, 194 360, 218 372
      C 252 388, 290 384, 314 360
      C 334 340, 332 316, 312 296
      C 296 280, 268 274, 244 282
      L 182 302
      C 150 312, 122 300, 108 274
      L 176 224
      Z
    "/>
    <path d="
      M 272 244
      C 234 264, 180 254, 148 222
      C 110 184, 112 124, 152 86
      C 192 48, 260 44, 320 68
      C 362 86, 390 116, 402 144
      L 344 186
      C 334 170, 318 152, 294 140
      C 260 124, 222 128, 198 152
      C 178 172, 180 196, 200 216
      C 216 232, 244 238, 268 230
      L 330 210
      C 362 200, 390 212, 404 238
      L 336 288
      Z
    "/>
    <circle cx="256" cy="256" r="16"/>
  </g>
</svg>`;

// 5. LOGO COMPACT (Symbole + SURGA en 1 ligne)
const surgaLogoCompactSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <defs>
    <linearGradient id="compAmber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="compIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <!-- Symbole S à gauche mis à l'échelle (34×34) -->
  <g transform="translate(2, 3) scale(0.0664)">
    <path fill="url(#compIndigo)" d="
      M 240 268 C 278 248, 332 258, 364 290 C 402 328, 400 388, 360 426
      C 320 464, 252 468, 192 444 C 150 426, 122 396, 110 368 L 168 326
      C 178 342, 194 360, 218 372 C 252 388, 290 384, 314 360 C 334 340, 332 316, 312 296
      C 296 280, 268 274, 244 282 L 182 302 C 150 312, 122 300, 108 274 L 176 224 Z
    "/>
    <path fill="url(#compAmber)" d="
      M 272 244 C 234 264, 180 254, 148 222 C 110 184, 112 124, 152 86
      C 192 48, 260 44, 320 68 C 362 86, 390 116, 402 144 L 344 186
      C 334 170, 318 152, 294 140 C 260 124, 222 128, 198 152 C 178 172, 180 196, 200 216
      C 216 232, 244 238, 268 230 L 330 210 C 362 200, 390 212, 404 238 L 336 288 Z
    "/>
    <circle cx="256" cy="256" r="16" fill="#059669"/>
  </g>

  <!-- Wordmark SURGA avec lettre G rehaussée -->
  <text x="44" y="28" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" letter-spacing="-0.5">
    <tspan fill="#0F172A">SUR</tspan><tspan fill="#D97706">GA</tspan>
  </text>
</svg>`;

// 6. LOGO HORIZONTAL COMPLET (Symbole + SURGA + Baseline "Assistant de poche")
const surgaLogoHorizontalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48" viewBox="0 0 240 48">
  <defs>
    <linearGradient id="horizAmber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="horizIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <!-- Symbole S à gauche (40×40) -->
  <g transform="translate(4, 4) scale(0.0781)">
    <path fill="url(#horizIndigo)" d="
      M 240 268 C 278 248, 332 258, 364 290 C 402 328, 400 388, 360 426
      C 320 464, 252 468, 192 444 C 150 426, 122 396, 110 368 L 168 326
      C 178 342, 194 360, 218 372 C 252 388, 290 384, 314 360 C 334 340, 332 316, 312 296
      C 296 280, 268 274, 244 282 L 182 302 C 150 312, 122 300, 108 274 L 176 224 Z
    "/>
    <path fill="url(#horizAmber)" d="
      M 272 244 C 234 264, 180 254, 148 222 C 110 184, 112 124, 152 86
      C 192 48, 260 44, 320 68 C 362 86, 390 116, 402 144 L 344 186
      C 334 170, 318 152, 294 140 C 260 124, 222 128, 198 152 C 178 172, 180 196, 200 216
      C 216 232, 244 238, 268 230 L 330 210 C 362 200, 390 212, 404 238 L 336 288 Z
    "/>
    <circle cx="256" cy="256" r="16" fill="#059669"/>
  </g>

  <!-- Wordmark Principal SURGA -->
  <text x="52" y="27" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" letter-spacing="-0.5">
    <tspan fill="#0F172A">SUR</tspan><tspan fill="#D97706">GA</tspan>
  </text>

  <!-- Baseline explicative "ASSISTANT DE POCHE" -->
  <text x="53" y="40" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#475569" letter-spacing="1.2">
    ASSISTANT DE POCHE
  </text>
</svg>`;

// 7. ICÔNE PWA STANDALONE 512×512 (sur squircle officiel Indigo Nuit)
const icon512Svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <!-- Dégradé Fond Squircle : Nuit Minérale Profonde -->
    <linearGradient id="pwaBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="60%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#070D18"/>
    </linearGradient>

    <!-- Dégradé Ambre Solaire -->
    <linearGradient id="pwaAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Dégradé Aile Inférieure Blanche Bleutée (pour contraste saisissant) -->
    <linearGradient id="pwaSlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>

    <filter id="pwaShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Squircle continu de marque (rx = 120px soit 23.4%) -->
  <rect x="16" y="16" width="480" height="480" rx="120" fill="url(#pwaBgGrad)" filter="url(#pwaShadow)"/>

  <!-- Bordure intérieure subtile de verre -->
  <rect x="17" y="17" width="478" height="478" rx="119" fill="none" stroke="rgba(255, 255, 255, 0.12)" stroke-width="2"/>

  <!-- Symbole S centré avec contrastes calibrés pour icône mobile -->
  <g transform="translate(64, 64) scale(0.75)">
    <!-- Base Inférieure (Blanc Pur / Platine pour émerger du fond sombre) -->
    <path fill="url(#pwaSlateGrad)" d="
      M 240 268 C 278 248, 332 258, 364 290 C 402 328, 400 388, 360 426
      C 320 464, 252 468, 192 444 C 150 426, 122 396, 110 368 L 168 326
      C 178 342, 194 360, 218 372 C 252 388, 290 384, 314 360 C 334 340, 332 316, 312 296
      C 296 280, 268 274, 244 282 L 182 302 C 150 312, 122 300, 108 274 L 176 224 Z
    "/>

    <!-- Aile Supérieure (Ambre Solaire Rayonnant) -->
    <path fill="url(#pwaAmberGrad)" d="
      M 272 244 C 234 264, 180 254, 148 222 C 110 184, 112 124, 152 86
      C 192 48, 260 44, 320 68 C 362 86, 390 116, 402 144 L 344 186
      C 334 170, 318 152, 294 140 C 260 124, 222 128, 198 152 C 178 172, 180 196, 200 216
      C 216 232, 244 238, 268 230 L 330 210 C 362 200, 390 212, 404 238 L 336 288 Z
    "/>

    <!-- Point d'Émeraude Central -->
    <circle cx="256" cy="256" r="16" fill="#10B981"/>
    <circle cx="256" cy="256" r="8" fill="#6EE7B7"/>
  </g>
</svg>`;

// 8. ICÔNE MASKABLE ANDROID 512×512 (Zone sûre 60%, sans coins arrondis transparents)
const iconMaskable512Svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="maskableBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="60%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#070D18"/>
    </linearGradient>
    <linearGradient id="maskAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="maskSlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
  </defs>

  <!-- Fond plein 100% (Android applique son propre masque adaptatif rond/squircle) -->
  <rect width="512" height="512" fill="url(#maskableBgGrad)"/>

  <!-- Symbole S mis à l'échelle dans la Safe Zone de 60% (translate(102.4, 102.4) scale(0.6)) -->
  <g transform="translate(102.4, 102.4) scale(0.6)">
    <path fill="url(#maskSlateGrad)" d="
      M 240 268 C 278 248, 332 258, 364 290 C 402 328, 400 388, 360 426
      C 320 464, 252 468, 192 444 C 150 426, 122 396, 110 368 L 168 326
      C 178 342, 194 360, 218 372 C 252 388, 290 384, 314 360 C 334 340, 332 316, 312 296
      C 296 280, 268 274, 244 282 L 182 302 C 150 312, 122 300, 108 274 L 176 224 Z
    "/>
    <path fill="url(#maskAmberGrad)" d="
      M 272 244 C 234 264, 180 254, 148 222 C 110 184, 112 124, 152 86
      C 192 48, 260 44, 320 68 C 362 86, 390 116, 402 144 L 344 186
      C 334 170, 318 152, 294 140 C 260 124, 222 128, 198 152 C 178 172, 180 196, 200 216
      C 216 232, 244 238, 268 230 L 330 210 C 362 200, 390 212, 404 238 L 336 288 Z
    "/>
    <circle cx="256" cy="256" r="16" fill="#10B981"/>
  </g>
</svg>`;

// 9. FAVICON VECTORIEL 32×32
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="favBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <!-- Fond rond Indigo Nuit -->
  <rect width="32" height="32" rx="7" fill="url(#favBg)"/>
  <!-- Symbole S compact -->
  <g transform="translate(3, 3) scale(0.0507)">
    <path fill="#FFFFFF" d="
      M 240 268 C 278 248, 332 258, 364 290 C 402 328, 400 388, 360 426
      C 320 464, 252 468, 192 444 C 150 426, 122 396, 110 368 L 168 326
      C 178 342, 194 360, 218 372 C 252 388, 290 384, 314 360 C 334 340, 332 316, 312 296
      C 296 280, 268 274, 244 282 L 182 302 C 150 312, 122 300, 108 274 L 176 224 Z
    "/>
    <path fill="#F59E0B" d="
      M 272 244 C 234 264, 180 254, 148 222 C 110 184, 112 124, 152 86
      C 192 48, 260 44, 320 68 C 362 86, 390 116, 402 144 L 344 186
      C 334 170, 318 152, 294 140 C 260 124, 222 128, 198 152 C 178 172, 180 196, 200 216
      C 216 232, 244 238, 268 230 L 330 210 C 362 200, 390 212, 404 238 L 336 288 Z
    "/>
    <circle cx="256" cy="256" r="18" fill="#10B981"/>
  </g>
</svg>`;

// Fichiers à écrire
const assets = [
  { name: 'surga-symbol.svg', content: surgaSymbolSvg },
  { name: 'surga-symbol-dark.svg', content: surgaSymbolDarkSvg },
  { name: 'surga-symbol-mono.svg', content: surgaSymbolMonoSvg },
  { name: 'surga-symbol-white.svg', content: surgaSymbolWhiteSvg },
  { name: 'surga-logo-compact.svg', content: surgaLogoCompactSvg },
  { name: 'surga-logo-horizontal.svg', content: surgaLogoHorizontalSvg },
  { name: 'icon-512.svg', content: icon512Svg },
  { name: 'icon-192.svg', content: icon512Svg.replace('width="512" height="512"', 'width="192" height="192"') },
  { name: 'icon-maskable-512.svg', content: iconMaskable512Svg },
  { name: 'icon-maskable-192.svg', content: iconMaskable512Svg.replace('width="512" height="512"', 'width="192" height="192"') },
  { name: 'favicon.svg', content: faviconSvg },
];

assets.forEach(({ name, content }) => {
  const filePath = path.join(targetDir, name);
  fs.writeFileSync(filePath, content.trim(), 'utf8');
  console.log(`[OK] Asset généré : ${filePath} (${content.length} octets)`);
});

console.log('\\n[SUCCÈS] Tous les actifs vectoriels Surga ont été générés avec succès !');
