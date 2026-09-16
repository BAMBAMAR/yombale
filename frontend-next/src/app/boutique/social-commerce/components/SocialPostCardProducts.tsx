'use client'

import React, { useState } from 'react'
import { ShoppingBag, Plus, Sparkles } from 'lucide-react'
import { fcfa } from '@/lib/format'
import { ProduitCatalogue, SocialPostAdmin } from '../types'
import { QuickProductPicker } from './QuickProductPicker'

interface SocialPostCardProductsProps {
  post: SocialPostAdmin
  catalogue: ProduitCatalogue[]
  smartSuggestions: Array<{ produit: ProduitCatalogue; confidence_score: number }>
  onDissociateProduct: (postId: string, productId: string) => void
  onOpenAssociateModal: (post: SocialPostAdmin) => void
  onDirectAssociate?: (postId: string, productId: string) => Promise<void> | void
}

export function SocialPostCardProducts({
  post,
  catalogue,
  smartSuggestions,
  onDissociateProduct,
  onOpenAssociateModal,
  onDirectAssociate,
}: SocialPostCardProductsProps) {
  const [showQuickPicker, setShowQuickPicker] = useState(false)
  const [associating, setAssociating] = useState(false)

  const topSuggestion = smartSuggestions[0]

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        {post.produits && post.produits.length > 0 ? (
          <>
            {post.produits.map((prod) => (
              <span key={prod.id} className="social-prod-pill">
                <ShoppingBag size={10} style={{ color: '#C75B00', flexShrink: 0 }} />
                <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prod.nom} ({prod.prix ? fcfa(prod.prix) : '—'})
                </span>
                <button
                  onClick={() => onDissociateProduct(post.id, prod.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    fontSize: 12,
                    lineHeight: 1,
                    marginLeft: 2,
                  }}
                  title="Dissocier ce produit"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={() => setShowQuickPicker(!showQuickPicker)}
              style={{
                background: '#fff',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
                borderRadius: 6,
                padding: '2px 5px',
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
              }}
              title="Associer un autre produit"
            >
              +
            </button>
          </>
        ) : topSuggestion ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 11,
              }}
            >
              <Sparkles size={12} style={{ color: '#C75B00', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: '#9a3412' }}>
                Suggéré ({Math.round(topSuggestion.confidence_score * 100)}%) : {topSuggestion.produit.nom}{' '}
                {topSuggestion.produit.prix ? `(${fcfa(topSuggestion.produit.prix)})` : ''}
              </span>
              <button
                type="button"
                disabled={associating}
                onClick={async () => {
                  if (onDirectAssociate) {
                    setAssociating(true)
                    await onDirectAssociate(post.id, topSuggestion.produit.id)
                    setAssociating(false)
                  } else {
                    onOpenAssociateModal(post)
                  }
                }}
                style={{
                  background: '#C75B00',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: associating ? 'not-allowed' : 'pointer',
                }}
              >
                {associating ? '...' : 'Associer en 1 clic'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickPicker(!showQuickPicker)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                borderRadius: 6,
                padding: '2px 6px',
                fontSize: 10.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Plus size={10} />
              <span>Autre</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowQuickPicker(!showQuickPicker)}
            style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#c2410c',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Plus size={11} />
            <span>Associer un produit</span>
          </button>
        )}
      </div>

      {showQuickPicker && (
        <QuickProductPicker
          catalogue={catalogue}
          suggestions={smartSuggestions}
          onSelect={async (prodId) => {
            if (onDirectAssociate) {
              setAssociating(true)
              await onDirectAssociate(post.id, prodId)
              setAssociating(false)
            }
            setShowQuickPicker(false)
          }}
          onClose={() => setShowQuickPicker(false)}
          isSubmitting={associating}
        />
      )}
    </>
  )
}
