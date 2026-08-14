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

    // Enregistrement effectif du Service Worker PWA
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA SW] Service Worker enregistré avec succès:', reg.scope)

        // Détecter une mise à jour disponible lors du téléchargement
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            // Le nouveau SW est installé et prêt à remplacer l'ancien contrôleur
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller && !isRecentlyUpdated()) {
              console.log('[PWA SW] Nouvelle version disponible. Affichage du bouton de mise à jour.')
              setSwUpdateAvailable(true)
            }
          })
        })

        // Vérifier si un nouveau SW est déjà téléchargé et en attente
        if (reg.waiting && navigator.serviceWorker.controller && !isRecentlyUpdated()) {
          setSwUpdateAvailable(true)
        }
      })
      .catch((err) => {
        console.error('[PWA SW] Échec enregistrement Service Worker:', err)
      })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  // Détecter les transitions offline → online pour afficher le toast
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
      setShowOnlineToast(false)
      console.warn('🔴 [RegisterSW] Hors-ligne confirmé par ping applicatif.')
    } else if (wasOffline && isOnline) {
      console.log('🟢 [RegisterSW] Connexion rétablie confirmée par ping applicatif.')
      setShowOnlineToast(true)
      setWasOffline(false)

      // Mettre à jour le SW en arrière-plan
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.update().catch(() => {})
        })
      }
    }
  }, [isOnline, wasOffline])

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

  const isOffline = !isOnline

  return (
    <>
      {/* Bandeau offline / online */}
      {(isOffline || showOnlineToast) && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: isOffline ? '#c2410c' : '#15803d',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: '30px',
            fontSize: '13px',
            fontWeight: 'bold',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto',
            transition: 'all 0.3s ease-in-out',
            width: 'max-content',
            maxWidth: '90vw',
            textAlign: 'center',
            lineHeight: '1.4',
          }}
        >
          <span>{isOffline ? '📡' : '✅'}</span>
          <span>
            {isOffline
              ? 'Mode Hors-Ligne — Consultation des données locales en cache'
              : 'Connexion Internet rétablie'}
          </span>
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
