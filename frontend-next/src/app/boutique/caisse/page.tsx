import { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import { verifySession } from '@/lib/dal'
import CaisseClient from './CaisseClient'

export const metadata: Metadata = {
  title: 'Caisse Enregistreuse POS — Nopalou',
  description: 'Point de vente physique et caisse enregistreuse connectée aux lecteurs code-barres et imprimantes thermiques.',
}

export const dynamic = 'force-dynamic'

export default async function CaissePage() {
  await verifySession()

  let planActif: string | null = null
  try {
    const res = await backendFetch('/api/abonnements/mon-plan')
    if (res.ok) {
      const data = await res.json()
      planActif = data.abonnement?.plan ?? null
    }
  } catch {
    planActif = null
  }

  return <CaisseClient planActif={planActif} />
}
