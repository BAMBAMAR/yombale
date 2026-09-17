'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, AlertCircle } from 'lucide-react'

export default function PayerLoyerForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = code.trim()
    if (!clean) {
      setError('Veuillez saisir votre référence d\'échéance ou numéro de facture.')
      return
    }
    setError('')
    router.push(`/payer-loyer/${encodeURIComponent(clean)}`)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label
        htmlFor="echeance-input"
        style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}
      >
        Référence de l&apos;avis d&apos;échéance ou code reçu :
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={16}
            color="var(--text-subtle, #5A4E42)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            id="echeance-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex : ECH-2026-9812 ou identifiant unique"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px 12px 38px',
              borderRadius: 10,
              border: '1.5px solid var(--border, #E8DDD2)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            background: 'var(--price, #0A5C36)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0
          }}
        >
          <span>Accéder au paiement</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b91c1c', fontSize: 12.5 }}>
          <AlertCircle size={14} color="#b91c1c" />
          <span>{error}</span>
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--text-subtle, #5A4E42)', margin: '4px 0 0', lineHeight: 1.4 }}>
        Conseil : la référence figure dans le message WhatsApp ou SMS de rappel envoyé par votre agence.
      </p>
    </form>
  )
}
