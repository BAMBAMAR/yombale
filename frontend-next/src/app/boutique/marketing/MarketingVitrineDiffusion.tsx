'use client'

import React from 'react'
import { Check, Copy, Download, Share2, Bot } from 'lucide-react'
import ExternalImg from '@/components/ExternalImg'
import BoutonPartager from '@/components/BoutonPartager'
import type { Boutique } from '../boutiqueTypes'

interface MarketingVitrineDiffusionProps {
  boutique: Boutique
  lienBoutique: string
  lienAssistant: string
  copiedKey: string | null
  copyToClipboard: (text: string, key: string) => void
}

export default function MarketingVitrineDiffusion({
  boutique,
  lienBoutique,
  lienAssistant,
  copiedKey,
  copyToClipboard,
}: MarketingVitrineDiffusionProps) {
  return (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Share2 size={20} style={{ color: '#0f172a' }} />
        <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#0f172a' }}>
          1. Liens de la Vitrine &amp; Partage 1-Clic
        </h3>
      </div>

      <div className="mkt-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* Carte Vitrine Marchand */}
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                overflow: 'hidden',
                flexShrink: 0,
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {boutique.logo_url ? (
                <ExternalImg src={boutique.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 18, fontWeight: 800, color: '#64748b' }}>
                  {boutique.nom.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{boutique.nom}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lienBoutique}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <BoutonPartager
              lien={lienBoutique}
              message={`Découvrez notre vitrine officielle ${boutique.nom} !\n\n${lienBoutique}`}
              lienVisuel={`/assets/boutique/${boutique.id}/story`}
            />
            <button
              type="button"
              onClick={() => copyToClipboard(lienBoutique, 'lien_boutique')}
              style={{
                padding: '7px 12px',
                background: copiedKey === 'lien_boutique' ? '#10b981' : '#ffffff',
                color: copiedKey === 'lien_boutique' ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              {copiedKey === 'lien_boutique' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === 'lien_boutique' ? 'Copié !' : 'Copier lien'}</span>
            </button>
            <a
              href={`/assets/boutique/${boutique.id}/story`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '7px 12px',
                background: '#f1f5f9',
                color: '#0f172a',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Download size={14} style={{ color: '#0284c7' }} />
              <span>Story HD (1080×1920)</span>
            </a>
          </div>
        </div>

        {/* Carte Assistant WhatsApp Bot */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#16a34a',
              }}
            >
              <Bot size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#166534' }}>
                Assistant WhatsApp Catalogue 24/7
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#15803d' }}>
                Vos clients consultent vos articles et commandent directement dans WhatsApp.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <BoutonPartager
              lien={lienAssistant}
              message={`Découvrez le catalogue de ${boutique.nom} et commandez directement sur WhatsApp !\n\n${lienAssistant}`}
              lienVisuel={`/assets/boutique/${boutique.id}/story`}
            />
            <button
              type="button"
              onClick={() => copyToClipboard(lienAssistant, 'lien_assistant')}
              style={{
                padding: '7px 12px',
                background: copiedKey === 'lien_assistant' ? '#10b981' : '#ffffff',
                color: copiedKey === 'lien_assistant' ? '#ffffff' : '#166534',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              {copiedKey === 'lien_assistant' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === 'lien_assistant' ? 'Copié !' : 'Copier lien'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
