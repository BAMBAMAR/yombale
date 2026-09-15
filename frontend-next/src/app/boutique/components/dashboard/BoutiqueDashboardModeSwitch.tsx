'use client'

import React from 'react'

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
        display: 'inline-flex',
        alignSelf: 'flex-start',
        background: '#F1F5F9',
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      <button
        type="button"
        onClick={() => onToggleModeEssentiel(false)}
        style={{
          border: 'none',
          borderRadius: 8,
          padding: '6px 14px',
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
          padding: '6px 14px',
          fontSize: 12,
          fontWeight: 750,
          cursor: 'pointer',
          background: modeEssentiel ? 'var(--accent, #C75B00)' : 'transparent',
          color: modeEssentiel ? '#FFFFFF' : '#64748B',
          boxShadow: modeEssentiel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        Mode Essentiel
      </button>
    </div>
  )
}
