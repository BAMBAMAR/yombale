'use client'

import { useEffect, useState } from 'react'

/**
 * Hook de détection de connectivité ultra-fiable v3 (Singleton & Centralisé).
 *
 * Améliorations vs v2 :
 *  - **Singleton partagé** : Zéro requêtes /api/ping dupliquées lorsque plusieurs composants écoutent le statut.
 *  - **Déduplication (Deduplication / In-Flight reuse)** : Si un ping est déjà en cours, les nouveaux appels réutilisent le même Promise.
 *  - **Throttle (500ms)** : Empêche la rafale de pings lors des montages simultanés de composants.
 *  - **Logs de diagnostic enrichis** avec balises visuelles `📡 [Network Monitor]`.
 */

const PING_URL = '/api/ping'
const PING_TIMEOUT_MS = 3000   // Timeout de 3000ms
const RECONNECT_POLL_FAST_MS = 3000   // 3 premières tentatives : toutes les 3s
const RECONNECT_POLL_SLOW_MS = 10000  // Ensuite : toutes les 10s
const FAST_RETRY_COUNT = 3            // Nombre de tentatives rapides avant de ralentir
const THROTTLE_PING_MS = 500          // Pas de réémission de ping si le dernier date de < 500ms

// ── ÉTAT GLOBAL UNIQUE (SINGLETON) ──────────────────────────────────────────
let globalIsOnline = true
let globalIsChecking = true
let lastPingTimestamp = 0
let inFlightPingPromise: Promise<boolean> | null = null
let retryCount = 0
let pollTimer: ReturnType<typeof setTimeout> | null = null

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

/**
 * Exécute la vérification réseau réelle vers /api/ping.
 * Re-utilise la promesse en cours si un ping tourne déjà.
 */
async function checkRealConnectivity(): Promise<boolean> {
  const now = Date.now()

  // 1. Si un ping est déjà en cours, réutiliser la promesse existante
  if (inFlightPingPromise) {
    return inFlightPingPromise
  }

  // 2. Si un ping s'est terminé il y a moins de 500ms, réutiliser l'état actuel sans faire de requête HTTP
  if (now - lastPingTimestamp < THROTTLE_PING_MS) {
    return globalIsOnline
  }

  inFlightPingPromise = (async () => {
    const startTime = Date.now()
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)

      const response = await fetch(`${PING_URL}?t=${startTime}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        priority: 'high',
        signal: controller.signal,
      } as RequestInit)

      clearTimeout(timeout)
      const duration = Date.now() - startTime
      const isOk = response.ok

      if (isOk !== globalIsOnline || globalIsChecking) {
        globalIsOnline = isOk
        globalIsChecking = false
        if (isOk) {
          retryCount = 0
          console.log(`🟢 📡 [Network Monitor] CONNECTÉ (Ping /api/ping 200 OK en ${duration}ms)`)
        } else {
          console.warn(`🔴 📡 [Network Monitor] HORS-LIGNE (Ping /api/ping HTTP ${response.status} en ${duration}ms)`)
        }
        notifyListeners()
      }

      lastPingTimestamp = Date.now()
      return isOk
    } catch (err: any) {
      const duration = Date.now() - startTime
      const wasOnline = globalIsOnline

      globalIsOnline = false
      globalIsChecking = false

      if (wasOnline) {
        console.warn(
          `🔴 📡 [Network Monitor] HORS-LIGNE (Échec ping /api/ping après ${duration}ms - ${err.name === 'AbortError' ? 'Timeout 3s' : 'Coupure réseau'})`
        )
        notifyListeners()
      }

      lastPingTimestamp = Date.now()
      return false
    } finally {
      inFlightPingPromise = null
    }
  })()

  return inFlightPingPromise
}

/**
 * Lance le polling de reconnexion adaptatif en mode hors-ligne.
 */
function scheduleReconnectPolling() {
  if (pollTimer) clearTimeout(pollTimer)
  if (globalIsOnline) return

  const delay = retryCount < FAST_RETRY_COUNT ? RECONNECT_POLL_FAST_MS : RECONNECT_POLL_SLOW_MS

  pollTimer = setTimeout(async () => {
    if (typeof document !== 'undefined' && document.hidden) {
      // Onglet en arrière-plan → décaler la tentative
      scheduleReconnectPolling()
      return
    }

    retryCount++
    console.log(`🔄 📡 [Network Monitor] Polling reconnexion #${retryCount} dans ${delay}ms...`)
    lastPingTimestamp = 0 // Forcer la réémission du ping sans throttling
    const isNowOnline = await checkRealConnectivity()
    if (!isNowOnline) {
      scheduleReconnectPolling()
    }
  }, delay)
}

// ── Initialisation unique des EventListeners du navigateur ──────────────────
if (typeof window !== 'undefined') {
  const handleOffline = () => {
    console.warn('⚡ 📡 [Network Monitor] Événement navigateur "offline" → Passage hors-ligne immédiat.')
    globalIsOnline = false
    globalIsChecking = false
    retryCount = 0
    notifyListeners()
    scheduleReconnectPolling()
  }

  const handleOnline = () => {
    console.log('⚡ 📡 [Network Monitor] Événement navigateur "online" → Confirmation par ping /api/ping...')
    globalIsChecking = true
    lastPingTimestamp = 0 // Reset immédiat du throttling pour exécuter le ping tout de suite
    notifyListeners()
    checkRealConnectivity().then((isOk) => {
      if (!isOk) scheduleReconnectPolling()
    })
  }

  const handleVisibilityOrFocus = () => {
    if (typeof document !== 'undefined' && !document.hidden) {
      console.log('👁️ 📡 [Network Monitor] Focus / Onglet actif → Vérification statut réseau...')
      lastPingTimestamp = 0 // Reset du throttling pour re-vérification immédiate
      checkRealConnectivity().then((isOk) => {
        if (!isOk) scheduleReconnectPolling()
      })
    }
  }

  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
  window.addEventListener('focus', handleVisibilityOrFocus)
  document.addEventListener('visibilitychange', handleVisibilityOrFocus)

  // Premier ping de contrôle immédiat au chargement de l'application
  checkRealConnectivity().then((isOk) => {
    if (!isOk) scheduleReconnectPolling()
  })
}

export interface OnlineStatus {
  isOnline: boolean
  isChecking: boolean
}

export function useOnlineStatus(): boolean {
  const { isOnline } = useOnlineStatusFull()
  return isOnline
}

/**
 * Hook React singleton qui s'abonne à l'état réseau global unique.
 */
export function useOnlineStatusFull(): OnlineStatus {
  const [state, setState] = useState<OnlineStatus>({
    isOnline: globalIsOnline,
    isChecking: globalIsChecking,
  })

  useEffect(() => {
    const handleUpdate = () => {
      setState({
        isOnline: globalIsOnline,
        isChecking: globalIsChecking,
      })
    }

    listeners.add(handleUpdate)
    // S'assurer que le composant a l'état actuel à son montage
    handleUpdate()

    return () => {
      listeners.delete(handleUpdate)
    }
  }, [])

  return state
}
