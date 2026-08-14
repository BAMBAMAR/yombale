import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOptionalSession } from '@/lib/dal'
import { backendAuthFetch } from '@/lib/backendFetch'
import PaiementSponsoringBoutiqueClient from './PaiementSponsoringBoutiqueClient'

export const metadata: Metadata = {
  title: 'Sponsoriser ma boutique',
}

interface Boutique {
  id: string
  nom: string
  sponsorise: boolean | null
}

export default async function PayerSponsoringBoutiquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getOptionalSession()
  if (!session) redirect('/connexion?redirect=/boutique')

  let boutique: Boutique | null = null

  try {
    const res = await backendAuthFetch('/boutiques/mes-boutiques')
    if (res.ok) {
      const boutiques: Boutique[] = await res.json()
      boutique = boutiques.find((b: any) => b.id === id) ?? null
    }
  } catch {
    // handled below
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
      <div style={{ marginBottom: 24 }}>
        <Link href="/boutique" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
          ← Mes boutiques
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', margin: '10px 0 4px' }}>
          Sponsoriser votre boutique
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          Mettez votre boutique &quot;{nomCourt}&quot; en vedette pour 30 jours (Apparaîtra dans la section Boutiques Pro).
        </p>
      </div>

      <PaiementSponsoringBoutiqueClient
        boutiqueId={id}
        nomCourt={nomCourt}
        settings={settings}
        userId={session.userId}
      />
    </div>
  )
}
