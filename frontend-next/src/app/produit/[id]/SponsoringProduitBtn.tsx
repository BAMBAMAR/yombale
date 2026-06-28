'use client'

import { useState, useTransition } from 'react'
import { initierWaveProduitSponsoring } from '@/app/actions/paiement'

export default function SponsoringProduitBtn({ produitId }: { produitId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await initierWaveProduitSponsoring(produitId)
      if (result.ok && result.url) {
        window.location.href = result.url
      } else {
        setError(result.error ?? 'Erreur inattendue')
      }
    })
  }

  return (
    <div className="sponsoring-produit-wrap">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="sponsoring-produit-btn"
      >
        {isPending ? 'Redirection…' : '⭐ Mettre en avant ce produit'}
      </button>
      <p className="sponsoring-produit-info">
        5 000 FCFA · 30 jours · Affiché en tête de liste
      </p>
      {error && <p className="sponsoring-produit-error">{error}</p>}
    </div>
  )
}
