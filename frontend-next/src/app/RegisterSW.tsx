'use client'

import { useEffect, useState } from 'react'

export default function RegisterSW() {
  const [isOffline, setIsOffline] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => {
      setIsOffline(false)
      // On peut forcer le SW à vérifier les mises à jour au retour en ligne
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.update().catch(() => {})
        })
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Vérification initiale
    if (!navigator.onLine) {
      setIsOffline(true)
    }

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px', // Au-dessus de la BottomBar mobile
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#C75B00',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: 'bold',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      pointerEvents: 'none'
    }}>
      <span>📡</span>
      Mode Hors-Ligne Actif
    </div>
  )
}
