'use client'

import React from 'react'
import { Lock, KeyRound } from 'lucide-react'

interface SurgaXaalisLockedScreenProps {
  onUnlock: () => void
}

export default function SurgaXaalisLockedScreen({ onUnlock }: SurgaXaalisLockedScreenProps) {
  return (
    <div
      style={{
        padding: '50px 20px',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid var(--surga-border, #E2E8F0)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          backgroundColor: 'rgba(199, 91, 0, 0.1)',
          color: 'var(--accent, #C75B00)',
          margin: '0 auto 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Lock size={28} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px' }}>
        Sama Xaalis est Verrouillé
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text2, #475569)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>
        Vos finances personnelles et votre solde Kalpé sont protégés par votre code PIN confidentiel.
      </p>
      <button
        type="button"
        onClick={onUnlock}
        style={{
          padding: '10px 22px',
          borderRadius: 10,
          backgroundColor: 'var(--navy, #1C2B4A)',
          color: '#FFFFFF',
          border: 'none',
          fontSize: 13.5,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <KeyRound size={16} />
        <span>Déverrouiller avec mon code PIN</span>
      </button>
    </div>
  )
}
