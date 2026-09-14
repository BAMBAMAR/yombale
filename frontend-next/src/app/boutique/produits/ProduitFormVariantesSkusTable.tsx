'use client'

import React from 'react'
import { Boxes, Sparkles } from 'lucide-react'
import type { VarianteSku } from '../boutiqueTypes'

interface ProduitFormVariantesSkusTableProps {
  variantesSkus: VarianteSku[]
  prixForm: string
  stockQuantiteForm: string
  alignerTousLesPrix: () => void
  alignerTousLesStocks: () => void
  regenererTousLesSkus: () => void
  updateVarianteSku: (index: number, champ: keyof VarianteSku, val: any) => void
  genererEanPourVariante: (index: number) => void
}

export function ProduitFormVariantesSkusTable({
  variantesSkus,
  prixForm,
  stockQuantiteForm,
  alignerTousLesPrix,
  alignerTousLesStocks,
  regenererTousLesSkus,
  updateVarianteSku,
  genererEanPourVariante,
}: ProduitFormVariantesSkusTableProps) {
  if (variantesSkus.length === 0) return null

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1.5px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Boxes size={15} color="#1d4ed8" />
            <span>Matrice 3D des Combinaisons</span>
            <span style={{ fontSize: 11, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 999 }}>
              {variantesSkus.length} {variantesSkus.length > 1 ? 'combinaisons' : 'combinaison'}
            </span>
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
            Gérez les stocks, prix et codes SKU individualisés par combinaison (Taille × Couleur × Matière...).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={alignerTousLesPrix}
            title="Copier le prix principal sur toutes les variantes"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '5px 9px',
              fontSize: 11,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Aligner prix ({prixForm || 0} F)
          </button>
          <button
            type="button"
            onClick={alignerTousLesStocks}
            title="Copier la quantité en stock principale sur toutes les variantes"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '5px 9px',
              fontSize: 11,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Aligner stock ({stockQuantiteForm || 0})
          </button>
          <button
            type="button"
            onClick={regenererTousLesSkus}
            title="Régénérer automatiquement les codes SKU"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '5px 9px',
              fontSize: 11,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            SKU auto
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '8px 12px' }}>Combinaison</th>
              <th style={{ padding: '8px 12px', width: 140 }}>Code SKU</th>
              <th style={{ padding: '8px 12px', width: 120 }}>Prix (FCFA)</th>
              <th style={{ padding: '8px 12px', width: 90 }}>Stock</th>
              <th style={{ padding: '8px 12px', width: 150 }}>Code-barres</th>
            </tr>
          </thead>
          <tbody>
            {variantesSkus.map((skuItem, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: idx < variantesSkus.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                }}
              >
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {Object.entries(skuItem.attributs || {}).map(([cle, val]) => (
                      <span
                        key={cle}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          padding: '2px 6px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#1e293b',
                        }}
                      >
                        <span style={{ color: '#64748b', fontSize: 10 }}>{cle}:</span>
                        <span>{val}</span>
                      </span>
                    ))}
                  </div>
                </td>

                <td style={{ padding: '6px 8px' }}>
                  <input
                    type="text"
                    value={skuItem.sku ?? ''}
                    onChange={e => updateVarianteSku(idx, 'sku', e.target.value)}
                    placeholder="SKU-001"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 11.5,
                      fontFamily: 'monospace',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </td>

                <td style={{ padding: '6px 8px' }}>
                  <input
                    type="number"
                    min={0}
                    value={skuItem.prix ?? ''}
                    onChange={e => updateVarianteSku(idx, 'prix', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder={prixForm || '0'}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </td>

                <td style={{ padding: '6px 8px' }}>
                  <input
                    type="number"
                    min={0}
                    value={skuItem.stock_quantite ?? ''}
                    onChange={e => updateVarianteSku(idx, 'stock_quantite', e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: (skuItem.stock_quantite ?? 0) > 0 ? '#166534' : '#991b1b',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </td>

                <td style={{ padding: '6px 8px' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={skuItem.code_barre ?? ''}
                      onChange={e => updateVarianteSku(idx, 'code_barre', e.target.value)}
                      placeholder="EAN13"
                      style={{
                        flex: 1,
                        padding: '6px 6px',
                        fontSize: 11,
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => genererEanPourVariante(idx)}
                      title="Générer EAN13 aléatoire"
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '5px 6px',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sparkles size={12} color="#475569" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
