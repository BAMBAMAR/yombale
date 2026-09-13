'use client'

import React, { useState } from 'react'
import { Eye, Smartphone, Monitor, Sliders, RefreshCw, Check } from 'lucide-react'
import type { BoutiqueCustomizationData } from './types'
import StudioPhoneFrame from './StudioPhoneFrame'

interface StudioMockupPreviewProps {
  boutique: BoutiqueCustomizationData
  couleurTheme: string
  contrastBtnText: string
  currentRadius: string
  activeCover: string
  activeLogo: string | null
  slogan: string
  bandeauPromo: string
  bandeauPromoActif: boolean
  activeScreenTab: 'editeur' | 'apercu'
  setActiveScreenTab: (tab: 'editeur' | 'apercu') => void
  isSaving: boolean
  onEnregistrer: () => void
}

export default function StudioMockupPreview({
  boutique,
  couleurTheme,
  contrastBtnText,
  currentRadius,
  activeCover,
  activeLogo,
  slogan,
  bandeauPromo,
  bandeauPromoActif,
  activeScreenTab,
  setActiveScreenTab,
  isSaving,
  onEnregistrer,
}: StudioMockupPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')

  return (
    <>
      <div
        className={`studio-preview-col ${activeScreenTab === 'editeur' ? 'studio-preview-hidden-mobile' : ''}`}
        style={{
          position: 'sticky',
          top: 80,
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Barre d'outils du Mockup */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '8px 14px',
            border: '1.5px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Eye size={15} style={{ color: couleurTheme }} />
            <span>Aperçu en direct pour vos clients</span>
          </span>

          {/* Toggle Mobile / Desktop */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 2 }}>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: 'none',
                background: previewMode === 'mobile' ? '#ffffff' : 'transparent',
                color: previewMode === 'mobile' ? '#0F172A' : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <Smartphone size={13} />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: 'none',
                background: previewMode === 'desktop' ? '#ffffff' : 'transparent',
                color: previewMode === 'desktop' ? '#0F172A' : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <Monitor size={13} />
              <span>PC</span>
            </button>
          </div>
        </div>

        {/* Châssis de prévisualisation */}
        <StudioPhoneFrame
          previewMode={previewMode}
          boutique={boutique}
          couleurTheme={couleurTheme}
          contrastBtnText={contrastBtnText}
          currentRadius={currentRadius}
          activeCover={activeCover}
          activeLogo={activeLogo}
          slogan={slogan}
          bandeauPromo={bandeauPromo}
          bandeauPromoActif={bandeauPromoActif}
        />
      </div>

      {/* Barre mobile sticky bottom */}
      <div className="studio-mobile-bottom-bar">
        <button
          type="button"
          onClick={() => setActiveScreenTab(activeScreenTab === 'editeur' ? 'apercu' : 'editeur')}
          style={{
            flex: '0 0 auto',
            padding: '9px 14px',
            borderRadius: 10,
            border: '1.5px solid #CBD5E1',
            background: '#F8FAFC',
            color: '#1E293B',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {activeScreenTab === 'editeur' ? (
            <>
              <Eye size={15} style={{ color: couleurTheme }} />
              <span>Aperçu direct</span>
            </>
          ) : (
            <>
              <Sliders size={15} style={{ color: couleurTheme }} />
              <span>Modifier</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onEnregistrer}
          disabled={isSaving}
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            padding: '10px 16px',
            borderRadius: 10,
            background: couleurTheme,
            color: contrastBtnText,
            border: 'none',
            fontSize: 13,
            fontWeight: 850,
            cursor: isSaving ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            opacity: isSaving ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
          <span>{isSaving ? 'Enregistrement…' : 'Publier modifications'}</span>
        </button>
      </div>
    </>
  )
}
