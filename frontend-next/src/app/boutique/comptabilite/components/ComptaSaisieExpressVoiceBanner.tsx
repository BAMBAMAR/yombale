'use client'

import React from 'react'
import { Mic, MicOff } from 'lucide-react'

interface ComptaSaisieExpressVoiceBannerProps {
  isListeningVoice: boolean
  demarrerEcouteVocale: () => void
  voiceFeedback: string | null
}

export function ComptaSaisieExpressVoiceBanner({
  isListeningVoice,
  demarrerEcouteVocale,
  voiceFeedback,
}: ComptaSaisieExpressVoiceBannerProps) {
  const isError = voiceFeedback && (
    voiceFeedback.includes('bloqué') ||
    voiceFeedback.includes('indisponible') ||
    voiceFeedback.includes('Erreur') ||
    voiceFeedback.includes('Microphone')
  )

  return (
    <div style={{
      background: isListeningVoice ? '#fff7ed' : '#ffffff',
      border: isListeningVoice ? '2px solid #ea580c' : '1px solid #e2e8f0',
      borderRadius: 16,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      boxShadow: isListeningVoice ? '0 6px 20px rgba(234, 88, 12, 0.2)' : '0 2px 8px rgba(0,0,0,0.02)',
      transition: 'all 0.2s ease',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={demarrerEcouteVocale}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: isListeningVoice ? '#ea580c' : '#f8fafc',
            color: isListeningVoice ? '#ffffff' : '#0f172a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isListeningVoice ? '0 0 0 5px rgba(234, 88, 12, 0.25)' : '0 2px 6px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title={isListeningVoice ? "Arrêter l'écoute" : "Dicter une opération"}
        >
          {isListeningVoice ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: isListeningVoice ? '#c2410c' : '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{isListeningVoice ? "Écoute en cours… Parlez en Wolof ou Français !" : "Assistant Vocal Saisie Express"}</span>
            {isListeningVoice && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />}
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
            Exemples : <em>« Dépense transport 2500 »</em>, <em>« Dépense benn téemeer essence »</em>, <em>« Vente 5000 »</em>, <em>« Vente ñaari junni »</em>
          </p>
        </div>
      </div>

      {voiceFeedback && (
        <div style={{
          background: isError ? '#fef2f2' : '#f0fdf4',
          border: isError ? '1.5px solid #fecaca' : '1px solid #bbf7d0',
          color: isError ? '#991b1b' : '#166534',
          padding: '8px 14px',
          borderRadius: 10,
          fontSize: 12.5,
          fontWeight: 700,
          maxWidth: 520,
          lineHeight: 1.4
        }}>
          {voiceFeedback}
        </div>
      )}
    </div>
  )
}
