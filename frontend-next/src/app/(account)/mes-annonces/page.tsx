import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import { verifySession } from '@/lib/dal'
import AnnoncesClient from './AnnoncesClient'

export const metadata: Metadata = { title: 'Mes annonces — Nopalou' }

interface Annonce {
  id: string
  titre: string
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  photos: string[] | null
  created_at: string
}

export default async function MesAnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>
}) {
  const params = await searchParams
  const session = await verifySession()

  let annonces: Annonce[] = []
  try {
    const res = await backendFetch('/api/annonces/mine')
    if (res.ok) {
      const data = await res.json()
      annonces = data.annonces ?? []
    }
  } catch {
    // afficher liste vide si erreur réseau
  }

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) settings = await r.json()
  } catch {
    // valeurs par défaut gérées dans AnnoncesClient
  }

  return (
    <AnnoncesClient
      annonces={annonces}
      created={params.created === '1'}
      updated={params.updated === '1'}
      userId={session.userId}
      prixAnnonce={Number(settings.prix_annonce) || 1500}
      prixBoost={Number(settings.prix_boost) || 500}
      numeroWave={settings.paiement_manuel_numero_wave || ''}
      numeroOM={settings.paiement_manuel_numero_om || ''}
      waveActif={settings.paiement_wave !== 'false'}
    />
  )
}
