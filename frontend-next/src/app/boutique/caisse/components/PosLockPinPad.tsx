'use client'

import React from 'react'
import { KeyRound } from 'lucide-react'

interface PosLockPinPadProps {
  codePinSaisi: string
  pinError: string | null
  setCodePinSaisi: any
  setPinError: (err: string | null) => void
}

export default function PosLockPinPad({
  codePinSaisi,
  pinError,
  setCodePinSaisi,
  setPinError,
}: PosLockPinPadProps) {
  return (
    <div>
      {/* Pastilles Visuelles de Chiffres PIN */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
        {[0, 1, 2, 3].map((i) => {
          const isFilled = codePinSaisi.length > i
          return (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: isFilled ? 'var(--pos-primary, #ea580c)' : 'var(--pos-surface2, #f1f5f9)',
                border: isFilled
                  ? '2px solid var(--pos-primary, #ea580c)'
                  : '2px solid var(--pos-border, #cbd5e1)',
                transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s ease',
              }}
            />
          )
        })}
      </div>

      {pinError && (
        <p style={{ margin: '0 0 12px', color: 'var(--pos-danger, #dc2626)', fontSize: 13, fontWeight: 700 }}>
          {pinError}
        </p>
      )}

      {/* Clavier Numérique PIN Pad Tactile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((val) => (
          <button
            key={val}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              if (val === 'C') {
                setCodePinSaisi('')
                setPinError(null)
              } else if (val === '⌫') {
                setCodePinSaisi((prev: string) => prev.slice(0, -1))
                setPinError(null)
              } else if (codePinSaisi.length < 6) {
                const nextPin = codePinSaisi + val
                setCodePinSaisi(nextPin)
                setPinError(null)
              }
            }}
            style={{
              padding: '16px',
              background: 'var(--pos-surface2, #f8fafc)',
              border: '1.5px solid var(--pos-border, #cbd5e1)',
              borderRadius: 14,
              fontSize: val === 'C' || val === '⌫' ? 17 : 22,
              fontWeight: 900,
              color: val === 'C' ? 'var(--pos-danger, #dc2626)' : 'var(--pos-navy, #0f172a)',
              cursor: 'pointer',
              userSelect: 'none',
              touchAction: 'manipulation',
            }}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Champ masqué d'écoute du clavier physique */}
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={codePinSaisi}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '')
          setCodePinSaisi(val)
          setPinError(null)
        }}
        placeholder="Tapez le code PIN au clavier..."
        autoFocus
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1.5px solid var(--pos-border, #cbd5e1)',
          background: 'var(--pos-surface, #ffffff)',
          color: 'var(--pos-text, #0f172a)',
          fontSize: 14,
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: 4,
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </div>
  )
}
