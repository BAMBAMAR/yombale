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
  type OfflineSale,
} from '@/lib/db-offline'

// ── Verrou global partagé entre toutes les instances du hook ──────────────────
// Un Map<boutiqueId, boolean> garantit qu'une seule sync tourne par boutique,
// même si le hook est monté dans plusieurs composants simultanément.
const syncLocks = new Map<string, boolean>()

const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1000

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Tente de synchroniser une vente avec le serveur.
 * Retourne { success: true } si ACK reçu (y compris duplicate: true).
 * Retourne { success: false, shouldRetry: boolean, error: string } sinon.
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
      // Réponse HTTP 200 mais success=false → erreur métier, ne pas retry
      return {
        success: false,
        shouldRetry: false,
        error: data.error || 'Erreur métier POS',
      }
    }

    // HTTP 4xx → erreur métier non retryable (ex: boutique introuvable)
    if (response.status >= 400 && response.status < 500) {
      const data = await response.json().catch(() => ({}))
      return {
        success: false,
        shouldRetry: false,
        error: data.error || `Erreur HTTP ${response.status}`,
      }
    }

    // HTTP 5xx ou timeout → erreur réseau/serveur retryable
    return { success: false, shouldRetry: true, error: `Erreur serveur HTTP ${response.status}` }
  } catch (err) {
    // Erreur réseau (fetch échoue, timeout, hors-ligne) → toujours retryable
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
 * Synchronise toutes les ventes en attente pour une boutique donnée.
 * Utilise le verrou global pour éviter les doubles syncs.
 */
export async function syncVentesBoutique(
  boutiqueId: string,
  userId: string
): Promise<SyncResult> {
  if (!boutiqueId || !userId) return { synced: 0, failed: 0, errors: [] }

  // Vérifier le verrou
  if (syncLocks.get(boutiqueId)) {
    return { synced: 0, failed: 0, errors: [] }
  }

  syncLocks.set(boutiqueId, true)

  const result: SyncResult = { synced: 0, failed: 0, errors: [] }

  try {
    const ventes = await obtenirVentesHorsLigne(boutiqueId, userId)

    if (ventes.length === 0) {
      return result
    }

    for (const vente of ventes) {
      // Marquer comme "en cours" pour éviter double traitement
      await marquerVenteSyncing(vente.id_temporaire).catch(() => {})

      let lastError = ''
      let success = false

      // Retry avec backoff exponentiel
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1)
          await sleep(delay)
        }

        const syncResult = await syncVente(vente)

        if (syncResult.success) {
          // ✅ ACK confirmé → supprimer de l'IndexedDB
          await supprimerVenteHorsLigne(vente.id_temporaire).catch(() => {})
          result.synced++
          success = true
          break
        }

        lastError = syncResult.error || 'Erreur inconnue'

        if (!syncResult.shouldRetry) {
          // Erreur métier non retryable → remettre en 'pending' et signaler
          await revertVenteSyncing(vente.id_temporaire).catch(() => {})
          console.error(`[SyncManager] ❌ Vente ${vente.id_temporaire} : erreur métier non retryable — ${lastError}`)
          break
        }
      }

      if (!success) {
        // Echec après tous les retries → remettre en 'pending'
        await revertVenteSyncing(vente.id_temporaire).catch(() => {})
        result.failed++
        result.errors.push({ id: vente.id_temporaire, error: lastError })
        console.error(`[SyncManager] ❌ Vente ${vente.id_temporaire} non synchronisée après ${MAX_RETRIES} tentatives.`)
      }
    }
  } finally {
    syncLocks.delete(boutiqueId)
  }

  return result
}

export interface UseSyncOfflineReturn {
  syncPending: boolean
  ventesEnAttente: number
  lastSyncResult: SyncResult | null
  declencherSync: () => Promise<SyncResult>
  rafraichirCompteur: () => Promise<void>
}

/**
 * Hook React pour déclencher et suivre la synchronisation offline d'une boutique.
 *
 * Usage :
 *   const { syncPending, ventesEnAttente, declencherSync } = useSyncOffline(boutiqueId, userId)
 */
export function useSyncOffline(
  boutiqueId: string,
  userId: string
): UseSyncOfflineReturn {
  const [syncPending, setSyncPending] = useState(false)
  const [ventesEnAttente, setVentesEnAttente] = useState(0)
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
      const ventes = await obtenirVentesHorsLigne(boutiqueId, userId)
      if (isMounted.current) setVentesEnAttente(ventes.length)
    } catch {
      if (isMounted.current) setVentesEnAttente(0)
    }
  }, [boutiqueId, userId])

  const declencherSync = useCallback(async (): Promise<SyncResult> => {
    if (!boutiqueId || !userId) return { synced: 0, failed: 0, errors: [] }
    if (isMounted.current) setSyncPending(true)

    try {
      const result = await syncVentesBoutique(boutiqueId, userId)
      if (isMounted.current) {
        setLastSyncResult(result)
        await rafraichirCompteur()
      }
      return result
    } finally {
      if (isMounted.current) setSyncPending(false)
    }
  }, [boutiqueId, userId, rafraichirCompteur])

  // Rafraîchir le compteur au montage et quand la boutique change
  useEffect(() => {
    rafraichirCompteur()
  }, [rafraichirCompteur])

  return { syncPending, ventesEnAttente, lastSyncResult, declencherSync, rafraichirCompteur }
}
