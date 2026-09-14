'use client'

import React from 'react'
import { Sparkles, MessageCircle, Check, Copy } from 'lucide-react'

export interface ModeleCampagne {
  id: string
  titre: string
  desc: string
  message: string
}

interface MarketingCampagnesListProps {
  modelesCampagnes: ModeleCampagne[]
  handleSendWhatsApp: (text: string) => void
  copyToClipboard: (text: string, key: string) => void
  copiedKey: string | null
}

export default function MarketingCampagnesList({
  modelesCampagnes,
  handleSendWhatsApp,
  copyToClipboard,
  copiedKey,
}: MarketingCampagnesListProps) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Sparkles size={20} style={{ color: '#C75B00' }} />
        <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#0f172a' }}>
          2. Messages Prêts à l&apos;Emploi (Générateur 1-Clic)
        </h3>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
        Gagnez du temps : choisissez un modèle déjà rédigé au nom de votre boutique et envoyez-le directement sur WhatsApp ou vos statuts.
      </p>

      <div className="mkt-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {modelesCampagnes.map((campagne) => (
          <div
            key={campagne.id}
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  {campagne.titre}
                </h4>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#64748b' }}>
                {campagne.desc}
              </p>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: '#334155',
                  maxHeight: 110,
                  overflowY: 'auto',
                  whiteSpace: 'pre-line',
                  fontFamily: 'inherit',
                }}
              >
                {campagne.message}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleSendWhatsApp(campagne.message)}
                style={{
                  flex: 1,
                  minWidth: 140,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#25D366',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MessageCircle size={15} />
                <span>Envoyer (WhatsApp)</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(campagne.message, campagne.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: copiedKey === campagne.id ? '#10b981' : '#ffffff',
                  color: copiedKey === campagne.id ? '#ffffff' : '#334155',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                {copiedKey === campagne.id ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedKey === campagne.id ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
