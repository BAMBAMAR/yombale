import type { Metadata } from 'next'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { logout } from '@/app/actions/auth'
import ProfilClient from './ProfilClient'

export const metadata: Metadata = { title: 'Mon profil — Nopalou' }

export default async function ProfilPage() {
  const session = await verifySession()
  const nom   = session.nom   ?? 'Utilisateur'
  const email = session.email ?? ''

  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 620 }}>
      <div className="profil-header">
        <Link href="/compte" className="profil-back">← Mon compte</Link>
        <h1 className="profil-titre">
          Mon <span style={{ color: 'var(--accent)' }}>profil</span>
        </h1>
      </div>

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
