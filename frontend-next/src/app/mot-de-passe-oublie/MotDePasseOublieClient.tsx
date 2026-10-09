'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import NopalouBrandLogo from '@/components/NopalouBrandLogo'
import { useTranslation } from '@/i18n/context'
import LanguageSelector from '@/components/LanguageSelector'
import MotDePasseOublieForm from './MotDePasseOublieForm'

export default function MotDePasseOublieClient() {
  const { t } = useTranslation()

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <NopalouBrandLogo taille={32} theme="dark" priority={true} className="auth-visual-logo" />
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
