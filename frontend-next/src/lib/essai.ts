import 'server-only'
import { cache } from 'react'
import { apiFetch } from '@/lib/api'
import { ESSAI_DEFAUT, essaiJoursValide } from '@/lib/essai-format'

// Mémoire courte : le layout, la page et generateMetadata lisent la même valeur sans multiplier les appels.
const TTL_MS = 60_000
let memo: { jours: number; at: number } | null = null

/** Durée d'essai gratuit (jours) lue dans les réglages admin, avec repli sur la dernière valeur connue puis sur 30. */
export const getEssaiJours = cache(async (): Promise<number> => {
  if (memo && Date.now() - memo.at < TTL_MS) return memo.jours
  try {
    const reglages = await apiFetch<Record<string, string>>('/settings/public')
    const jours = essaiJoursValide(reglages?.abonnement_essai_jours)
    memo = { jours, at: Date.now() }
    return jours
  } catch {
    return memo?.jours ?? ESSAI_DEFAUT
  }
})
