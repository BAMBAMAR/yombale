'use client'

import React from 'react'
import { Mic, MicOff, X, Sparkles, Volume2 } from 'lucide-react'

interface ComptaSaisieExpressVoiceBannerProps {
  isOpen: boolean
  onClose: () => void
  isListeningVoice: boolean
  demarrerEcouteVocale: () => void
  voiceFeedback: string | null
}

export function ComptaSaisieExpressVoiceBanner({
  isOpen,
  onClose,
  isListeningVoice,
  demarrerEcouteVocale,
  voiceFeedback,
}: ComptaSaisieExpressVoiceBannerProps) {
  if (!isOpen) return null

  const isError =
    voiceFeedback &&
    (voiceFeedback.includes('bloqué') ||
      voiceFeedback.includes('indisponible') ||
      voiceFeedback.includes('Erreur') ||
      voiceFeedback.includes('Microphone') ||
      voiceFeedback.includes('Aucune voix'))

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Assistant vocal et guide d'utilisation"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 460,
          width: '100%',
          padding: '22px 20px',
          boxShadow: '0 20px 50px rgba(28, 43, 74, 0.25)',
          border: '1.5px solid var(--border, #E8DDD2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'relative',
        }}
      >
        {/* En-tête de la modale */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            paddingBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#FFF3E8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #C75B00)',
                flexShrink: 0,
              }}
            >
              <Mic size={18} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 900,
                  color: 'var(--navy, #1C2B4A)',
                  letterSpacing: '-0.01em',
                }}
              >
                Assistant Vocal
              </h2>
              <p
                style={{
                  margin: '1px 0 0',
                  fontSize: 11.5,
                  color: 'var(--text2, #6B7280)',
                  fontWeight: 600,
                }}
              >
                Wolof & Français · Ventes & Dépenses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--bg, #F8F5F0)',
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Fermer le guide vocal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Bouton d'écoute interactif central */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 10px',
            background: isListeningVoice ? '#FFF3E8' : 'var(--bg, #F8F5F0)',
            borderRadius: 16,
            border: isListeningVoice
              ? '2px solid var(--accent, #C75B00)'
              : '1.5px solid var(--border, #E8DDD2)',
            transition: 'all 0.2s ease',
          }}
        >
          <button
            type="button"
            onClick={demarrerEcouteVocale}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: 'none',
              background: isListeningVoice
                ? 'var(--accent, #C75B00)'
                : 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isListeningVoice
                ? '0 0 0 8px rgba(199, 91, 0, 0.22)'
                : '0 4px 12px rgba(28, 43, 74, 0.2)',
              transition: 'all 0.2s ease',
            }}
            title={isListeningVoice ? "Arrêter l'écoute" : 'Démarrer la dictée'}
          >
            {isListeningVoice ? <MicOff size={26} /> : <Mic size={26} />}
          </button>

          <span
            style={{
              marginTop: 12,
              fontSize: 13.5,
              fontWeight: 800,
              color: isListeningVoice
                ? 'var(--accent, #C75B00)'
                : 'var(--navy, #1C2B4A)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isListeningVoice
              ? 'Écoute en cours… Parlez maintenant !'
              : 'Touchez le micro pour parler'}
          </span>
        </div>

        {/* Retour en direct / Transcription */}
        {voiceFeedback && (
          <div
            style={{
              background: isError ? '#FEF2F2' : '#E6F4EC',
              border: isError ? '1.5px solid #FECACA' : '1px solid #BBF7D0',
              color: isError ? 'var(--red, #B91C1C)' : 'var(--price, #0A5C36)',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 700,
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Volume2 size={16} style={{ flexShrink: 0 }} />
            <span>{voiceFeedback}</span>
          </div>
        )}

        {/* Guide d'utilisation & Exemples pratiques */}
        <div
          style={{
            background: 'var(--bg, #F8F5F0)',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            <Sparkles size={14} color="var(--accent, #C75B00)" />
            <span>Comment l&apos;utiliser ?</span>
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'var(--text2, #5A4E42)',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div>
              <strong>Pour une vente :</strong>
              <div style={{ color: 'var(--price, #0A5C36)', fontStyle: 'italic', paddingLeft: 8 }}>
                « Vente 5000 » · « 3 jus bissap » · « Vente ñaari junni »
              </div>
            </div>

            <div>
              <strong>Pour une dépense :</strong>
              <div style={{ color: 'var(--accent, #C75B00)', fontStyle: 'italic', paddingLeft: 8 }}>
                « Dépense transport 2000 » · « Sortie Woyofal 5000 » · « Tiak-tiak 1500 »
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text3, #8C7E74)', marginTop: 2 }}>
              Le système comprend le Français et le Wolof avec conversion automatique en FCFA (téemeer, junni).
            </div>
          </div>
        </div>

        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
