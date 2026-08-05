import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { backendFetch } from '@/lib/backend-fetch'
import AnalyticsClient from './AnalyticsClient'

export const metadata: Metadata = { title: 'Analytics boutique' }

export default async function BoutiqueAnalyticsPage() {
  // ── Vérification du plan avant d'afficher la page ──────────────────
  let planActif: string | null = null
  try {
    const r = await backendFetch('/api/abonnements/mon-plan')
    if (r.ok) {
      const d = await r.json()
      planActif = d?.abonnement?.plan ?? null
    }
  } catch {}

  const isPro = planActif === 'pro' || planActif === 'business'
  if (!isPro) {
    redirect('/boutique?tab=analytics&locked=true')
  }

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
