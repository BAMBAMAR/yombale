'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  type Locale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  isLocale,
  isRTL,
  LOCALES_META,
  type LocaleMeta,
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
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale || getCookieLocale())

  const setLocale = useCallback((newLocale: Locale) => {
    if (!isLocale(newLocale)) return
    setLocaleState(newLocale)
    if (typeof document !== 'undefined') {
      document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(newLocale)}; path=/; max-age=31536000; SameSite=Lax`
      document.documentElement.lang = newLocale
      document.documentElement.dir = isRTL(newLocale) ? 'rtl' : 'ltr'
      window.dispatchEvent(new CustomEvent('nopalou-locale-change', { detail: { locale: newLocale } }))
      router.refresh()
    }
  }, [router])

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

  const isRtl = useMemo(() => isRTL(locale), [locale])
  const meta = useMemo(() => LOCALES_META[locale] || LOCALES_META.fr, [locale])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = dictionaries[locale] || dictionaries.fr
      let raw = resolveNestedKey(dict, key)
      if (raw === undefined && locale !== 'fr') {
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
    },
    [locale]
  )

  const formatPrice = useCallback((price: number | string | null | undefined) => fcfa(price, locale), [locale])
  const formatNumber = useCallback((val: number | string | null | undefined) => formatNombre(val, locale), [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatPrice,
      formatNumber,
      isRtl,
      meta,
    }),
    [locale, setLocale, t, formatPrice, formatNumber, isRtl, meta]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    // Fallback safe for components rendered outside provider
    const fallbackLocale = getCookieLocale()
    return {
      locale: fallbackLocale,
      setLocale: () => {},
      isRtl: isRTL(fallbackLocale),
      meta: LOCALES_META[fallbackLocale] || LOCALES_META.fr,
      formatPrice: (price: number | string | null | undefined) => fcfa(price, fallbackLocale),
      formatNumber: (val: number | string | null | undefined) => formatNombre(val, fallbackLocale),
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        const dict = dictionaries[fallbackLocale] || dictionaries.fr
        let raw = resolveNestedKey(dict, key) || resolveNestedKey(dictionaries.fr, key) || key
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            raw = raw.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
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
