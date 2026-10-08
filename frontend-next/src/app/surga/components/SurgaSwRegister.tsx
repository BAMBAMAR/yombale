'use client'

import { useEffect } from 'react'

// SRG-A3-002 / SRG-A1-029 : le worker était enregistré avec la portée « /surga/ », qui ne contient pas l'adresse
// « /surga » : il ne contrôlait pas l'application, laissée au worker de Nopalou. La portée est « /surga » (autorisée
// par l'en-tête Service-Worker-Allowed du fichier) ; l'ancienne inscription est retirée.
export default function SurgaSwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const isSurgaDomain = window.location.hostname.startsWith('surga.')
    const swScope = isSurgaDomain ? '/' : '/surga'

    navigator.serviceWorker.getRegistrations()
      .then((inscriptions) => Promise.all(
        inscriptions.filter((r) => new URL(r.scope).pathname === '/surga/').map((r) => r.unregister())
      ))
      .catch(() => {})
      // updateViaCache « none » : une nouvelle version du worker n'attend pas l'expiration du cache du navigateur.
      .then(() => navigator.serviceWorker.register('/surga/sw.js', { scope: swScope, updateViaCache: 'none' }))
      .then((reg) => {
        reg.update().catch(() => {})
        if (process.env.NODE_ENV === 'development') {
          console.log('[SURGA SW] Enregistré avec succès pour le scope:', reg.scope)
        }
      })
      .catch((err) => {
        console.warn('[SURGA SW] Erreur enregistrement service worker:', err)
      })
  }, [])

  return null
}
