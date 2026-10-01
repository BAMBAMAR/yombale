// AUD-163 : détecte (et avec --fix corrige) les objets `openGraph` de pages sans `images`.
// Usage : node og-images.cjs [--fix] [racine]
const fs = require('fs')
const path = require('path')

function parcourir(dir, sortie = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'admin') parcourir(p, sortie) }
    else if (/\.(ts|tsx)$/.test(e.name)) sortie.push(p)
  }
  return sortie
}

/** Position de l'accolade fermante qui correspond à l'accolade ouvrante en `debut`. */
function fin(src, debut) {
  let n = 0
  for (let i = debut; i < src.length; i++) {
    if (src[i] === '{') n++
    else if (src[i] === '}' && --n === 0) return i
  }
  return -1
}

function sansImages(src) {
  const trouves = []
  const re = /openGraph:\s*\{/g
  let m
  while ((m = re.exec(src))) {
    const debut = m.index + m[0].length - 1
    const bloc = src.slice(debut, fin(src, debut) + 1)
    if (!/\bimages\b/.test(bloc)) trouves.push(debut)
  }
  return trouves
}

function analyser(racine, corriger) {
  const resultat = []
  for (const f of parcourir(racine)) {
    if (f.endsWith(path.join('lib', 'social.ts'))) continue
    let src = fs.readFileSync(f, 'utf8')
    const pos = sansImages(src)
    if (!pos.length) continue
    resultat.push({ f: path.relative(racine, f).replace(/\\/g, '/'), n: pos.length })
    if (corriger) {
      for (const p of pos.reverse()) src = src.slice(0, p + 1) + ' images: OG_IMAGES,' + src.slice(p + 1)
      if (!/import \{[^}]*OG_IMAGES[^}]*\} from/.test(src)) {
        const imports = [...src.matchAll(/^import .*$/gm)]
        const dernier = imports[imports.length - 1]
        const ligne = "import { OG_IMAGES } from '@/lib/social'\n"
        src = dernier ? src.slice(0, dernier.index + dernier[0].length + 1) + ligne + src.slice(dernier.index + dernier[0].length + 1) : ligne + src
      }
      fs.writeFileSync(f, src)
    }
  }
  return resultat
}

module.exports = { analyser }

if (require.main === module) {
  const corriger = process.argv.includes('--fix')
  const racine = process.argv.filter((a) => !a.startsWith('--'))[2] || path.join(__dirname, '../../../frontend-next/src')
  const r = analyser(racine, corriger)
  for (const x of r) console.log(x.f, x.n)
  console.log((corriger ? 'corrigés : ' : 'à corriger : ') + r.length + ' fichiers')
}
