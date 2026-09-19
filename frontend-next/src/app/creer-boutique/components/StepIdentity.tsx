'use client'

import React from 'react'
import { Store, Sparkles } from 'lucide-react'

const NOM_SUGGESTIONS = [
  'Teranga Shopping',
  'Dakar Élégance',
  'Taf Taf Express',
  'Keur Wax Couture',
  'Alimentation Thiossane',
  'Sénégal High-Tech',
]

interface StepIdentityProps {
  nom: string
  setNom: (val: string) => void
  fontStyle?: React.CSSProperties
}

export default function StepIdentity({ nom, setNom, fontStyle }: StepIdentityProps) {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: '#FFF3E8',
          color: 'var(--accent, #C75B00)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Store size={24} />
      </div>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: 'var(--navy, #1C2B4A)',
          marginBottom: 8,
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
        }}
      >
        Quel est le nom de votre boutique ou marque ?
      </h1>
      <p style={{ color: '#64748b', fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
        C&apos;est le nom sous lequel vos clients vous reconnaîtront. Vous pourrez le modifier à tout moment.
      </p>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>
        Nom commercial :
      </label>
      <input
        type="text"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Ex: Teranga Shopping, Dakar Élégance..."
        autoFocus
        style={{
          width: '100%',
          padding: '16px 20px',
          borderRadius: 16,
          border: '2px solid #cbd5e1',
          fontSize: 18,
          color: '#0f172a',
          fontWeight: 700,
          outline: 'none',
          background: '#f8fafc',
          transition: 'all 0.2s ease',
          ...fontStyle,
        }}
      />

      {/* Suggestions inspirantes */}
      <div style={{ marginTop: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            marginBottom: 8,
          }}
        >
          <Sparkles size={13} color="var(--accent, #C75B00)" />
          Idées populaires :
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {NOM_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => setNom(sug)}
              style={{
                background: nom === sug ? '#FFF3E8' : '#f1f5f9',
                color: nom === sug ? 'var(--accent, #C75B00)' : '#475569',
                border: nom === sug ? '1px solid #fed7aa' : '1px solid transparent',
                borderRadius: 16,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
