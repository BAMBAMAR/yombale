'use client'

import { useEffect } from 'react'

export default function SurgaSwRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/surga/sw.js', { scope: '/surga/' })
        .then((reg) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[SURGA SW] Enregistré avec succès pour le scope:', reg.scope)
          }
        })
        .catch((err) => {
          console.warn('[SURGA SW] Erreur enregistrement service worker:', err)
        })
    }
  }, [])

  return null
}
