'use client'

import React from 'react'
import { Mic, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ClientCredit, VoiceActionPending } from '../types'
import CarnetVoiceActionPrompt from './CarnetVoiceActionPrompt'

interface CarnetVoiceActionCardProps {
  isMobile: boolean
  isListeningVoice: boolean
  voiceFeedback: string | null
  voiceActionPending: VoiceActionPending | null
  setVoiceActionPending: React.Dispatch<React.SetStateAction<VoiceActionPending | null>>
  voiceActionLoading: boolean
  clients: ClientCredit[]
  onStopListening: () => void
  onValiderActionVocale: (action: VoiceActionPending) => void
  onModifierDepuisVocal: (action: VoiceActionPending) => void
  onCreerNouveauClientVocal: (nom: string) => void
}

export default function CarnetVoiceActionCard({
  isMobile,
  isListeningVoice,
  voiceFeedback,
  voiceActionPending,
  setVoiceActionPending,
  voiceActionLoading,
  clients,
  onStopListening,
  onValiderActionVocale,
  onModifierDepuisVocal,
  onCreerNouveauClientVocal,
}: CarnetVoiceActionCardProps) {
  const isErrorFeedback =
    voiceFeedback?.includes('bloqué') ||
    voiceFeedback?.includes('indisponible') ||
    voiceFeedback?.includes('Erreur') ||
    voiceFeedback?.includes('Microphone')

  return (
    <>
      {/* Bandeau Vocal Supérieur */}
      {(isListeningVoice || voiceFeedback) && (
        <div
          style={{
            background: isListeningVoice ? '#fff7ed' : isErrorFeedback ? '#fef2f2' : '#f0fdf4',
            border: isListeningVoice
              ? '2px solid #ea580c'
              : isErrorFeedback
              ? '1.5px solid #fecaca'
              : '1.5px solid #bbf7d0',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isListeningVoice ? (
              <Mic size={20} color="#ea580c" className="animate-pulse" />
            ) : isErrorFeedback ? (
              <AlertCircle size={20} color="#dc2626" />
            ) : (
              <CheckCircle2 size={20} color="#16a34a" />
            )}
            <div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: isListeningVoice ? '#9a3412' : isErrorFeedback ? '#991b1b' : '#166534',
                }}
              >
                {isListeningVoice
                  ? 'Écoute en cours… Parlez en Wolof ou Français !'
                  : voiceFeedback}
              </div>
              {isListeningVoice && (
                <div style={{ fontSize: 12, color: '#c2410c', marginTop: 2 }}>
                  Dites par ex : <em>« Bor Moussa 10 000 »</em>, <em>« Dette Fatou ñaari junni »</em> ou{' '}
                  <em>« Client Alioune »</em>
                </div>
              )}
            </div>
          </div>
          {isListeningVoice && (
            <button
              type="button"
              onClick={onStopListening}
              style={{
                background: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Arrêter
            </button>
          )}
        </div>
      )}

      {/* CARTE D'ACTION VOCALE INSTANTANÉE */}
      {voiceActionPending && (
        <CarnetVoiceActionPrompt
          voiceActionPending={voiceActionPending}
          setVoiceActionPending={setVoiceActionPending}
          voiceActionLoading={voiceActionLoading}
          isMobile={isMobile}
          clients={clients}
          onValiderActionVocale={onValiderActionVocale}
          onModifierDepuisVocal={onModifierDepuisVocal}
          onCreerNouveauClientVocal={onCreerNouveauClientVocal}
        />
      )}
    </>
  )
}
