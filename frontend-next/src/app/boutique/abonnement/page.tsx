import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import AbonnementClient from './AbonnementClient'

export const metadata: Metadata = { title: 'Abonnement Boutique — Nopalou' }

export default async function AbonnementPage() {
  let planActif: { plan: string; fin: string } | null = null
  try {
    const res = await backendFetch('/api/abonnements/mon-plan')
    if (res.ok) {
      const data = await res.json()
      planActif = data.abonnement
    }
  } catch { /* afficher page normale si erreur */ }

  return <AbonnementClient planActif={planActif} />
}
