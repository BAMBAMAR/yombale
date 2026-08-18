'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/i18n/context'

export default function AccountMobileHeader() {
  const pathname = usePathname()
  const { t, isRtl } = useTranslation()
  if (pathname === '/compte') return null

  return (
    <div className="account-mobile-header" style={{ padding: '12px 16px', background: 'var(--pos-surface, #ffffff)', borderBottom: '1px solid var(--pos-border, #E8DDD2)' }}>
      <Link
        href="/compte"
        className="account-back-link"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 800,
          color: 'var(--pos-navy, #1C2B4A)',
          background: 'var(--pos-surface2, #FAF8F5)',
          padding: '6px 12px',
          borderRadius: 10,
          border: '1.5px solid var(--pos-border, #E8DDD2)',
          textDecoration: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent, #C75B00)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>{t('account.navTitle')}</span>
      </Link>
    </div>
  )
}
