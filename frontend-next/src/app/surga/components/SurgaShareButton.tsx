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
  styleCustom?: React.CSSProperties;
}

export default function SurgaShareButton({
  payload,
  taille = 'sm',
  libelle,
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
          gap: '6px',
          padding,
          fontSize,
          fontWeight: 600,
          color: 'var(--navy, #1C2B4A)',
          backgroundColor: 'rgba(28, 43, 74, 0.06)',
          border: '1px solid rgba(28, 43, 74, 0.12)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <Share2 size={iconSize} color="var(--accent, #C75B00)" />
        {libelle && <span>{libelle}</span>}
      </button>

      <button
        type="button"
        onClick={handleCopierDirect}
        aria-label="Copier le texte"
        title="Copier le message dans le presse-papier"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: taille === 'sm' ? '4px 6px' : '6px 8px',
          fontSize,
          color: copieEffectuee ? 'var(--price, #0A5C36)' : '#8A94A6',
          backgroundColor: copieEffectuee ? 'rgba(10, 92, 54, 0.1)' : 'transparent',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {copieEffectuee ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      </button>
    </div>
  );
}
