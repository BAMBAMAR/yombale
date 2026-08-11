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
      setIsOffline(true)
      setShowOnlineToast(false)
    }
    const handleOnline = () => {
      setIsOffline(false)
      setShowOnlineToast(true)
      setTimeout(() => setShowOnlineToast(false), 4000)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.update().catch(() => {})
        })
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    if (!navigator.onLine) {
      setIsOffline(true)
    }

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showOnlineToast) return null

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
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
      gap: '10px',
      border: '1px solid rgba(255,255,255,0.25)',
      backdropFilter: 'blur(8px)',
      pointerEvents: 'auto',
      transition: 'all 0.3s ease-in-out'
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
