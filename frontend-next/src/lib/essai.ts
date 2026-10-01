import 'server-only'
import { cache } from 'react'
import { apiFetch } from '@/lib/api'
import {
  ESSAI_DEFAUT, essaiJoursValide,
  KALPE_ESSAI_DEFAUT, KALPE_PRIX_DEFAUT, kalpeEssaiJoursValide, kalpePrixMensuelValide,
} from '@/lib/essai-format'

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

let memoKalpe: { essaiJours: number; prixMensuel: number; at: number } | null = null

/** Réglages Sama Xaalis (durée d'essai en jours, prix mensuel en FCFA) lus dans les réglages admin, repli sur 30 jours et 1 000 FCFA. */
export const getKalpeReglages = cache(async (): Promise<{ essaiJours: number; prixMensuel: number }> => {
  if (memoKalpe && Date.now() - memoKalpe.at < TTL_MS) return { essaiJours: memoKalpe.essaiJours, prixMensuel: memoKalpe.prixMensuel }
  try {
    const reglages = await apiFetch<Record<string, string>>('/settings/public')
    const valeurs = {
      essaiJours: kalpeEssaiJoursValide(reglages?.kalpe_essai_jours),
      prixMensuel: kalpePrixMensuelValide(reglages?.kalpe_prix_mensuel),
    }
    memoKalpe = { ...valeurs, at: Date.now() }
    return valeurs
  } catch {
    return memoKalpe
      ? { essaiJours: memoKalpe.essaiJours, prixMensuel: memoKalpe.prixMensuel }
      : { essaiJours: KALPE_ESSAI_DEFAUT, prixMensuel: KALPE_PRIX_DEFAUT }
  }
})
