import React from 'react'
import { Search, X, RotateCcw } from 'lucide-react'
import { CATEGORIES_LABELS, TriOption } from './types'

interface AdminAnnoncesFilterBarProps {
  q: string
  onQChange: (q: string) => void
  hasActiveFilters: boolean
  onResetFilters: () => void
  categorieFilter: string
  onCategorieFilterChange: (cat: string) => void
  villeFilter: string
  onVilleFilterChange: (ville: string) => void
  villesDisponibles: string[]
  payeeFilter: string
  onPayeeFilterChange: (val: string) => void
  triOption: TriOption
  onTriOptionChange: (tri: TriOption) => void
}

export default function AdminAnnoncesFilterBar({
  q,
  onQChange,
  hasActiveFilters,
  onResetFilters,
  categorieFilter,
  onCategorieFilterChange,
  villeFilter,
  onVilleFilterChange,
  villesDisponibles,
  payeeFilter,
  onPayeeFilterChange,
  triOption,
  onTriOptionChange
}: AdminAnnoncesFilterBarProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      {/* Champ de recherche principal */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            value={q}
            onChange={e => onQChange(e.target.value)}
            placeholder="Rechercher par titre, description, auteur, e-mail, téléphone, ville..."
            style={{
              width: '100%',
              padding: '11px 40px 11px 42px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              fontFamily: 'system-ui, sans-serif'
            }}
          />
          {q && (
            <button
              type="button"
              onClick={() => onQChange('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              padding: '10px 14px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RotateCcw size={13} />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      {/* Ligne de filtres déroulants */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filtre Catégorie */}
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            Catégorie
          </label>
          <select
            value={categorieFilter}
            onChange={e => onCategorieFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#fff',
              color: '#1e293b',
              cursor: 'pointer'
            }}
          >
            <option value="">Toutes les catégories</option>
            {Object.entries(CATEGORIES_LABELS).map(([slug, label]) => (
              <option key={slug} value={slug}>{label}</option>
            ))}
          </select>
        </div>

        {/* Filtre Ville */}
        <div style={{ flex: '1 1 160px', minWidth: 150 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            Ville / Zone
          </label>
          <select
            value={villeFilter}
            onChange={e => onVilleFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#fff',
              color: '#1e293b',
              cursor: 'pointer'
            }}
          >
            <option value="">Toutes les villes</option>
            {villesDisponibles.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Filtre Paiement */}
        <div style={{ flex: '1 1 150px', minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            Statut Paiement
          </label>
          <select
            value={payeeFilter}
            onChange={e => onPayeeFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#fff',
              color: '#1e293b',
              cursor: 'pointer'
            }}
          >
            <option value="">Tous les types</option>
            <option value="payee">Payée</option>
            <option value="gratuite">Gratuite / Quota</option>
          </select>
        </div>

        {/* Trier par */}
        <div style={{ flex: '1 1 170px', minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            Trier par
          </label>
          <select
            value={triOption}
            onChange={e => onTriOptionChange(e.target.value as TriOption)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#fff',
              color: '#1e293b',
              cursor: 'pointer'
            }}
          >
            <option value="recent">Les plus récentes</option>
            <option value="ancien">Les plus anciennes</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
          </select>
        </div>
      </div>
    </div>
  )
}
