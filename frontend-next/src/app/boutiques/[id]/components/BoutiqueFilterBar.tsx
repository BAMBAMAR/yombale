'use client'

import React from 'react'
import { Search, X, Grid, List } from 'lucide-react'

interface BoutiqueFilterBarProps {
  nomBoutique: string
  totalProduits: number
  searchQuery: string
  setSearchQuery: (q: string) => void
  categoriesInternes: string[]
  catFilter: string
  setCatFilter: (c: string) => void
  priceFilter: string
  setPriceFilter: (p: string) => void
  stockOnly: boolean
  setStockOnly: (s: boolean) => void
  sortOption: string
  setSortOption: (so: string) => void
  viewMode: 'grid' | 'list'
  setViewMode: (v: 'grid' | 'list') => void
  couleurTheme: string
  contrastBtnText: string
  currentRadius: string
}

const TRANCHES_PRIX = [
  { id: '', label: 'Tous' },
  { id: '<10k', label: '< 10k F' },
  { id: '10k-50k', label: '10k-50k F' },
  { id: '50k-100k', label: '50k-100k F' },
  { id: '>100k', label: '> 100k F' },
]

export default function BoutiqueFilterBar({
  nomBoutique,
  totalProduits,
  searchQuery,
  setSearchQuery,
  categoriesInternes,
  catFilter,
  setCatFilter,
  priceFilter,
  setPriceFilter,
  stockOnly,
  setStockOnly,
  sortOption,
  setSortOption,
  viewMode,
  setViewMode,
  couleurTheme,
  contrastBtnText,
  currentRadius,
}: BoutiqueFilterBarProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: currentRadius,
        padding: '12px 14px',
        border: '1px solid #e5e7eb',
        marginBottom: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Barre de Recherche Intérieure */}
      <div style={{ position: 'relative', width: '100%' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Rechercher chez ${nomBoutique}...`}
          style={{
            width: '100%',
            paddingLeft: 38,
            paddingRight: searchQuery ? 36 : 12,
            height: 38,
            borderRadius: currentRadius,
            border: '1px solid #d1d5db',
            fontSize: 13.5,
            outline: 'none',
            background: '#f8fafc',
            boxSizing: 'border-box',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Effacer la recherche"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filtres par Catégorie Internes (Pastilles) */}
      {categoriesInternes.length > 0 && (
        <div className="horizontal-scroll-fade" style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
          <button
            type="button"
            onClick={() => setCatFilter('')}
            style={{
              padding: '4px 10px',
              borderRadius: 16,
              fontSize: 11.5,
              fontWeight: !catFilter ? 800 : 600,
              background: !catFilter ? couleurTheme : '#f1f5f9',
              color: !catFilter ? contrastBtnText : '#374151',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Tous ({totalProduits})
          </button>
          {categoriesInternes.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCatFilter(catFilter === c ? '' : c)}
              style={{
                padding: '4px 10px',
                borderRadius: 16,
                fontSize: 11.5,
                fontWeight: catFilter === c ? 800 : 600,
                background: catFilter === c ? couleurTheme : '#f1f5f9',
                color: catFilter === c ? contrastBtnText : '#374151',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Tranche de Prix & Badges de Tri */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 6,
          borderTop: '1px solid #f3f4f6',
        }}
      >
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7280' }}>Prix :</span>
          {TRANCHES_PRIX.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPriceFilter(priceFilter === p.id ? '' : p.id)}
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: priceFilter === p.id ? 800 : 600,
                background: priceFilter === p.id ? `${couleurTheme}15` : '#fff',
                color: priceFilter === p.id ? couleurTheme : '#4b5563',
                border: priceFilter === p.id ? `1.5px solid ${couleurTheme}` : '1px solid #e5e7eb',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setStockOnly(!stockOnly)}
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: stockOnly ? 800 : 600,
              background: stockOnly ? '#f0fdf4' : '#fff',
              color: stockOnly ? '#16a34a' : '#4b5563',
              border: stockOnly ? '1.5px solid #16a34a' : '1px solid #e5e7eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            En stock
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Option Tri */}
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: 11.5,
              fontWeight: 600,
              background: '#fff',
            }}
          >
            <option value="recent">Plus récents</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
            <option value="nom_asc">Nom A-Z</option>
          </select>

          {/* Basculer Grille / Liste */}
          <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '4px 6px',
                background: viewMode === 'grid' ? couleurTheme : '#fff',
                color: viewMode === 'grid' ? contrastBtnText : '#6b7280',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Vue Grille"
            >
              <Grid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '4px 6px',
                background: viewMode === 'list' ? couleurTheme : '#fff',
                color: viewMode === 'list' ? contrastBtnText : '#6b7280',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Vue Liste"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
