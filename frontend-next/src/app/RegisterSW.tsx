'use client'

import { useEffect, useState } from 'react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

export default function RegisterSW() {
  const isOnline = useOnlineStatus()
  const [showOnlineToast, setShowOnlineToast] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // =====================================================================
    // FORCE-UPDATE v13 : Purge automatique des caches icônes/manifest/assets
    // pour forcer le re-téléchargement des nouvelles icônes PWA premium.
    // Chaque incrémentation de FORCE_VERSION déclenche la purge chez TOUS les utilisateurs.
    // =====================================================================
    const FORCE_VERSION = '13'
    const FORCE_KEY = 'nopalou_force_v'

    try {
      const currentForce = localStorage.getItem(FORCE_KEY)
      if (currentForce !== FORCE_VERSION) {
        console.log(`[PWA Force-Update] v${currentForce || '?'} → v${FORCE_VERSION} — Purge complète des caches icônes/assets...`)

        // 1. Purger tous les caches liés aux icônes, manifest, assets et PWA metadata
        caches.keys().then(async (names) => {
          const cachesToPurge = names.filter(n =>
            n.includes('icon') ||
            n.includes('asset') ||
            n.includes('pwa-meta') ||
            n.includes('precache') ||
            n.includes('html-cache') ||
            n.includes('offline-fallback')
          )
          if (cachesToPurge.length > 0) {
            console.log('[PWA Force-Update] Purge de', cachesToPurge.length, 'cache(s):', cachesToPurge)
            await Promise.all(cachesToPurge.map(n => caches.delete(n)))
          }

          // 2. Dés-inscrire et ré-inscrire le SW pour forcer le re-précaching
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const reg of registrations) {
            await reg.unregister()
          }

          // 3. Sauvegarder la version et forcer un hard-reload
          localStorage.setItem(FORCE_KEY, FORCE_VERSION)
          console.log('[PWA Force-Update] Caches purgés, SW désinscrit → Hard reload...')
          window.location.reload()
        }).catch((err) => {
          console.error('[PWA Force-Update] Erreur:', err)
          localStorage.setItem(FORCE_KEY, FORCE_VERSION)
        })

        return // Stop here, page will reload
      }
    } catch {
      // localStorage indisponible (navigation privée, etc.)
    }
    // =====================================================================

    // En environnement de développement local, désactiver et désinscrire le Service Worker
    // pour éviter les erreurs de précaching sur les bundles HMR/dev.
    const isDev =
      process.env.NODE_ENV === 'development' ||
      (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))

    if (isDev) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {})
        }
      }).catch(() => {})
      return
    }

    // Écouter l'activation du nouveau SW (controllerchange) pour recharger proprement
    let refreshing = false
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    // Vérifier si une mise à jour récente a eu lieu (< 15 sec) pour éviter le clignotement
    const isRecentlyUpdated = () => {
      try {
        const lastUpdated = sessionStorage.getItem('nopalou_sw_updated')
        return !!(lastUpdated && Date.now() - parseInt(lastUpdated, 10) < 15000)
      } catch {
        return false
      }
    }

    // Enregistrement effectif du Service Worker PWA avec auto-mise à jour transparente
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA SW] Service Worker enregistré avec succès:', reg.scope)

        // Détecter une mise à jour disponible lors du téléchargement et l'activer immédiatement
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA SW] Nouvelle version détectée -> Activation automatique transparente.')
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })

        // Si un nouveau SW est déjà téléchargé et en attente, l'activer directement
        if (reg.waiting && navigator.serviceWorker.controller) {
          console.log('[PWA SW] Service Worker en attente -> Activation automatique directe.')
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        // Vérifier les mises à jour serveur lors du retour au premier plan de l'onglet
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {})
          }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
      })
      .catch((err) => {
        console.error('[PWA SW] Échec enregistrement Service Worker:', err)
      })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  const [showOfflineToast, setShowOfflineToast] = useState(false)

  // Détecter les transitions offline / online pour afficher des toasts discrets et temporaires
  useEffect(() => {
    if (!isOnline) {
      if (!wasOffline) {
        setWasOffline(true)
        setShowOfflineToast(true)
        setShowOnlineToast(false)
        console.warn('🔴 [RegisterSW] Hors-ligne confirmé par ping applicatif.')
      }
    } else if (wasOffline && isOnline) {
      console.log('🟢 [RegisterSW] Connexion rétablie confirmée par ping applicatif.')
      setShowOnlineToast(true)
      setShowOfflineToast(false)
      setWasOffline(false)

      // Mettre à jour le SW en arrière-plan
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.update().catch(() => {})
        })
      }
    }
  }, [isOnline, wasOffline])

  // Masquage automatique du toast hors-ligne après 4.5 secondes
  useEffect(() => {
    if (showOfflineToast) {
      const timer = setTimeout(() => setShowOfflineToast(false), 4500)
      return () => clearTimeout(timer)
    }
  }, [showOfflineToast])

  // Masquage garanti du toast "Connexion Internet rétablie" après 3.5 secondes
  useEffect(() => {
    if (showOnlineToast) {
      const timer = setTimeout(() => setShowOnlineToast(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [showOnlineToast])

  function handleSwUpdate() {
    setSwUpdateAvailable(false)
    if (typeof window === 'undefined') return

    try {
      sessionStorage.setItem('nopalou_sw_updated', Date.now().toString())
    } catch {}

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration()
        .then((reg) => {
          if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' })
            // Fallback reload au cas où controllerchange ne se déclenche pas immédiatement
            setTimeout(() => {
              window.location.reload()
            }, 300)
          } else {
            window.location.reload()
          }
        })
        .catch(() => {
          window.location.reload()
        })
    } else {
      window.location.reload()
    }
  }

  if (!mounted) return null

  return (
    <>
      {/* Notification Toast Réseau — Discrète, temporaire, ne bloque pas l'interface */}
      {(showOfflineToast || showOnlineToast) && (
        <div
          style={{
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: showOfflineToast ? '#c2410c' : '#15803d',
            color: '#ffffff',
            padding: '7px 14px 7px 16px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto',
            transition: 'all 0.3s ease-in-out',
            width: 'max-content',
            maxWidth: '92vw',
            textAlign: 'center',
            lineHeight: '1.3',
            animation: 'fadeInDown 0.25s ease',
          }}
        >
          <span style={{ fontSize: '13px' }}>{showOfflineToast ? '📡' : '✅'}</span>
          <span>
            {showOfflineToast
              ? 'Mode Hors-Ligne activé — Données en cache local'
              : 'Connexion Internet rétablie'}
          </span>
          <button
            type="button"
            onClick={() => { setShowOfflineToast(false); setShowOnlineToast(false); }}
            aria-label="Fermer la notification réseau"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold',
              marginLeft: '4px',
              padding: 0,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Bouton de mise à jour SW — non intrusif, coin supérieur droit */}
      {swUpdateAvailable && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            backgroundColor: '#1e40af',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 4px 16px rgba(30,64,175,0.4)',
            zIndex: 99998,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
          onClick={handleSwUpdate}
        >
          <span>🔄</span>
          <span>Nouvelle version disponible — Mettre à jour</span>
        </div>
      )}
    </>
  )
}
