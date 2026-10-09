import { describe, it, expect } from 'vitest'
import { reparerApostrophes } from '../surga-formatting'

describe('reparerApostrophes', () => {
  it('rétablit l’apostrophe des textes constatés dans les fiches de concours', () => {
    expect(reparerApostrophes('Concours direct d entrée à l École Nationale d Administration (ENA)'))
      .toBe('Concours direct d’entrée à l’École Nationale d’Administration (ENA)')
    expect(reparerApostrophes('Ministère de l Intérieur — Direction Générale de la Police Nationale'))
      .toBe('Ministère de l’Intérieur — Direction Générale de la Police Nationale')
    expect(reparerApostrophes('Concours de recrutement d Élèves Gardiens de la Paix'))
      .toBe('Concours de recrutement d’Élèves Gardiens de la Paix')
    expect(reparerApostrophes('Extrait d acte de naissance')).toBe('Extrait d’acte de naissance')
    expect(reparerApostrophes('Il faut qu un dossier soit complet, jusqu à la clôture'))
      .toBe('Il faut qu’un dossier soit complet, jusqu’à la clôture')
  })

  it('ne modifie pas un texte déjà correct', () => {
    const ok = 'Concours d’entrée à l’École nationale d’administration'
    expect(reparerApostrophes(ok)).toBe(ok)
    expect(reparerApostrophes("Droit d'accès et l'oubli")).toBe("Droit d'accès et l'oubli")
  })

  it('ne touche pas aux lettres isolées qui ne sont pas des élisions', () => {
    expect(reparerApostrophes('Option C et D, plan B')).toBe('Option C et D, plan B')
    expect(reparerApostrophes('Section A à Z')).toBe('Section A à Z')
    expect(reparerApostrophes('Les 3 premiers sont l un après l autre')).toBe('Les 3 premiers sont l’un après l’autre')
  })

  it('rend une chaîne vide pour une valeur absente', () => {
    expect(reparerApostrophes(null)).toBe('')
    expect(reparerApostrophes(undefined)).toBe('')
  })
})
