'use client'

import React, { useState, useMemo } from 'react'
import ExternalImg from '@/components/ExternalImg'
import { fcfa } from '@/lib/format'
import { Search, Sparkles, Check, X, Package } from 'lucide-react'
import { ProduitCatalogue, ProductMatchSuggestion } from '../types'

interface QuickProductPickerProps {
  catalogue: ProduitCatalogue[]
  suggestions?: ProductMatchSuggestion[]
  onSelect: (productId: string) => void
  onClose: () => void
  isSubmitting?: boolean
}

export function QuickProductPicker({
  catalogue,
  suggestions = [],
  onSelect,
  onClose,
  isSubmitting = false,
}: QuickProductPickerProps) {
  const [search, setSearch] = useState('')

  // Produits filtrés par recherche
  const filteredProducts = useMemo(() => {
    if (!search.trim()) {
      return catalogue.slice(0, 8)
    }
    const q = search.toLowerCase()
    return catalogue
      .filter(p => p.nom.toLowerCase().includes(q) || (p.categorie && p.categorie.toLowerCase().includes(q)))
      .slice(0, 10)
  }, [catalogue, search])

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #C75B00',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: 10,
        marginTop: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        zIndex: 50,
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Barre de recherche + bouton fermer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F8F5F0',
            border: '1px solid #E8DDD2',
            borderRadius: 6,
            padding: '4px 8px',
            flex: 1,
          }}
        >
          <Search size={14} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher un produit du catalogue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 12,
              width: '100%',
              color: '#1C2B4A',
            }}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: '#f1f5f9',
            border: 'none',
            borderRadius: 6,
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
          }}
          title="Fermer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Suggestions Smart Matching si disponibles et aucune recherche en cours */}
      {!search.trim() && suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#C75B00' }}>
            <Sparkles size={12} />
            <span>Suggestions intelligentes :</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {suggestions.slice(0, 3).map(sugg => {
              const p = sugg.produit
              const pct = Math.round(sugg.confidence_score * 100)
              return (
                <div
                  key={'sugg_' + p.id}
                  onClick={() => onSelect(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    borderRadius: 6,
                    background: '#FFF7ED',
                    border: '1px solid #FED7AA',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: '#e2e8f0',
                        flexShrink: 0,
                      }}
                    >
                      {p.images && p.images[0] ? (
                        <ExternalImg src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={14} style={{ color: '#94a3b8' }} />
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1C2B4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.nom}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '1px 4px',
                            borderRadius: 4,
                            background: '#ffedd5',
                            color: '#c2410c',
                          }}
                        >
                          {pct}%
                        </span>
                        {sugg.price_matched && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              padding: '1px 4px',
                              borderRadius: 4,
                              background: '#dcfce7',
                              color: '#0A5C36',
                            }}
                          >
                            Prix détecté
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0A5C36' }}>
                        {p.prix ? fcfa(p.prix) : 'Prix sur demande'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    style={{
                      background: '#C75B00',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} />
                    <span>Associer</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Liste des produits (recherche ou par défaut) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
        <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700 }}>
          {search.trim() ? `Résultats (${filteredProducts.length}) :` : 'Tous les produits :'}
        </span>
        {filteredProducts.length === 0 ? (
          <span style={{ fontSize: 11, color: '#94a3b8', padding: '6px 0', textAlign: 'center' }}>
            Aucun produit trouvé.
          </span>
        ) : (
          filteredProducts.map(prod => (
            <div
              key={prod.id}
              onClick={() => onSelect(prod.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px',
                borderRadius: 6,
                background: '#ffffff',
                border: '1px solid #E8DDD2',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8F5F0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    flexShrink: 0,
                  }}
                >
                  {prod.images && prod.images[0] ? (
                    <ExternalImg src={prod.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={12} style={{ color: '#94a3b8' }} />
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#1C2B4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {prod.nom}
                  </p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#0A5C36' }}>
                    {prod.prix ? fcfa(prod.prix) : '—'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                style={{
                  background: '#1C2B4A',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 6px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                Choisir
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
