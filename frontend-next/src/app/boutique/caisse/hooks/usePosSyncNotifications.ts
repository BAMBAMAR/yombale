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
    cloturesEnAttente: cloturesHorsLigneCount,
    depensesEnAttente: depensesHorsLigneCount,
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
          if (res.synced > 0) showToast(`${res.synced} élément(s) synchronisé(s)`, 'success')
        })
        .catch(() => {})
    }
  }, [isReallyOnline, boutiqueActiveId, declencherSyncOffline, showToast])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleSyncComplete = (e: any) => {
      if (e.detail?.boutiqueId === boutiqueActiveId) {
        rafraichirCompteurOffline()
        if (e.detail?.result?.synced > 0) {
          showToast(`${e.detail.result.synced} élément(s) synchronisé(s) avec le serveur`, 'success')
        }
      }
    }
    window.addEventListener('nopalou:sync-complete', handleSyncComplete)
    return () => {
      window.removeEventListener('nopalou:sync-complete', handleSyncComplete)
    }
  }, [boutiqueActiveId, rafraichirCompteurOffline, showToast])

  return {
    offlineModeActive,
    toastMsg,
    showToast,
    syncingOffline,
    ventesHorsLigneCount,
    dettesHorsLigneCount,
    cloturesHorsLigneCount,
    depensesHorsLigneCount,
    totalHorsLigneCount,
    declencherSyncOffline,
    rafraichirCompteurOffline,
  }
}
