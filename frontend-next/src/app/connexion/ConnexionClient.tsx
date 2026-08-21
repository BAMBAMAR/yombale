'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '@/i18n/context'
import LanguageSelector from '@/components/LanguageSelector'
import ConnexionForm from './ConnexionForm'

export default function ConnexionClient() {
  const { t } = useTranslation()

  return (
    <div className="auth-page">
      {/* Panneau gauche — visuel */}
      <div className="auth-visual">
        <Link href="/" className="auth-visual-logo">
          <Image src="/icons/logo-mark.svg" alt="" width={32} height={32} style={{ borderRadius: 7, flexShrink: 0 }} priority />
          <span className="auth-logo-name"><span style={{ color: '#fff' }}>Nopa</span><span style={{ color: '#C75B00' }}>lou</span></span>
        </Link>
        <div className="auth-visual-body">
          <h2 className="auth-visual-titre" style={{ whiteSpace: 'pre-line' }}>
            {t('auth.visualTitle')}
          </h2>
          <p className="auth-visual-desc">{t('auth.visualDesc')}</p>
          <ul className="auth-visual-list">
            <li>✅ {t('auth.visualBullet1')}</li>
            <li>✅ {t('auth.visualBullet2')}</li>
            <li>✅ {t('auth.visualBullet3')}</li>
            <li>✅ {t('auth.visualBullet4')}</li>
          </ul>
        </div>
        <p className="auth-visual-footer">© {new Date().getFullYear()} {t('auth.visualFooter')}</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="auth-panel">
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <LanguageSelector variant="compact" />
          </div>
          <div className="auth-card-header">
            <h1 className="auth-card-titre">{t('auth.loginTitle')}</h1>
            <p className="auth-card-desc">{t('auth.loginDesc')}</p>
          </div>
          <ConnexionForm />
        </div>
      </div>
    </div>
  )
}
