import { fr } from './locales/fr/index'
import { en } from './locales/en/index'
import { ar } from './locales/ar/index'
import type { Locale } from './config'
import type { TranslationSchema } from './types'

export const dictionaries: Record<Locale, TranslationSchema> = {
  fr,
  en,
  ar,
}

export function getDictionary(locale: Locale): TranslationSchema {
  return dictionaries[locale] || dictionaries.fr
}

export * from './config'
export * from './types'
