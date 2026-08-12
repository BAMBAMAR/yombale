'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Hook de détection de connectivité ultra-fiable et réactif.
 * 
 * Principes :
 * - Mode en ligne : AUCUN polling inutile pour éviter tout bruit réseau
 *   et aucun conflit avec les requêtes de préchargement / Server Actions.
 * - Événement 'offline' / perte de réseau : passage immédiat en mode hors-ligne
 *   et démarrage d'un sondage léger toutes les 5s vers /api/ping.
 * - Reconnexion : dès qu'un ping réussit, passage en mode en ligne et arrêt du sondage.
 */

const PING_URL = '/api/ping'
const PING_TIMEOUT_MS = 5000
const RECONNECT_POLL_MS = 5000 // Sondage de tentative de reconnexion (uniquement hors-ligne)

async function checkRealConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)
    
    const response = await fetch(`${PING_URL}?t=${Date.now()}`, {
      method: 'GET',
      priority: 'high',
      signal: controller.signal,
    })
    
    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const isOnlineRef = useRef<boolean>(true)

  const updateStatus = useCallback((onlineStatus: boolean) => {
    if (isOnlineRef.current !== onlineStatus) {
      isOnlineRef.current = onlineStatus
      setIsOnline(onlineStatus)
      if (onlineStatus) {
        console.log('🟢 [useOnlineStatus] Statut Réseau : Connecté (ping /api/ping OK)')
      } else {
        console.warn('🔴 [useOnlineStatus] Statut Réseau : Hors-Ligne (ping /api/ping échoué)')
      }
    }
  }, [])

  const verifyConnectivity = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return
    const reallyOnline = await checkRealConnectivity()
    updateStatus(reallyOnline)
  }, [updateStatus])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Événement 'offline' du navigateur → passage hors-ligne immédiat
    const handleOfflineEvent = () => {
      console.warn('📡 [useOnlineStatus] Événement navigateur "offline" capturé.')
      updateStatus(false)
    }

    // 2. Événement 'online' du navigateur → confirmation obligatoire par ping réel
    const handleOnlineEvent = () => {
      console.log('📡 [useOnlineStatus] Événement navigateur "online" capturé. Confirmation par ping...')
      verifyConnectivity()
    }

    // 3. Focus / Changement de visibilité d'onglet → vérifier la connectivité si on était hors-ligne
    const handleFocusOrVisibility = () => {
      if (!document.hidden && !isOnlineRef.current) {
        verifyConnectivity()
      }
    }

    window.addEventListener('offline', handleOfflineEvent)
    window.addEventListener('online', handleOnlineEvent)
    window.addEventListener('focus', handleFocusOrVisibility)
    document.addEventListener('visibilitychange', handleFocusOrVisibility)

    // Si navigator.onLine indique qu'on est offline au chargement, vérifier par ping
    if (!navigator.onLine) {
      verifyConnectivity()
    }

    return () => {
      window.removeEventListener('offline', handleOfflineEvent)
      window.removeEventListener('online', handleOnlineEvent)
      window.removeEventListener('focus', handleFocusOrVisibility)
      document.removeEventListener('visibilitychange', handleFocusOrVisibility)
    }
  }, [verifyConnectivity, updateStatus])

  // 4. Polling de reconnexion : S'ACTIVE UNIQUEMENT LORSQU'ON EST HORS-LIGNE
  useEffect(() => {
    if (isOnline) return // Pas de polling quand on est connecté (0 overhead)

    console.log('🔄 [useOnlineStatus] Polling de reconnexion actif (toutes les 5s)...')
    const timer = setInterval(() => {
      verifyConnectivity()
    }, RECONNECT_POLL_MS)

    return () => clearInterval(timer)
  }, [isOnline, verifyConnectivity])

  return isOnline
}
