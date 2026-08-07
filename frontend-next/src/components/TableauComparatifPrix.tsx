'use client'

import React from 'react'

export interface OffreComparee {
  id?: string
  site: string // 'Jumia' | 'Expat-Dakar' | 'CoinAfrique' | 'Boutique Nopalou'
  prix: number
  url?: string | null
  vendeur?: string | null
  date_verification?: string
  is_internal?: boolean
}

interface TableauComparatifProps {
  produitNom: string
  offres: OffreComparee[]
  onCommanderDirect?: () => void
}

export default function TableauComparatifPrix({
  produitNom,
  offres,
  onCommanderDirect,
}: TableauComparatifProps) {
  if (!offres || offres.length === 0) return null

  // Trier les offres par prix croissant pour déterminer la meilleure offre
  const offresTriees = [...offres].sort((a, b) => a.prix - b.prix)
  const prixMin = offresTriees[0]?.prix

  const fcfa = (val: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(val) + ' FCFA'

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 16,
      marginTop: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{
          fontFamily: 'var(--font-archivo), sans-serif',
          fontSize: 15,
          fontWeight: 700,
          color: '#1C2B4A',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          📊 Comparateur de Prix Dakar — {produitNom}
        </h3>
        <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '3px 8px', borderRadius: 12, fontWeight: 500 }}>
          Vérifié aujourd&apos;hui
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {offresTriees.map((o, idx) => {
          const isBestPrice = o.prix === prixMin
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: isBestPrice ? '#16a34a' : '#f3f4f6',
                background: isBestPrice ? '#f0fdf4' : '#fafafa',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isBestPrice && (
                  <span style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}>
                    🏆 Meilleur Prix
                  </span>
                )}
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', display: 'block' }}>
                    {o.site} {o.vendeur ? `(${o.vendeur})` : ''}
                  </span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                    {o.is_internal ? 'Boutique Nopalou — Livraison Rapide' : 'Vendeur externe agrégé'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: isBestPrice ? '#15803d' : '#C75B00',
                }}>
                  {fcfa(o.prix)}
                </span>

                {o.is_internal ? (
                  <button
                    onClick={onCommanderDirect}
                    style={{
                      background: '#C75B00',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🛒 Commander (1-Clic)
                  </button>
                ) : o.url ? (
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#1C2B4A',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    ↗️ Voir l&apos;offre
                  </a>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
