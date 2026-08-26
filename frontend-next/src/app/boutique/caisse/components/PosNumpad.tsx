'use client'

import React, { useState } from 'react'

interface PosNumpadProps {
  onSearchOrAddBarcode: (code: string) => void
  onClose?: () => void
  isDocked?: boolean
}

export default function PosNumpad({ onSearchOrAddBarcode, onClose, isDocked = false }: PosNumpadProps) {
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
        background: 'var(--pos-surface, #ffffff)',
        border: isDocked ? 'none' : '1.5px solid var(--pos-border, #cbd5e1)',
        borderRadius: isDocked ? 0 : 16,
        padding: isDocked ? '10px 12px' : 16,
        boxShadow: isDocked ? 'none' : '0 15px 35px -5px rgba(0,0,0,0.25)',
        width: isDocked ? '100%' : 260,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--pos-text2, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🔢</span> {isDocked ? 'Pavé Tactile EAN / SKU' : 'Pavé Numérique'}
        </span>
        {onClose && !isDocked && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--pos-surface2, #f1f5f9)',
              border: 'none',
              borderRadius: 6,
              color: 'var(--pos-text2, #94a3b8)',
              width: 26,
              height: 26,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Écran Digital LCD */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          readOnly
          placeholder="Code-barres / SKU..."
          value={valeur}
          style={{
            width: '100%',
            padding: '11px 12px',
            borderRadius: 10,
            border: '2px solid var(--pos-primary, #f97316)',
            background: 'var(--pos-surface2, #1e293b)',
            color: 'var(--pos-primary, #f97316)',
            fontSize: 17,
            fontWeight: 900,
            textAlign: 'center',
            letterSpacing: '0.12em',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        {valeur && (
          <button
            type="button"
            onClick={() => setValeur('')}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              width: 20,
              height: 20,
              fontSize: 10,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Grille des Touches Tactiles 3x4 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => {
          const isClear = k === 'C'
          const isBack = k === '⌫'
          return (
            <button
              key={k}
              type="button"
              onClick={() => handleKey(k)}
              style={{
                padding: isDocked ? '13px 0' : '15px 0',
                borderRadius: 10,
                border: '1px solid var(--pos-border, #334155)',
                background: isClear
                  ? 'rgba(239, 68, 68, 0.18)'
                  : isBack
                  ? 'var(--pos-surface2, #334155)'
                  : 'var(--pos-surface, #1e293b)',
                color: isClear ? '#f87171' : 'var(--pos-text, #ffffff)',
                fontSize: 17,
                fontWeight: 900,
                cursor: 'pointer',
                userSelect: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'all 0.1s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.96)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {k}
            </button>
          )
        })}
      </div>

      {/* Bouton de Validation / Ajout */}
      <button
        type="button"
        onClick={() => handleKey('OK')}
        disabled={!valeur.trim()}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 10,
          border: 'none',
          background: valeur.trim()
            ? 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)'
            : 'var(--pos-surface2, #cbd5e1)',
          color: valeur.trim() ? '#ffffff' : 'var(--pos-text2, #94a3b8)',
          fontSize: 14,
          fontWeight: 900,
          cursor: valeur.trim() ? 'pointer' : 'not-allowed',
          boxShadow: valeur.trim() ? '0 4px 12px rgba(199,91,0,0.35)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.15s ease',
        }}
      >
        <span>✓</span> Ajouter au Panier
      </button>
    </div>
  )
}
