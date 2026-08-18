'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import AccountNavLinks from './AccountNavLinks'
import LanguageSelector from '@/components/LanguageSelector'
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
    >
      <div className="account-sidebar-identity">
        <div className="account-avatar" aria-hidden="true">{initiale}</div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{nom}</p>
          {email && <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)' }}>{email}</p>}
        </div>
      </div>
      <div className="account-sidebar-nav-wrapper">
        <AccountNavLinks overrideTab={tab} />
      </div>
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{t('common.language')}</span>
        <LanguageSelector variant="compact" align="start" />
      </div>
    </aside>
  )
}
