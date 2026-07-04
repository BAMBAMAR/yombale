'use server'
import { backendFetch, type ActionState } from '@/lib/backend-fetch'

export interface StatsApporteur {
  code_apporteur: string
  boutiques: { id: string; nom: string; plan: string | null; abonnement_statut: string | null }[]
  total_du: number
  total_paye: number
  taux_commission: number
  seuil_paiement: number
}

export async function devenirApporteur(): Promise<ActionState & { code_apporteur?: string }> {
  try {
    const res = await backendFetch('/api/apporteurs/devenir', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data.error ?? 'Impossible d\'activer le statut apporteur' }
    return { success: true, code_apporteur: data.code_apporteur }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function getMesStatsApporteur(): Promise<StatsApporteur | null> {
  try {
    const res = await backendFetch('/api/apporteurs/mes-stats')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
