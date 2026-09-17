'use client'

import React from 'react'
import { X } from 'lucide-react'
import BienForm, { BienFormData } from './BienForm'

interface ModalEditerBienProps {
  slug: string
  bien: BienFormData & { id: string }
  onClose: () => void
  onSuccess: (updated: any) => void
}

export default function ModalEditerBien({ slug, bien, onClose, onSuccess }: ModalEditerBienProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          maxWidth: 820,
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(28, 43, 74, 0.35)',
          border: '1px solid var(--border, #E8DDD2)',
          overflow: 'hidden',
        }}
      >
        {/* ── En-tête Fixe de la Modale ── */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FAF8F5',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Modifier le bien immobilier
            </h2>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
              Réf : {bien.reference || bien.id.slice(0, 8)} • Photos, vidéos et caractéristiques complètes
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Corps Défilant avec le Formulaire Complet (Photos, Vidéos, etc.) ── */}
        <div
          style={{
            overflowY: 'auto',
            padding: '20px 24px',
            flex: 1,
          }}
        >
          <BienForm
            slug={slug}
            initialBien={bien}
            onSuccess={onSuccess}
            onCancel={onClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  )
}
