import { fr } from './locales/fr/index.ts'
import { en } from './locales/en/index.ts'
import { ar } from './locales/ar/index.ts'
import type { Locale } from './config.ts'
import type { TranslationSchema } from './types.ts'

export const dictionaries: Record<Locale, TranslationSchema> = {
  fr,
  en,
  ar,
}

export function getDictionary(locale: Locale): TranslationSchema {
  return dictionaries[locale] || dictionaries.fr
}

export * from './config.ts'
export * from './types.ts'
