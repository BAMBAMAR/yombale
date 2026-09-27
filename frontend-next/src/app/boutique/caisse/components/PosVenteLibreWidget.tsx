'use client'

import React, { useState } from 'react'
import { Zap } from 'lucide-react'
import { fcfa } from '@/lib/format'
import type { ProduitCaisse } from './PosCatalogueSection'

interface PosVenteLibreWidgetProps {
  onAjouter: (p: ProduitCaisse) => void
}

export default function PosVenteLibreWidget({ onAjouter }: PosVenteLibreWidgetProps) {
  const [montantLibre, setMontantLibre] = useState('')

  const handleAjouter = (montant?: number) => {
    const m = Number(montant || montantLibre)
    if (m > 0) {
      onAjouter({
        id: `libre-${Date.now()}-${m}`,
        nom: `Vente Libre (${fcfa(m)})`,
        prix: m,
        stock: 9999,
        categorie: 'divers',
      })
      setMontantLibre('')
    }
  }

  return (
    <div
      style={{
        background: 'var(--pos-surface2)',
        borderRadius: 12,
        padding: '16px 14px',
        maxWidth: 420,
        margin: '0 auto 16px',
        border: '1px solid var(--pos-border)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pos-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Zap size={14} style={{ color: 'var(--pos-primary)' }} />
        <span>Encaissement Vente Libre (sans article)</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          type="number"
          placeholder="Montant FCFA..."
          value={montantLibre}
          onChange={(e) => setMontantLibre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAjouter()
          }}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid var(--pos-border)',
            background: 'var(--pos-surface)',
            color: 'var(--pos-text)',
            fontSize: 14,
            fontWeight: 700,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => handleAjouter()}
          disabled={!Number(montantLibre)}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--pos-primary)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            cursor: Number(montantLibre) ? 'pointer' : 'not-allowed',
            opacity: Number(montantLibre) ? 1 : 0.6,
          }}
        >
          + Ajouter
        </button>
      </div>

      {/* Paliers rapides */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[1000, 2000, 5000, 10000].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => handleAjouter(val)}
            style={{
              padding: '5px 10px',
              borderRadius: 14,
              border: '1px solid var(--pos-border)',
              background: 'var(--pos-surface)',
              color: 'var(--pos-text)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            +{fcfa(val)}
          </button>
        ))}
      </div>
    </div>
  )
}
