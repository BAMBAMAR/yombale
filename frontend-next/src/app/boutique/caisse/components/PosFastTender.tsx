'use client'

import React from 'react'
import { calculerSuggestionsFastTender, FastTenderOption } from '../lib/fast-tender'
import { fcfa } from '@/lib/format'

interface PosFastTenderProps {
  totalNet: number
  montantRecu: string
  onSelectMontant: (montant: number) => void
}

export default function PosFastTender({
  totalNet,
  montantRecu,
  onSelectMontant,
}: PosFastTenderProps) {
  if (!totalNet || totalNet <= 0) return null

  const suggestions = calculerSuggestionsFastTender(totalNet)
  const montantActuel = Number(montantRecu) || 0
  const monnaieCalculee = Math.max(0, montantActuel - totalNet)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--pos-text2, #475569)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ⚡ Appoints Rapides Espèces (Fast Tender)
        </label>
        {montantActuel > 0 && montantActuel >= totalNet && (
          <span style={{ fontSize: 12, fontWeight: 900, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>
            Rendre : {fcfa(monnaieCalculee)}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${suggestions.length}, 1fr)`, gap: 6 }}>
        {suggestions.map((opt) => {
          const isSelected = montantActuel === opt.montant
          return (
            <button
              key={opt.montant}
              type="button"
              onClick={() => onSelectMontant(opt.montant)}
              style={{
                padding: '8px 4px',
                borderRadius: 8,
                border: isSelected ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
                background: isSelected ? '#16a34a' : '#ffffff',
                color: isSelected ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 3px 8px rgba(22,163,74,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.12s ease',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.2 }}>
                {opt.isExact ? 'Exact' : `${opt.montant.toLocaleString('fr-FR')} F`}
              </span>
              <span style={{ fontSize: 9.5, opacity: isSelected ? 0.9 : 0.6, fontWeight: 700, marginTop: 2 }}>
                {opt.monnaieARendre > 0 ? `-${opt.monnaieARendre.toLocaleString('fr-FR')} F` : '0 F'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
