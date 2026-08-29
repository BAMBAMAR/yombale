'use client'

import { useEffect, useState } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    console.error('[Nopalou Error]', error)

    // Auto-guérison automatique en cas de bundle/chunk en cache obsolète (ReferenceError, ChunkLoadError, etc.)
    if (typeof window !== 'undefined') {
      const errName = error?.name || ''
      const errMsg = error?.message || ''
      const isStaleBundleError =
        errName === 'ReferenceError' ||
        errName === 'ChunkLoadError' ||
        errMsg.includes('is not defined') ||
        errMsg.includes('Loading chunk') ||
        errMsg.includes('dynamically imported module') ||
        errMsg.includes('Failed to fetch')

      if (isStaleBundleError) {
        const reloadKey = 'nopalou_auto_heal_time'
        const lastHeal = sessionStorage.getItem(reloadKey)
        const now = Date.now()
        // Éviter les boucles infinies : maximum 1 auto-reload toutes les 30 secondes
        if (!lastHeal || now - parseInt(lastHeal, 10) > 30000) {
          sessionStorage.setItem(reloadKey, now.toString())
          console.warn('[Nopalou Error Boundary] Détection de cache obsolète. Purge automatique et rafraîchissement...')
          
          if ('caches' in window) {
            caches.keys()
              .then(keys => Promise.all(keys.map(k => caches.delete(k))))
              .catch(() => {})
              .finally(() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations()
                    .then(regs => {
                      for (const r of regs) r.update().catch(() => {})
                    })
                    .catch(() => {})
                    .finally(() => {
                      window.location.reload()
                    })
                } else {
                  window.location.reload()
                }
              })
            return
          } else {
            window.location.reload()
            return
          }
        }
      }
    }

    // Sondage automatique /api/health toutes les 4 secondes pour restaurer la page dès que le serveur réagit
    const interval = setInterval(async () => {
      try {
        setIsChecking(true)
        const res = await fetch('/api/health', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'ok') {
            clearInterval(interval)
            reset()
          }
        }
      } catch {
        // En attente du rétablissement serveur
      } finally {
        setIsChecking(false)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [error, reset])

  const isNextTechnicalError =
    error?.message?.includes('Server Components render') ||
    error?.message?.includes('digest') ||
    error?.message?.includes('production builds')

  const displayMessage = isNextTechnicalError || !error?.message
    ? 'Un problème temporaire de connexion est survenu. Le système se réinitialise automatiquement.'
    : error.message

  return (
    <div className="erreur-page" style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: 500, margin: '2rem auto' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ margin: '0 auto 16px', display: 'block', color: '#dc2626' }}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12 }}>Une interruption temporaire est survenue</h2>
      <p style={{ marginBottom: 24, color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.5 }}>
        {displayMessage}
      </p>
      {isChecking && (
        <div style={{ fontSize: '0.85rem', color: '#C75B00', marginBottom: 16, fontWeight: 700 }}>
          ⏳ Connexion au serveur en cours...
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => reset()} className="btn-primary" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          🔄 Réessayer maintenant
        </button>
        <a href="/" className="btn-secondary" style={{ padding: '10px 20px', textDecoration: 'none', background: '#f3f4f6', color: '#374151', borderRadius: 8, fontWeight: 600 }}>
          🏠 Retour à l&apos;accueil
        </a>
      </div>
    </div>
  )
}
