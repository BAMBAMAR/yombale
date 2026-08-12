'use client'

import { useEffect, useState } from 'react'

export default function RegisterSW() {
  const [isOffline, setIsOffline] = useState(false)
  const [showOnlineToast, setShowOnlineToast] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Enregistrement effectif du Service Worker PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA SW] Service Worker enregistré avec succès:', reg.scope)
        })
        .catch((err) => {
          console.error('[PWA SW] Échec enregistrement Service Worker:', err)
        })
    }

    const handleOffline = () => {
      console.warn('🔴 [Diagnostic PWA] Événement navigateur "offline" capturé. Déconnexion réseau détectée.')
      console.info('📡 [Diagnostic PWA] Le bandeau UI Hors-Ligne va s\'afficher.')
      setIsOffline(true)
      setShowOnlineToast(false)
    }
    const handleOnline = () => {
      console.log('🟢 [Diagnostic PWA] Événement navigateur "online" capturé. Connexion réseau rétablie.')
      console.info('✅ [Diagnostic PWA] Le bandeau UI de reconnexion va s\'afficher pendant 4 secondes.')
      setIsOffline(false)
      setShowOnlineToast(true)
      setTimeout(() => setShowOnlineToast(false), 4000)
      if ('serviceWorker' in navigator) {
        console.log('🔄 [Diagnostic PWA] Demande de mise à jour du Service Worker en arrière-plan...')
        navigator.serviceWorker.ready.then(reg => {
          reg.update().then(() => {
             console.log('✅ [Diagnostic PWA] Mise à jour du Service Worker réussie.')
          }).catch((err) => {
             console.error('❌ [Diagnostic PWA] Échec de la mise à jour du Service Worker:', err)
          })
        })
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    if (!navigator.onLine) {
      setIsOffline(true)
    }

    // Polling de sécurité pour desktop : certains navigateurs ne déclenchent pas
    // l'événement 'offline' de manière fiable (notamment sur PC avec câble Ethernet)
    const pollingInterval = setInterval(() => {
      const currentlyOffline = !navigator.onLine
      setIsOffline(prev => {
        if (prev !== currentlyOffline) {
          if (currentlyOffline) {
            console.warn('🔴 [Diagnostic PWA Polling] Déconnexion détectée par polling.')
          } else {
            console.log('🟢 [Diagnostic PWA Polling] Reconnexion détectée par polling.')
            setShowOnlineToast(true)
            setTimeout(() => setShowOnlineToast(false), 4000)
          }
        }
        return currentlyOffline
      })
    }, 3000)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      clearInterval(pollingInterval)
    }
  }, [])

  if (!isOffline && !showOnlineToast) return null

  return (
    <div style={{
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
      lineHeight: '1.4'
    }}>
      <span>{isOffline ? '📡' : '✅'}</span>
      <span>
        {isOffline 
          ? 'Mode Hors-Ligne — Consultation des données locales en cache' 
          : 'Connexion Internet rétablie'}
      </span>
    </div>
  )
}
