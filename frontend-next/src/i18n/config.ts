export const LOCALES = ['fr', 'en', 'ar'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'
export const LOCALE_COOKIE_NAME = 'nopalou_locale'

export interface LocaleMeta {
  code: Locale
  label: string
  nativeLabel: string
  flag: string
  dir: 'ltr' | 'rtl'
}

export const LOCALES_META: Record<Locale, LocaleMeta> = {
  fr: {
    code: 'fr',
    label: 'Français',
    nativeLabel: 'Français',
    flag: '🇫🇷',
    dir: 'ltr',
  },
  en: {
    code: 'en',
    label: 'Anglais',
    nativeLabel: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
  },
  ar: {
    code: 'ar',
    label: 'Arabe',
    nativeLabel: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
  },
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale)
}

export function isRTL(locale: Locale | string): boolean {
  return isLocale(locale) && LOCALES_META[locale].dir === 'rtl'
}

export function getValidLocale(locale?: string | null): Locale {
  if (locale && isLocale(locale)) return locale
  return DEFAULT_LOCALE
}
