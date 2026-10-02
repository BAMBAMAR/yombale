// @vitest-environment node
// AUD-220 : tout lien wa.me porte l'indicatif pays
import { describe, it, expect } from 'vitest'
import { numeroWhatsapp, lienWhatsapp } from '../format'

describe('numeroWhatsapp', () => {
  it.each([
    ['772082578', '221772082578'],
    ['77 208 25 78', '221772082578'],
    ['+221 77 208 25 78', '221772082578'],
    ['00221772082578', '221772082578'],
    ['221772082578', '221772082578'],
  ])('%s -> %s', (entree, attendu) => {
    expect(numeroWhatsapp(entree)).toBe(attendu)
  })
  it.each([[''], [null], [undefined], ['abc'], ['1234']])('numéro inutilisable (%s) -> null', (entree) => {
    expect(numeroWhatsapp(entree as any)).toBeNull()
  })
})

describe('lienWhatsapp', () => {
  it('ajoute 221 aux numéros à 9 chiffres', () => {
    expect(lienWhatsapp('772082578')).toBe('https://wa.me/221772082578')
  })
  it('encode le message', () => {
    expect(lienWhatsapp('772082578', 'Bonjour & merci')).toBe('https://wa.me/221772082578?text=Bonjour%20%26%20merci')
  })
  it('renvoie null sans numéro valide (jamais le numéro de l’administrateur)', () => {
    expect(lienWhatsapp(null)).toBeNull()
  })
})
