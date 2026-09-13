'use client'

import React from 'react'
import { fcfa } from '@/lib/format'
import type { LigneDocument } from './types'

interface GestionDocumentsCartLinesProps {
  lignesSelectionnees: LigneDocument[]
  produits: any[]
  totalArticles: number
  totalTTC: number
  onViderPanier: () => void
  onModifierLigne: (index: number, champ: keyof LigneDocument, valeur: any) => void
  onSupprimerLigne: (index: number) => void
  t: (key: string) => string
}

export default function GestionDocumentsCartLines({
  lignesSelectionnees,
  produits,
  totalArticles,
  totalTTC,
  onViderPanier,
  onModifierLigne,
  onSupprimerLigne,
  t,
}: GestionDocumentsCartLinesProps) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
          {t('shop.articlesInDocCart')} ({totalArticles} {t('shop.articlesTotalCount')} • {t('shop.totalTtc')}:{' '}
          {fcfa(totalTTC)})
        </span>
        {lignesSelectionnees.length > 0 && (
          <button
            type="button"
            onClick={onViderPanier}
            style={{
              fontSize: 11,
              color: '#ef4444',
              background: '#fee2e2',
              border: 'none',
              borderRadius: 6,
              padding: '3px 8px',
              cursor: 'pointer',
              fontWeight: 800,
            }}
          >
            {t('shop.emptyCartBtn')}
          </button>
        )}
      </div>

      {lignesSelectionnees.length === 0 ? (
        <div style={{ padding: '24px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>
          {t('shop.emptyDocCartMsg')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
          {lignesSelectionnees.map((ligne, idx) => {
            const estLibre = ligne.produitId === 'custom' || !produits.some((p) => p.id === ligne.produitId)
            const subtotal = (Number(ligne.quantite) || 0) * (Number(ligne.prix) || 0)

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: estLibre ? '1px dashed #0284c7' : '1px solid #e2e8f0',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: estLibre ? '#e0f2fe' : '#f0fdf4',
                      color: estLibre ? '#0369a1' : '#16a34a',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {estLibre ? t('shop.freeItemTag') : t('shop.catalogItemTag')}
                  </span>

                  {estLibre ? (
                    <input
                      type="text"
                      value={ligne.nom}
                      onChange={(e) => onModifierLigne(idx, 'nom', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        fontSize: 12.5,
                        fontWeight: 700,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontWeight: 700,
                        color: '#0f172a',
                        fontSize: 13,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ligne.nom}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('common.price')} :</label>
                    <input
                      type="number"
                      min="0"
                      value={ligne.prix}
                      onChange={(e) => onModifierLigne(idx, 'prix', Number(e.target.value))}
                      style={{
                        width: 80,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        fontSize: 12,
                        fontWeight: 700,
                        textAlign: 'right',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                      {t('shop.quantityLabel')} :
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ligne.quantite}
                      onChange={(e) => onModifierLigne(idx, 'quantite', Number(e.target.value))}
                      style={{
                        width: 55,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        fontSize: 12,
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    />
                  </div>

                  <span
                    style={{
                      minWidth: 85,
                      textAlign: 'right',
                      fontWeight: 900,
                      color: '#0284c7',
                      fontSize: 13,
                    }}
                  >
                    {fcfa(subtotal)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSupprimerLigne(idx)}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      color: '#ef4444',
                      borderRadius: 6,
                      width: 24,
                      height: 24,
                      cursor: 'pointer',
                      fontWeight: 900,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Supprimer cette ligne"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
