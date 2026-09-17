'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { BailItem } from './TableBauxImmo'

interface ModalResilierBailProps {
  bail: BailItem | null
  motif: string
  onMotifChange: (m: string) => void
  loading: boolean
  errorMsg: string | null
  onClose: () => void
  onConfirm: (e: React.FormEvent) => void
}

export default function ModalResilierBail({
  bail,
  motif,
  onMotifChange,
  loading,
  errorMsg,
  onClose,
  onConfirm,
}: ModalResilierBailProps) {
  if (!bail) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div className="agence-card" style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', borderRadius: 12, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E11D48', marginBottom: 10 }}>
          <AlertTriangle size={22} />
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Résilier le contrat de bail</h3>
        </div>
        <p style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
          Confirmez la résiliation du bail pour <strong>{bail.bien_titre}</strong>. Le bien sera immédiatement remis en statut disponible.
        </p>

        <form onSubmit={onConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="Motif de résiliation..."
            value={motif}
            onChange={(e) => onMotifChange(e.target.value)}
            className="form-input"
          />

          {errorMsg && (
            <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: 6, fontSize: 12.5 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid var(--border, #E8DDD2)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                background: '#E11D48',
                color: '#fff',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Résiliation...' : 'Confirmer résiliation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
