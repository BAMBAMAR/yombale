'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Hook de détection de connectivité fiable.
 * 
 * Contrairement à navigator.onLine (qui ment fréquemment sur desktop,
 * Ethernet, et lors de bascules responsive mobile↔web), ce hook
 * effectue un vrai ping applicatif vers /api/ping pour confirmer
 * la connectivité.
 * 
 * Fonctionnement :
 * - navigator.onLine comme indice initial uniquement
 * - Ping /api/ping avec timeout 4s pour confirmer
 * - Re-vérifie au focus, à l'événement online, et sur intervalle
 * - Suspend les vérifications quand l'onglet est masqué
 */

const PING_URL = '/api/ping'
const PING_TIMEOUT_MS = 4000
const POLL_INTERVAL_ONLINE_MS = 30000  // 30s quand on est en ligne
const POLL_INTERVAL_OFFLINE_MS = 5000  // 5s quand on est hors-ligne (retry rapide)

async function checkRealConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)
    
    const response = await fetch(`${PING_URL}?t=${Date.now()}`, {
      method: 'GET',
      signal: controller.signal,
    })
    
    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

export function useOnlineStatus() {
  // État initial optimiste à true (en ligne)
  const [isOnline, setIsOnline] = useState(true)
  
  const prevOnline = useRef(isOnline)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const performCheck = useCallback(async () => {
    // Si l'onglet est masqué, ne pas vérifier (économie batterie/réseau)
    if (typeof document !== 'undefined' && document.hidden) return

    const reallyOnline = await checkRealConnectivity()
    
    setIsOnline(prev => {
      if (prev !== reallyOnline) {
        if (reallyOnline) {
          console.log('🟢 [useOnlineStatus] Connectivité confirmée par ping /api/ping')
        } else {
          console.warn('🔴 [useOnlineStatus] Ping /api/ping échoué — mode hors-ligne')
        }
      }
      prevOnline.current = reallyOnline
      return reallyOnline
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Vérification initiale immédiate
    performCheck()

    // Événements navigateur comme déclencheurs de re-vérification
    const handleOnlineEvent = () => {
      // Ne pas faire confiance directement — vérifier par ping
      console.log('📡 [useOnlineStatus] Événement "online" reçu — vérification par ping...')
      performCheck()
    }
    
    const handleOfflineEvent = () => {
      // L'événement offline est plus fiable — appliquer immédiatement
      // mais vérifier quand même par ping au prochain cycle
      console.warn('📡 [useOnlineStatus] Événement "offline" reçu — passage hors-ligne immédiat')
      setIsOnline(false)
      prevOnline.current = false
    }

    const handleFocus = () => {
      // Re-vérifier au retour de focus (l'utilisateur revient sur l'onglet)
      performCheck()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // L'onglet redevient visible — re-vérifier
        performCheck()
      }
    }

    window.addEventListener('online', handleOnlineEvent)
    window.addEventListener('offline', handleOfflineEvent)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Polling adaptatif : plus rapide en offline (retry), plus lent en ligne
    const startPolling = () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      
      const interval = prevOnline.current ? POLL_INTERVAL_ONLINE_MS : POLL_INTERVAL_OFFLINE_MS
      pollTimerRef.current = setInterval(() => {
        performCheck()
      }, interval)
    }

    startPolling()

    // Ajuster le polling quand l'état change
    const adjustPollingInterval = setInterval(() => {
      const currentInterval = prevOnline.current ? POLL_INTERVAL_ONLINE_MS : POLL_INTERVAL_OFFLINE_MS
      // Redémarrer le polling si l'intervalle doit changer
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = setInterval(() => {
          performCheck()
        }, currentInterval)
      }
    }, 10000) // Vérifie l'ajustement toutes les 10s

    return () => {
      window.removeEventListener('online', handleOnlineEvent)
      window.removeEventListener('offline', handleOfflineEvent)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      clearInterval(adjustPollingInterval)
    }
  }, [performCheck])

  return isOnline
}
