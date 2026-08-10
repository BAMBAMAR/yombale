'use client'

import { useEffect, useState } from 'react'

export default function RegisterSW() {
  const [isOffline, setIsOffline] = useState(false)
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    // 1. Enregistrement du Service Worker PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[PWA] Service Worker registration:', err)
        })
      })
    }

    // 2. Écoute des événements de réseau en direct (Online / Offline)
    const handleOffline = () => {
      setIsOffline(true)
      setShowRestored(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowRestored(true)
      const timer = setTimeout(() => setShowRestored(false), 3500)
      return () => clearTimeout(timer)
    }

    // Détection initiale
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setIsOffline(true)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showRestored) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: isOffline ? '#0f172a' : '#15803d',
        color: '#ffffff',
        padding: '10px 20px',
        borderRadius: 30,
        fontSize: 13,
        fontWeight: 800,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: isOffline ? '1px solid #C75B00' : '1px solid #22c55e',
        transition: 'all 0.3s ease',
        maxWidth: '90vw',
        textAlign: 'center',
      }}
    >
      {isOffline ? (
        <>
          <span style={{ fontSize: 16 }}>📡</span>
          <span>Mode Hors-Ligne — Consultation des pages en cache local</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 16 }}>✅</span>
          <span>Connexion Internet rétablie</span>
        </>
      )}
    </div>
  )
}
