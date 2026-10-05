'use client'

import React from 'react'
import { Zap } from 'lucide-react'

export type AgendaPresetType = '15min' | '1h' | 'ce_soir' | 'demain_matin' | 'apres_demain'

interface SurgaAgendaPresetsProps {
  onSelect: (type: AgendaPresetType) => void
}

const PRESETS: Array<{ key: AgendaPresetType; label: string }> = [
  { key: '15min', label: 'Dans 15 min' },
  { key: '1h', label: 'Dans 1 heure' },
  { key: 'ce_soir', label: 'Ce soir (18h)' },
  { key: 'demain_matin', label: 'Demain (09h)' },
  { key: 'apres_demain', label: 'Après-demain' },
]

export default function SurgaAgendaPresets({ onSelect }: SurgaAgendaPresetsProps) {
  return (
    <div>
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text3, #73675E)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 4,
        }}
      >
        <Zap size={12} color="var(--accent, #C75B00)" />
        <span>Raccourcis rapides</span>
      </label>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onSelect(p.key)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid var(--border, #E8DDD2)',
              backgroundColor: '#FFFFFF',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
