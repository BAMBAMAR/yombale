'use client'

import React, { useState } from 'react'
import ExternalImg from '@/components/ExternalImg'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import { Search, ShoppingBag, X } from 'lucide-react'
import { ProduitCatalogue } from '../types'

interface SocialBatchProductModalProps {
  selectedCount: number
  catalogue: ProduitCatalogue[]
  batchLoading: boolean
  onClose: () => void
  onBatchAssociate: (productId: string) => Promise<void>
}

export function SocialBatchProductModal({
  selectedCount,
  catalogue,
  batchLoading,
  onClose,
  onBatchAssociate,
}: SocialBatchProductModalProps) {
  const [batchProductSearch, setBatchProductSearch] = useState('')

  const filteredBatchCatalogue = catalogue.filter(
    p =>
      p.nom.toLowerCase().includes(batchProductSearch.toLowerCase()) ||
      (p.categorie && p.categorie.toLowerCase().includes(batchProductSearch.toLowerCase()))
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 520,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Entête Modal */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
              Associer un produit par lot
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Le produit choisi sera associé aux <strong>{selectedCount} publications</strong> cochées.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Recherche Produit */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div className="saas-search-wrap">
            <Search size={14} className="saas-search-icon" />
            <input
              type="text"
              value={batchProductSearch}
              onChange={e => setBatchProductSearch(e.target.value)}
              placeholder="Rechercher par nom ou catégorie..."
              className="saas-search-input"
              autoFocus
            />
            {batchProductSearch && (
              <button
                type="button"
                onClick={() => setBatchProductSearch('')}
                className="saas-search-clear"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Liste scrollable des produits */}
        <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredBatchCatalogue.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>
              Aucun produit correspondant trouvé dans votre catalogue.
            </p>
          ) : (
            filteredBatchCatalogue.map(prod => (
              <div
                key={prod.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 6,
                      background: '#fff',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    {prod.images?.[0] ? (
                      <ExternalImg
                        src={cloudinaryHQ(prod.images[0], { width: 90 })}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShoppingBag size={16} style={{ color: '#94a3b8' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {prod.nom}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#C75B00' }}>
                      {prod.prix ? fcfa(prod.prix) : 'Sur demande'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onBatchAssociate(prod.id)}
                  disabled={batchLoading}
                  style={{
                    background: '#C75B00',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {batchLoading ? 'Association...' : 'Associer à la sélection'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
