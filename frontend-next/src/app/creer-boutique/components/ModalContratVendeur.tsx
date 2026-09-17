'use client'

import React from 'react'
import { X, FileText, Check } from 'lucide-react'

interface ModalContratVendeurProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  contratTexte: string
}

export default function ModalContratVendeur({
  isOpen,
  onClose,
  onAccept,
  contratTexte,
}: ModalContratVendeurProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          maxWidth: 680,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: '#FFF3E8',
                color: 'var(--accent, #C75B00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                Contrat &amp; Charte Vendeur Nopalou
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                Conditions Générales d&apos;Utilisation Marchand
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'background 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: 24,
            overflowY: 'auto',
            flex: 1,
            whiteSpace: 'pre-line',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#334155',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {contratTexte || 'Chargement des conditions générales de vente et de la charte marchand...'}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ffffff',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              padding: '10px 20px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onAccept}
            style={{
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: 12,
              fontWeight: 900,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Check size={16} />
            J&apos;accepte le contrat
          </button>
        </div>
      </div>
    </div>
  )
}
