'use client'

import React from 'react'
import { Share2, QrCode, Flame, ExternalLink } from 'lucide-react'
import type { Boutique } from '../boutiqueTypes'
import type { ManageTab } from '../BoutiqueClient'

interface MarketingPixelsAndPhysicalProps {
  boutique: Boutique
  onNavigate?: (tab: ManageTab) => void
  onOpenQrModal?: () => void
  sponsoringEnCours: boolean
  handleActiverSponsoring: () => void
}

export default function MarketingPixelsAndPhysical({
  boutique,
  onNavigate,
  onOpenQrModal,
  sponsoringEnCours,
  handleActiverSponsoring,
}: MarketingPixelsAndPhysicalProps) {
  return (
    <>
      {/* ── SECTION 4 : RÉSEAUX SOCIAUX & PIXELS PUBLICITAIRES ── */}
      <div
        className="mkt-card"
        style={{
          background: '#ffffff',
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          padding: '22px 24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Share2 size={20} style={{ color: '#0f172a' }} />
            <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#0f172a' }}>
              4. Réseaux Sociaux &amp; Pixels Publicitaires
            </h3>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('fiscalite')}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              Configurer mes pixels &amp; réseaux
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {/* Pixel Meta Facebook */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#1e3a8a' }}>Meta Facebook Pixel</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: (boutique as any).meta_pixel_id ? '#16a34a' : '#94a3b8' }}>
              {(boutique as any).meta_pixel_id ? `✓ Actif (${(boutique as any).meta_pixel_id})` : 'Non configuré'}
            </p>
          </div>

          {/* Pixel TikTok */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#0f172a' }}>TikTok Pixel</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: (boutique as any).tiktok_pixel_id ? '#16a34a' : '#94a3b8' }}>
              {(boutique as any).tiktok_pixel_id ? `✓ Actif (${(boutique as any).tiktok_pixel_id})` : 'Non configuré'}
            </p>
          </div>

          {/* Page Facebook */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#1d4ed8' }}>Page Facebook</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: (boutique as any).facebook ? '#16a34a' : '#94a3b8' }}>
              {(boutique as any).facebook ? '✓ Connectée' : 'Non renseignée'}
            </p>
          </div>

          {/* Compte Instagram */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#e11d48' }}>Instagram</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: (boutique as any).instagram ? '#16a34a' : '#94a3b8' }}>
              {(boutique as any).instagram ? '✓ Connecté' : 'Non renseigné'}
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 5 : SUPPORTS PHYSIQUES & BOOSTER ── */}
      <div className="mkt-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* QR Code & Comptoir Physique */}
        <div
          className="mkt-card"
          style={{
            background: '#ffffff',
            borderRadius: 18,
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
            minWidth: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <QrCode size={20} style={{ color: '#1C2B4A' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                QR Code Comptoir &amp; Vitrine
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.45 }}>
              Imprimez un QR Code haute définition pour votre comptoir physique. Vos clients scannent et accèdent à votre vitrine ou demandent un crédit client.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenQrModal?.()}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#1C2B4A',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <QrCode size={16} />
            <span>Ouvrir &amp; Télécharger le QR Code</span>
          </button>
        </div>

        {/* Booster de Visibilité Sponsoring */}
        <div
          className="mkt-card"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            borderRadius: 18,
            border: '1.5px solid #fde68a',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
            minWidth: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Flame size={20} style={{ color: '#C75B00' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#92400e' }}>
                Booster de Visibilité (Sponsoring)
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#78350f', lineHeight: 1.45 }}>
              Placez votre boutique en tête de liste des recherches à Dakar et sur la page d&apos;accueil pour maximiser vos visites.
            </p>
          </div>

          <button
            type="button"
            disabled={sponsoringEnCours}
            onClick={handleActiverSponsoring}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#C75B00',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              cursor: sponsoringEnCours ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Flame size={16} />
            <span>{sponsoringEnCours ? 'Initialisation…' : 'Activer le Sponsoring Wave'}</span>
          </button>
        </div>
      </div>
    </>
  )
}
