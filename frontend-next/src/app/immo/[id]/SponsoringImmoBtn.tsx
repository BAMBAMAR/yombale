'use client'
import { useState, useTransition } from 'react'
import { initierWaveImmoSponsoring } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'

interface Props {
  immoId: string
  userId: string
  settings: Record<string, string>
}

export default function SponsoringImmoBtn({ immoId, userId, settings }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start]  = useTransition()
  const [showManuel, setShowManuel] = useState(false)

  const manuelActif = settings.paiement_manuel_actif !== 'false'
  const waveActif   = settings.paiement_wave !== 'false'
  const montant     = Number(settings.prix_sponsoring) || 5000

  function handleClick() {
    setError(null)
    start(async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || undefined
      const res = await initierWaveImmoSponsoring(immoId, token)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        setShowManuel(true)
        if (res.error && !res.fallbackManuel) {
          setError(res.error)
        }
      }
    })
  }

  return (
    <div style={{ marginTop: 20, padding: '16px 20px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: '#92400E' }}>⭐ Mettre en avant cette annonce</p>
      <p style={{ fontSize: 13, color: '#78350F', marginBottom: 12 }}>
        Apparaissez en tête des résultats pendant 30 jours — <strong>{montant.toLocaleString('fr-FR')} FCFA</strong>
      </p>
      {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>❌ {error}</p>}
      {waveActif && (
        <button
          onClick={handleClick}
          disabled={pending}
          style={{
            background: '#D97706', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 20px', fontWeight: 700,
            fontSize: 14, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? 'Connexion Wave…' : `🌊 Payer ${montant.toLocaleString('fr-FR')} FCFA via Wave`}
        </button>
      )}

      {manuelActif && (
        <button
          onClick={() => setShowManuel(true)}
          style={{
            display: 'block', marginTop: 8, background: 'none', border: '1px solid #92400E',
            color: '#92400E', borderRadius: 8, padding: '9px 20px', fontWeight: 700,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          🧾 Dépôt Manuel (Wave / OM)
        </button>
      )}

      {showManuel && (
        <ModalPaiementManuel
          reference={`immo_${userId}_${immoId}`}
          montant={montant}
          numeroWave={settings.paiement_manuel_numero_wave || ''}
          numeroOM={settings.paiement_manuel_numero_om || ''}
          onClose={() => setShowManuel(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
}
