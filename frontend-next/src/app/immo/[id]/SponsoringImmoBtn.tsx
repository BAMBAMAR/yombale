'use client'
import { useState, useTransition } from 'react'
import { initierWaveImmoSponsoring } from '@/app/actions/paiement'

export default function SponsoringImmoBtn({ immoId }: { immoId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start]  = useTransition()

  function handleClick() {
    setError(null)
    start(async () => {
      const res = await initierWaveImmoSponsoring(immoId)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        setError(res.error ?? 'Impossible d\'initialiser le paiement.')
      }
    })
  }

  return (
    <div style={{ marginTop: 20, padding: '16px 20px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: '#92400E' }}>⭐ Mettre en avant cette annonce</p>
      <p style={{ fontSize: 13, color: '#78350F', marginBottom: 12 }}>
        Apparaissez en tête des résultats pendant 30 jours — <strong>5 000 FCFA</strong>
      </p>
      {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>❌ {error}</p>}
      <button
        onClick={handleClick}
        disabled={pending}
        style={{
          background: '#D97706', color: '#fff', border: 'none',
          borderRadius: 8, padding: '10px 20px', fontWeight: 700,
          fontSize: 14, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? 'Connexion Wave…' : '🌊 Payer 5 000 FCFA via Wave'}
      </button>
    </div>
  )
}
