'use client';

// frontend-next/src/app/surga/components/SurgaShareButton.tsx
// Bouton de partage polyvalent pour les contenus de Surga (brèves, sport, calculs)
// Web Share API, repli WhatsApp direct, copie presse-papier, zéro émoji

import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { executerPartage, copierDansPressePapier, type PartagePayload } from '@/lib/surga-share';

interface SurgaShareButtonProps {
  payload: PartagePayload;
  taille?: 'sm' | 'md';
  libelle?: string;
  sansCopier?: boolean;
  styleCustom?: React.CSSProperties;
}

export default function SurgaShareButton({
  payload,
  taille = 'sm',
  libelle,
  sansCopier = false,
  styleCustom,
}: SurgaShareButtonProps) {
  const [copieEffectuee, setCopieEffectuee] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const handlePartager = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnCours(true);

    try {
      const res = await executerPartage(payload);
      if (res === 'COPIE') {
        setCopieEffectuee(true);
        setTimeout(() => setCopieEffectuee(false), 2000);
      }
    } finally {
      setEnCours(false);
    }
  };

  const handleCopierDirect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copierDansPressePapier(payload.texte);
    if (ok) {
      setCopieEffectuee(true);
      setTimeout(() => setCopieEffectuee(false), 2000);
    }
  };

  const iconSize = taille === 'sm' ? 14 : 16;
  const padding = taille === 'sm' ? '4px 8px' : '6px 12px';
  const fontSize = taille === 'sm' ? '12px' : '13px';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', ...styleCustom }}>
      <button
        type="button"
        onClick={handlePartager}
        disabled={enCours}
        aria-label="Partager ce contenu"
        title="Partager vers WhatsApp ou d'autres applications"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: libelle ? '6px' : 0,
          width: libelle ? 'auto' : 32,
          height: 32,
          padding: libelle ? padding : 0,
          fontSize,
          fontWeight: 600,
          color: 'var(--surga-primary, #0F172A)',
          backgroundColor: 'var(--surga-surface, #FFFFFF)',
          border: '1px solid var(--surga-border, #E2E8F0)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Share2 size={iconSize} color="var(--surga-accent, #D97706)" />
        {libelle && <span>{libelle}</span>}
      </button>

      {!sansCopier && (
        <button
          type="button"
          onClick={handleCopierDirect}
          aria-label="Copier le texte"
          title="Copier le message dans le presse-papier"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            padding: 0,
            fontSize,
            color: copieEffectuee ? 'var(--surga-emerald, #059669)' : 'var(--surga-text3, #94A3B8)',
            backgroundColor: copieEffectuee ? 'rgba(5, 150, 105, 0.1)' : 'var(--surga-surface, #FFFFFF)',
            border: '1px solid var(--surga-border, #E2E8F0)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {copieEffectuee ? <Check size={iconSize} /> : <Copy size={iconSize} />}
        </button>
      )}
    </div>
  );
}
