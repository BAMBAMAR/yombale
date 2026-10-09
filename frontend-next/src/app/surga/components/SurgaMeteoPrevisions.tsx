// frontend-next/src/app/surga/components/SurgaMeteoPrevisions.tsx
'use client'

import React from 'react'
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { PrevisionItem } from './SurgaMeteoCard'

export function renderMeteoIcon(code: string, size = 20) {
  switch (code) {
    case 'soleil':
      return <Sun size={size} color="var(--accent, #C75B00)" />
    case 'nuageux':
    case 'partiellement_nuageux':
    case 'poussiere':
      return <Cloud size={size} color="var(--navy, #1C2B4A)" />
    case 'pluie':
    case 'averse':
      return <CloudRain size={size} color="var(--navy, #1C2B4A)" />
    case 'orage':
      return <CloudLightning size={size} color="var(--accent, #C75B00)" />
    default:
      return <Sun size={size} color="var(--accent, #C75B00)" />
  }
}

interface SurgaMeteoPrevisionsProps {
  previsions: PrevisionItem[]
  showPrevisions: boolean
  onToggle: () => void
}

export default function SurgaMeteoPrevisions({
  previsions,
  showPrevisions,
  onToggle,
}: SurgaMeteoPrevisionsProps) {
  if (!previsions || previsions.length === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          background: 'none',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'var(--surga-accent-ink, #A64B08)',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <span>{showPrevisions ? 'Masquer les prévisions' : 'Voir les prévisions à 3 jours'}</span>
        {showPrevisions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showPrevisions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {previsions.map((prev, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 6,
                backgroundColor: 'var(--bg, #F8F5F0)',
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {renderMeteoIcon(prev.condition_code, 15)}
                <span style={{ fontWeight: 700, color: 'var(--text1, #1A1612)' }}>{prev.jour}</span>
                <span style={{ color: 'var(--text3, #73675E)' }}>• {prev.condition_texte}</span>
              </div>
              <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {prev.temp_min}° / {prev.temp_max}°C
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
