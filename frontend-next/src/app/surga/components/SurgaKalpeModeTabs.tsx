'use client'

import React from 'react'
import { ArrowDownLeft, ArrowUpRight, Users, PiggyBank, X } from 'lucide-react'
import type { SaisieMode } from './SurgaKalpeSaisieModal'

interface SurgaKalpeModeTabsProps {
  mode: SaisieMode
  onSelectMode: (m: SaisieMode) => void
  onClose: () => void
}

export default function SurgaKalpeModeTabs({
  mode,
  onSelectMode,
  onClose,
}: SurgaKalpeModeTabsProps) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--surga-border, #E2E8F0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--surga-surface, #FFFFFF)',
      }}
    >
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onSelectMode('entree')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            minHeight: 38,
            backgroundColor: mode === 'entree' ? 'var(--surga-emerald, #059669)' : 'var(--surga-bg, #F8FAFC)',
            color: mode === 'entree' ? '#FFFFFF' : 'var(--surga-text2, #475569)',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowDownLeft size={15} strokeWidth={2.5} />
          <span>Entrée</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('depense')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            minHeight: 38,
            backgroundColor: mode === 'depense' ? 'var(--surga-primary, #0F172A)' : 'var(--surga-bg, #F8FAFC)',
            color: mode === 'depense' ? '#FFFFFF' : 'var(--surga-text2, #475569)',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowUpRight size={15} strokeWidth={2.5} />
          <span>Dépense</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('dette')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            minHeight: 38,
            backgroundColor: mode === 'dette' ? 'var(--surga-accent, #D97706)' : 'var(--surga-bg, #F8FAFC)',
            color: mode === 'dette' ? '#FFFFFF' : 'var(--surga-text2, #475569)',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={15} strokeWidth={2.5} />
          <span>Dette</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('epargne')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            minHeight: 38,
            backgroundColor: mode === 'epargne' ? '#2563EB' : 'var(--surga-bg, #F8FAFC)',
            color: mode === 'epargne' ? '#FFFFFF' : 'var(--surga-text2, #475569)',
            transition: 'all 0.15s ease',
          }}
        >
          <PiggyBank size={15} strokeWidth={2.5} />
          <span>Épargne</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la boîte de saisie"
        style={{
          background: 'none',
          border: 'none',
          padding: 8,
          cursor: 'pointer',
          color: 'var(--surga-text2, #475569)',
          minWidth: 40,
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        <X size={20} />
      </button>
    </div>
  )
}
