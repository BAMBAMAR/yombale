'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  type Locale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  isLocale,
  isRTL,
  LOCALES_META,
  type LocaleMeta,
  isI18nScopedRoute,
} from './config'
import { dictionaries } from './index'
import type { TranslationKey, TranslationSchema } from './types'

import { fcfa, formatNombre } from '@/lib/format'

interface I18nContextValue {
  locale: Locale
  setLocale: (newLocale: Locale) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  formatPrice: (price: number | string | null | undefined) => string
  formatNumber: (val: number | string | null | undefined) => string
  isRtl: boolean
  meta: LocaleMeta
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getCookieLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${LOCALE_COOKIE_NAME}=([^;]+)`))
  const val = match ? decodeURIComponent(match[2]) : null
  return val && isLocale(val) ? val : DEFAULT_LOCALE
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

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale || getCookieLocale())

  const isScoped = isI18nScopedRoute(pathname)

  const setLocale = useCallback((newLocale: Locale) => {
    if (!isLocale(newLocale)) return
    setLocaleState(newLocale)
    if (typeof document !== 'undefined') {
      document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(newLocale)}; path=/; max-age=31536000; SameSite=Lax`
      const scoped = isI18nScopedRoute(pathname)
      document.documentElement.lang = scoped ? newLocale : 'fr'
      document.documentElement.dir = (scoped && isRTL(newLocale)) ? 'rtl' : 'ltr'
      window.dispatchEvent(new CustomEvent('nopalou-locale-change', { detail: { locale: newLocale } }))
      router.refresh()
    }
  }, [pathname, router])

  useEffect(() => {
    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ locale: Locale }>
      if (customEvent.detail?.locale && isLocale(customEvent.detail.locale)) {
        setLocaleState(customEvent.detail.locale)
      }
    }
    window.addEventListener('nopalou-locale-change', handleLocaleChange)
    return () => window.removeEventListener('nopalou-locale-change', handleLocaleChange)
  }, [])

  // Synchroniser la balise html (lang et dir) lors de la navigation entre pages publiques et espace compte
  useEffect(() => {
    if (typeof document === 'undefined') return
    const scoped = isI18nScopedRoute(pathname)
    const activeLang = scoped ? locale : 'fr'
    const activeDir = (scoped && isRTL(locale)) ? 'rtl' : 'ltr'
    document.documentElement.lang = activeLang
    document.documentElement.dir = activeDir
  }, [pathname, locale])

  const effectiveLocale = isScoped ? locale : 'fr'
  const isRtl = isScoped && isRTL(locale)
  const meta = isScoped ? (LOCALES_META[locale] || LOCALES_META.fr) : LOCALES_META.fr

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const activeLang = isI18nScopedRoute(pathname) ? locale : 'fr'
      const dict = dictionaries[activeLang] || dictionaries.fr
      let raw = resolveNestedKey(dict, key)
      if (raw === undefined && activeLang !== 'fr') {
        raw = resolveNestedKey(dictionaries.fr, key)
      }
      if (raw === undefined) {
        return key
      }
      if (params) {
        let formatted = raw
        Object.entries(params).forEach(([k, v]) => {
          const valStr = (activeLang === 'ar' && typeof v === 'number') ? formatNombre(v, 'ar') : String(v)
          formatted = formatted.replace(new RegExp(`\\{${k}\\}`, 'g'), valStr)
        })
        return formatted
      }
      return raw
    },
    [pathname, locale]
  )

  const formatPrice = useCallback((price: number | string | null | undefined) => {
    const activeLang = isI18nScopedRoute(pathname) ? locale : 'fr'
    return fcfa(price, activeLang)
  }, [pathname, locale])

  const formatNumber = useCallback((val: number | string | null | undefined) => {
    const activeLang = isI18nScopedRoute(pathname) ? locale : 'fr'
    return formatNombre(val, activeLang)
  }, [pathname, locale])

  const value = useMemo(
    () => ({
      locale: effectiveLocale,
      setLocale,
      t,
      formatPrice,
      formatNumber,
      isRtl,
      meta,
    }),
    [effectiveLocale, setLocale, t, formatPrice, formatNumber, isRtl, meta]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    // Fallback safe for components rendered outside provider
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const isScoped = isI18nScopedRoute(currentPath)
    const fallbackUserLocale = getCookieLocale()
    const fallbackLocale = isScoped ? fallbackUserLocale : 'fr'
    return {
      locale: fallbackLocale,
      setLocale: () => {},
      isRtl: isScoped && isRTL(fallbackLocale),
      meta: LOCALES_META[fallbackLocale] || LOCALES_META.fr,
      formatPrice: (price: number | string | null | undefined) => fcfa(price, fallbackLocale),
      formatNumber: (val: number | string | null | undefined) => formatNombre(val, fallbackLocale),
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        const dict = dictionaries[fallbackLocale] || dictionaries.fr
        let raw = resolveNestedKey(dict, key) || resolveNestedKey(dictionaries.fr, key) || key
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            const valStr = (fallbackLocale === 'ar' && typeof v === 'number') ? formatNombre(v, 'ar') : String(v)
            raw = raw.replace(new RegExp(`\\{${k}\\}`, 'g'), valStr)
          })
        }
        return raw
      },
    }
  }
  return context
}

export function useLocale() {
  const { locale, setLocale, isRtl, meta } = useTranslation()
  return { locale, setLocale, isRtl, meta }
}
