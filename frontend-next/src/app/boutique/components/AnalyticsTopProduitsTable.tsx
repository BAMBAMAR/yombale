'use client'

import React from 'react'
import { Trophy, ShoppingBag, TrendingUp } from 'lucide-react'

export interface TopProduitItem {
  produit_id: string | null
  nom_produit: string
  quantite_vendue: number
  ca_total: number
}

interface AnalyticsTopProduitsTableProps {
  topProduits: TopProduitItem[]
  formatMontant: (v: number) => string
}

export default function AnalyticsTopProduitsTable({
  topProduits,
  formatMontant,
}: AnalyticsTopProduitsTableProps) {
  if (!topProduits || topProduits.length === 0) {
    return null
  }

  const maxCa = Math.max(...topProduits.map(p => p.ca_total), 1)

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 14,
        padding: '16px 20px',
        marginBottom: 24,
        boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#FFF3E8',
              border: '1px solid #FFE4CC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={16} style={{ color: 'var(--accent, #C75B00)' }} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              Top des Ventes sur la Période
            </h3>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text2, #6B5E52)' }}>
              Classement des articles les plus performants (quantité et chiffre d&apos;affaires)
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 12,
            background: 'var(--bg, #F8F5F0)',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          {topProduits.length} article{topProduits.length > 1 ? 's' : ''} classé{topProduits.length > 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
          <thead>
            <tr style={{ background: 'var(--bg, #F8F5F0)', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--text2, #6B5E52)' }}>Rang &amp; Produit</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--text2, #6B5E52)' }}>Unités Vendues</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--text2, #6B5E52)' }}>Chiffre d&apos;Affaires</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--text2, #6B5E52)', width: 140 }}>Part Relative</th>
            </tr>
          </thead>
          <tbody>
            {topProduits.map((item, idx) => {
              const ratio = Math.round((item.ca_total / maxCa) * 100)
              return (
                <tr
                  key={item.produit_id || `${item.nom_produit}-${idx}`}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: idx === 0 ? '#FEF3C7' : idx === 1 ? '#E2E8F0' : idx === 2 ? '#FFEDD5' : '#F8FAFC',
                          color: idx === 0 ? '#B45309' : idx === 1 ? '#475569' : idx === 2 ? '#C2410C' : '#64748B',
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 13 }}>
                        {item.nom_produit}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: '#F1F5F9',
                        fontSize: 12,
                      }}
                    >
                      {item.quantite_vendue}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--price, #0A5C36)', fontSize: 13.5 }}>
                    {formatMontant(item.ca_total)} FCFA
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 4,
                          background: '#E2E8F0',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${ratio}%`,
                            height: '100%',
                            background: idx === 0 ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                            borderRadius: 4,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10.5, color: '#64748B', minWidth: 26 }}>
                        {ratio}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
