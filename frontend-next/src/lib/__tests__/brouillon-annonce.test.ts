// @vitest-environment node
// AUD-219 : le brouillon d'annonce survit au rechargement, par utilisateur, sans jamais casser le formulaire
import { describe, it, expect } from 'vitest'
import { lireBrouillon, ecrireBrouillon, effacerBrouillon } from '../brouillon-annonce'

function faux() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    brut: m,
  }
}
const exemple = { slug: 'smartphones', car: { marque: 'Samsung' }, champs: { titre: 'Samsung Galaxy A15 128 Go' }, step: 2 as const }

describe('brouillon d’annonce', () => {
  it('écrit puis relit le même contenu', () => {
    const s = faux()
    ecrireBrouillon('awa@exemple.sn', exemple, s)
    expect(lireBrouillon('awa@exemple.sn', s)).toEqual(exemple)
  })
  it('est séparé par utilisateur (e-mail insensible à la casse)', () => {
    const s = faux()
    ecrireBrouillon('Awa@Exemple.sn', exemple, s)
    expect(lireBrouillon('awa@exemple.sn', s)).toEqual(exemple)
    expect(lireBrouillon('moussa@exemple.sn', s)).toBeNull()
  })
  it('s’efface', () => {
    const s = faux()
    ecrireBrouillon('a@b.sn', exemple, s)
    effacerBrouillon('a@b.sn', s)
    expect(lireBrouillon('a@b.sn', s)).toBeNull()
  })
  it('ignore les données corrompues ou invalides', () => {
    const s = faux()
    s.setItem('nopalou_annonce_brouillon_v1:a@b.sn', '{pas du json')
    expect(lireBrouillon('a@b.sn', s)).toBeNull()
    s.setItem('nopalou_annonce_brouillon_v1:a@b.sn', JSON.stringify({ slug: '', car: {}, champs: {}, step: 2 }))
    expect(lireBrouillon('a@b.sn', s)).toBeNull()
    s.setItem('nopalou_annonce_brouillon_v1:a@b.sn', JSON.stringify({ slug: 'mode', car: { x: 3 }, champs: {}, step: 2 }))
    expect(lireBrouillon('a@b.sn', s)).toBeNull()
  })
  it('ne lève jamais d’erreur si le stockage est indisponible', () => {
    const casse = { getItem: () => { throw new Error('bloqué') }, setItem: () => { throw new Error('plein') }, removeItem: () => { throw new Error('bloqué') } }
    expect(() => ecrireBrouillon('a@b.sn', exemple, casse)).not.toThrow()
    expect(lireBrouillon('a@b.sn', casse)).toBeNull()
    expect(() => effacerBrouillon('a@b.sn', casse)).not.toThrow()
    expect(lireBrouillon('a@b.sn', null)).toBeNull()
  })
})
