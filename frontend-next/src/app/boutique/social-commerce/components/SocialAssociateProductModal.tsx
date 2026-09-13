'use client'

import React, { useState } from 'react'
import ExternalImg from '@/components/ExternalImg'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import { Search, ShoppingBag, X } from 'lucide-react'
import { ProduitCatalogue, SocialPostAdmin } from '../types'

interface SocialAssociateProductModalProps {
  post: SocialPostAdmin
  onClose: () => void
  catalogue: ProduitCatalogue[]
  onAssociateProduct: (productId: string) => Promise<void>
}

export function SocialAssociateProductModal({
  post,
  onClose,
  catalogue,
  onAssociateProduct,
}: SocialAssociateProductModalProps) {
  const [productSearch, setProductSearch] = useState('')

  const filteredCatalogue = catalogue.filter(
    p =>
      p.nom.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.categorie && p.categorie.toLowerCase().includes(productSearch.toLowerCase()))
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 540,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
              Associer un produit à cette publication
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Les acheteurs pourront l&apos;ajouter au panier ou le commander sur WhatsApp directement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Barre de recherche produit */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Rechercher par nom d'article ou catégorie..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Liste scrollable des produits */}
        <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredCatalogue.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
              Aucun produit trouvé dans votre catalogue.
            </p>
          ) : (
            filteredCatalogue.map(prod => {
              const alreadyLinked = post.produits?.some(p => p.id === prod.id)
              return (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: alreadyLinked ? '#f0fdf4' : '#f8fafc',
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
                    onClick={() => onAssociateProduct(prod.id)}
                    disabled={alreadyLinked}
                    style={{
                      background: alreadyLinked ? '#16a34a' : '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: alreadyLinked ? 'default' : 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {alreadyLinked ? '✓ Déjà lié' : 'Associer'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
