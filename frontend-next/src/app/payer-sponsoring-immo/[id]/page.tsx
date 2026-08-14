import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOptionalSession } from '@/lib/dal'
import PaiementSponsoringImmoClient from './PaiementSponsoringImmoClient'
import { apiFetch } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Sponsoriser cette annonce immobilière',
}

export default async function PayerSponsoringImmoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getOptionalSession()
  if (!session) redirect(`/connexion?redirect=/immo/${id}`)

  let immo: { titre: string } | null = null
  try {
    immo = await apiFetch<{ titre: string }>(`/immo/${id}`)
  } catch {
    immo = null
  }

  if (!immo) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🏠</span>
          <p>Annonce immobilière introuvable.</p>
          <Link href="/immo" className="budget-pill active" style={{ marginTop: 8 }}>
            Retour
          </Link>
        </div>
      </div>
    )
  }

  const titreCourt = immo.titre.length > 60
    ? immo.titre.slice(0, 57) + '…'
    : immo.titre

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
        <Link href={`/immo/${id}`} style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
          ← Retour à l&apos;annonce
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', margin: '10px 0 4px' }}>
          Sponsoriser votre bien immobilier
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Mettez &quot;{titreCourt}&quot; en vedette pour 30 jours (Apparaîtra en haut de la liste).
        </p>
      </div>

      <PaiementSponsoringImmoClient
        immoId={id}
        titreCourt={titreCourt}
        settings={settings}
        userId={session.userId}
      />
    </div>
  )
}
