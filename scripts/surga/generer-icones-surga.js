// scripts/surga/generer-icones-surga.js
// Jeu d'icônes de la PWA Surga, produit depuis l'emblème officiel (frontend-next/public/surga/surga-symbol.png).
// L'emblème est détouré de son cadre d'origine puis posé sur un fond ardoise nuit avec un halo : l'ancienne icône
// était un carré contenant un second cadre, posé tel quel sur l'écran d'ouverture.
//
//   node scripts/surga/generer-icones-surga.js                 écrit dans frontend-next/public/surga
//   node scripts/surga/generer-icones-surga.js --sortie DOSSIER écrit ailleurs (aperçu)
//   node scripts/surga/generer-icones-surga.js --source FICHIER autre image d'origine (un original plus grand donne
//                                                               des icônes plus nettes ; même composition attendue)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RACINE = path.join(__dirname, '../..');
const arg = (nom, defaut) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : defaut;
};
const SOURCE = arg('source', path.join(RACINE, 'frontend-next/public/surga/surga-symbol.png'));
const SORTIE = arg('sortie', path.join(RACINE, 'frontend-next/public/surga'));

// Couleur de bord = background_color du manifeste : sur l'écran d'ouverture, l'icône se fond dans le fond.
const NUIT = '#0F172A';

// forme « tuile » : coins arrondis transparents ; « plein » : carré entier, que le système découpe lui-même.
// emblème : hauteur de l'emblème rapportée au côté (un masque adaptatif ne garde que le centre : 0,52 au plus).
const ICONES = [
  { fichier: 'icons/icon-192.png', cote: 192, forme: 'tuile', embleme: 0.62 },
  { fichier: 'icons/icon-512.png', cote: 512, forme: 'tuile', embleme: 0.62 },
  { fichier: 'icon-192.png', cote: 192, forme: 'tuile', embleme: 0.62 },
  { fichier: 'icon-512.png', cote: 512, forme: 'tuile', embleme: 0.62 },
  { fichier: 'icons/icon-maskable-192.png', cote: 192, forme: 'plein', embleme: 0.52 },
  { fichier: 'icons/icon-maskable-512.png', cote: 512, forme: 'plein', embleme: 0.52 },
  { fichier: 'icons/surga-whatsapp-avatar.png', cote: 512, forme: 'plein', embleme: 0.52 },
  { fichier: 'apple-touch-icon.png', cote: 180, forme: 'plein', embleme: 0.64 },
  { fichier: 'favicon.png', cote: 64, forme: 'tuile', embleme: 0.76 },
];
// Fichiers .svg existants : enveloppes d'une image, régénérées pour ne plus servir l'ancien cadre sous ces noms.
const ENVELOPPES = [
  { fichier: 'icons/icon-192.svg', de: 'icons/icon-192.png', cote: 192 },
  { fichier: 'icons/icon-512.svg', de: 'icons/icon-512.png', cote: 512 },
  { fichier: 'icon-192.svg', de: 'icons/icon-192.png', cote: 192 },
  { fichier: 'icon-512.svg', de: 'icons/icon-512.png', cote: 512 },
  { fichier: 'icons/icon-maskable-192.svg', de: 'icons/icon-maskable-192.png', cote: 192 },
  { fichier: 'icons/icon-maskable-512.svg', de: 'icons/icon-maskable-512.png', cote: 512 },
  { fichier: 'icons/favicon.svg', de: 'favicon.png', cote: 64 },
  { fichier: 'favicon.svg', de: 'favicon.png', cote: 64 },
];

// Exécuté dans la page : détoure l'emblème puis dessine chaque icône.
async function dessiner({ sourceUrl, icones, nuit }) {
  const img = new Image();
  img.src = sourceUrl;
  await img.decode();
  const L = img.naturalWidth;
  const H = img.naturalHeight;
  const brut = document.createElement('canvas');
  brut.width = L;
  brut.height = H;
  const cb = brut.getContext('2d');
  cb.drawImage(img, 0, 0);
  const px = cb.getImageData(0, 0, L, H);
  const d = px.data;

  // Couleur du cadre intérieur : médiane d'une bande verticale à gauche de l'emblème.
  const echantillons = [[], [], []];
  for (let y = Math.round(H * 0.3); y < H * 0.7; y++) {
    for (let x = Math.round(L * 0.14); x < L * 0.2; x++) {
      const i = (y * L + x) * 4;
      for (let k = 0; k < 3; k++) echantillons[k].push(d[i + k]);
    }
  }
  const fond = echantillons.map((v) => v.sort((a, b) => a - b)[v.length >> 1]);
  const ecart = (i) => Math.hypot(d[i] - fond[0], d[i + 1] - fond[1], d[i + 2] - fond[2]);

  // Détourage : opacité selon l'écart au fond, couleur démêlée du fond sur les bords.
  const SEUIL_BAS = 16;
  const SEUIL_HAUT = 64;
  let x0 = L, y0 = H, x1 = 0, y1 = 0;
  // Zone utile : l'intérieur du cadre (ses bords et son ombre restent dehors).
  const marge = Math.round(L * 0.13);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < L; x++) {
      const i = (y * L + x) * 4;
      const dedans = x >= marge && x < L - marge && y >= marge && y < H - marge;
      const a = dedans ? Math.max(0, Math.min(1, (ecart(i) - SEUIL_BAS) / (SEUIL_HAUT - SEUIL_BAS))) : 0;
      if (a > 0) {
        for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, (d[i + k] - (1 - a) * fond[k]) / a));
        if (a > 0.5) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
      d[i + 3] = Math.round(a * 255);
    }
  }
  cb.putImageData(px, 0, 0);
  const eL = x1 - x0 + 1;
  const eH = y1 - y0 + 1;
  const embleme = document.createElement('canvas');
  embleme.width = eL;
  embleme.height = eH;
  embleme.getContext('2d').drawImage(brut, x0, y0, eL, eH, 0, 0, eL, eH);

  const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const centre = hex(fond.map((v) => Math.min(255, v * 1.12 + 4)));

  const sorties = {};
  for (const ic of icones) {
    const S = ic.cote;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    if (ic.forme === 'tuile') {
      g.beginPath();
      g.roundRect(0, 0, S, S, S * 0.225);
      g.clip();
    }
    // Halo : centre légèrement relevé derrière le buste, bords exactement couleur nuit.
    const halo = g.createRadialGradient(S / 2, S * 0.44, 0, S / 2, S * 0.5, S * 0.7);
    halo.addColorStop(0, centre);
    halo.addColorStop(0.38, hex(fond));
    // Couleur nuit atteinte avant le milieu des côtés : aucun bord visible sur l'écran d'ouverture.
    halo.addColorStop(0.66, nuit);
    halo.addColorStop(1, nuit);
    g.fillStyle = nuit;
    g.fillRect(0, 0, S, S);
    g.fillStyle = halo;
    g.fillRect(0, 0, S, S);

    const h = S * ic.embleme;
    const l = (h * eL) / eH;
    // Ombre portée discrète : l'emblème se détache du fond.
    g.shadowColor = 'rgba(2, 6, 23, 0.55)';
    g.shadowBlur = S * 0.045;
    g.shadowOffsetY = S * 0.018;
    g.drawImage(embleme, (S - l) / 2, (S - h) / 2, l, h);
    sorties[ic.fichier] = c.toDataURL('image/png');
  }
  return { sorties, fond: hex(fond), embleme: `${eL}x${eH}`, source: `${L}x${H}` };
}

(async () => {
  const sourceUrl = `data:image/png;base64,${fs.readFileSync(SOURCE).toString('base64')}`;
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage();
  const { sorties, fond, embleme, source } = await page.evaluate(dessiner, { sourceUrl, icones: ICONES, nuit: NUIT });
  await navigateur.close();

  const ecrire = (fichier, contenu) => {
    const cible = path.join(SORTIE, fichier);
    fs.mkdirSync(path.dirname(cible), { recursive: true });
    fs.writeFileSync(cible, contenu);
    return cible;
  };
  const png = {};
  for (const ic of ICONES) {
    png[ic.fichier] = Buffer.from(sorties[ic.fichier].split(',')[1], 'base64');
    ecrire(ic.fichier, png[ic.fichier]);
  }
  for (const env of ENVELOPPES) {
    const b64 = png[env.de].toString('base64');
    ecrire(
      env.fichier,
      `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${env.cote}" height="${env.cote}" viewBox="0 0 ${env.cote} ${env.cote}">\n  <image href="data:image/png;base64,${b64}" width="${env.cote}" height="${env.cote}"/>\n</svg>\n`,
    );
  }
  console.log(`source ${source}, emblème détouré ${embleme}, fond du cadre ${fond}`);
  console.log(`${ICONES.length} images et ${ENVELOPPES.length} enveloppes écrites dans ${SORTIE}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
