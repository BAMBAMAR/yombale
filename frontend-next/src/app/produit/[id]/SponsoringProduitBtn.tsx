'use client'

import { useState, useTransition } from 'react'
import { initierWaveProduitSponsoring } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'

interface Props {
  produitId: string
  userId: string
  settings: Record<string, string>
}

export default function SponsoringProduitBtn({ produitId, userId, settings }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showManuel, setShowManuel] = useState(false)

  const manuelActif = settings.paiement_manuel_actif !== 'false'
  const waveActif   = settings.paiement_wave !== 'false'
  const montant     = Number(settings.prix_sponsoring) || 5000

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || undefined
      const result = await initierWaveProduitSponsoring(produitId, token)
      if (result.ok && result.url) {
        window.location.href = result.url
      } else {
        setShowManuel(true)
        if (result.error && !result.fallbackManuel) {
          setError(result.error)
        }
      }
    })
  }

  return (
    <div className="sponsoring-produit-wrap">
      {waveActif && (
        <button
          onClick={handleClick}
          disabled={isPending}
          className="sponsoring-produit-btn"
        >
          {isPending ? 'Redirection…' : '⭐ Mettre en avant ce produit'}
        </button>
      )}
      <p className="sponsoring-produit-info">
        {montant.toLocaleString('fr-FR')} FCFA · 30 jours · Affiché en tête de liste
      </p>
      {error && <p className="sponsoring-produit-error">{error}</p>}

      {manuelActif && (
        <button
          type="button"
          onClick={() => setShowManuel(true)}
          className="sponsoring-produit-btn"
          style={{ marginTop: 8, background: 'none', border: '1px solid var(--border, #d1d5db)' }}
        >
          🧾 Dépôt Manuel (Wave / OM)
        </button>
      )}

      {showManuel && (
        <ModalPaiementManuel
          reference={`prod_${userId}_${produitId}`}
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
