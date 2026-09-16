'use client';

import React from 'react';
import { Type, Bell, MessageCircle } from 'lucide-react';

interface StudioAgenceMarketingTextsProps {
  slogan: string;
  onChangeSlogan: (val: string) => void;
  bandeauAnnonce: string;
  onChangeBandeauAnnonce: (val: string) => void;
  bandeauAnnonceActif: boolean;
  onChangeBandeauAnnonceActif: (val: boolean) => void;
  messageAccueilWa: string;
  onChangeMessageAccueilWa: (val: string) => void;
}

export default function StudioAgenceMarketingTexts({
  slogan,
  onChangeSlogan,
  bandeauAnnonce,
  onChangeBandeauAnnonce,
  bandeauAnnonceActif,
  onChangeBandeauAnnonceActif,
  messageAccueilWa,
  onChangeMessageAccueilWa,
}: StudioAgenceMarketingTextsProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid var(--border, #E8DDD2)',
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Type size={18} style={{ color: 'var(--accent, #C75B00)' }} />
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Accroches & Textes Marketing
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
            Définissez les messages phares affichés aux acheteurs et locataires sur votre vitrine.
          </p>
        </div>
      </div>

      {/* Slogan officiel */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
          Slogan de l'agence
        </label>
        <input
          type="text"
          placeholder="Ex: Votre adresse de prestige pour l'immobilier d'exception à Dakar"
          value={slogan}
          onChange={(e) => onChangeSlogan(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <span style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4, display: 'block' }}>
          Affiché en sous-titre de l'en-tête de votre vitrine.
        </span>
      </div>

      {/* Bandeau d'Annonce Vitrine */}
      <div
        style={{
          background: '#FAF8F5',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 10,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={15} style={{ color: 'var(--accent, #C75B00)' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Bandeau d'alerte / Portes ouvertes
            </span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={bandeauAnnonceActif}
              onChange={(e) => onChangeBandeauAnnonceActif(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent, #C75B00)' }}
            />
            <span>{bandeauAnnonceActif ? 'Bandeau Actif' : 'Désactivé'}</span>
          </label>
        </div>

        <input
          type="text"
          placeholder="Ex: Portes ouvertes ce samedi aux Almadies — Réservez votre créneau privé !"
          value={bandeauAnnonce}
          disabled={!bandeauAnnonceActif}
          onChange={(e) => onChangeBandeauAnnonce(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 12.5,
            outline: 'none',
            background: bandeauAnnonceActif ? '#FFFFFF' : '#F1F5F9',
            color: bandeauAnnonceActif ? 'var(--navy, #1C2B4A)' : '#94A3B8',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Message d'accueil WhatsApp */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <MessageCircle size={15} style={{ color: '#16A34A' }} />
          <label style={{ fontSize: 13, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
            Message d'accueil WhatsApp par défaut
          </label>
        </div>
        <textarea
          rows={2}
          placeholder="Ex: Bonjour, je visite la vitrine Nopalou de votre agence et souhaite me renseigner sur vos opportunités disponibles."
          value={messageAccueilWa}
          onChange={(e) => onChangeMessageAccueilWa(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 12.5,
            outline: 'none',
            resize: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}
