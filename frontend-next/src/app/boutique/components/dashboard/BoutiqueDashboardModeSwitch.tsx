'use client'

import React from 'react'
import { Store, LayoutDashboard } from 'lucide-react'

interface BoutiqueDashboardModeSwitchProps {
  modeEssentiel: boolean
  onToggleModeEssentiel: (enabled: boolean) => void
}

export default function BoutiqueDashboardModeSwitch({
  modeEssentiel,
  onToggleModeEssentiel,
}: BoutiqueDashboardModeSwitchProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 14px',
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {modeEssentiel ? (
          <Store size={20} style={{ color: 'var(--accent, #C75B00)' }} />
        ) : (
          <LayoutDashboard size={20} style={{ color: 'var(--navy, #1C2B4A)' }} />
        )}
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {modeEssentiel ? 'Mode Essentiel (Boutiquier)' : 'Mode Gestion Complète'}
          </span>
          <p style={{ margin: 0, fontSize: 11.5, color: '#64748B' }}>
            {modeEssentiel
              ? '4 actions capitales pour vendre vite au comptoir'
              : 'Vue 360° avec tous les indicateurs et modules'}
          </p>
        </div>
      </div>

      <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 10, padding: 3, gap: 2 }}>
        <button
          type="button"
          onClick={() => onToggleModeEssentiel(false)}
          style={{
            border: 'none',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 750,
            cursor: 'pointer',
            background: !modeEssentiel ? '#FFFFFF' : 'transparent',
            color: !modeEssentiel ? 'var(--navy, #1C2B4A)' : '#64748B',
            boxShadow: !modeEssentiel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Mode Complet
        </button>
        <button
          type="button"
          onClick={() => onToggleModeEssentiel(true)}
          style={{
            border: 'none',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 750,
            cursor: 'pointer',
            background: modeEssentiel ? 'var(--accent, #C75B00)' : 'transparent',
            color: modeEssentiel ? '#FFFFFF' : '#64748B',
            boxShadow: modeEssentiel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Mode Essentiel (4 Boutons)
        </button>
      </div>
    </div>
  )
}
