'use client'

import React from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

interface FiltresBiensBarProps {
  searchTerm: string
  setSearchTerm: (s: string) => void
  filterType: string
  setFilterType: (t: string) => void
  filterStatut: string
  setFilterStatut: (s: string) => void
  onSearch: () => void
}

export function FiltresBiensBar({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterStatut,
  setFilterStatut,
  onSearch,
}: FiltresBiensBarProps) {
  const typeChips = [
    { value: 'tous', label: 'Tous les biens' },
    { value: 'appartement', label: 'Appartement' },
    { value: 'villa', label: 'Villa' },
    { value: 'studio', label: 'Studio' },
    { value: 'terrain', label: 'Terrain' },
    { value: 'bureau', label: 'Bureau / Local' },
  ]

  const statutChips = [
    { value: 'tous', label: 'Tous statuts' },
    { value: 'disponible', label: 'Disponible' },
    { value: 'loue', label: 'Loué' },
    { value: 'vendu', label: 'Vendu' },
  ]

  return (
    <div
      className="agence-card"
      style={{
        padding: 14,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* ── Barre de recherche ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#FAF8F5',
            borderRadius: 8,
            padding: '0 12px',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Rechercher par titre, quartier, référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            style={{
              width: '100%',
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13.5,
              color: 'var(--navy, #1C2B4A)',
            }}
          />
        </div>

        {/* Sélecteurs rapides visibles sur Desktop */}
        <div className="immo-desktop-flex" style={{ display: 'flex', gap: 8 }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '8px 12px' }}
          >
            {typeChips.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '8px 12px' }}
          >
            {statutChips.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Chips Horizontaux Défilables sur Mobile (< 768px) ── */}
      <div className="immo-mobile-only" style={{ flexDirection: 'column', gap: 8 }}>
        {/* Types */}
        <div className="immo-chips-scroller">
          {typeChips.map((chip) => {
            const isSelected = filterType === chip.value
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setFilterType(chip.value)}
                className={`immo-chip ${isSelected ? 'active' : ''}`}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                title={chip.label}
              >
                <span>{chip.label}</span>
              </button>
            )
          })}
        </div>

        {/* Statuts */}
        <div className="immo-chips-scroller">
          {statutChips.map((chip) => {
            const isSelected = filterStatut === chip.value
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setFilterStatut(chip.value)}
                className={`immo-chip ${isSelected ? 'active' : ''}`}
                style={{
                  fontSize: 11.5,
                  padding: '5px 12px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
                title={chip.label}
              >
                <span>{chip.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FiltresBiensBar
