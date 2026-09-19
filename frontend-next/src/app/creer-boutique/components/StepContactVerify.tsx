'use client'

import React from 'react'
import { Phone, KeyRound } from 'lucide-react'

interface StepContactVerifyProps {
  step: 2 | 3
  telephone: string
  setTelephone: (val: string) => void
  code: string
  setCode: (val: string) => void
  fontStyle?: React.CSSProperties
}

export default function StepContactVerify({
  step,
  telephone,
  setTelephone,
  code,
  setCode,
  fontStyle,
}: StepContactVerifyProps) {
  if (step === 2) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: '#ecfdf5',
            color: 'var(--price, #0A5C36)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Phone size={24} />
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
          Votre numéro WhatsApp
        </h1>
        <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
          Les commandes passées sur votre vitrine arriveront directement sur ce numéro WhatsApp.
        </p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>
          Numéro WhatsApp (Sénégal) :
        </label>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 18,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 15,
              fontWeight: 800,
              color: '#475569',
              letterSpacing: '0.02em',
            }}
          >
            +221
          </span>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="77 123 45 67"
            autoFocus
            style={{
              width: '100%',
              padding: '18px 22px 18px 75px',
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
        </div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: '#eff6ff',
          color: '#1e3a5f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <KeyRound size={24} />
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
        Vérification WhatsApp
      </h1>
      <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
        Entrez le code à 6 chiffres envoyé au <strong style={{ color: '#0f172a' }}>{telephone}</strong>.
      </p>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
        autoFocus
        maxLength={6}
        style={{
          width: '100%',
          padding: '20px 22px',
          borderRadius: 16,
          border: '2px solid #3b82f6',
          fontSize: 28,
          color: '#0f172a',
          fontWeight: 900,
          outline: 'none',
          letterSpacing: '6px',
          textAlign: 'center',
          background: '#eff6ff',
          ...fontStyle,
        }}
      />
    </div>
  )
}
