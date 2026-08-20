'use client'

import React from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AccountNavLinks from './AccountNavLinks'
import { useTranslation } from '@/i18n/context'

interface Props {
  nom: string
  email: string | null
  initiale: string
}

export default function AccountSidebarClient({ nom, email, initiale }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || undefined
  const isMainPage = pathname === '/compte'
  const { t } = useTranslation()

  return (
    <aside
      className={`account-sidebar ${isMainPage ? 'account-sidebar--main' : 'account-sidebar--sub'}`}
      aria-label={t('account.navTitle')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: '#ffffff',
        padding: '16px',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Carte d'Identité Utilisateur */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 100%)',
          borderRadius: 14,
          border: '1px solid #E8DDD2',
          boxShadow: '0 2px 6px rgba(26,22,18,0.04)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            fontWeight: 900,
            boxShadow: '0 3px 8px rgba(28,43,74,0.2)',
            flexShrink: 0,
          }}
        >
          {initiale}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: 14,
              color: 'var(--navy, #1C2B4A)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {nom}
          </p>
          {email && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11.5,
                color: '#64748B',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={email}
            >
              {email}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Accordéon Desktop / Tabs Mobile */}
      <div className="account-sidebar-nav-wrapper" style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <AccountNavLinks overrideTab={tab} />
      </div>

      {/* Footer Accès Rapides & Aide */}
      <div
        className="account-sidebar-footer"
        style={{
          borderTop: '1px solid #E8DDD2',
          paddingTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <Link
          href="/guide-utilisation"
          target="_blank"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: '#C75B00',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 750,
            background: '#FFF7ED',
            border: '1px solid #FFEDD5',
            transition: 'background 0.15s',
          }}
        >
          <span>📖 Guide d&apos;utilisation</span>
        </Link>
        <Link
          href="/boutique"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: 'var(--navy, #1C2B4A)',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 700,
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            transition: 'background 0.15s',
          }}
        >
          <span>🏪 {t('shop.merchantAccount') || 'Espace Boutique'}</span>
        </Link>
        <a
          href="/api/auth/deconnexion"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: '#DC2626',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 700,
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            transition: 'background 0.15s',
          }}
        >
          <span>🚪 {t('account.navLogout') || 'Déconnexion'}</span>
        </a>
      </div>
    </aside>
  )
}
