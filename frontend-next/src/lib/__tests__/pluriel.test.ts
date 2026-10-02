// @vitest-environment node
// AUD-232 : accord en nombre à la française
import { describe, it, expect } from 'vitest'
import { pluriel } from '../format'

describe('pluriel', () => {
  it.each([
    [0, 'agence', '0 agence'],
    [1, 'agence', '1 agence'],
    [2, 'agence', '2 agences'],
    [71, 'boutique', '71 boutiques'],
    [1, 'bien', '1 bien'],
  ])('pluriel(%i, %s) = %s', (n, mot, attendu) => expect(pluriel(n, mot)).toBe(attendu))

  it('accepte un pluriel irrégulier', () => {
    expect(pluriel(3, 'journal', 'journaux')).toBe('3 journaux')
    expect(pluriel(1, 'journal', 'journaux')).toBe('1 journal')
  })
})
