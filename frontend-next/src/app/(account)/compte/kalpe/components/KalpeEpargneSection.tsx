'use client'

import React from 'react'
import { PiggyBank, Plus, CheckCircle2, Target } from 'lucide-react'
import type { KalpeObjectif } from '../types'

interface KalpeEpargneSectionProps {
  objectifs: KalpeObjectif[]
  loading: boolean
  onAddObjectif: () => void
  onVerserObjectif: (obj: KalpeObjectif) => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export default function KalpeEpargneSection({
  objectifs,
  loading,
  onAddObjectif,
  onVerserObjectif,
}: KalpeEpargneSectionProps) {
  const totalEpargne = objectifs.reduce((sum, o) => sum + Number(o.montant_actuel || 0), 0)
  const totalCible = objectifs.reduce((sum, o) => sum + Number(o.montant_cible || 0), 0)
  const globalPct = totalCible > 0 ? Math.min(100, Math.round((totalEpargne / totalCible) * 100)) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* En-tête & Bouton Nouvel Objectif */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mes Buts & Projets d'Épargne
          </span>
          <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
            Visualisez et sécurisez vos projets de vie sans jargon bancaire
          </div>
        </div>

        <button
          type="button"
          onClick={onAddObjectif}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 10,
            border: 'none',
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>Nouvel objectif</span>
        </button>
      </div>

      {/* Jauge Globale */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
          borderRadius: 14,
          padding: '16px 18px',
          color: '#ffffff',
          boxShadow: '0 2px 10px rgba(2, 132, 199, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#E0F2FE' }}>
            Total épargné sur vos projets
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: 8 }}>
            {globalPct} % atteint
          </span>
        </div>

        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>
          {fmt(totalEpargne)} <span style={{ fontSize: 14, fontWeight: 600 }}>/ {fmt(totalCible)} FCFA</span>
        </div>

        <div style={{ width: '100%', height: 6, borderRadius: 6, background: 'rgba(255, 255, 255, 0.25)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${globalPct}%`,
              height: '100%',
              borderRadius: 6,
              background: '#ffffff',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Liste des objectifs */}
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
          Chargement de vos objectifs...
        </div>
      ) : objectifs.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 14,
            border: '1px dashed var(--border, #E8DDD2)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
            Aucun projet d'épargne défini
          </div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginBottom: 12 }}>
            Créez votre première cagnotte (ex : Réserve de sécurité, Tabaski, Permis de conduire, Achat de stock).
          </div>
          <button
            type="button"
            onClick={onAddObjectif}
            style={{
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 800,
              borderRadius: 9,
              border: 'none',
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            + Définir mon premier but
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {objectifs.map((obj) => {
            const isAtteint = obj.statut === 'atteint' || Number(obj.montant_actuel) >= Number(obj.montant_cible)
            const pct = Math.min(100, Math.round((Number(obj.montant_actuel) / Math.max(Number(obj.montant_cible), 1)) * 100))
            const reste = Math.max(0, Number(obj.montant_cible) - Number(obj.montant_actuel))

            return (
              <div
                key={obj.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 14,
                  border: isAtteint ? '1.5px solid #BBF7D0' : '1px solid var(--border, #E8DDD2)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                      {obj.titre}
                    </div>
                    {obj.date_echeance && (
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                        Échéance : {new Date(obj.date_echeance).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>

                  <div>
                    {isAtteint ? (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} strokeWidth={2.4} />
                        Atteint
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: '#E0F2FE', color: '#0369A1' }}>
                        {pct} %
                      </span>
                    )}
                  </div>
                </div>

                {/* Montants */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                      {fmt(obj.montant_actuel)} FCFA
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                      sur {fmt(obj.montant_cible)} F
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <div style={{ width: '100%', height: 7, borderRadius: 6, background: '#E2E8F0', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: 6,
                        background: isAtteint ? 'var(--price, #0A5C36)' : '#0284C7',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {!isAtteint && (
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 500 }}>
                      Plus que {fmt(reste)} FCFA pour finaliser ce projet
                    </div>
                  )}
                </div>

                {/* Bouton Verser */}
                <button
                  type="button"
                  onClick={() => onVerserObjectif(obj)}
                  style={{
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 9,
                    border: '1px solid var(--navy, #1C2B4A)',
                    background: '#ffffff',
                    color: 'var(--navy, #1C2B4A)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} strokeWidth={2.4} />
                  <span>Ajouter un versement</span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
