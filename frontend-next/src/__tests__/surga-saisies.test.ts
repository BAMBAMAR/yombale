// @vitest-environment node
// SRG-A2-005, SRG-A2-007, SRG-A2-017 : montants, calculatrice et report d'un rappel
import { describe, it, expect } from 'vitest'
import { evaluerCalcul, formaterNombreCalcul } from '../lib/surga-calculator'
import { decalerDUneHeure } from '../lib/surga-agenda-dates'
import { interpreterCommandeVocale, regrouperMilliers } from '../lib/surga-voice'

describe('calculatrice (SRG-A2-007)', () => {
  it('garde les décimales du résultat et les affiche', () => {
    expect(evaluerCalcul('7/2').resultat).toBe(3.5)
    expect(evaluerCalcul('100/3').resultat).toBe(33.33)
    expect(evaluerCalcul('0,1+0,2').resultat).toBe(0.3)
    expect(formaterNombreCalcul(3.5)).toBe('3,5')
    expect(formaterNombreCalcul(33.33)).toBe('33,33')
    expect(formaterNombreCalcul(12)).toBe('12')
  })

  it('refuse un nombre mal formé au lieu de le lire à moitié', () => {
    expect(evaluerCalcul('1.2.3+1').success).toBe(false)
    expect(evaluerCalcul('5..2').success).toBe(false)
    expect(evaluerCalcul('100/0').success).toBe(false)
  })

  it('applique un pourcentage ajouté ou retiré à tout ce qui précède', () => {
    expect(evaluerCalcul('100+50+10%').resultat).toBe(165)
    expect(evaluerCalcul('5000+18%').resultat).toBe(5900)
    expect(evaluerCalcul('20000-25%').resultat).toBe(15000)
    expect(evaluerCalcul('200*10%').resultat).toBe(20)
    expect(evaluerCalcul('10%').resultat).toBe(0.1)
  })

  it('signale une valeur approchée au-delà de la précision des nombres', () => {
    expect(evaluerCalcul('999999999*999999999').approche).toBe(true)
    expect(evaluerCalcul('2500*4').approche).toBeUndefined()
  })
})

describe('montant avec espace des milliers (SRG-A2-005)', () => {
  it('regroupe les milliers sans toucher aux autres nombres', () => {
    expect(regrouperMilliers('Note 2 500 FCFA de taxi')).toBe('Note 2500 FCFA de taxi')
    expect(regrouperMilliers('1 250 000 FCFA')).toBe('1250000 FCFA')
    expect(regrouperMilliers('rappel le 12 à 10 h')).toBe('rappel le 12 à 10 h')
    expect(regrouperMilliers('3 kilos à 1500')).toBe('3 kilos à 1500')
  })

  it('lit le bon montant dans une commande', () => {
    const taxi = interpreterCommandeVocale('Note 2 500 FCFA de taxi')
    expect(taxi.intention).toBe('ADD_EXPENSE')
    expect(taxi.depenseData?.montant).toBe(2500)
    expect(interpreterCommandeVocale('5 000 FCFA carburant').depenseData?.montant).toBe(5000)
  })
})

describe('report d\'un rappel (SRG-A2-017)', () => {
  it('ajoute une heure à la date et à l\'heure du rappel, pas à l\'instant présent', () => {
    expect(decalerDUneHeure('2030-05-10', '14:00')).toEqual({ date: '2030-05-10', heure: '15:00' })
    expect(decalerDUneHeure('2030-05-10', '23:30')).toEqual({ date: '2030-05-11', heure: '00:30' })
    expect(decalerDUneHeure('2030-12-31', '23:15')).toEqual({ date: '2031-01-01', heure: '00:15' })
  })

  it('compte un rappel sans heure à 9 h', () => {
    expect(decalerDUneHeure('2030-05-10')).toEqual({ date: '2030-05-10', heure: '10:00' })
  })
})
