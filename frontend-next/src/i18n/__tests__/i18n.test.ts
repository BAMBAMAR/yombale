import { describe, it, expect } from 'vitest'
import { LOCALES, DEFAULT_LOCALE, LOCALES_META, isLocale, isRTL, getValidLocale } from '../config'
import { getDictionary } from '../index'
import frDict from '../locales/fr'
import enDict from '../locales/en'
import arDict from '../locales/ar'

function getDeepKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getDeepKeys(value, currentPath))
    } else {
      keys.push(currentPath)
    }
  }
  return keys.sort()
}

describe('i18n Config & Utilities', () => {
  it('définit les 3 langues supportées avec le Français par défaut', () => {
    expect(LOCALES).toEqual(['fr', 'en', 'ar'])
    expect(DEFAULT_LOCALE).toBe('fr')
  })

  it('fournit les métadonnées pour chaque langue (code, label, flag, dir)', () => {
    expect(LOCALES_META.fr.dir).toBe('ltr')
    expect(LOCALES_META.en.dir).toBe('ltr')
    expect(LOCALES_META.ar.dir).toBe('rtl')
    expect(LOCALES_META.fr.label).toBe('Français')
    expect(LOCALES_META.en.label).toBe('Anglais')
    expect(LOCALES_META.en.nativeLabel).toBe('English')
    expect(LOCALES_META.ar.label).toBe('Arabe')
    expect(LOCALES_META.ar.nativeLabel).toBe('العربية')
    expect(LOCALES_META.fr.flag).toBe('🇫🇷')
    expect(LOCALES_META.en.flag).toBe('🇬🇧')
    expect(LOCALES_META.ar.flag).toBe('🇸🇦')
  })

  it('isLocale valide uniquement fr, en, ar', () => {
    expect(isLocale('fr')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('ar')).toBe(true)
    expect(isLocale('es')).toBe(false)
    expect(isLocale('')).toBe(false)
    expect(isLocale(null)).toBe(false)
  })

  it('isRTL identifie correctement l’arabe comme RTL', () => {
    expect(isRTL('ar')).toBe(true)
    expect(isRTL('fr')).toBe(false)
    expect(isRTL('en')).toBe(false)
    expect(isRTL('unknown')).toBe(false)
  })

  it('getValidLocale retourne la langue demandée ou le fallback fr', () => {
    expect(getValidLocale('en')).toBe('en')
    expect(getValidLocale('ar')).toBe('ar')
    expect(getValidLocale('fr')).toBe('fr')
    expect(getValidLocale('de')).toBe('fr')
    expect(getValidLocale(null)).toBe('fr')
  })
})

describe('i18n Dictionaries & Key Parity', () => {
  const frKeys = getDeepKeys(frDict)
  const enKeys = getDeepKeys(enDict)
  const arKeys = getDeepKeys(arDict)

  it('vérifie que les dictionnaires fr, en et ar contiennent le même nombre total de clés', () => {
    expect(frKeys.length).toBeGreaterThan(50)
    expect(enKeys.length).toBe(frKeys.length)
    expect(arKeys.length).toBe(frKeys.length)
  })

  it('vérifie que toutes les clés françaises existent à 100% en anglais', () => {
    const missingInEn = frKeys.filter(k => !enKeys.includes(k))
    expect(missingInEn).toEqual([])
  })

  it('vérifie que toutes les clés françaises existent à 100% en arabe', () => {
    const missingInAr = frKeys.filter(k => !arKeys.includes(k))
    expect(missingInAr).toEqual([])
  })

  it('vérifie qu’aucune traduction n’est vide ou non définie', () => {
    function assertNoEmptyValues(obj: Record<string, any>, path = '') {
      for (const [key, val] of Object.entries(obj)) {
        const fullKey = path ? `${path}.${key}` : key
        if (typeof val === 'object' && val !== null) {
          assertNoEmptyValues(val, fullKey)
        } else {
          expect(typeof val).toBe('string')
          expect((val as string).trim().length).toBeGreaterThan(0)
        }
      }
    }

    assertNoEmptyValues(frDict, 'fr')
    assertNoEmptyValues(enDict, 'en')
    assertNoEmptyValues(arDict, 'ar')
  })
})

describe('i18n getDictionary & Interpolation', () => {
  it('permet de récupérer le dictionnaire correspondant à la locale', () => {
    const fr = getDictionary('fr')
    const en = getDictionary('en')
    const ar = getDictionary('ar')

    expect(fr.common.save).toBe('Enregistrer')
    expect(en.common.save).toBe('Save')
    expect(ar.common.save).toBe('حفظ')
  })

  it('fallback sur fr si la locale est invalide', () => {
    const fallback = getDictionary('it' as any)
    expect(fallback.common.save).toBe('Enregistrer')
  })
})
