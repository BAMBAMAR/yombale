'use client'

import React from 'react'
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'

export interface SortOption {
  value: string
  label: string
}

interface AgenceTableToolbarProps {
  searchTerm?: string
  searchValue?: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  sortOptions?: SortOption[]
  currentSort?: string
  sortField?: string
  onSortChange?: (value: string) => void
  onSortFieldChange?: (value: string) => void
  sortDirection?: 'asc' | 'desc'
  sortOrder?: 'asc' | 'desc'
  onToggleSortDirection?: () => void
  onSortOrderToggle?: () => void
  totalCount?: number
  filteredCount?: number
  totalResults?: number
  resultsLabel?: string
  hasActiveFilters?: boolean
  activeFiltersCount?: number
  onResetFilters?: () => void
  filterSlot?: React.ReactNode
  children?: React.ReactNode
}

export function AgenceTableToolbar({
  searchTerm,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  sortOptions = [],
  currentSort,
  sortField,
  onSortChange,
  onSortFieldChange,
  sortDirection,
  sortOrder,
  onToggleSortDirection,
  onSortOrderToggle,
  totalCount,
  filteredCount,
  totalResults,
  resultsLabel,
  hasActiveFilters = false,
  activeFiltersCount,
  onResetFilters,
  filterSlot,
  children,
}: AgenceTableToolbarProps) {
  const activeSearch = searchTerm ?? searchValue ?? ''
  const activeSort = currentSort ?? sortField ?? ''
  const activeDir = sortDirection ?? sortOrder ?? 'desc'
  const handleSortChange = onSortChange ?? onSortFieldChange
  const handleToggleDir = onToggleSortDirection ?? onSortOrderToggle
  const finalHasActiveFilters = hasActiveFilters || (typeof activeFiltersCount === 'number' && activeFiltersCount > 0)
  const finalFilteredCount = filteredCount ?? totalResults
  return (
    <div
      className="agence-card"
      style={{
        padding: 14,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* ── Ligne Supérieure : Recherche & Sélecteur de Tri ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          width: '100%',
        }}
      >
        {/* Champ de Recherche */}
        <div
          style={{
            flex: '1 1 260px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#FAF8F5',
            borderRadius: 8,
            padding: '0 12px',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <Search size={16} color="#64748B" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={activeSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 0',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13.5,
              color: 'var(--navy, #1C2B4A)',
            }}
          />
          {activeSearch && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Effacer la recherche"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                color: '#64748B',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sélecteur de Tri */}
        {sortOptions.length > 0 && handleSortChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B' }}>
              Trier par :
            </span>
            <select
              value={activeSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="form-select"
              style={{
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                background: '#FFFFFF',
                color: 'var(--navy, #1C2B4A)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {handleToggleDir && (
              <button
                type="button"
                onClick={handleToggleDir}
                title={activeDir === 'asc' ? 'Ordre croissant (cliquer pour décroissant)' : 'Ordre décroissant (cliquer pour croissant)'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  background: '#FFFFFF',
                  color: 'var(--navy, #1C2B4A)',
                  cursor: 'pointer',
                }}
              >
                {activeDir === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
              </button>
            )}
          </div>
        )}

        {/* Bouton Réinitialiser les filtres */}
        {finalHasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px dashed var(--border, #E8DDD2)',
              background: '#FFF5EB',
              color: 'var(--accent, #C75B00)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} />
            <span>Réinitialiser filtres</span>
          </button>
        )}
      </div>

      {/* ── Ligne Inférieure : Filtres Spécifiques / Chips & Compteur ── */}
      {(children || filterSlot || typeof finalFilteredCount === 'number') && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            borderTop: children || filterSlot ? '1px solid var(--border, #E8DDD2)' : 'none',
            paddingTop: children || filterSlot ? 10 : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            {filterSlot}
            {children}
          </div>

          {typeof finalFilteredCount === 'number' && (
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              {finalFilteredCount} {resultsLabel || `résultat${finalFilteredCount > 1 ? 's' : ''}`}
              {typeof totalCount === 'number' && totalCount !== finalFilteredCount && (
                <span> sur {totalCount}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AgenceTableToolbar
