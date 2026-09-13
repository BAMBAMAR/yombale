'use client'
import React from 'react'
import { fcfa } from '@/lib/format'
import { Tag } from 'lucide-react'

interface DrawerCartPromoCodeProps {
  codePromo: string
  setCodePromo: (val: string) => void
  promoApplique: { code: string; reduction: number; type_remise?: string; message?: string } | null
  promoLoading: boolean
  promoError: string | null
  onApply: () => void
  onRemove: () => void
}

export default function DrawerCartPromoCode({
  codePromo,
  setCodePromo,
  promoApplique,
  promoLoading,
  promoError,
  onApply,
  onRemove,
}: DrawerCartPromoCodeProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 14,
        padding: '12px 14px',
      }}
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: 'var(--text1, #1A1612)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <Tag size={13} style={{ color: 'var(--accent, #C75B00)' }} />
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
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={14} color="#16a34a" />
            <div>
              <strong style={{ fontSize: 13, color: '#166534' }}>{promoApplique.code}</strong>
              <span
                style={{
                  fontSize: 12.5,
                  color: '#15803d',
                  marginLeft: 6,
                  fontWeight: 700,
                }}
              >
                (-{fcfa(promoApplique.reduction)})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              padding: '2px 6px',
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
            onChange={(e) => setCodePromo(e.target.value.toUpperCase())}
            placeholder="Ex: SOLDE20"
            className="premium-cart-input"
            style={{
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              flex: 1,
              padding: '9px 12px',
            }}
          />
          <button
            type="button"
            onClick={onApply}
            disabled={promoLoading || !codePromo.trim()}
            style={{
              background: 'var(--navy, #1C2B4A)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 800,
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
  )
}
