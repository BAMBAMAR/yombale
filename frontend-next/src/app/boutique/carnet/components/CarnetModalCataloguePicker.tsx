'use client'

import React, { useState } from 'react'
import { fcfa } from '@/lib/format'
import type { ProduitBoutique } from '../types'
import CarnetModalPanierSummary from './CarnetModalPanierSummary'

interface CarnetModalCataloguePickerProps {
  produits: ProduitBoutique[]
  panierProduits: Record<string, number>
  setPanierProduits: React.Dispatch<React.SetStateAction<Record<string, number>>>
  itemsCustomPanier: Array<{ id: string; nom: string; prix: number; quantite: number }>
  setItemsCustomPanier: React.Dispatch<React.SetStateAction<Array<{ id: string; nom: string; prix: number; quantite: number }>>>
  isMobile: boolean
  t: (key: string) => string
}

export default function CarnetModalCataloguePicker({
  produits,
  panierProduits,
  setPanierProduits,
  itemsCustomPanier,
  setItemsCustomPanier,
  isMobile,
  t,
}: CarnetModalCataloguePickerProps) {
  const [rechercheProduitModal, setRechercheProduitModal] = useState('')
  const [categorieProduitModal, setCategorieProduitModal] = useState('tous')

  const categoriesModal = Array.from(
    new Set(produits.map((p: any) => p.categorie).filter(Boolean))
  ) as string[]

  const qModal = rechercheProduitModal.trim().toLowerCase()
  const produitsFiltresModal = produits.filter((p: any) => {
    const matchCat = categorieProduitModal === 'tous' || p.categorie === categorieProduitModal
    const matchText =
      !qModal ||
      p.nom?.toLowerCase().includes(qModal) ||
      p.categorie?.toLowerCase().includes(qModal) ||
      p.barcode?.toLowerCase().includes(qModal) ||
      p.code_barre?.toLowerCase().includes(qModal) ||
      p.sku?.toLowerCase().includes(qModal)
    return matchCat && matchText
  })

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: 0 }}>
          {t('shop.clickArticlesPrompt')}
        </label>
        {Object.keys(panierProduits).some((k) => panierProduits[k] > 0) && (
          <button
            type="button"
            onClick={() => setPanierProduits({})}
            style={{
              fontSize: 11,
              color: '#ef4444',
              background: '#fee2e2',
              border: 'none',
              borderRadius: 6,
              padding: '2px 8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {t('shop.emptyCartBtn')}
          </button>
        )}
      </div>

      {/* Champ de recherche rapide + Filtres catégories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={rechercheProduitModal}
            onChange={(e) => setRechercheProduitModal(e.target.value)}
            placeholder={t('shop.searchProductPrompt')}
            style={{
              width: '100%',
              padding: '8px 30px 8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {rechercheProduitModal && (
            <button
              type="button"
              onClick={() => setRechercheProduitModal('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {categoriesModal.length > 0 && (
          <div
            className="horizontal-scroll-fade"
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none',
            }}
          >
            <button
              type="button"
              onClick={() => setCategorieProduitModal('tous')}
              style={{
                padding: '3px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: categorieProduitModal === 'tous' ? '#0284c7' : '#f1f5f9',
                color: categorieProduitModal === 'tous' ? '#ffffff' : '#475569',
              }}
            >
              {t('common.all')} ({produits.length})
            </button>
            {categoriesModal.map((cat) => {
              const count = produits.filter((p: any) => p.categorie === cat).length
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategorieProduitModal(cat)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: categorieProduitModal === cat ? '#0284c7' : '#f1f5f9',
                    color: categorieProduitModal === cat ? '#ffffff' : '#475569',
                  }}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 8,
          maxHeight: 240,
          overflowY: 'auto',
          padding: 2,
        }}
      >
        {produitsFiltresModal.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              fontSize: 12.5,
              color: '#94a3b8',
              textAlign: 'center',
              padding: 20,
            }}
          >
            {produits.length === 0
              ? t('shop.noProductsInCatalog')
              : t('shop.noProductsMatchSearch')}
          </div>
        ) : (
          produitsFiltresModal.map((p: any) => {
            const qte = panierProduits[p.id] || 0
            const prixAff = Number(p.prix_promo || p.prix || 0)

            return (
              <div
                key={p.id}
                style={{
                  background: qte > 0 ? '#f0f9ff' : '#f8fafc',
                  border: qte > 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '8px 6px',
                  textAlign: 'center',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  onClick={() => setPanierProduits((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={p.nom}
                  >
                    {p.nom}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 900, marginTop: 2 }}>
                    {fcfa(prixAff)}
                  </div>
                </div>

                {qte > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      marginTop: 6,
                      paddingTop: 4,
                      borderTop: '1px dashed #bae6fd',
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPanierProduits((prev) => {
                          const copy = { ...prev }
                          if (copy[p.id] > 1) {
                            copy[p.id] -= 1
                          } else {
                            delete copy[p.id]
                          }
                          return copy
                        })
                      }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: 'none',
                        background: '#fee2e2',
                        color: '#ef4444',
                        fontWeight: 900,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="-"
                    >
                      -
                    </button>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: '#0369a1',
                        minWidth: 16,
                        textAlign: 'center',
                      }}
                    >
                      {qte}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPanierProduits((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))
                      }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: 'none',
                        background: '#e0f2fe',
                        color: '#0284c7',
                        fontWeight: 900,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="+"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPanierProduits((prev) => ({ ...prev, [p.id]: 1 }))}
                    style={{
                      marginTop: 4,
                      padding: '3px 6px',
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {t('common.add')}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Résumé clair du panier sélectionné (Catalogue + Saisie Libre) */}
      <CarnetModalPanierSummary
        produits={produits}
        panierProduits={panierProduits}
        setPanierProduits={setPanierProduits}
        itemsCustomPanier={itemsCustomPanier}
        setItemsCustomPanier={setItemsCustomPanier}
        t={t}
      />
    </div>
  )
}
