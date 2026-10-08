'use client'

import React from 'react'
import { ArrowDownLeft, ArrowUpRight, Users, PiggyBank } from 'lucide-react'
import type { SaisieMode } from './SurgaKalpeSaisieModal'

interface SurgaKalpeQuickActionsProps {
  onOpenSaisie: (mode: SaisieMode) => void
}

export default function SurgaKalpeQuickActions({
  onOpenSaisie,
}: SurgaKalpeQuickActionsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        marginBottom: 16,
      }}
    >
      <button
        type="button"
        onClick={() => onOpenSaisie('entree')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 4px',
          borderRadius: 10,
          border: '1px solid var(--surga-border, #E2E8F0)',
          backgroundColor: 'var(--surga-surface, #FFFFFF)',
          cursor: 'pointer',
          gap: 6,
          minHeight: 64,
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'var(--surga-emerald-soft, rgba(5, 150, 105, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowDownLeft size={17} color="var(--surga-emerald, #059669)" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>+ Entrée</span>
      </button>

      <button
        type="button"
        onClick={() => onOpenSaisie('depense')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 4px',
          borderRadius: 10,
          border: '1px solid var(--surga-border, #E2E8F0)',
          backgroundColor: 'var(--surga-surface, #FFFFFF)',
          cursor: 'pointer',
          gap: 6,
          minHeight: 64,
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(15, 23, 42, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowUpRight size={17} color="var(--surga-primary, #0F172A)" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>- Dépense</span>
      </button>

      <button
        type="button"
        onClick={() => onOpenSaisie('dette')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 4px',
          borderRadius: 10,
          border: '1px solid var(--surga-border, #E2E8F0)',
          backgroundColor: 'var(--surga-surface, #FFFFFF)',
          cursor: 'pointer',
          gap: 6,
          minHeight: 64,
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'var(--surga-accent-soft, rgba(217, 119, 6, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={17} color="var(--surga-accent, #D97706)" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>Dette</span>
      </button>

      <button
        type="button"
        onClick={() => onOpenSaisie('epargne')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 4px',
          borderRadius: 10,
          border: '1px solid var(--surga-border, #E2E8F0)',
          backgroundColor: 'var(--surga-surface, #FFFFFF)',
          cursor: 'pointer',
          gap: 6,
          minHeight: 64,
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PiggyBank size={17} color="#2563EB" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>Épargne</span>
      </button>
    </div>
  )
}
