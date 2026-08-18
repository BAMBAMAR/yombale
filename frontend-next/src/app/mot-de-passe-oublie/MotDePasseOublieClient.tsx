'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '@/i18n/context'
import LanguageSelector from '@/components/LanguageSelector'
import MotDePasseOublieForm from './MotDePasseOublieForm'

export default function MotDePasseOublieClient() {
  const { t } = useTranslation()

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Link href="/" className="auth-visual-logo">
          <Image src="/icons/logo-mark.svg" alt="" width={32} height={32} style={{ borderRadius: 7, flexShrink: 0 }} priority />
          <span className="auth-logo-name" data-suffix="lou">Nopa</span>
        </Link>
        <div className="auth-visual-body">
          <h2 className="auth-visual-titre">{t('auth.forgotTitle')}</h2>
          <p className="auth-visual-desc">{t('auth.forgotSubtitle')}</p>
        </div>
        <p className="auth-visual-footer">© {new Date().getFullYear()} {t('auth.visualFooter')}</p>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <LanguageSelector variant="compact" />
          </div>
          <div className="auth-card-header">
            <h1 className="auth-card-titre">{t('auth.forgotTitle')}</h1>
            <p className="auth-card-desc">{t('auth.forgotSubtitle')}</p>
          </div>
          <MotDePasseOublieForm />
        </div>
      </div>
    </div>
  )
}
