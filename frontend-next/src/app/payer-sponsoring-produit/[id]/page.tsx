import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOptionalSession } from '@/lib/dal'
import PageHeader from '@/components/PageHeader'
import PaiementSponsoringProduitClient from './PaiementSponsoringProduitClient'
import { apiFetch } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Sponsoriser ce produit',
}

export default async function PayerSponsoringProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getOptionalSession()
  if (!session) redirect(`/connexion?redirect=/produit/${id}`)

  let produit: { nom: string } | null = null
  try {
    produit = await apiFetch<{ nom: string }>(`/produits/${id}`)
  } catch {
    produit = null
  }

  if (!produit) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>📦</span>
          <p>Produit introuvable.</p>
          <Link href="/boutique" className="budget-pill active" style={{ marginTop: 8 }}>
            Retour
          </Link>
        </div>
      </div>
    )
  }
  
  const nomCourt = produit.nom.length > 60
    ? produit.nom.slice(0, 57) + '…'
    : produit.nom

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
          { label: 'Produit', href: `/produit/${id}` },
          { label: 'Mettre en avant' }
        ]}
        emoji="⭐"
        titre="Mettre en avant ce produit"
        compteur={`Sponsorisez "${nomCourt}" pour 30 jours afin de le propulser en tête des résultats.`}
      />

      <PaiementSponsoringProduitClient
        produitId={id}
        nomCourt={nomCourt}
        settings={settings}
        userId={session.userId}
      />
    </div>
  )
}
