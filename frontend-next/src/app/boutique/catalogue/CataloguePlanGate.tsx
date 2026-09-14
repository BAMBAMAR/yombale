'use client'

import React from 'react'
import Link from 'next/link'
import { Crown } from 'lucide-react'

interface CataloguePlanGateProps {
  prixPro: number
}

export default function CataloguePlanGate({ prixPro }: CataloguePlanGateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '36px 20px',
        background: '#fffbeb',
        borderRadius: 14,
        border: '1px solid #fcd34d',
        maxWidth: 520,
        margin: '20px auto',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: '#fef3c7',
          color: '#b45309',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        <Crown size={24} />
      </div>
      <h3 style={{ fontWeight: 800, fontSize: 16, margin: '0 0 6px', color: '#78350f' }}>
        Catalogue disponible en Boutique Pro
      </h3>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px', lineHeight: 1.5 }}>
        Ajoutez vos produits avec photos et prix. Vos clients peuvent parcourir votre catalogue directement sur Nopalou.
      </p>
      <Link
        href="/boutique/abonnement"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--accent, #C75B00)',
          color: '#fff',
          padding: '10px 24px',
          borderRadius: 10,
          textDecoration: 'none',
          fontWeight: 750,
          fontSize: 13.5,
          boxShadow: '0 2px 8px rgba(199,91,0,0.25)',
        }}
      >
        <span>Passer en Pro — {prixPro.toLocaleString('fr-FR')} FCFA/mois</span>
      </Link>
    </div>
  )
}
