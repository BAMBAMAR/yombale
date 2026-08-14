import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOptionalSession } from '@/lib/dal'
import { backendAuthFetch } from '@/lib/backendFetch'
import PageHeader from '@/components/PageHeader'
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
      <PageHeader
        breadcrumb={[
          { label: 'Immobilier', href: `/immo/${id}` },
          { label: 'Sponsoriser' }
        ]}
        emoji="⭐"
        titre="Sponsoriser votre bien immobilier"
        compteur={`Mettez "${titreCourt}" en vedette pour 30 jours (Apparaîtra en haut de la liste).`}
      />

      <PaiementSponsoringImmoClient
        immoId={id}
        titreCourt={titreCourt}
        settings={settings}
        userId={session.userId}
      />
    </div>
  )
}
