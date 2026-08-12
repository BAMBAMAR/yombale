'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Hook de détection de connectivité ultra-fiable v2.
 *
 * Améliorations vs v1 :
 *  - Ping de démarrage immédiat au lieu d'assumer online optimiste.
 *  - Timeout réduit à 3000ms (v1 : 5000ms).
 *  - Retourne { isOnline, isChecking } pour permettre un état "vérification" dans l'UI.
 *  - Backoff adaptatif pour le polling offline : 3s × 3 tentatives, puis 10s.
 *  - Suspension correcte sur onglet masqué ET reprise immédiate au focus.
 */

const PING_URL = '/api/ping'
const PING_TIMEOUT_MS = 3000   // Réduit de 5000 → 3000ms pour réactivité mobile
const RECONNECT_POLL_FAST_MS = 3000   // 3 premières tentatives : toutes les 3s
const RECONNECT_POLL_SLOW_MS = 10000  // Ensuite : toutes les 10s
const FAST_RETRY_COUNT = 3            // Nombre de tentatives rapides avant de ralentir

async function checkRealConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)

    const response = await fetch(`${PING_URL}?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
      priority: 'high',
      signal: controller.signal,
    } as RequestInit)

    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
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
 * Version étendue retournant aussi isChecking.
 * Utile pour afficher un état intermédiaire "vérification…" dans l'UI.
 */
export function useOnlineStatusFull(): OnlineStatus {
  // Démarrer en mode "vérification" jusqu'au premier ping
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [isChecking, setIsChecking] = useState<boolean>(true)
  const isOnlineRef = useRef<boolean>(true)
  const retryCountRef = useRef<number>(0)

  const updateStatus = useCallback((onlineStatus: boolean) => {
    if (isOnlineRef.current !== onlineStatus) {
      isOnlineRef.current = onlineStatus
      setIsOnline(onlineStatus)
      if (onlineStatus) {
        retryCountRef.current = 0 // Réinitialiser le compteur de retry
        console.log('🟢 [useOnlineStatus v2] Connecté (ping /api/ping OK)')
      } else {
        console.warn('🔴 [useOnlineStatus v2] Hors-Ligne (ping /api/ping échoué)')
      }
    }
  }, [])

  const verifyConnectivity = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return
    const reallyOnline = await checkRealConnectivity()
    updateStatus(reallyOnline)
    setIsChecking(false)
  }, [updateStatus])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // ── Ping de démarrage immédiat ──────────────────────────────────────────
    // v1 assumait isOnline=true, ce qui provoquait un affichage "connecté"
    // si l'utilisateur ouvrait la PWA sans réseau (corrigé : on vérifie d'abord).
    verifyConnectivity()

    // ── Événements navigateur ───────────────────────────────────────────────
    const handleOfflineEvent = () => {
      console.warn('📡 [useOnlineStatus v2] Événement "offline" capturé → passage hors-ligne immédiat.')
      updateStatus(false)
      retryCountRef.current = 0
    }

    const handleOnlineEvent = () => {
      console.log('📡 [useOnlineStatus v2] Événement "online" capturé → confirmation par ping…')
      verifyConnectivity()
    }

    const handleFocusOrVisibility = () => {
      if (!document.hidden) {
        // Au retour de l'onglet, toujours vérifier (qu'on soit online ou offline)
        verifyConnectivity()
      }
    }

    window.addEventListener('offline', handleOfflineEvent)
    window.addEventListener('online', handleOnlineEvent)
    window.addEventListener('focus', handleFocusOrVisibility)
    document.addEventListener('visibilitychange', handleFocusOrVisibility)

    return () => {
      window.removeEventListener('offline', handleOfflineEvent)
      window.removeEventListener('online', handleOnlineEvent)
      window.removeEventListener('focus', handleFocusOrVisibility)
      document.removeEventListener('visibilitychange', handleFocusOrVisibility)
    }
  }, [verifyConnectivity, updateStatus])

  // ── Polling de reconnexion adaptatif (UNIQUEMENT en mode hors-ligne) ───────
  // Pas de polling en mode connecté → 0 overhead réseau.
  useEffect(() => {
    if (isOnline) return

    const getDelay = () =>
      retryCountRef.current < FAST_RETRY_COUNT
        ? RECONNECT_POLL_FAST_MS
        : RECONNECT_POLL_SLOW_MS

    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      retryCountRef.current++
      console.log(
        `🔄 [useOnlineStatus v2] Polling reconnexion #${retryCountRef.current} (délai: ${getDelay()}ms)…`
      )
      await verifyConnectivity()
      // Replanifier si toujours hors-ligne (vérifié via ref pour éviter stale closure)
      if (!isOnlineRef.current) {
        timer = setTimeout(poll, getDelay())
      }
    }

    timer = setTimeout(poll, getDelay())

    return () => clearTimeout(timer)
  }, [isOnline, verifyConnectivity])

  return { isOnline, isChecking }
}
