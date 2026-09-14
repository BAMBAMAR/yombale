'use client'

import React from 'react'
import { Boxes, RefreshCw, Warehouse } from 'lucide-react'
import type { StockEntrepot } from '../GestionEntrepots'

interface StocksVentilationTableProps {
  stocks: StockEntrepot[]
  chargerDonnees: () => void
  onAjusterStock: (produitId: string, entrepotId: string, quantite: number) => void
}

export default function StocksVentilationTable({
  stocks,
  chargerDonnees,
  onAjusterStock,
}: StocksVentilationTableProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border, #E8DDD2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Boxes size={16} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>Ventilation des Stocks par Produit &amp; Dépôt</span>
        </h4>
        <button
          type="button"
          onClick={chargerDonnees}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {stocks.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          Aucun stock ventilé pour le moment. Cliquez sur « Ajuster Stock Dépôt » pour affecter
          vos marchandises aux différents sites.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  background: 'var(--bg, #F8F5F0)',
                  color: 'var(--text2, #6B5E52)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '10px 14px' }}>Produit</th>
                <th style={{ padding: '10px 14px' }}>Entrepôt / Dépôt</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Quantité</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr
                  key={`${s.produit_id}_${s.entrepot_id}`}
                  style={{ borderTop: '1px solid var(--border, #E8DDD2)' }}
                >
                  <td
                    style={{
                      padding: '10px 14px',
                      fontWeight: 700,
                      color: 'var(--navy, #1C2B4A)',
                    }}
                  >
                    {s.produit_nom}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Warehouse size={13} style={{ color: 'var(--accent, #C75B00)' }} />
                      {s.entrepot_nom}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontWeight: 800,
                      color: s.quantite > 0 ? '#0A5C36' : '#dc2626',
                    }}
                  >
                    {s.quantite}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => onAjusterStock(s.produit_id, s.entrepot_id, s.quantite)}
                      style={{
                        padding: '4px 8px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Ajuster
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
