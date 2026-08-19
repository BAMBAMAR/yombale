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

/**
 * Détermine si une route fait partie du périmètre internationalisé (Compte, Boutique, Auth, Dépôt d'annonces).
 * Toutes les autres routes publiques (Accueil, Fiche Produit, Immobilier, Télécom, Annonces publiques)
 * restent strictement en français (LTR).
 */
export function isI18nScopedRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const cleanPath = pathname.split('?')[0].split('#')[0]
  
  // Cas spécifique : /boutiques (au pluriel) est l'annuaire public, /boutique (au singulier) est l'espace marchand
  if (cleanPath.startsWith('/boutiques')) {
    return false
  }

  const scopedPrefixes = [
    '/compte',
    '/boutique',
    '/mes-annonces',
    '/mes-annonces-immo',
    '/mes-alertes',
    '/deposer-annonce',
    '/deposer-immo',
    '/connexion',
    '/inscription',
    '/mot-de-passe-oublie',
  ]

  return scopedPrefixes.some(prefix => cleanPath === prefix || cleanPath.startsWith(prefix + '/'))
}
