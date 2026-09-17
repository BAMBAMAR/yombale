'use client'

import React from 'react'

export interface CommoditesState {
  meuble: boolean
  climatisation: boolean
  gardien: boolean
  parking: boolean
  ascenseur: boolean
  piscine: boolean
}

interface BienCommoditesSelectorProps {
  values: CommoditesState
  onChange: (key: keyof CommoditesState, checked: boolean) => void
}

const COMMODITES_LIST: { key: keyof CommoditesState; label: string }[] = [
  { key: 'meuble', label: 'Meublé' },
  { key: 'climatisation', label: 'Climatisé' },
  { key: 'gardien', label: 'Gardiennage' },
  { key: 'parking', label: 'Parking' },
  { key: 'ascenseur', label: 'Ascenseur' },
  { key: 'piscine', label: 'Piscine' },
]

export function BienCommoditesSelector({ values, onChange }: BienCommoditesSelectorProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 10,
        marginTop: 10,
      }}
    >
      {COMMODITES_LIST.map((item) => {
        const isChecked = Boolean(values[item.key])
        return (
          <label
            key={item.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              background: isChecked ? 'rgba(199, 91, 0, 0.08)' : '#FAF8F5',
              border: '1px solid',
              borderColor: isChecked ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onChange(item.key, e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent, #C75B00)' }}
            />
            {item.label}
          </label>
        )
      })}
    </div>
  )
}

export default BienCommoditesSelector
