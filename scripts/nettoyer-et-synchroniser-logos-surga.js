// scripts/nettoyer-et-synchroniser-logos-surga.js
// Nettoyage définitif de tous les faux logos obsolètes de Surga (vieux symboles géométriques S avec point vert)
// Remplacement universel par le VRAI emblème officiel sanctuarisé : personnage en caftan blanc stylisé en S avec ceinture ambre.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SURGA_DIR = path.join(ROOT, 'frontend-next/public/surga');
const ICONS_DIR = path.join(SURGA_DIR, 'icons');

console.log('🚀 Début du nettoyage universel des logos Surga...');

// 1. Vérification des sources de vérité
const master512Path = path.join(ICONS_DIR, 'icon-512.png');
const master192Path = path.join(ICONS_DIR, 'icon-192.png');
const masterSymbolPath = path.join(SURGA_DIR, 'surga-symbol.png');

if (!fs.existsSync(master512Path)) {
  console.error('❌ ERREUR: master icon-512.png introuvable !');
  process.exit(1);
}

const b64_512 = fs.readFileSync(master512Path).toString('base64');
const b64_192 = fs.readFileSync(master192Path).toString('base64');
const b64_symbol = fs.readFileSync(masterSymbolPath).toString('base64');

// 2. Générer les templates SVG officiels avec le vrai logo embarqué en haute fidélité
const svg512 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <image href="data:image/png;base64,${b64_512}" width="512" height="512"/>
</svg>`;

const svg192 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <image href="data:image/png;base64,${b64_192}" width="192" height="192"/>
</svg>`;

const svgSymbol = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <image href="data:image/png;base64,${b64_512}" width="512" height="512"/>
</svg>`;

// 3. Remplacer tous les fichiers SVG parasites dans public/surga/ et public/surga/icons/
const svgReplacements = [
  { file: path.join(SURGA_DIR, 'icon-512.svg'), content: svg512 },
  { file: path.join(SURGA_DIR, 'icon-192.svg'), content: svg192 },
  { file: path.join(ICONS_DIR, 'icon-512.svg'), content: svg512 },
  { file: path.join(ICONS_DIR, 'icon-192.svg'), content: svg192 },
  { file: path.join(ICONS_DIR, 'icon-maskable-512.svg'), content: svg512 },
  { file: path.join(ICONS_DIR, 'icon-maskable-192.svg'), content: svg192 },
  { file: path.join(ICONS_DIR, 'surga-symbol.svg'), content: svgSymbol },
  { file: path.join(ICONS_DIR, 'surga-symbol-dark.svg'), content: svgSymbol },
  { file: path.join(ICONS_DIR, 'surga-symbol-white.svg'), content: svgSymbol },
  { file: path.join(ICONS_DIR, 'surga-symbol-mono.svg'), content: svgSymbol },
  { file: path.join(ICONS_DIR, 'surga-logo-compact.svg'), content: svgSymbol },
  { file: path.join(ICONS_DIR, 'surga-logo-horizontal.svg'), content: svgSymbol },
];

svgReplacements.forEach(({ file, content }) => {
  fs.writeFileSync(file, content, 'utf8');
  console.log(`✅ Fichier SVG assaini : ${path.relative(ROOT, file)}`);
});

// 4. Copier les PNG certifiés vers la racine public/surga/ pour cohérence totale
fs.copyFileSync(master512Path, path.join(SURGA_DIR, 'icon-512.png'));
fs.copyFileSync(master192Path, path.join(SURGA_DIR, 'icon-192.png'));
console.log('✅ Synchronisation PNG icon-512.png et icon-192.png vers public/surga/ terminée.');

// 5. Mettre à jour manifest.json pour n'utiliser que les icônes propres certifiées
const manifestPath = path.join(SURGA_DIR, 'manifest.json');
const manifestContent = {
  name: "Surga — Assistant Personnel de Poche",
  short_name: "Surga",
  description: "Votre assistant personnel au quotidien au Sénégal : briefing, notes, dépenses et actualités.",
  start_url: "/surga",
  scope: "/surga",
  display: "standalone",
  orientation: "portrait-primary",
  background_color: "#F8FAFC",
  theme_color: "#0F172A",
  lang: "fr-FR",
  categories: ["productivity", "utilities", "finance"],
  icons: [
    {
      src: "/surga/icons/icon-192.png?v=4",
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/surga/icons/icon-maskable-192.png?v=4",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: "/surga/icons/icon-512.png?v=4",
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/surga/icons/icon-maskable-512.png?v=4",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: "/surga/icons/icon-512.svg?v=4",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any"
    }
  ]
};

fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2) + '\n', 'utf8');
console.log('✅ manifest.json mis à jour avec les icônes officielles sanctuarisées.');

// 6. Mettre à jour le Service Worker de Surga avec le nouveau numéro de cache v4
const swPath = path.join(SURGA_DIR, 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');
swContent = swContent.replace(/const SURGA_CACHE_NAME = 'surga-pwa-v\d+';/, "const SURGA_CACHE_NAME = 'surga-pwa-v4';");
swContent = swContent.replace(
  /const STATIC_ASSETS = \[PAGE, '\/surga\/manifest\.json', '[^']*', '[^']*'\];/,
  "const STATIC_ASSETS = [PAGE, '/surga/manifest.json', '/surga/icons/icon-192.png', '/surga/icons/icon-512.png', '/surga/surga-symbol.png'];"
);
fs.writeFileSync(swPath, swContent, 'utf8');
console.log('✅ public/surga/sw.js mis à jour (cache surga-pwa-v4 et vraies icônes Surga).');

console.log('🎉 TOUS LES LOGOS OBSOLÈTES ONT ÉTÉ ÉLIMINÉS ET REMPLACÉS PAR LE VRAI LOGO OFFICIEL !');
