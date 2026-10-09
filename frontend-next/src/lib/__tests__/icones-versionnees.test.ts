// @vitest-environment node
// Icônes de Nopalou : toute adresse sous /icons/ porte une version (?v=N).
// Sans version, Cloudflare et les navigateurs servent la copie gardée sous cette adresse,
// donc l'ancien logo, même après remplacement du fichier. Seul /icons/logo-n.svg en est dispensé :
// son nom n'a jamais porté d'autre image.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const RACINE = path.resolve(__dirname, '../../../..')
const DOSSIERS = ['frontend-next/src', 'backend/middlewares', 'backend/services', 'backend/routes']
const FICHIERS = ['frontend-next/public/manifest.json', 'frontend-next/public/offline.html', 'frontend-next/public/widget.json']
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.html'])
const DISPENSES = new Set(['logo-n.svg'])
const ICONE = /(?<!\/surga)\/icons\/([A-Za-z0-9-]+\.(?:png|svg))(\?v=\d+)?/g

function fichiers(dossier: string): string[] {
  if (!fs.existsSync(dossier)) return []
  return fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const chemin = path.join(dossier, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === '__tests__' ? [] : fichiers(chemin)
    return EXTENSIONS.has(path.extname(e.name)) ? [chemin] : []
  })
}

function iconesSansVersion(texte: string): string[] {
  return [...texte.matchAll(ICONE)].filter((m) => !m[2] && !DISPENSES.has(m[1])).map((m) => m[0])
}

describe('icônes de Nopalou versionnées', () => {
  it('repère une adresse sans version et laisse passer les autres', () => {
    expect(iconesSansVersion("icon: '/icons/icon-192.png'")).toEqual(['/icons/icon-192.png'])
    expect(iconesSansVersion("icon: '/icons/icon-192.png?v=19'")).toEqual([])
    expect(iconesSansVersion('<Image src="/icons/logo-n.svg" />')).toEqual([])
    expect(iconesSansVersion("apple: '/surga/icons/icon-192.png'")).toEqual([])
  })

  it('aucune adresse /icons/ sans version dans le code ni dans le manifeste', () => {
    const cibles = [
      ...DOSSIERS.flatMap((d) => fichiers(path.join(RACINE, d))),
      ...FICHIERS.map((f) => path.join(RACINE, f)).filter((f) => fs.existsSync(f)),
    ]
    expect(cibles.length).toBeGreaterThan(100)
    const fautes = cibles.flatMap((f) =>
      iconesSansVersion(fs.readFileSync(f, 'utf8')).map((u) => `${path.relative(RACINE, f).replace(/\\/g, '/')} : ${u}`),
    )
    expect(fautes).toEqual([])
  })
})
