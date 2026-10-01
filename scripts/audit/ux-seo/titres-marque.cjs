// AUD-154 : détecte (et avec --fix corrige) les titres de premier niveau qui portent déjà la marque, alors que le
// gabarit du layout ajoute « | Nopalou ». Les titres imbriqués (openGraph, twitter) n'utilisent pas le gabarit : ignorés.
// Usage : node titres-marque.cjs [--fix] [racine]
const fs = require('fs')
const path = require('path')

const SUFFIXE = /(\s*(?:\||—|–|-)\s*Nopalou(?: Immo)?)(['"`],?\s*)$/

function parcourir(dir, sortie = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'admin') parcourir(p, sortie) }
    else if (/\.(ts|tsx)$/.test(e.name)) sortie.push(p)
  }
  return sortie
}

function indentation(l) { return l.length - l.trimStart().length }

/** Renvoie les numéros de ligne (0-based) des titres de premier niveau terminés par la marque. */
function lignesAvecMarque(lignes) {
  const trouves = []
  lignes.forEach((l, i) => {
    if (!/^\s*title:\s*['"`]/.test(l) || !SUFFIXE.test(l)) return
    const ind = indentation(l)
    let j = i - 1
    while (j >= 0 && (lignes[j].trim() === '' || indentation(lignes[j]) >= ind)) j--
    const parent = j >= 0 ? lignes[j] : ''
    if (/openGraph|twitter/.test(parent)) return
    trouves.push(i)
  })
  return trouves
}

function analyser(racine, corriger) {
  const resultat = []
  for (const f of parcourir(racine)) {
    const src = fs.readFileSync(f, 'utf8')
    const lignes = src.split(/\r?\n/)
    const idx = lignesAvecMarque(lignes)
    if (!idx.length) continue
    resultat.push({ f: path.relative(racine, f).replace(/\\/g, '/'), lignes: idx.map((i) => `${i + 1}: ${lignes[i].trim()}`) })
    if (corriger) {
      for (const i of idx) lignes[i] = lignes[i].replace(SUFFIXE, '$2')
      fs.writeFileSync(f, lignes.join(src.includes('\r\n') ? '\r\n' : '\n'))
    }
  }
  return resultat
}

module.exports = { lignesAvecMarque, analyser }

if (require.main === module) {
  const corriger = process.argv.includes('--fix')
  const racine = process.argv.filter((a) => !a.startsWith('--'))[2] || path.join(__dirname, '../../../frontend-next/src/app')
  const r = analyser(racine, corriger)
  for (const x of r) console.log(x.f + '\n  ' + x.lignes.join('\n  '))
  console.log((corriger ? 'corrigés : ' : 'à corriger : ') + r.reduce((n, x) => n + x.lignes.length, 0))
}
