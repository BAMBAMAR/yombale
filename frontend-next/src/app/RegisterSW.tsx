'use client'

import { useEffect, useState } from 'react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

export default function RegisterSW() {
  const isOnline = useOnlineStatus()
  const [showOnlineToast, setShowOnlineToast] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

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
  }, [])

  // Détecter les transitions offline → online pour afficher le toast
  useEffect(() => {
    if (!isOnline) {
      // On passe hors-ligne
      setWasOffline(true)
      setShowOnlineToast(false)
      console.warn('🔴 [RegisterSW] Hors-ligne confirmé par ping applicatif.')
    } else if (wasOffline && isOnline) {
      // Transition offline → online confirmée par ping réel
      console.log('🟢 [RegisterSW] Connexion rétablie confirmée par ping applicatif.')
      setShowOnlineToast(true)
      setWasOffline(false)
      
      // Mettre à jour le SW en arrière-plan
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.update().then(() => {
            console.log('✅ [RegisterSW] Mise à jour du Service Worker réussie.')
          }).catch((err) => {
            console.error('❌ [RegisterSW] Échec de la mise à jour du Service Worker:', err)
          })
        })
      }

      // Masquer le toast après 4s
      const timer = setTimeout(() => setShowOnlineToast(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  const isOffline = !isOnline

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
