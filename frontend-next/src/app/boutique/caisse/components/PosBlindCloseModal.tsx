'use client'

import React, { useState } from 'react'
import { fcfa } from '@/lib/format'

interface PosBlindCloseModalProps {
  sessionId: string
  caissierNom: string
  onClose: () => void
  onValiderCloture: (especesComptees: number, detailBillets: Record<string, number>) => Promise<void>
}

export default function PosBlindCloseModal({
  sessionId,
  caissierNom,
  onClose,
  onValiderCloture,
}: PosBlindCloseModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [modeSaisie, setModeSaisie] = useState<'decompte' | 'direct'>('decompte')
  const [montantDirect, setMontantDirect] = useState('')

  // Coupures officielles BCEAO
  const [quantites, setQuantites] = useState<Record<string, number>>({
    '10000': 0,
    '5000': 0,
    '2000': 0,
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '25': 0,
  })

  const COUPURES_BILLETS = [
    { valeur: 10000, label: '10 000 FCFA', icone: '💵' },
    { valeur: 5000, label: '5 000 FCFA', icone: '💵' },
    { valeur: 2000, label: '2 000 FCFA', icone: '💵' },
    { valeur: 1000, label: '1 000 FCFA', icone: '💵' },
    { valeur: 500, label: '500 FCFA', icone: '💵' },
  ]

  const COUPURES_PIECES = [
    { valeur: 500, label: '500 FCFA (Pièce)', icone: '🪙' },
    { valeur: 200, label: '200 FCFA', icone: '🪙' },
    { valeur: 100, label: '100 FCFA', icone: '🪙' },
    { valeur: 50, label: '50 FCFA', icone: '🪙' },
    { valeur: 25, label: '25 FCFA', icone: '🪙' },
  ]

  const totalCalcule = modeSaisie === 'decompte'
    ? Object.entries(quantites).reduce((sum, [val, qte]) => sum + (Number(val) * qte), 0)
    : (Number(montantDirect) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onValiderCloture(totalCalcule, quantites)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 580,
          maxHeight: '92vh',
          overflowY: 'auto',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔒</span> Clôture Z — Comptage des Espèces
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Session #{sessionId} • Caissier : <strong>{caissierNom}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: 32, height: 32, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Note standard bancaire anti-fraude */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🛡️</span>
          <span>Comptage à l’aveugle : comptez le liquide réellement présent dans votre tiroir-caisse sans influence.</span>
        </div>

        {/* Mode de saisie : Décompte par billet vs Total direct */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10, gap: 4 }}>
          <button
            type="button"
            onClick={() => setModeSaisie('decompte')}
            style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
              background: modeSaisie === 'decompte' ? '#ffffff' : 'transparent',
              color: modeSaisie === 'decompte' ? '#0f172a' : '#64748b',
              fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
              boxShadow: modeSaisie === 'decompte' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            💵 Décompte par Billets & Pièces
          </button>
          <button
            type="button"
            onClick={() => setModeSaisie('direct')}
            style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
              background: modeSaisie === 'direct' ? '#ffffff' : 'transparent',
              color: modeSaisie === 'direct' ? '#0f172a' : '#64748b',
              fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
              boxShadow: modeSaisie === 'direct' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            ✍️ Saisie Montant Global
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modeSaisie === 'decompte' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Billets */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Billets de banque
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {COUPURES_BILLETS.map((c) => (
                    <div key={c.valeur} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{c.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>×</span>
                        <input
                          type="number"
                          min={0}
                          value={quantites[String(c.valeur)] || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0)
                            setQuantites((prev) => ({ ...prev, [String(c.valeur)]: val }))
                          }}
                          style={{ width: 55, padding: '6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pièces */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Pièces de monnaie
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {COUPURES_PIECES.map((c) => (
                    <div key={c.valeur} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{c.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>×</span>
                        <input
                          type="number"
                          min={0}
                          value={quantites[String(c.valeur)] || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0)
                            setQuantites((prev) => ({ ...prev, [String(c.valeur)]: val }))
                          }}
                          style={{ width: 55, padding: '6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                Montant total des espèces comptées dans le tiroir (FCFA)
              </label>
              <input
                type="number"
                min={0}
                required
                placeholder="Ex: 85000"
                value={montantDirect}
                onChange={(e) => setMontantDirect(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '2px solid #cbd5e1', fontSize: 18, fontWeight: 900, textAlign: 'center', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* Total Compté en Grand Format */}
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                TOTAL ESPÈCES COMPTÉES
              </span>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1e3a5f' }}>
                {fcfa(totalCalcule)}
              </p>
            </div>
            <span style={{ fontSize: 28 }}>💰</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ flex: 1.5, padding: '12px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Clôture en cours...' : '🔒 Clôturer la Session (Rapport Z)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
