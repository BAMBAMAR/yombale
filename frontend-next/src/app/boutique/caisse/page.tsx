import { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import { verifySession } from '@/lib/dal'
import CaisseClient from './CaisseClient'

export const metadata: Metadata = {
  title: 'Caisse Enregistreuse POS — Nopalou',
  description: 'Point de vente physique et caisse enregistreuse connectée aux lecteurs code-barres et imprimantes thermiques.',
}

export const dynamic = 'force-dynamic'

export default async function CaissePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; b?: string; boutique?: string }>
}) {
  const params = await searchParams
  const token = params.token?.trim() || null
  const initialBoutiqueId = params.b?.trim() || params.boutique?.trim() || null

  let planActif: string | null = null
  let userId: string | null = null

  if (!token) {
    const session = await verifySession()
    userId = session.userId ?? null
    try {
      const res = await backendFetch('/api/abonnements/mon-plan')
      if (res.ok) {
        const data = await res.json()
        planActif = data.abonnement?.plan ?? null
      }
    } catch {
      planActif = null
    }
  }

  return (
    <CaisseClient
      planActif={planActif}
      initialToken={token}
      userId={userId}
      initialBoutiqueId={initialBoutiqueId}
    />
  )
}
