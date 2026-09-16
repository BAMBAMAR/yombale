'use client'

import React from 'react'
import { Sparkles, X, Check } from 'lucide-react'

export interface MatchedBien {
  id: string
  titre: string
  type_bien: string
  ville: string
  quartier?: string
  prix_location?: number
  prix_vente?: number
  score_matching: number
  raisons: string[]
}

interface ModalMatchingProspectProps {
  prospectNom: string
  matchedBiens: MatchedBien[]
  loading: boolean
  isOpen: boolean
  onClose: () => void
}

export function ModalMatchingProspect({
  prospectNom,
  matchedBiens,
  loading,
  isOpen,
  onClose,
}: ModalMatchingProspectProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.55)',
        backdropFilter: 'blur(4px)',
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
          borderRadius: 14,
          maxWidth: 600,
          width: '100%',
          padding: 24,
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="var(--accent, #C75B00)" />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Biens Matchés pour {prospectNom}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>Calcul du matching en temps réel...</p>
        ) : matchedBiens.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>
            Aucun bien du portefeuille ne correspond actuellement aux critères.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {matchedBiens.map(b => (
              <div
                key={b.id}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid var(--border, #E8DDD2)',
                  background: '#FAF8F5',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>{b.titre}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      {b.type_bien} • {b.quartier ? `${b.quartier}, ${b.ville}` : b.ville}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 12,
                      background: '#DCFCE7',
                      color: '#166534',
                    }}
                  >
                    {b.score_matching}% Match
                  </span>
                </div>

                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {b.raisons.map((r, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 6px',
                        background: '#FFFFFF',
                        borderRadius: 4,
                        border: '1px solid #E2E8F0',
                        color: '#475569',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Check size={10} color="#166534" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
