import { describe, it, expect } from 'vitest'
import { formatPhone, formatNomPropre, fcfa, decodeHtml, escapeHtml } from '../format'

describe('Formatters - formatPhone (Numéros de Téléphone)', () => {
  it('formate correctement les numéros sénégalais 9 chiffres standards (77, 78, 76, 75, 70, 33)', () => {
    expect(formatPhone('777202086')).toBe('77 720 20 86')
    expect(formatPhone('781234567')).toBe('78 123 45 67')
    expect(formatPhone('765554433')).toBe('76 555 44 33')
    expect(formatPhone('759998877')).toBe('75 999 88 77')
    expect(formatPhone('701112233')).toBe('70 111 22 33')
    expect(formatPhone('338210000')).toBe('33 821 00 00')
  })

  it('gère les numéros avec indicatif international +221 ou 00221', () => {
    expect(formatPhone('+221777202086')).toBe('+221 77 720 20 86')
    expect(formatPhone('00221781234567')).toBe('+221 78 123 45 67')
  })

  it('nettoie les espaces, tirets et parenthèses superflus avant formatage', () => {
    expect(formatPhone('77-720-20-86')).toBe('77 720 20 86')
    expect(formatPhone('77 720 20 86')).toBe('77 720 20 86')
    expect(formatPhone('(77) 720.20.86')).toBe('77 720 20 86')
  })

  it('retourne la chaîne brute si le format ne correspond pas à 9 chiffres', () => {
    expect(formatPhone('12345')).toBe('12345')
    expect(formatPhone('')).toBe('')
    expect(formatPhone(null)).toBe('')
    expect(formatPhone(undefined)).toBe('')
  })
})

describe('Formatters - formatNomPropre (Capitalisation des Noms Propres)', () => {
  it('capitalise un nom en minuscules brutes', () => {
    expect(formatNomPropre('basse')).toBe('Basse')
    expect(formatNomPropre('amadou')).toBe('Amadou')
  })

  it('capitalise chaque mot d un nom composé ou complet', () => {
    expect(formatNomPropre('amadou basse')).toBe('Amadou Basse')
    expect(formatNomPropre('cheikh ahmadou bamba')).toBe('Cheikh Ahmadou Bamba')
  })

  it('normalise les majuscules excessives (ALL CAPS)', () => {
    expect(formatNomPropre('AMAR')).toBe('Amar')
    expect(formatNomPropre('FATOU DIOP')).toBe('Fatou Diop')
  })

  it('supprime les espaces multiples et trimme', () => {
    expect(formatNomPropre('   moussa   ndiaye   ')).toBe('Moussa Ndiaye')
  })

  it('gère les valeurs vides et nulles sans erreur', () => {
    expect(formatNomPropre('')).toBe('')
    expect(formatNomPropre(null)).toBe('')
    expect(formatNomPropre(undefined)).toBe('')
  })
})

describe('Formatters - fcfa (Formatage Monétaire)', () => {
  it('formate les montants entiers avec séparateur de milliers et suffixe FCFA', () => {
    const res1 = fcfa(250000)
    expect(res1).toMatch(/250[\s\u202F\u00A0]000\sFCFA/)
    const res2 = fcfa(77)
    expect(res2).toBe('77 FCFA')
    const res3 = fcfa(0)
    expect(res3).toBe('0 FCFA')
  })

  it('arrondit les décimales proprement', () => {
    const res = fcfa(1550.8)
    expect(res).toMatch(/1[\s\u202F\u00A0]551\sFCFA/)
  })

  it('retourne un tiret cadratin pour les valeurs nulles ou invalides', () => {
    expect(fcfa(null)).toBe('—')
    expect(fcfa(undefined)).toBe('—')
    expect(fcfa('')).toBe('—')
    expect(fcfa('invalide')).toBe('—')
  })
})

describe('Formatters - decodeHtml & escapeHtml', () => {
  it('échappe et décode correctement les entités HTML', () => {
    const raw = '<script>alert("test & demo")</script>'
    const escaped = escapeHtml(raw)
    expect(escaped).toBe('&lt;script&gt;alert(&quot;test &amp; demo&quot;)&lt;/script&gt;')
    
    expect(decodeHtml('&amp;')).toBe('&')
    expect(decodeHtml('&quot;')).toBe('"')
    expect(decodeHtml('&lt;')).toBe('<')
    expect(decodeHtml('&gt;')).toBe('>')
  })
})
