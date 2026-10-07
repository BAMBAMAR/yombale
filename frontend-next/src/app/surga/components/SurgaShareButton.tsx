'use client'

// frontend-next/src/app/surga/components/SurgaShareButton.tsx
// Bouton de partage unique et épuré pour Surga (SRG-UI-23)
// Un seul bouton par titre ; propose le partage natif ou la copie du lien avec retour visuel immédiat

import React, { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { executerPartage, copierDansPressePapier, type PartagePayload } from '@/lib/surga-share'

interface SurgaShareButtonProps {
  payload: PartagePayload
  taille?: 'sm' | 'md'
  libelle?: string
  styleCustom?: React.CSSProperties
  className?: string
}

export default function SurgaShareButton({
  payload,
  taille = 'sm',
  libelle,
  styleCustom,
  className = '',
}: SurgaShareButtonProps) {
  const [copieEffectuee, setCopieEffectuee] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setEnCours(true)

    try {
      const res = await executerPartage(payload)
      if (res === 'COPIE' || res === 'ANNULE') {
        // Si Web Share API n'est pas dispo ou a été dégradé, copier le lien
        if (payload.texte) {
          await copierDansPressePapier(payload.texte)
        }
        setCopieEffectuee(true)
        setTimeout(() => setCopieEffectuee(false), 2000)
      }
    } catch {
      if (payload.texte) {
        await copierDansPressePapier(payload.texte)
        setCopieEffectuee(true)
        setTimeout(() => setCopieEffectuee(false), 2000)
      }
    } finally {
      setEnCours(false)
    }
  }

  const iconSize = taille === 'sm' ? 13 : 15
  const padding = taille === 'sm' ? '3px 8px' : '5px 12px'
  const fontSize = taille === 'sm' ? 11.5 : 13

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', ...styleCustom }}>
      <button
        type="button"
        onClick={handleAction}
        disabled={enCours}
        aria-label={copieEffectuee ? 'Lien copié dans le presse-papier' : 'Partager ou copier le lien'}
        title={copieEffectuee ? 'Copié dans le presse-papier !' : 'Partager (WhatsApp, copier le lien)'}
        className={`surga-share-btn ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: libelle || copieEffectuee ? 5 : 0,
          width: libelle || copieEffectuee ? 'auto' : 28,
          height: 28,
          padding: libelle || copieEffectuee ? padding : 0,
          fontSize,
          fontWeight: 600,
          color: copieEffectuee ? 'var(--surga-emerald, #059669)' : 'var(--surga-primary, #0F172A)',
          backgroundColor: copieEffectuee ? 'rgba(5, 150, 105, 0.08)' : 'var(--surga-surface, #FFFFFF)',
          border: '1px solid',
          borderColor: copieEffectuee ? 'rgba(5, 150, 105, 0.3)' : 'var(--surga-border, #E2E8F0)',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {copieEffectuee ? (
          <>
            <Check size={iconSize} color="var(--surga-emerald, #059669)" />
            <span>Copié</span>
          </>
        ) : (
          <>
            <Share2 size={iconSize} color="var(--surga-accent, #D97706)" />
            {libelle && <span>{libelle}</span>}
          </>
        )}
      </button>
    </div>
  )
}
