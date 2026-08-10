'use client'

import { useEffect } from 'react'

export default function RegisterSW() {
  useEffect(() => {
    // Enregistrement silencieux du Service Worker PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[PWA] Service Worker registration:', err)
        })
      })
    }
  }, [])

  return null
}
