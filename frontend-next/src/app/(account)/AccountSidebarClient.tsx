'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import AccountNavLinks from './AccountNavLinks'

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

  return (
    <aside
      className={`account-sidebar ${isMainPage ? 'account-sidebar--main' : 'account-sidebar--sub'}`}
      aria-label="Panneau de gestion du compte"
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
    </aside>
  )
}
