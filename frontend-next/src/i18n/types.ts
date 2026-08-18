import type { LocaleTranslations } from './locales/fr'
import type { Locale } from './config'

export type TranslationSchema = LocaleTranslations

// Recursively build dot notation keys e.g. "auth.loginTitle" or "common.save"
type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`

export type NestedKeyOf<T> = (
  T extends object
    ? { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<NestedKeyOf<T[K]>>}` }[Exclude<keyof T, symbol>]
    : ''
) extends infer D
  ? Extract<D, string>
  : never

export type TranslationKey = NestedKeyOf<TranslationSchema>

export type { Locale }
