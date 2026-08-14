'use client'

import Link from 'next/link'

interface Props {
  immoId: string
  settings: Record<string, string>
}

export default function SponsoringImmoBtn({ immoId, settings }: Props) {
  const montant = Number(settings.prix_sponsoring) || 5000

  return (
    <div style={{ marginTop: 20, padding: '16px 20px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: '#92400E' }}>⭐ Mettre en avant cette annonce</p>
      <p style={{ fontSize: 13, color: '#78350F', marginBottom: 12 }}>
        Apparaissez en tête des résultats pendant 30 jours — <strong>{montant.toLocaleString('fr-FR')} FCFA</strong>
      </p>
      <Link
        href={`/payer-sponsoring-immo/${immoId}`}
        style={{
          display: 'block', textAlign: 'center', background: '#D97706', color: '#fff', border: 'none',
          borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, textDecoration: 'none'
        }}
      >
        Mettre en avant
      </Link>
    </div>
  )
}
