'use client'

import React, { useState } from 'react'

interface PosNumpadProps {
  onSearchOrAddBarcode: (code: string) => void
  onClose?: () => void
}

export default function PosNumpad({ onSearchOrAddBarcode, onClose }: PosNumpadProps) {
  const [valeur, setValeur] = useState('')

  const handleKey = (char: string) => {
    if (char === 'C') {
      setValeur('')
    } else if (char === '⌫') {
      setValeur((prev) => prev.slice(0, -1))
    } else if (char === 'OK') {
      if (valeur.trim()) {
        onSearchOrAddBarcode(valeur.trim())
        setValeur('')
        if (onClose) onClose()
      }
    } else {
      setValeur((prev) => prev + char)
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid var(--pos-border, #cbd5e1)',
        borderRadius: 14,
        padding: 12,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
        width: 220,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
          🔢 Pavé Code-barres
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      <input
        type="text"
        readOnly
        placeholder="Code EAN / SKU..."
        value={valeur}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1.5px solid var(--pos-primary, #C75B00)',
          background: '#fff7ed',
          color: '#0f172a',
          fontSize: 16,
          fontWeight: 900,
          textAlign: 'center',
          letterSpacing: '0.1em',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleKey(k)}
            style={{
              padding: '12px 0',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: k === 'C' ? '#fee2e2' : k === '⌫' ? '#f1f5f9' : '#f8fafc',
              color: k === 'C' ? '#dc2626' : '#0f172a',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.1s',
            }}
          >
            {k}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => handleKey('OK')}
        disabled={!valeur.trim()}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 8,
          border: 'none',
          background: valeur.trim() ? 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)' : '#cbd5e1',
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 900,
          cursor: valeur.trim() ? 'pointer' : 'not-allowed',
          boxShadow: valeur.trim() ? '0 3px 8px rgba(199,91,0,0.3)' : 'none',
        }}
      >
        ✓ Ajouter au panier
      </button>
    </div>
  )
}
