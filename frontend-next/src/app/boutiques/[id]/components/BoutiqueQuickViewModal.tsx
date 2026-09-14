'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingCart, X } from 'lucide-react'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import { Produit } from './types'

interface BoutiqueQuickViewModalProps {
  quickViewProduct: Produit | null
  onClose: () => void
  boutiqueKey: string
  boutiqueNom: string
  whatsapp?: string | null
  couleurTheme: string
  contrastBtnText: string
  currentRadius: string
}

export default function BoutiqueQuickViewModal({
  quickViewProduct,
  onClose,
  boutiqueKey,
  boutiqueNom,
  whatsapp,
  couleurTheme,
  contrastBtnText,
  currentRadius,
}: BoutiqueQuickViewModalProps) {
  const { addToCart } = useCart()

  if (!quickViewProduct) return null

  const isEnStock =
    (quickViewProduct.quantite_stock ?? quickViewProduct.stock_quantite) != null
      ? Number(quickViewProduct.quantite_stock ?? quickViewProduct.stock_quantite) > 0
      : quickViewProduct.en_stock !== false

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: 'relative', width: '100%', height: 260, background: '#f8fafc' }}>
          {quickViewProduct.images?.[0] ? (
            <img
              src={cloudinaryHQ(quickViewProduct.images[0], { width: 800 })}
              alt={quickViewProduct.nom}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={48} style={{ color: '#9ca3af' }} />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 22 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#111827' }}>
            {quickViewProduct.nom}
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 900, color: couleurTheme }}>
            {quickViewProduct.prix ? fcfa(quickViewProduct.prix) : 'Prix sur demande'}
          </p>
          {quickViewProduct.description && (
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>
              {quickViewProduct.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                addToCart(boutiqueKey, boutiqueNom, quickViewProduct, whatsapp)
                onClose()
              }}
              disabled={!isEnStock}
              style={{
                flex: 1,
                background: couleurTheme,
                color: contrastBtnText,
                border: 'none',
                borderRadius: currentRadius,
                padding: '12px',
                fontWeight: 800,
                fontSize: 14,
                cursor: isEnStock ? 'pointer' : 'not-allowed',
                opacity: isEnStock ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <ShoppingCart size={16} />
              <span>{isEnStock ? 'Ajouter au panier' : 'Rupture'}</span>
            </button>
            <Link
              href={`/boutiques/${boutiqueKey}/produits/${quickViewProduct.id}`}
              style={{
                background: '#f1f5f9',
                color: '#1e3a5f',
                padding: '12px 18px',
                borderRadius: currentRadius,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Voir fiche complète →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
