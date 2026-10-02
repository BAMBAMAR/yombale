'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'

interface DemandeConsentement {
  prendre: () => void
  repondre: (ok: boolean) => void
}

/**
 * Écran d'information affiché une seule fois par appareil, juste avant la première demande d'accès au micro
 * du navigateur. Écoute l'événement `nopalou:voice-consent` émis par `demanderPermissionMicrophone`.
 * Le choix est mémorisé en local uniquement (aucun envoi au serveur).
 */
export default function VoiceConsentHost() {
  const [demande, setDemande] = useState<DemandeConsentement | null>(null)
  const boutonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onDemande = (e: Event) => {
      const detail = (e as CustomEvent<DemandeConsentement>).detail
      if (!detail) return
      detail.prendre()
      setDemande(detail)
    }
    window.addEventListener('nopalou:voice-consent', onDemande)
    return () => window.removeEventListener('nopalou:voice-consent', onDemande)
  }, [])

  useEffect(() => {
    if (demande) boutonRef.current?.focus()
  }, [demande])

  if (!demande) return null

  const repondre = (ok: boolean) => {
    demande.repondre(ok)
    setDemande(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-consent-titre"
      onKeyDown={(e) => { if (e.key === 'Escape') repondre(false) }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(28, 43, 74, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--bg, #F8F5F0)',
          border: '1.5px solid var(--border, #E8DDD2)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 420,
          padding: '22px 20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Mic size={18} />
          </span>
          <h2 id="voice-consent-titre" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Parler au lieu d&apos;écrire
          </h2>
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55, color: 'var(--navy, #1C2B4A)' }}>
          <li>Votre micro n&apos;est utilisé que pendant que vous appuyez sur le bouton micro et que vous parlez.</li>
          <li>Nopalou n&apos;enregistre pas votre voix : la reconnaissance est faite par votre navigateur, et seul le texte compris est utilisé.</li>
          <li>Parlez en français ; les mots wolof courants (téemeer, junni…) sont compris pour les montants.</li>
          <li>Vérifiez toujours le résultat avant de valider.</li>
        </ul>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', opacity: 0.8 }}>
          Votre navigateur va ensuite vous demander d&apos;autoriser le micro : choisissez « Autoriser ».
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            ref={boutonRef}
            type="button"
            className="btn-npl"
            onClick={() => repondre(true)}
            style={{
              flex: '1 1 160px',
              background: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Continuer
          </button>
          <button
            type="button"
            onClick={() => repondre(false)}
            style={{
              flex: '1 1 120px',
              background: 'transparent',
              color: 'var(--navy, #1C2B4A)',
              border: '1.5px solid var(--border, #E8DDD2)',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
