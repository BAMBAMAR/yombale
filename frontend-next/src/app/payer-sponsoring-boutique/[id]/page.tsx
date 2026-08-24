import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOptionalSession } from '@/lib/dal'
import { apiFetch } from '@/lib/api'
import { backendAuthFetch } from '@/lib/backendFetch'
import PageHeader from '@/components/PageHeader'
import PaiementSponsoringBoutiqueClient from './PaiementSponsoringBoutiqueClient'

export const metadata: Metadata = {
  title: 'Mettre en avant ma boutique',
}

interface Boutique {
  id: string
  nom: string
  sponsorise?: boolean | null
}

export default async function PayerSponsoringBoutiquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getOptionalSession()
  if (!session) redirect(`/connexion?redirect=/payer-sponsoring-boutique/${id}`)

  let boutique: Boutique | null = null

  // 1. Tenter la route authentifiée /boutiques/mine
  try {
    const res = await backendAuthFetch('/boutiques/mine')
    if (res.ok) {
      const data = await res.json()
      const list: Boutique[] = Array.isArray(data) ? data : (data.boutiques || [])
      boutique = list.find((b: any) => b.id === id || b.slug === id) ?? null
    }
  } catch {
    // handled below
  }

  // 2. Repli vers apiFetch public (/boutiques/${id})
  if (!boutique) {
    try {
      const bq = await apiFetch<Boutique>(`/boutiques/${id}`)
      if (bq && bq.id) {
        boutique = bq
      }
    } catch {
      // handled below
    }
  }

  if (!boutique) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🏪</span>
          <p>Boutique introuvable.</p>
          <Link href="/boutique" className="budget-pill active" style={{ marginTop: 8 }}>
            Mes boutiques
          </Link>
        </div>
      </div>
    )
  }

  const nomCourt = boutique.nom.length > 60
    ? boutique.nom.slice(0, 57) + '…'
    : boutique.nom

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
          { label: 'Ma boutique', href: '/boutique' },
          { label: 'Mettre en avant' }
        ]}
        emoji="⭐"
        titre="Mettre en avant votre boutique"
        compteur={`Mettez votre boutique "${nomCourt}" en vedette pour 30 jours (Apparaîtra dans la section Boutiques Pro).`}
      />

      <PaiementSponsoringBoutiqueClient
        boutiqueId={boutique.id}
        nomCourt={nomCourt}
        settings={settings}
        userId={session.userId}
      />
    </div>
  )
}
