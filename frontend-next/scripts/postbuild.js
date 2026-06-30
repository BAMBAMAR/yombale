// Copie public/ et .next/static/ dans le dossier standalone après next build
// Requis pour que `node .next/standalone/server.js` serve les assets correctement
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(
  path.join(root, 'public'),
  path.join(root, '.next', 'standalone', 'public')
);

copyDir(
  path.join(root, '.next', 'static'),
  path.join(root, '.next', 'standalone', '.next', 'static')
);

console.log('[postbuild] ✅ Assets copiés dans .next/standalone/');
