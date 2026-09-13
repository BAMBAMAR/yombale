'use client'

import React from 'react'
import { Tag, Sparkles } from 'lucide-react'

interface StudioMarketingTextsProps {
  couleurTheme: string
  slogan: string
  setSlogan: (slogan: string) => void
  bandeauPromo: string
  setBandeauPromo: (promo: string) => void
  bandeauPromoActif: boolean
  setBandeauPromoActif: (actif: boolean) => void
  messageAccueil: string
  setMessageAccueil: (msg: string) => void
}

export default function StudioMarketingTexts({
  couleurTheme,
  slogan,
  setSlogan,
  bandeauPromo,
  setBandeauPromo,
  bandeauPromoActif,
  setBandeauPromoActif,
  messageAccueil,
  setMessageAccueil,
}: StudioMarketingTextsProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', border: '1.5px solid #E2E8F0' }}>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 850,
          color: '#0F172A',
          margin: '0 0 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Tag size={16} style={{ color: couleurTheme }} />
        <span>4. Slogan &amp; Annonces Commerciales</span>
      </h2>
      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
        Communiquez immédiatement vos points forts et vos offres promotionnelles.
      </p>

      {/* Champ Slogan */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 750, color: '#1E293B', marginBottom: 5 }}>
          Slogan de la boutique
        </label>
        <input
          type="text"
          value={slogan}
          onChange={(e) => setSlogan(e.target.value)}
          maxLength={120}
          placeholder="Ex: L'élégance et le raffinement au cœur de Dakar"
          style={{
            width: '100%',
            height: 40,
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            padding: '0 12px',
            fontSize: 13,
            outline: 'none',
            background: '#F8FAFC',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94A3B8' }}>
          Affiché sous le nom de votre boutique pour résumer votre promesse client.
        </p>
      </div>

      {/* Bandeau Promotionnel */}
      <div
        style={{
          background: '#FFF7ED',
          border: '1.5px solid #FED7AA',
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: '#9A3412',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={14} style={{ color: '#EA580C' }} />
            <span>Bandeau d&apos;Annonce Promotionnel</span>
          </span>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              color: '#9A3412',
            }}
          >
            <input
              type="checkbox"
              checked={bandeauPromoActif}
              onChange={(e) => setBandeauPromoActif(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#EA580C', cursor: 'pointer' }}
            />
            <span>{bandeauPromoActif ? 'Actif sur la boutique' : 'Désactivé'}</span>
          </label>
        </div>

        <input
          type="text"
          value={bandeauPromo}
          onChange={(e) => setBandeauPromo(e.target.value)}
          disabled={!bandeauPromoActif}
          placeholder="Ex: PROMO SPÉCIALE : -20% sur toute la collection jusqu'à dimanche !"
          style={{
            width: '100%',
            height: 38,
            borderRadius: 8,
            border: '1px solid #FDBA74',
            padding: '0 10px',
            fontSize: 12.5,
            outline: 'none',
            background: bandeauPromoActif ? '#ffffff' : '#f3f4f6',
            color: '#9A3412',
            fontWeight: 600,
            opacity: bandeauPromoActif ? 1 : 0.6,
            boxSizing: 'border-box',
          }}
        />
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#C2410C' }}>
          Bandeau défilant visible en tête de vitrine pour déclencher des achats impulsifs.
        </p>
      </div>

      {/* Message d'accueil / Pitch */}
      <div>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 750, color: '#1E293B', marginBottom: 5 }}>
          Message ou note de bienvenue (optionnel)
        </label>
        <textarea
          value={messageAccueil}
          onChange={(e) => setMessageAccueil(e.target.value)}
          rows={2}
          placeholder="Ex: Bienvenue chez nous ! Livraison express à Dakar et dans toutes les régions sous 24h."
          style={{
            width: '100%',
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            padding: '8px 12px',
            fontSize: 12.5,
            outline: 'none',
            background: '#F8FAFC',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
