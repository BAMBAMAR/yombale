'use client'

import Link from 'next/link'

interface Props {
  produitId: string
  userId: string
  settings: Record<string, string>
}

export default function SponsoringProduitBtn({ produitId, settings }: Props) {
  const montant = Number(settings.prix_sponsoring) || 5000

  return (
    <div className="sponsoring-produit-wrap">
      <Link
        href={`/payer-sponsoring-produit/${produitId}`}
        className="sponsoring-produit-btn"
        style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
      >
        ⭐ Mettre en avant ce produit
      </Link>
      <p className="sponsoring-produit-info">
        {montant.toLocaleString('fr-FR')} FCFA · 30 jours · Affiché en tête de liste
      </p>
    </div>
  )
}
