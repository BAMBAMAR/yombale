import { Metadata } from 'next'
import { redirect } from 'next/navigation'
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
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token?.trim() || null

  let planActif: string | null = null

  if (!token) {
    await verifySession()
    try {
      const res = await backendFetch('/api/abonnements/mon-plan')
      if (res.ok) {
        const data = await res.json()
        planActif = data.abonnement?.plan ?? null
      }
    } catch {
      planActif = null
    }

    // ── Vérification du plan : Caisse POS réservée aux formules Pro & Business
    const isPro = planActif === 'pro' || planActif === 'business'
    if (!isPro) {
      redirect('/boutique?tab=caisse&locked=true')
    }
  }

  return <CaisseClient planActif={planActif} initialToken={token} />
}
