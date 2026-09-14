'use client'

import React from 'react'
import { Barcode } from 'lucide-react'
import { fcfa } from '@/lib/format'
import type { ProduitCaisse } from './PosCatalogueSection'

interface PosProductCardProps {
  produit: ProduitCaisse
  qteAuPanier: number
  vueCatalogue: 'mosaique' | 'liste'
  onAjouter: (p: ProduitCaisse) => void
  onImprimerEtiquette: (e: React.MouseEvent, p: ProduitCaisse) => void
}

export default function PosProductCard({
  produit: p,
  qteAuPanier,
  vueCatalogue,
  onAjouter,
  onImprimerEtiquette,
}: PosProductCardProps) {
  const isStockValide = typeof p.stock === 'number' && !isNaN(p.stock)
  const stockRestant = isStockValide ? Math.max(0, p.stock - qteAuPanier) : null
  const estHorsStock = isStockValide && stockRestant === 0

  return (
    <div
      onClick={() => onAjouter(p)}
      className={[
        'pos-produit-card',
        qteAuPanier > 0 ? 'pos-produit-card--in-cart' : '',
        estHorsStock ? 'pos-produit-card--epuise' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        padding: '10px 12px',
        display: 'flex',
        flexDirection: vueCatalogue === 'liste' ? 'row' : 'column',
        alignItems: vueCatalogue === 'liste' ? 'center' : 'stretch',
        justifyContent: 'space-between',
        minHeight: vueCatalogue === 'liste' ? 60 : 96,
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {qteAuPanier > 0 && (
        <div
          className="pos-qte-badge"
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: 'var(--pos-primary, #ea580c)',
            color: '#fff',
            borderRadius: 10,
            width: 22,
            height: 22,
            fontSize: 11,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(249,115,22,0.4)',
            zIndex: 2,
          }}
        >
          {qteAuPanier}
        </div>
      )}

      <div
        style={{
          flex: vueCatalogue === 'liste' ? 1 : 'unset',
          minWidth: 0,
          paddingRight: vueCatalogue === 'liste' ? 10 : 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
          <p
            style={{
              margin: '0 0 2px',
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--pos-text)',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {p.nom}
          </p>
          {vueCatalogue !== 'liste' && (
            <button
              onClick={(e) => onImprimerEtiquette(e, p)}
              title="Générer / Imprimer étiquette code-barres EAN"
              style={{
                background: 'var(--pos-surface2)',
                border: '1px solid var(--pos-border)',
                borderRadius: 4,
                padding: '2px 4px',
                fontSize: 9,
                cursor: 'pointer',
                color: 'var(--pos-text2)',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              <Barcode size={12} />
            </button>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 9, color: 'var(--pos-text3)', fontFamily: 'monospace' }}>
          {p.code_barre ? `EAN ${p.code_barre}` : ''}
        </p>
      </div>

      <div
        style={{
          marginTop: vueCatalogue === 'liste' ? 0 : 6,
          display: 'flex',
          flexDirection: vueCatalogue === 'liste' ? 'column' : 'row',
          justifyContent: vueCatalogue === 'liste' ? 'center' : 'space-between',
          alignItems: vueCatalogue === 'liste' ? 'flex-end' : 'center',
          gap: vueCatalogue === 'liste' ? 2 : 0,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--pos-primary)' }}>{fcfa(p.prix)}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {vueCatalogue === 'liste' && (
            <button
              onClick={(e) => onImprimerEtiquette(e, p)}
              title="Générer / Imprimer étiquette code-barres EAN"
              style={{
                background: 'var(--pos-surface2)',
                border: '1px solid var(--pos-border)',
                borderRadius: 4,
                padding: '2px 4px',
                fontSize: 9,
                cursor: 'pointer',
                color: 'var(--pos-text2)',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              <Barcode size={12} />
            </button>
          )}
          {isStockValide && (
            <span
              style={{
                fontSize: 9,
                background: estHorsStock
                  ? 'rgba(239, 68, 68, 0.2)'
                  : (stockRestant ?? 999) <= 3
                  ? 'rgba(249, 115, 22, 0.2)'
                  : 'rgba(34, 197, 94, 0.2)',
                color: estHorsStock ? '#f87171' : (stockRestant ?? 999) <= 3 ? '#fb923c' : '#4ade80',
                border: estHorsStock
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : (stockRestant ?? 999) <= 3
                  ? '1px solid rgba(249, 115, 22, 0.4)'
                  : '1px solid rgba(34, 197, 94, 0.4)',
                padding: '1px 5px',
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              {estHorsStock ? 'Épuisé' : `Stk ${stockRestant}`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
