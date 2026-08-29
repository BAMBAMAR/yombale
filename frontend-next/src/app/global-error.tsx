'use client'
import React, { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const errName = error?.name || ''
      const errMsg = error?.message || ''
      const isStale =
        errName === 'ReferenceError' ||
        errName === 'ChunkLoadError' ||
        errMsg.includes('is not defined') ||
        errMsg.includes('Loading chunk')

      if (isStale) {
        const reloadKey = 'nopalou_global_auto_heal'
        const lastHeal = sessionStorage.getItem(reloadKey)
        const now = Date.now()
        if (!lastHeal || now - parseInt(lastHeal, 10) > 30000) {
          sessionStorage.setItem(reloadKey, now.toString())
          if ('caches' in window) {
            caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).finally(() => {
              window.location.reload()
            })
          } else {
            window.location.reload()
          }
        }
      }
    }
  }, [error])
  return (
    <html lang="fr">
      <body style={{
        fontFamily: 'system-ui, sans-serif',
        background: '#F8F5F0',
        color: '#1A1612',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        margin: 0,
        padding: '20px',
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
          border: '1px solid #E8DDD2',
        }}>
          <h2 style={{ color: '#C75B00', marginTop: 0, fontSize: '22px' }}>⚠️ Une erreur inattendue est survenue</h2>
          <p style={{ color: '#6B5E52', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
            Nopalou n&apos;a pas pu charger la page demandée. Notre équipe a été notifiée et résout le problème au plus vite.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{
                background: '#C75B00',
                color: '#FFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{
                background: '#1C2B4A',
                color: '#FFF',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
