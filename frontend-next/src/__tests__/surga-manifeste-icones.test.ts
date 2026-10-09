// @vitest-environment node
// Icônes de la PWA Surga : chaque icône du manifeste existe, à la taille déclarée ; l'icône « maskable » (découpée
// par le système) n'est pas le fichier de l'icône « any » (montrée entière sur l'écran d'ouverture) ; le fond de
// l'écran d'ouverture est la couleur nuit des icônes, pour que l'icône s'y fonde sans cadre visible.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const PUBLIC = path.resolve(__dirname, '../../public')
const manifeste = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'surga/manifest.json'), 'utf8'))
const fichier = (src: string) => path.join(PUBLIC, src.split('?')[0])
// En-tête PNG : largeur et hauteur aux octets 16 à 23.
const taillePng = (f: string) => {
  const b = fs.readFileSync(f)
  return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`
}
const empreinte = (f: string) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')

describe('manifeste de Surga : icônes', () => {
  it('chaque icône est un PNG présent, versionné, à la taille déclarée', () => {
    expect(manifeste.icons.length).toBeGreaterThanOrEqual(4)
    for (const icone of manifeste.icons) {
      expect(icone.type).toBe('image/png')
      expect(icone.src).toMatch(/\?v=\d+$/)
      expect(fs.existsSync(fichier(icone.src))).toBe(true)
      expect(taillePng(fichier(icone.src))).toBe(icone.sizes)
    }
  })

  it('les icônes « maskable » et « any » d\'une même taille sont deux images distinctes', () => {
    for (const taille of ['192x192', '512x512']) {
      const de = (but: string) => manifeste.icons.find((i: any) => i.sizes === taille && i.purpose === but)
      expect(de('any')).toBeTruthy()
      expect(de('maskable')).toBeTruthy()
      expect(empreinte(fichier(de('maskable').src))).not.toBe(empreinte(fichier(de('any').src)))
    }
  })

  it('le fond de l\'écran d\'ouverture est la couleur nuit de la barre du haut', () => {
    expect(manifeste.background_color).toBe('#0F172A')
    expect(manifeste.theme_color).toBe('#0F172A')
  })
})
