'use client'

/**
 * SyncManager — Gestionnaire centralisé de synchronisation des ventes hors-ligne.
 *
 * Garanties :
 *  - Verrou par boutique : une seule synchronisation à la fois par boutiqueId.
 *  - Suppression IndexedDB UNIQUEMENT après ACK HTTP 200 confirmé.
 *  - Retry avec backoff exponentiel (1s → 2s → 4s → arrêt).
 *  - Idempotence : l'id_temporaire est transmis comme idempotency_key.
 *  - Erreurs métier (stock insuffisant, conflit) distinctes des erreurs réseau.
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import {
  obtenirVentesHorsLigne,
  marquerVenteSyncing,
  supprimerVenteHorsLigne,
  revertVenteSyncing,
  obtenirDettesHorsLigne,
  marquerDetteSyncing,
  supprimerDetteHorsLigne,
  revertDetteSyncing,
  type OfflineSale,
  type OfflineDebtTransaction,
} from '@/lib/db-offline'

// ── Verrou global partagé entre toutes les instances du hook ──────────────────
const syncLocks = new Map<string, boolean>()

const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1000

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Tente de synchroniser une vente avec le serveur.
 */
async function syncVente(
  vente: OfflineSale
): Promise<{ success: boolean; shouldRetry: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/boutiques/${vente.boutique_id}/pos-vente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotency_key: vente.id_temporaire,
        items: vente.items,
        caissier: vente.caissier,
        caissier_id: vente.caissier_id || undefined,
        session_id: vente.session_id || undefined,
        modePaiement: vente.modePaiement,
        client_id: vente.client_id,
        total: vente.total,
      }),
    })

    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      if (data.success || data.duplicate) {
        return { success: true, shouldRetry: false }
      }
      return {
        success: false,
        shouldRetry: false,
        error: data.error || 'Erreur métier POS',
      }
    }

    if (response.status >= 400 && response.status < 500) {
      const data = await response.json().catch(() => ({}))
      return {
        success: false,
        shouldRetry: false,
        error: data.error || `Erreur HTTP ${response.status}`,
      }
    }

    return { success: false, shouldRetry: true, error: `Erreur serveur HTTP ${response.status}` }
  } catch (err) {
    return {
      success: false,
      shouldRetry: true,
      error: err instanceof Error ? err.message : 'Erreur réseau',
    }
  }
}

/**
 * Tente de synchroniser une transaction de dette avec le serveur.
 */
async function syncDette(
  dette: OfflineDebtTransaction
): Promise<{ success: boolean; shouldRetry: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/boutiques/${dette.boutique_id}/credits-clients/${dette.client_id}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotency_key: dette.id_temporaire,
        type: dette.type,
        montant: dette.montant,
        mode_paiement: dette.mode_paiement || 'credit',
        note: dette.note || null,
        produits: dette.produits || [],
        date_echeance: dette.date_echeance || null,
        relance_auto_whatsapp: dette.relance_auto_whatsapp !== false,
      }),
    })

    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      if (data.success || data.duplicate) {
        return { success: true, shouldRetry: false }
      }
      return {
        success: false,
        shouldRetry: false,
        error: data.error || 'Erreur métier carnet de dettes',
      }
    }

    if (response.status >= 400 && response.status < 500) {
      const data = await response.json().catch(() => ({}))
      return {
        success: false,
        shouldRetry: false,
        error: data.error || `Erreur HTTP ${response.status}`,
      }
    }

    return { success: false, shouldRetry: true, error: `Erreur serveur HTTP ${response.status}` }
  } catch (err) {
    return {
      success: false,
      shouldRetry: true,
      error: err instanceof Error ? err.message : 'Erreur réseau',
    }
  }
}

export interface SyncResult {
  synced: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

/**
 * Synchronise toutes les ventes et transactions de dettes en attente pour une boutique.
 */
export async function syncToutBoutique(
  boutiqueId: string,
  userId: string
): Promise<SyncResult> {
  if (!boutiqueId || !userId) return { synced: 0, failed: 0, errors: [] }

  if (syncLocks.get(boutiqueId)) {
    return { synced: 0, failed: 0, errors: [] }
  }

  syncLocks.set(boutiqueId, true)
  const result: SyncResult = { synced: 0, failed: 0, errors: [] }

  try {
    // 1. Synchronisation des ventes POS
    const ventes = await obtenirVentesHorsLigne(boutiqueId, userId)
    for (const vente of ventes) {
      await marquerVenteSyncing(vente.id_temporaire).catch(() => {})
      let lastError = ''
      let success = false

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1)
          await sleep(delay)
        }

        const resVente = await syncVente(vente)
        if (resVente.success) {
          await supprimerVenteHorsLigne(vente.id_temporaire).catch(() => {})
          result.synced++
          success = true
          break
        }

        lastError = resVente.error || 'Erreur inconnue'
        if (!resVente.shouldRetry) {
          await revertVenteSyncing(vente.id_temporaire).catch(() => {})
          break
        }
      }

      if (!success) {
        await revertVenteSyncing(vente.id_temporaire).catch(() => {})
        result.failed++
        result.errors.push({ id: vente.id_temporaire, error: lastError })
      }
    }

    // 2. Synchronisation des écritures du Carnet de Dettes
    const dettes = await obtenirDettesHorsLigne(boutiqueId, userId)
    for (const dette of dettes) {
      await marquerDetteSyncing(dette.id_temporaire).catch(() => {})
      let lastError = ''
      let success = false

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1)
          await sleep(delay)
        }

        const resDette = await syncDette(dette)
        if (resDette.success) {
          await supprimerDetteHorsLigne(dette.id_temporaire).catch(() => {})
          result.synced++
          success = true
          break
        }

        lastError = resDette.error || 'Erreur inconnue'
        if (!resDette.shouldRetry) {
          await revertDetteSyncing(dette.id_temporaire).catch(() => {})
          break
        }
      }

      if (!success) {
        await revertDetteSyncing(dette.id_temporaire).catch(() => {})
        result.failed++
        result.errors.push({ id: dette.id_temporaire, error: lastError })
      }
    }
  } finally {
    syncLocks.delete(boutiqueId)
  }

  return result
}

// Rétrocompatibilité : syncVentesBoutique appelle syncToutBoutique
export async function syncVentesBoutique(
  boutiqueId: string,
  userId: string
): Promise<SyncResult> {
  return syncToutBoutique(boutiqueId, userId)
}

export interface UseSyncOfflineReturn {
  syncPending: boolean
  ventesEnAttente: number
  dettesEnAttente: number
  totalEnAttente: number
  lastSyncResult: SyncResult | null
  declencherSync: () => Promise<SyncResult>
  rafraichirCompteur: () => Promise<void>
}

/**
 * Hook React pour déclencher et suivre la synchronisation offline d'une boutique (POS & Dettes).
 */
export function useSyncOffline(
  boutiqueId: string,
  userId: string
): UseSyncOfflineReturn {
  const [syncPending, setSyncPending] = useState(false)
  const [ventesEnAttente, setVentesEnAttente] = useState(0)
  const [dettesEnAttente, setDettesEnAttente] = useState(0)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const rafraichirCompteur = useCallback(async () => {
    if (!boutiqueId || !userId) return
    try {
      const [ventes, dettes] = await Promise.all([
        obtenirVentesHorsLigne(boutiqueId, userId).catch(() => []),
        obtenirDettesHorsLigne(boutiqueId, userId).catch(() => []),
      ])
      if (isMounted.current) {
        setVentesEnAttente(ventes.length)
        setDettesEnAttente(dettes.length)
      }
    } catch {
      if (isMounted.current) {
        setVentesEnAttente(0)
        setDettesEnAttente(0)
      }
    }
  }, [boutiqueId, userId])

  const declencherSync = useCallback(async (): Promise<SyncResult> => {
    if (!boutiqueId || !userId) return { synced: 0, failed: 0, errors: [] }
    if (isMounted.current) setSyncPending(true)

    try {
      const result = await syncToutBoutique(boutiqueId, userId)
      if (isMounted.current) {
        setLastSyncResult(result)
        await rafraichirCompteur()
      }
      return result
    } finally {
      if (isMounted.current) setSyncPending(false)
    }
  }, [boutiqueId, userId, rafraichirCompteur])

  useEffect(() => {
    rafraichirCompteur()
  }, [rafraichirCompteur])

  return {
    syncPending,
    ventesEnAttente,
    dettesEnAttente,
    totalEnAttente: ventesEnAttente + dettesEnAttente,
    lastSyncResult,
    declencherSync,
    rafraichirCompteur,
  }
}

