'use client'

import React, { useState } from 'react'
import { Produit } from '../types'
import { fcfa } from '../utils'
import { useTranslation } from '@/i18n/context'

interface ComptaSaisieExpressCatalogueProps {
  produits: Produit[]
  panierProduits: Record<string, number>
  onAjouterProduitCatalogue: (p: any, delta?: number) => void
}

export function ComptaSaisieExpressCatalogue({
  produits,
  panierProduits,
  onAjouterProduitCatalogue,
}: ComptaSaisieExpressCatalogueProps) {
  const { t } = useTranslation()
  const [rechercheProduit, setRechercheProduit] = useState('')
  const [categorieFiltre, setCategorieFiltre] = useState('tous')

  const categoriesCatalogue = Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
  const qModal = rechercheProduit.trim().toLowerCase()
  const produitsFiltres = produits.filter((p: any) => {
    const matchCat = categorieFiltre === 'tous' || p.categorie === categorieFiltre
    const matchText = !qModal ||
      p.nom?.toLowerCase().includes(qModal) ||
      p.categorie?.toLowerCase().includes(qModal) ||
      p.barcode?.toLowerCase().includes(qModal) ||
      p.sku?.toLowerCase().includes(qModal)
    return matchCat && matchText
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Barre de recherche */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={rechercheProduit}
          onChange={e => setRechercheProduit(e.target.value)}
          placeholder={t('shop.searchProductPrompt')}
          style={{
            width: '100%',
            padding: '9px 36px 9px 12px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            fontSize: 13,
            fontWeight: 600,
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        {rechercheProduit && (
          <button
            type="button"
            onClick={() => setRechercheProduit('')}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Catégories */}
      {categoriesCatalogue.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setCategorieFiltre('tous')}
            style={{
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 11.5,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: categorieFiltre === 'tous' ? '#0284c7' : '#f1f5f9',
              color: categorieFiltre === 'tous' ? '#ffffff' : '#475569'
            }}
          >
            {t('common.all')} ({produits.length})
          </button>
          {categoriesCatalogue.map(cat => {
            const count = produits.filter((p: any) => p.categorie === cat).length
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategorieFiltre(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: categorieFiltre === cat ? '#0284c7' : '#f1f5f9',
                  color: categorieFiltre === cat ? '#ffffff' : '#475569'
                }}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Grille Produits */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 8,
        maxHeight: 220,
        overflowY: 'auto',
        padding: 2
      }}>
        {produitsFiltres.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: '#94a3b8', textAlign: 'center', padding: '24px 10px' }}>
            {produits.length === 0
              ? t('shop.noProductsInCatalog')
              : t('shop.noProductsMatchSearch')}
          </div>
        ) : (
          produitsFiltres.map((p: any) => {
            const qte = panierProduits[p.id] || 0
            const prixAff = Number(p.prix_promo || p.prix || 0)
            const stock = p.stock_quantite ?? p.quantite_stock

            return (
              <div
                key={p.id}
                style={{
                  background: qte > 0 ? '#f0f9ff' : '#f8fafc',
                  border: qte > 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '8px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease-in-out'
                }}
              >
                <div
                  onClick={() => onAjouterProduitCatalogue(p, 1)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.nom}>
                    {p.nom}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                    <span style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 900 }}>
                      {fcfa(prixAff)}
                    </span>
                    {stock !== undefined && stock !== null && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: stock > 0 ? '#10b981' : '#ef4444' }}>
                        {stock > 0 ? `${stock} ${t('shop.inStockLabel')}` : t('shop.outOfStockBadge')}
                      </span>
                    )}
                  </div>
                </div>

                {qte > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, paddingTop: 4, borderTop: '1px dashed #bae6fd' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAjouterProduitCatalogue(p, -1)
                      }}
                      style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="-"
                    >
                      -
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#0369a1', minWidth: 16, textAlign: 'center' }}>
                      {qte}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAjouterProduitCatalogue(p, 1)
                      }}
                      style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#e0f2fe', color: '#0284c7', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="+"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAjouterProduitCatalogue(p, 1)}
                    style={{ marginTop: 6, padding: '3px 6px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, color: '#475569', cursor: 'pointer' }}
                  >
                    {t('common.add')}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
