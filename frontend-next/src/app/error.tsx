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
    console.error('[Nopalou]', error)
  }, [error])

  return (
    <div className="erreur-page">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--red)' }}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h2>Une erreur est survenue</h2>
      <p style={{ marginBottom: '20px' }}>
        {error.message || 'Impossible de charger cette page. Réessayez dans quelques instants.'}
      </p>
      <button onClick={reset} className="btn-primary">
        Réessayer
      </button>
    </div>
  )
}
