'use client'

import React from 'react'
import { Search } from 'lucide-react'

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
  return (
    <div
      className="agence-card"
      style={{
        padding: 16,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={16} color="#64748B" />
        <input
          type="text"
          placeholder="Rechercher par titre, quartier, référence..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
          className="form-input"
          style={{ padding: '8px 12px' }}
        />
      </div>

      <select
        value={filterType}
        onChange={e => setFilterType(e.target.value)}
        className="form-select"
        style={{ width: 'auto', padding: '8px 12px' }}
      >
        <option value="tous">Tous les types</option>
        <option value="appartement">Appartement</option>
        <option value="villa">Villa</option>
        <option value="studio">Studio</option>
        <option value="terrain">Terrain</option>
        <option value="bureau">Bureau / Commerce</option>
      </select>

      <select
        value={filterStatut}
        onChange={e => setFilterStatut(e.target.value)}
        className="form-select"
        style={{ width: 'auto', padding: '8px 12px' }}
      >
        <option value="tous">Tous les statuts</option>
        <option value="disponible">Disponible</option>
        <option value="loue">Loué</option>
        <option value="vendu">Vendu</option>
      </select>
    </div>
  )
}
