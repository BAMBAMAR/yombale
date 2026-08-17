import { describe, it, expect } from 'vitest'
import { champVisibleSelonVariante } from '../boutiqueHelpers'

describe('champVisibleSelonVariante', () => {
  it('reste visible si aucune variante correspondante n\'est active', () => {
    expect(champVisibleSelonVariante('taille', new Set())).toBe(true)
    expect(champVisibleSelonVariante('couleur', new Set())).toBe(true)
    expect(champVisibleSelonVariante('stockage', new Set())).toBe(true)
  })

  it('se masque si la variante correspondante est active', () => {
    expect(champVisibleSelonVariante('taille', new Set(['taille']))).toBe(false)
    expect(champVisibleSelonVariante('couleur', new Set(['couleur']))).toBe(false)
    expect(champVisibleSelonVariante('stockage', new Set(['stockage']))).toBe(false)
  })

  it('ne se masque pas si une autre variante (non correspondante) est active', () => {
    expect(champVisibleSelonVariante('taille', new Set(['couleur']))).toBe(true)
    expect(champVisibleSelonVariante('couleur', new Set(['stockage']))).toBe(true)
  })
})
