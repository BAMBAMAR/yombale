'use client'

import React from 'react'
import { CreditCard, Zap, Plus, Settings, CheckCircle2 } from 'lucide-react'

interface CreditsHeaderProps {
  totalCredits: number
  totalFinancement: number
  totalRestant: number
  activeTab: 'plans' | 'parametres'
  onSelectTab: (tab: 'plans' | 'parametres') => void
  onOpenWaveModal: () => void
  onOpenSimpleModal: () => void
  toastMsg: string | null
}

export default function CreditsHeader({
  totalCredits,
  totalFinancement,
  totalRestant,
  activeTab,
  onSelectTab,
  onOpenWaveModal,
  onOpenSimpleModal,
  toastMsg,
}: CreditsHeaderProps) {
  return (
    <>
      {/* ── En-tête de la Page avec Boutons d'Action ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={24} color="var(--accent, #C75B00)" />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
              Crédits & Plans d&apos;Échelonnement
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
            Caution locative en 2x/3x/4x, vente de terrains et VEFA par tranches avec lien Wave direct
          </p>
        </div>

        {activeTab === 'plans' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onOpenWaveModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(199, 91, 0, 0.25)',
              }}
            >
              <Zap size={16} />
              <span>Nouveau Financement & Lien Wave</span>
            </button>

            <button
              type="button"
              onClick={onOpenSimpleModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFFFFF',
                color: 'var(--navy, #1C2B4A)',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              <span>Plan Standard</span>
            </button>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => onSelectTab('plans')}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'plans' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            background: activeTab === 'plans' ? 'var(--navy, #1C2B4A)' : '#fff',
            color: activeTab === 'plans' ? '#fff' : 'var(--navy, #1C2B4A)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Plans d&apos;Échelonnement ({totalCredits})
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('parametres')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'parametres' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            background: activeTab === 'parametres' ? 'var(--navy, #1C2B4A)' : '#fff',
            color: activeTab === 'parametres' ? '#fff' : 'var(--navy, #1C2B4A)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <Settings size={15} />
          <span>Paramètres d&apos;Échelonnement</span>
        </button>
      </div>

      {toastMsg && (
        <div style={{ padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div className="kpi-card" style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Total Engagé</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              {Number(totalFinancement).toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>{totalCredits} contrat(s) actif(s)</div>
          </div>

          <div className="kpi-card" style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: totalRestant > 0 ? '1px solid #FCA5A5' : '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 12, color: totalRestant > 0 ? '#DC2626' : '#15803d', fontWeight: 600, marginBottom: 4 }}>Solde Restant Dû</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: totalRestant > 0 ? '#DC2626' : '#15803d' }}>
              {Number(totalRestant).toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>À recouvrer sur échéances</div>
          </div>
        </div>
      )}
    </>
  )
}
