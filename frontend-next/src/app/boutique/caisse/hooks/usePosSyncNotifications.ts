'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSyncOffline } from '@/lib/sync-manager'

export function usePosSyncNotifications(
  boutiqueActiveId: string,
  userId: string,
  isReallyOnline: boolean
) {
  const [offlineModeActive, setOfflineModeActive] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warning' } | null>(null)

  const showToast = useCallback((text: string, type: 'success' | 'warning' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 4000)
  }, [])

  const {
    syncPending: syncingOffline,
    ventesEnAttente: ventesHorsLigneCount,
    dettesEnAttente: dettesHorsLigneCount,
    totalEnAttente: totalHorsLigneCount,
    declencherSync: declencherSyncOffline,
    rafraichirCompteur: rafraichirCompteurOffline,
  } = useSyncOffline(boutiqueActiveId, userId || 'anonymous')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const newOffline = !isReallyOnline
    setOfflineModeActive(newOffline)
    if (!newOffline) {
      declencherSyncOffline()
        .then((res) => {
          if (res.synced > 0) showToast(`${res.synced} vente(s) synchronisée(s)`, 'success')
        })
        .catch(() => {})
    }
  }, [isReallyOnline, boutiqueActiveId, declencherSyncOffline, showToast])

  return {
    offlineModeActive,
    toastMsg,
    showToast,
    syncingOffline,
    ventesHorsLigneCount,
    dettesHorsLigneCount,
    totalHorsLigneCount,
    declencherSyncOffline,
    rafraichirCompteurOffline,
  }
}
