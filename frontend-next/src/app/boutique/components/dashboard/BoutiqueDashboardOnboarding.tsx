'use client'

import React from 'react'
import type { ManageTab } from '../../types'
import { Sparkles, Check, ChevronUp, ChevronDown, X, Package, Store, Share2, ShoppingCart } from 'lucide-react'

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
        borderRadius: 16,
        padding: '14px 18px',
        boxShadow: '0 2px 10px rgba(199,91,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 220 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: '#FFEDD5',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
                {pctReady === 100 ? 'Boutique 100% prête à vendre !' : `Activation boutique : ${pctReady}%`}
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
                  gap: 3,
                  padding: 0,
                }}
              >
                {onboardingOpen ? (
                  <>
                    Masquer <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    Voir les étapes <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748B' }}>
              Complétez ces 4 étapes rapides pour accélérer vos premières ventes à Dakar et sur WhatsApp.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          }}
          title="Ne plus afficher"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Barre de progression fluide */}
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: '#E2E8F0',
          overflow: 'hidden',
          marginBottom: onboardingOpen ? 14 : 0,
        }}
      >
        <div
          style={{
            width: `${Math.max(5, pctReady)}%`,
            height: '100%',
            background: pctReady >= 80 ? 'linear-gradient(90deg, #10B981, #0A5C36)' : 'linear-gradient(90deg, #FF6600, #C75B00)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {onboardingOpen && (
        <div
          style={{
            paddingTop: 12,
            borderTop: '1px solid #FED7AA',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          {/* Étape 1 : Produits */}
          <div
            style={{
              background: '#FFFFFF',
              border: hasProducts ? '1.5px solid #BBF7D0' : '1.5px solid #FED7AA',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                <Package size={14} color="var(--accent, #C75B00)" />
                1. Produits
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: hasProducts ? '#16A34A' : '#C75B00', display: 'flex', alignItems: 'center', gap: 3 }}>
                {hasProducts ? <><Check size={12} strokeWidth={3} /> Prêt</> : 'À ajouter'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('produits')}
              className="btn-npl btn-npl-primary btn-npl-sm"
              style={{ width: '100%', height: 30, fontSize: 11.5 }}
            >
              {hasProducts ? 'Gérer catalogue' : 'Ajouter un produit'}
            </button>
          </div>

          {/* Étape 2 : Profil */}
          <div
            style={{
              background: '#FFFFFF',
              border: hasLogoOrCover || hasDesc ? '1.5px solid #BBF7D0' : '1.5px solid #E2E8F0',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                <Store size={14} color="var(--navy, #1C2B4A)" />
                2. Identité
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: hasLogoOrCover || hasDesc ? '#16A34A' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {hasLogoOrCover || hasDesc ? <><Check size={12} strokeWidth={3} /> Rempli</> : 'Optionnel'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('infos')}
              className="btn-npl btn-npl-secondary btn-npl-sm"
              style={{ width: '100%', height: 30, fontSize: 11.5 }}
            >
              Modifier profil
            </button>
          </div>

          {/* Étape 3 : Partage WhatsApp */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                <Share2 size={14} color="#16A34A" />
                3. Statut WhatsApp
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A' }}>1-Clic</span>
            </div>
            <button
              type="button"
              onClick={() => (onOpenQrModal ? onOpenQrModal() : onNavigate('marketing'))}
              className="btn-npl btn-npl-secondary btn-npl-sm"
              style={{
                width: '100%',
                height: 30,
                fontSize: 11.5,
                borderColor: '#FED7AA',
                color: '#C75B00',
                background: '#FFF7ED',
              }}
            >
              Partager vitrine
            </button>
          </div>

          {/* Étape 4 : Caisse POS */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                <ShoppingCart size={14} color="var(--price, #0A5C36)" />
                4. Caisse POS
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>Test Vente</span>
            </div>
            <button
              type="button"
              onClick={() => (window.location.href = '/boutique/caisse')}
              className="btn-npl btn-npl-secondary btn-npl-sm"
              style={{
                width: '100%',
                height: 30,
                fontSize: 11.5,
                borderColor: '#BBF7D0',
                color: '#166534',
                background: '#F0FDF4',
              }}
            >
              Ouvrir la caisse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
