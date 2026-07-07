import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import { verifySession } from '@/lib/dal'
import BoutiqueClient from './BoutiqueClient'

export const metadata: Metadata = { title: 'Ma boutique — Nopalou' }

interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  cover_url: string | null
  site_web: string | null
  facebook: string | null
  instagram: string | null
  slug: string | null
  actif: boolean
  sponsorise: boolean | null
  sponsor_jusqu_au: string | null
  created_at: string
}

interface PlanActif {
  plan: 'pro' | 'business'
}

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ apporteur?: string }>
}) {
  const params = await searchParams
  const codeApporteurDefaut = params.apporteur?.trim().toUpperCase() || ''
  const session = await verifySession()

  let boutiques: Boutique[] = []
  let planActif: 'pro' | 'business' | null = null

  await Promise.all([
    backendFetch('/api/boutiques/mine')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) boutiques = d.boutiques ?? [] })
      .catch(() => {}),
    backendFetch('/api/abonnements/mon-plan')
      .then(r => r.ok ? r.json() : null)
      .then((d: { abonnement: PlanActif | null } | null) => { if (d?.abonnement) planActif = d.abonnement.plan })
      .catch(() => {}),
  ])

  const canCreate = boutiques.length < 3

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) settings = await r.json()
  } catch {
    // handled by defaults in BoutiqueClient
  }

  return (
    <BoutiqueClient
      boutiques={boutiques}
      canCreate={canCreate}
      planActif={planActif}
      codeApporteurDefaut={codeApporteurDefaut}
      userId={session.userId}
      settings={settings}
    />
  )
}
