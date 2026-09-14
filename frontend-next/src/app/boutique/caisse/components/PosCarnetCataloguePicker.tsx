'use client'

import React from 'react'

export interface ProduitItem {
  id: string
  nom: string
  prix: number
  code_barre?: string
}

interface PosCarnetCataloguePickerProps {
  rechercheProd: string
  setRechercheProd: (q: string) => void
  prodsFiltres: ProduitItem[]
  panierCarnet: Record<string, number>
  setPanierCarnet: React.Dispatch<React.SetStateAction<Record<string, number>>>
  fcfa: (m: number | undefined | null) => string
}

export default function PosCarnetCataloguePicker({
  rechercheProd,
  setRechercheProd,
  prodsFiltres,
  panierCarnet,
  setPanierCarnet,
  fcfa,
}: PosCarnetCataloguePickerProps) {
  return (
    <div>
      <input
        type="text"
        placeholder="Rechercher un produit du catalogue..."
        value={rechercheProd}
        onChange={(e) => setRechercheProd(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 'var(--r-md, 8px)',
          border: '1px solid var(--border, #E8DDD2)',
          fontSize: 13,
          marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
          gap: 8,
          maxHeight: 220,
          overflowY: 'auto',
        }}
      >
        {prodsFiltres.map((p) => {
          const qte = panierCarnet[p.id] || 0
          return (
            <div
              key={p.id}
              style={{
                border: qte > 0 ? '2px solid #ef4444' : '1px solid var(--border, #E8DDD2)',
                borderRadius: 'var(--r-md, 8px)',
                padding: 8,
                background: qte > 0 ? '#fef2f2' : 'var(--bg, #F8F5F0)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  lineHeight: 1.3,
                }}
              >
                {p.nom}
              </p>
              <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 900, color: '#ef4444' }}>
                {fcfa(p.prix)}
              </p>
              {qte === 0 ? (
                <button
                  type="button"
                  onClick={() => setPanierCarnet((prev) => ({ ...prev, [p.id]: 1 }))}
                  style={{
                    width: '100%',
                    background: 'var(--navy, #1C2B4A)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 0',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    minHeight: 36,
                  }}
                >
                  + Ajouter
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fff',
                    borderRadius: 6,
                    border: '1px solid #fecaca',
                    padding: 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPanierCarnet((prev) => {
                        const n = { ...prev }
                        if (n[p.id] > 1) n[p.id]--
                        else delete n[p.id]
                        return n
                      })
                    }
                    style={{
                      border: 'none',
                      background: '#fee2e2',
                      color: '#dc2626',
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 900 }}>{qte}</span>
                  <button
                    type="button"
                    onClick={() => setPanierCarnet((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                    style={{
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
