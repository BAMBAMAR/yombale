import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOptionalSession } from '@/lib/dal'
import { backendAuthFetch } from '@/lib/backendFetch'
import PaiementBoostClient from './PaiementBoostClient'

export const metadata: Metadata = {
  title: 'Booster mon annonce',
}

interface Annonce {
  id: string
  titre: string
  payee: boolean
  actif: boolean
  categorie_slug: string
}

export default async function PayerBoostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getOptionalSession()
  if (!session) redirect('/connexion?redirect=/mes-annonces')

  let annonce: Annonce | null = null

  try {
    const res = await backendAuthFetch('/annonces/mine')
    if (res.ok) {
      const data: { annonces: Annonce[] } = await res.json()
      annonce = data.annonces.find(a => a.id === id) ?? null
    }
  } catch {
    // handled below
  }

  if (!annonce) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🔍</span>
          <p>Annonce introuvable.</p>
          <Link href="/mes-annonces" className="budget-pill active" style={{ marginTop: 8 }}>
            Mes annonces
          </Link>
        </div>
      </div>
    )
  }

  const titreCourt = annonce.titre.length > 60
    ? annonce.titre.slice(0, 57) + '…'
    : annonce.titre

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) settings = await r.json()
  } catch {
    // handled by defaults
  }

  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/mes-annonces" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
          ← Mes annonces
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', margin: '10px 0 4px' }}>
          Booster votre annonce
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Mettez votre annonce &quot;{titreCourt}&quot; en haut des résultats pendant 7 jours.
        </p>
      </div>

      <PaiementBoostClient
        annonceId={id}
        titreCourt={titreCourt}
        settings={settings}
        userId={session.userId}
      />
    </div>
  )
}
