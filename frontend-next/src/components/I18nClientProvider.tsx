'use client'

import React from 'react'
import { I18nProvider } from '@/i18n/context'
import type { Locale } from '@/i18n/config'

export default function I18nClientProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  return <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
}
