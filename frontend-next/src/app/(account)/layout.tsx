import { getOptionalSession } from '@/lib/dal'
import { backendAuthFetch } from '@/lib/backendFetch'
import AccountNavLinks from './AccountNavLinks'
import BannerEmailNonVerifie from './BannerEmailNonVerifie'

// Toutes les routes de ce groupe sauf /favoris sont dans PROTECTED_ROUTES
// (middleware.ts) — session garantie non-nulle pour elles. /favoris est la
// seule exception volontaire (fonctionne aussi pour visiteurs anonymes).
export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSession()
  if (!session) return <>{children}</>

  // Récupérer le statut email depuis le backend (source de vérité)
  let emailVerifie = true
  try {
    const res = await backendAuthFetch('/auth/statut')
    if (res.ok) {
      const data = await res.json()
      emailVerifie = data.email_verifie === true
    }
  } catch {
    // En cas d'erreur réseau, on n'affiche pas le bandeau pour ne pas bloquer
    emailVerifie = true
  }

  const nom = session.nom ?? session.email ?? 'vous'
  const initiale = nom.charAt(0).toUpperCase()

  return (
    <div className="account-layout">
      {!emailVerifie && <BannerEmailNonVerifie />}
      <aside className="account-sidebar">
        <div className="account-sidebar-identity">
          <div className="account-avatar">{initiale}</div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{nom}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)' }}>{session.email}</p>
          </div>
        </div>
        <AccountNavLinks />
      </aside>
      <main className="account-main">{children}</main>
    </div>
  )
}

