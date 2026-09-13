'use client'

import React from 'react'
import { Tag, Sparkles, Check, Plus, MessageSquare } from 'lucide-react'
import { Produit, PromoApplique, fcfa } from './types'

interface CommanderCrossSellSectionProps {
  codePromo: string
  setCodePromo: (code: string) => void
  promoApplique: PromoApplique | null
  promoLoading: boolean
  promoError: string | null
  appliquerCodePromo: () => void
  removePromo: () => void
  crossSell: Produit[]
  selectedAddons: Record<string, number>
  toggleAddon: (id: string) => void
  note: string
  setNote: (note: string) => void
}

export default function CommanderCrossSellSection({
  codePromo,
  setCodePromo,
  promoApplique,
  promoLoading,
  promoError,
  appliquerCodePromo,
  removePromo,
  crossSell,
  selectedAddons,
  toggleAddon,
  note,
  setNote,
}: CommanderCrossSellSectionProps) {
  return (
    <>
      {/* Section 4 : Code Promo */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '12px 14px',
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
          }}
        >
          <Tag size={15} color="var(--accent, #C75B00)" />
          <span>Code Promo (optionnel)</span>
        </label>

        {promoApplique ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={16} color="#16a34a" />
              <div>
                <strong style={{ fontSize: 14, color: '#166534' }}>{promoApplique.code}</strong>
                <span style={{ fontSize: 13, color: '#15803d', marginLeft: 8, fontWeight: 700 }}>
                  (-{fcfa(promoApplique.reduction)})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={removePromo}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Retirer ✕
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={codePromo}
              onChange={e => setCodePromo(e.target.value.toUpperCase())}
              className="commander-premium-input"
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', flex: 1, padding: '9px 12px' }}
              placeholder="Ex: SOLDE20"
            />
            <button
              type="button"
              onClick={appliquerCodePromo}
              disabled={promoLoading || !codePromo.trim()}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                background: 'var(--navy, #1C2B4A)',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: promoLoading || !codePromo.trim() ? 'not-allowed' : 'pointer',
                opacity: promoLoading || !codePromo.trim() ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {promoLoading ? '...' : 'Appliquer'}
            </button>
          </div>
        )}

        {promoError && (
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 700 }}>
            {promoError}
          </p>
        )}
      </div>

      {/* Section 5 : Cross-sell / Articles Complémentaires */}
      {crossSell.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1.5px solid #fef3c7',
            borderRadius: 14,
            padding: '12px 14px',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 11.5,
              fontWeight: 900,
              color: '#92400e',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={14} color="#d97706" />
            <span>Ajouter un article complémentaire (1-Clic) :</span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {crossSell.map(c => {
              const isSelected = !!selectedAddons[c.id]
              return (
                <div
                  key={c.id}
                  onClick={() => toggleAddon(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1.5px solid',
                    borderColor: isSelected ? 'var(--accent, #C75B00)' : '#fde68a',
                    background: isSelected ? '#fff7ed' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: isSelected ? 'var(--accent, #C75B00)' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 800 : 600, color: '#1e293b' }}>
                      {c.nom}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>
                    +{c.prix ? fcfa(c.prix) : '0 FCFA'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Section 6 : Note optionnelle */}
      <div>
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
          }}
        >
          <MessageSquare size={14} color="#64748b" />
          <span>Note / Précisions particulières (optionnel)</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          className="commander-premium-input"
          rows={2}
          placeholder="Couleur, taille, instructions pour le livreur..."
          style={{ resize: 'vertical' }}
        />
      </div>
    </>
  )
}
