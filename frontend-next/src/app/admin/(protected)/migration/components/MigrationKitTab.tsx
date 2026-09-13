import React from 'react'
import { QrCode, MessageCircle, CheckCircle2, Copy, ExternalLink, Printer } from 'lucide-react'
import { KitResult } from './types'

interface MigrationKitTabProps {
  kitResult: KitResult | null
  onGenerateKit: () => void
  onCopyWhatsApp: () => void
  copie: boolean
}

export default function MigrationKitTab({
  kitResult,
  onGenerateKit,
  onCopyWhatsApp,
  copie,
}: MigrationKitTabProps) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border, #e2e8f0)', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 8, background: '#f0fdf4', color: '#16a34a' }}>
          <QrCode size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
            Kit Vitrine &amp; Message d&apos;Accueil Marchand
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
            Générez le kit d&apos;onboarding complet pour la boutique sélectionnée : QR code vitrine prêt à imprimer et
            message WhatsApp officiel d&apos;accueil.
          </p>
        </div>
      </div>

      {kitResult ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Carte Message WhatsApp */}
          <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageCircle size={16} /> Message WhatsApp Prêt à Envoyer
              </span>
              <button
                type="button"
                onClick={onCopyWhatsApp}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {copie ? <CheckCircle2 size={14} color="#16a34a" /> : <Copy size={14} />}
                {copie ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <textarea
              readOnly
              value={kitResult.messageWhatsApp}
              rows={12}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                background: '#ffffff',
                color: '#1e293b',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Carte Flyer & QR Code Vitrine */}
          <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 12 }}>
              Vitrine &amp; QR Code Comptoir
            </span>

            <div
              style={{
                background: '#ffffff',
                padding: 20,
                borderRadius: 12,
                border: '2px dashed #cbd5e1',
                display: 'inline-block',
                marginBottom: 16,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(kitResult.storeUrl)}`}
                alt="QR Code Boutique"
                style={{ width: 160, height: 160, display: 'block', margin: '0 auto' }}
              />
              <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8, color: '#0f172a' }}>
                {kitResult.boutique?.nom}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Scannez pour commander en ligne</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              <a
                href={kitResult.storeUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#0284c7',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <ExternalLink size={14} /> Voir la Vitrine
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Printer size={14} /> Imprimer le Flyer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <button
            type="button"
            onClick={onGenerateKit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <QrCode size={18} /> Générer le Kit d&apos;Onboarding de cette boutique
          </button>
        </div>
      )}
    </div>
  )
}
