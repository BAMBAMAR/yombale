'use client'

import React, { useState, useEffect, useRef } from 'react'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'

export interface ProduitOption {
  id: string
  nom: string
  prix: number
  prix_promo?: number
  categorie?: string
  stock_quantite?: number
  quantite_stock?: number
  barcode?: string
  sku?: string
  [key: string]: any
}

interface SearchableProductSelectProps {
  produits: ProduitOption[]
  value: string
  onChange: (produitId: string, produitObj?: ProduitOption | null) => void
  placeholder?: string
  allowCustom?: boolean
  customLabel?: string
  disabled?: boolean
}

export default function SearchableProductSelect({
  produits,
  value,
  onChange,
  placeholder,
  allowCustom = true,
  customLabel,
  disabled = false
}: SearchableProductSelectProps) {
  const { t } = useTranslation()
  const displayPlaceholder = placeholder || t('shop.searchProductPrompt')
  const displayCustomLabel = customLabel || t('shop.customArticleOption')

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('tous')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputSearchRef = useRef<HTMLInputElement>(null)

  // Extraire les catégories uniques
  const categories = Array.from(
    new Set(produits.map(p => p.categorie).filter(Boolean))
  ) as string[]

  // Obtenir le produit sélectionné
  const selectedProduct = produits.find(p => p.id === value)

  // Fermer quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus sur le champ de recherche quand on ouvre
  useEffect(() => {
    if (isOpen && inputSearchRef.current) {
      inputSearchRef.current.focus()
    }
  }, [isOpen])

  // Filtrer la liste des produits
  const q = searchTerm.trim().toLowerCase()
  const produitsFiltres = produits.filter(p => {
    const matchCategory = selectedCategory === 'tous' || p.categorie === selectedCategory
    const matchText = !q ||
      p.nom.toLowerCase().includes(q) ||
      (p.categorie && p.categorie.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.prix && p.prix.toString().includes(q))
    return matchCategory && matchText
  })

  const handleSelect = (pId: string, pObj?: ProduitOption | null) => {
    onChange(pId, pObj)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Bouton de sélection / Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: isOpen ? '2px solid #0284c7' : '1px solid #cbd5e1',
          background: disabled ? '#f1f5f9' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 40,
          boxSizing: 'border-box',
          fontSize: 13,
          fontWeight: 600,
          color: '#0f172a',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {!value ? (
            <span style={{ color: '#64748b', fontWeight: 500 }}>{displayPlaceholder}</span>
          ) : value === 'custom' ? (
            <span style={{ color: '#0284c7', fontWeight: 700 }}>
              {displayCustomLabel}
            </span>
          ) : selectedProduct ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedProduct.nom}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0284c7', flexShrink: 0 }}>
                ({fcfa(selectedProduct.prix)})
              </span>
              {selectedProduct.categorie && (
                <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
                  {selectedProduct.categorie}
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: '#0f172a', fontWeight: 600 }}>ID: {value}</span>
          )}
        </div>

        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>
          ▼
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: 350
          }}
        >
          {/* Recherche */}
          <div style={{ position: 'relative' }}>
            <input
              ref={inputSearchRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={displayPlaceholder}
              style={{
                width: '100%',
                padding: '8px 30px 8px 12px',
                borderRadius: 6,
                border: '1px solid #94a3b8',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                fontWeight: 600
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
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
                  padding: 2
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Catégories Quick Filter */}
          {categories.length > 0 && (
            <div className="horizontal-scroll-fade" style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setSelectedCategory('tous')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: selectedCategory === 'tous' ? '#0284c7' : '#f1f5f9',
                  color: selectedCategory === 'tous' ? '#ffffff' : '#475569'
                }}
              >
                {t('common.all')} ({produits.length})
              </button>
              {categories.map(cat => {
                const count = produits.filter(p => p.categorie === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      background: selectedCategory === cat ? '#0284c7' : '#f1f5f9',
                      color: selectedCategory === cat ? '#ffffff' : '#475569'
                    }}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Option Hors Catalogue / Custom */}
          {allowCustom && (
            <div
              onClick={() => handleSelect('custom', null)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                background: value === 'custom' ? '#e0f2fe' : '#f8fafc',
                border: '1px dashed #0284c7',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 700,
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{displayCustomLabel}</span>
              <span style={{ fontSize: 10, background: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>
                {t('shop.freeItemTag')}
              </span>
            </div>
          )}

          {/* Liste Scrollable des Produits */}
          <div style={{ overflowY: 'auto', maxHeight: 220, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {produitsFiltres.length === 0 ? (
              <div style={{ padding: '14px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                {t('shop.noProductsMatchSearch')}
              </div>
            ) : (
              produitsFiltres.map(p => {
                const isSelected = p.id === value
                const stock = p.stock_quantite ?? p.quantite_stock ?? 0

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p.id, p)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: isSelected ? '#f0f9ff' : 'transparent',
                      borderLeft: isSelected ? '3px solid #0284c7' : '3px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#f8fafc'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12.5, fontWeight: isSelected ? 800 : 700, color: isSelected ? '#0369a1' : '#0f172a' }}>
                        {p.nom}
                      </div>
                      {p.categorie && (
                        <div style={{ fontSize: 10.5, color: '#64748b' }}>
                          📂 {p.categorie}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#0284c7' }}>
                        {fcfa(p.prix)}
                      </span>
                      {stock > 0 ? (
                        <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                          {t('shop.stockCountLabel')} {stock}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c', fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                          {t('shop.outOfStockBadge')}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
