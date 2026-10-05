'use client'

import React from 'react'
import { Search } from 'lucide-react'

interface SurgaImmoFilterBarProps {
  queryVocale: string
  setQueryVocale: (q: string) => void
  rechercheEnCours: boolean
  onRecherche: (e: React.FormEvent) => void
  filtreTransaction: string
  setFiltreTransaction: (t: string) => void
  filtreType: string
  setFiltreType: (t: string) => void
  filtreQuartier: string
  setFiltreQuartier: (q: string) => void
  quartiers: string[]
}

const selectStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid var(--border, #E8DDD2)',
  fontSize: 12,
  backgroundColor: '#FFFFFF',
}

export default function SurgaImmoFilterBar({
  queryVocale,
  setQueryVocale,
  rechercheEnCours,
  onRecherche,
  filtreTransaction,
  setFiltreTransaction,
  filtreType,
  setFiltreType,
  filtreQuartier,
  setFiltreQuartier,
  quartiers,
}: SurgaImmoFilterBarProps) {
  return (
    <>
      <form onSubmit={onRecherche} style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Ex: F3 meublé à Ouakam ou Villa Almadies..."
            value={queryVocale}
            onChange={(e) => setQueryVocale(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 34px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text3, #73675E)',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={rechercheEnCours}
          style={{
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '0 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {rechercheEnCours ? 'Recherche...' : 'Filtrer'}
        </button>
      </form>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <select
          value={filtreTransaction}
          onChange={(e) => setFiltreTransaction(e.target.value)}
          style={selectStyle}
        >
          <option value="tous">Toutes transactions</option>
          <option value="location">Location</option>
          <option value="vente">Vente</option>
        </select>

        <select
          value={filtreType}
          onChange={(e) => setFiltreType(e.target.value)}
          style={selectStyle}
        >
          <option value="tous">Tous les types</option>
          <option value="appartement">Appartements</option>
          <option value="studio">Studios</option>
          <option value="villa">Villas</option>
          <option value="terrain">Terrains</option>
          <option value="bureau">Bureaux</option>
        </select>

        <select
          value={filtreQuartier}
          onChange={(e) => setFiltreQuartier(e.target.value)}
          style={selectStyle}
        >
          <option value="">Tous les quartiers</option>
          {quartiers.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
