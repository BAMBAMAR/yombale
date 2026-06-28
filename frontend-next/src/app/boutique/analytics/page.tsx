import type { Metadata } from 'next'
import { backendFetch } from '@/lib/backend-fetch'
import AnalyticsClient from './AnalyticsClient'

export const metadata: Metadata = { title: 'Analytics boutique — Nopalou' }

export default async function BoutiqueAnalyticsPage() {
  // Récupère les boutiques de l'utilisateur
  let boutiques: { id: string; nom: string }[] = []
  try {
    const res = await backendFetch('/api/boutiques/mine')
    if (res.ok) {
      const data = await res.json()
      boutiques = (data.boutiques ?? []).map((b: { id: string; nom: string }) => ({ id: b.id, nom: b.nom }))
    }
  } catch {}

  return <AnalyticsClient boutiques={boutiques} />
}
