'use client'

import React from 'react'
import { Mic, MicOff, Check } from 'lucide-react'

interface KalpeSaisieMontantProps {
  montant: string
  setMontant: (v: string) => void
  isListening: boolean
  toggleListening: () => void
  voiceFeedback: string | null
  handleQuickAddMontant: (v: number) => void
}

export function KalpeSaisieMontant({
  montant,
  setMontant,
  isListening,
  toggleListening,
  voiceFeedback,
  handleQuickAddMontant,
}: KalpeSaisieMontantProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A' }}>Montant (FCFA)</label>
        <button
          type="button"
          onClick={toggleListening}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isListening ? '#DC2626' : '#FFF7ED',
            color: isListening ? '#FFFFFF' : '#C75B00',
            border: isListening ? '1.5px solid #DC2626' : '1px solid #FED7AA',
            borderRadius: '8px',
            padding: '5px 10px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isListening ? '0 0 10px rgba(220, 38, 38, 0.4)' : 'none',
          }}
        >
          {isListening ? <MicOff size={14} style={{ flexShrink: 0 }} /> : <Mic size={14} style={{ flexShrink: 0 }} />}
          <span>{isListening ? 'Arrêter écoute' : 'Dicter vocal'}</span>
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="number"
          inputMode="numeric"
          required
          placeholder="Ex: 5000"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          style={{
            width: '100%',
            fontSize: '22px',
            fontWeight: 800,
            color: '#1C2B4A',
            padding: '10px 14px',
            border: '1.5px solid #E8DDD2',
            borderRadius: '10px',
            background: '#FFFFFF',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '13px',
            fontWeight: 700,
            color: '#888',
          }}
        >
          FCFA
        </span>
      </div>

      {/* Voice Feedback */}
      {voiceFeedback && (
        <div
          style={{
            fontSize: '11.5px',
            color: isListening ? '#C75B00' : '#0A5C36',
            background: isListening ? '#FFF7ED' : '#ECFDF5',
            border: isListening ? '1px solid #FED7AA' : '1px solid #A7F3D0',
            padding: '6px 10px',
            borderRadius: 8,
            marginTop: '8px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isListening ? (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#DC2626',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
          ) : (
            <Check size={14} style={{ color: '#0A5C36', flexShrink: 0 }} />
          )}
          <span>{voiceFeedback}</span>
        </div>
      )}

      {/* Chips Montants Rapides */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
        {[500, 1000, 2000, 5000, 10000, 25000].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => handleQuickAddMontant(val)}
            style={{
              background: '#F8F5F0',
              border: '1px solid #E8DDD2',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#1C2B4A',
              cursor: 'pointer',
            }}
          >
            +{val >= 1000 ? `${val / 1000}k` : val}
          </button>
        ))}
      </div>
    </div>
  )
}
