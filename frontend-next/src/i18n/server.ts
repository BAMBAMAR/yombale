import { cookies } from 'next/headers'
import {
  type Locale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  isLocale,
  isRTL,
} from './config'
import { dictionaries } from './index'
import type { TranslationKey, TranslationSchema } from './types'

export function getServerLocale(): Locale {
  try {
    const cookieStore = cookies()
    const cookieVal = cookieStore.get(LOCALE_COOKIE_NAME)?.value
    return cookieVal && isLocale(cookieVal) ? cookieVal : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

function resolveNestedKey(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  const parts = path.split('.')
  let curr: any = obj
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part]
    } else {
      return undefined
    }
  }
  return typeof curr === 'string' ? curr : undefined
}

export function getServerTranslation(locale?: Locale) {
  const activeLocale = locale || getServerLocale()
  const isRtl = isRTL(activeLocale)

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = dictionaries[activeLocale] || dictionaries.fr
    let raw = resolveNestedKey(dict, key)
    if (raw === undefined && activeLocale !== 'fr') {
      raw = resolveNestedKey(dictionaries.fr, key)
    }
    if (raw === undefined) {
      return key
    }
    if (params) {
      let formatted = raw
      Object.entries(params).forEach(([k, v]) => {
        formatted = formatted.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
      return formatted
    }
    return raw
  }

  return {
    locale: activeLocale,
    isRtl,
    t,
  }
}
