import type { Metadata } from 'next'
import { verifySession } from '@/lib/dal'
import { logout } from '@/app/actions/auth'
import ProfilClient from './ProfilClient'

export const metadata: Metadata = { title: 'Mon profil — Nopalou' }

export default async function ProfilPage() {
  const session = await verifySession()
  const nom   = session.nom   ?? 'Utilisateur'
  const email = session.email ?? ''

  return (
    <div>
      <ProfilClient nom={nom} email={email} />

      {/* Déconnexion */}
      <div className="profil-section profil-section--danger">
        <h2 className="profil-section-titre">Session</h2>
        <form action={logout}>
          <button type="submit" className="profil-logout-btn">
            🚪 Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
