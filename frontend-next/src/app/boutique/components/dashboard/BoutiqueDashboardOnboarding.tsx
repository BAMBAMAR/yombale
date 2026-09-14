'use client'

import React from 'react'
import type { ManageTab } from '../../types'
import { Sparkles } from 'lucide-react'

interface BoutiqueDashboardOnboardingProps {
  pctReady: number
  hasProducts: boolean
  hasLogoOrCover: boolean
  hasDesc: boolean
  onboardingOpen: boolean
  setOnboardingOpen: (open: boolean) => void
  onDismiss: () => void
  onNavigate: (tab: ManageTab) => void
  onOpenQrModal?: () => void
}

export default function BoutiqueDashboardOnboarding({
  pctReady,
  hasProducts,
  hasLogoOrCover,
  hasDesc,
  onboardingOpen,
  setOnboardingOpen,
  onDismiss,
  onNavigate,
  onOpenQrModal,
}: BoutiqueDashboardOnboardingProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FFFDF9 0%, #FFF7ED 100%)',
        border: '1.5px solid #FED7AA',
        borderRadius: 14,
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(199,91,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 200 }}>
          <Sparkles size={18} style={{ color: 'var(--accent, #C75B00)' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {pctReady === 100 ? 'Boutique 100% prête à vendre !' : `Boutique prête à ${pctReady}%`}
          </span>
          <button
            type="button"
            onClick={() => setOnboardingOpen(!onboardingOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent, #C75B00)',
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: 0,
            }}
          >
            <span>{onboardingOpen ? 'Masquer détails ▴' : 'Voir les étapes ▾'}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: 14,
            cursor: 'pointer',
            padding: '2px 6px',
          }}
          title="Ne plus afficher"
        >
          ✕
        </button>
      </div>

      {onboardingOpen && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #FED7AA',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: hasProducts ? '1px solid #BBF7D0' : '1px solid #FED7AA',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>1. Produits</span>
              <span style={{ fontSize: 11, fontWeight: 750, color: hasProducts ? '#16A34A' : '#C75B00' }}>
                {hasProducts ? '✓ Prêt' : 'À ajouter'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('produits')}
              className="btn-npl btn-npl-primary btn-npl-sm"
              style={{ width: '100%', height: 28, fontSize: 11.5 }}
            >
              {hasProducts ? 'Gérer catalogue' : 'Ajouter un produit'}
            </button>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: hasLogoOrCover || hasDesc ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>2. Profil</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 750,
                  color: hasLogoOrCover || hasDesc ? '#16A34A' : '#64748B',
                }}
              >
                {hasLogoOrCover || hasDesc ? '✓ Rempli' : 'Optionnel'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('infos')}
              className="btn-npl btn-npl-secondary btn-npl-sm"
              style={{ width: '100%', height: 28, fontSize: 11.5 }}
            >
              Modifier profil
            </button>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>3. WhatsApp</span>
              <span style={{ fontSize: 11, fontWeight: 750, color: '#16A34A' }}>1-Clic</span>
            </div>
            <button
              type="button"
              onClick={() => (onOpenQrModal ? onOpenQrModal() : onNavigate('marketing'))}
              className="btn-npl btn-npl-secondary btn-npl-sm"
              style={{
                width: '100%',
                height: 28,
                fontSize: 11.5,
                borderColor: '#FED7AA',
                color: '#C75B00',
                background: '#FFF7ED',
              }}
            >
              Partager vitrine
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
