'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Nopalou Error]', error)
  }, [error])

  const isNextTechnicalError =
    error?.message?.includes('Server Components render') ||
    error?.message?.includes('digest') ||
    error?.message?.includes('production builds')

  const displayMessage = isNextTechnicalError || !error?.message
    ? 'Un problème temporaire de connexion est survenu. Cliquez ci-dessous pour recharger la page.'
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
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => reset()} className="btn-primary" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          🔄 Réessayer
        </button>
        <a href="/" className="btn-secondary" style={{ padding: '10px 20px', textDecoration: 'none', background: '#f3f4f6', color: '#374151', borderRadius: 8, fontWeight: 600 }}>
          🏠 Retour à l&apos;accueil
        </a>
      </div>
    </div>
  )
}
