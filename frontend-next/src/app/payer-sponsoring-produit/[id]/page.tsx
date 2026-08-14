import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOptionalSession } from '@/lib/dal'
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
      <div style={{ marginBottom: 24 }}>
        <Link href={`/produit/${id}`} style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
          ← Retour au produit
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', margin: '10px 0 4px' }}>
          Mettre en avant ce produit
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Sponsorisez &quot;{nomCourt}&quot; pour 30 jours afin de le propulser en tête des résultats.
        </p>
      </div>

      <PaiementSponsoringProduitClient
        produitId={id}
        nomCourt={nomCourt}
        settings={settings}
        userId={session.userId}
      />
    </div>
  )
}
