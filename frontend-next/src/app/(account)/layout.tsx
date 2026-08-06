import { getOptionalSession } from '@/lib/dal'
import { backendAuthFetch } from '@/lib/backendFetch'
import AccountSidebarClient from './AccountSidebarClient'
import AccountMobileHeader from './AccountMobileHeader'
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

  const rawNom = session.nom?.trim()
  const emailVal = session.email?.trim()
  const nom = rawNom || emailVal || 'Vous'
  const initiale = nom.charAt(0).toUpperCase()

  return (
    <>
      {!emailVerifie && <BannerEmailNonVerifie />}
      <div className="account-layout">
        <AccountSidebarClient
          nom={nom}
          email={session.email ?? null}
          initiale={initiale}
        />
        <main className="account-main">
          <AccountMobileHeader />
          {children}
        </main>
      </div>
    </>
  )
}

