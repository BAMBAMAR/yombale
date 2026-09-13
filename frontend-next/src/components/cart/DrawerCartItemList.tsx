'use client'
import React from 'react'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'
import { ShoppingBag, Trash2, Plus, Minus, Store } from 'lucide-react'
import { CartItem, BoutiqueCart } from '@/context/CartContext'

interface DrawerCartItemListProps {
  items: CartItem[]
  activeBoutiqueId: string | null
  carts: Record<string, BoutiqueCart>
  boutiquesWithItems: string[]
  setActiveBoutiqueId: (id: string) => void
  updateQuantity: (boutiqueId: string, itemId: string, delta: number) => void
  removeFromCart: (boutiqueId: string, itemId: string) => void
  closeCart: () => void
}

export default function DrawerCartItemList({
  items,
  activeBoutiqueId,
  carts,
  boutiquesWithItems,
  setActiveBoutiqueId,
  updateQuantity,
  removeFromCart,
  closeCart,
}: DrawerCartItemListProps) {
  return (
    <>
      {/* Multi-boutiques Switcher Tabs si articles dans plusieurs boutiques */}
      {boutiquesWithItems.length > 1 && (
        <div
          style={{
            padding: '8px 16px',
            background: '#F1F5F9',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
          }}
        >
          {boutiquesWithItems.map((bId) => {
            const bCart = carts[bId]
            const isSelected = activeBoutiqueId === bId
            const bCount = (bCart?.items || []).reduce((s, it) => s + (it.quantite || 0), 0)
            return (
              <button
                key={bId}
                type="button"
                onClick={() => setActiveBoutiqueId(bId)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: isSelected
                    ? '1.5px solid var(--accent, #C75B00)'
                    : '1px solid #CBD5E1',
                  background: isSelected ? '#FFF7ED' : '#FFFFFF',
                  color: isSelected ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Store size={13} />
                <span>{bCart?.boutiqueNom || 'Boutique'}</span>
                <span
                  style={{
                    background: isSelected ? 'var(--accent, #C75B00)' : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : '#475569',
                    padding: '1px 6px',
                    borderRadius: 8,
                    fontSize: 10.5,
                    fontWeight: 900,
                  }}
                >
                  {bCount}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'var(--orange2, #FFF3E8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <ShoppingBag size={32} style={{ color: 'var(--accent, #C75B00)' }} />
          </div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: 'var(--navy, #1C2B4A)',
              margin: '0 0 8px',
            }}
          >
            Votre panier est vide
          </h3>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text2, #6B5E52)',
              margin: '0 0 24px',
              maxWidth: 280,
              lineHeight: 1.5,
            }}
          >
            Parcourez nos boutiques partenaires pour ajouter des articles et commander rapidement.
          </p>
          <a
            href="/boutiques"
            onClick={closeCart}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              textDecoration: 'none',
              padding: '12px 22px',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 13.5,
              boxShadow: '0 4px 12px rgba(199,91,0,0.25)',
            }}
          >
            <Store size={16} />
            <span>Explorer les boutiques</span>
          </a>
        </div>
      ) : (
        /* Items List */
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px',
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid var(--border, #E8DDD2)',
                alignItems: 'center',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--bg, #F8F5F0)',
                }}
              >
                <ExternalImg
                  src={item.images?.[0]}
                  alt={item.nom}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: '0 0 2px',
                    fontWeight: 800,
                    fontSize: 13.5,
                    color: 'var(--navy, #1C2B4A)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.nom}
                </p>
                {item.detailsVariante && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      background: 'var(--bg, #F8F5F0)',
                      color: 'var(--text2, #6B5E52)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontWeight: 700,
                      marginBottom: 4,
                      border: '1px solid var(--border, #E8DDD2)',
                    }}
                  >
                    {item.detailsVariante}
                  </span>
                )}
                <div>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 900,
                      color: 'var(--accent, #C75B00)',
                    }}
                  >
                    {fcfa(item.prix)}
                  </span>
                </div>
              </div>

              {/* Sélecteur de Quantité */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#ffffff',
                  border: '1.5px solid var(--border, #E8DDD2)',
                  padding: '2px 4px',
                  borderRadius: 8,
                }}
              >
                <button
                  onClick={() => updateQuantity(activeBoutiqueId!, item.id, -1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    minWidth: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text2)',
                  }}
                  aria-label="Réduire"
                >
                  <Minus size={13} />
                </button>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    minWidth: 18,
                    textAlign: 'center',
                    color: 'var(--navy, #1C2B4A)',
                  }}
                >
                  {item.quantite}
                </span>
                <button
                  onClick={() => updateQuantity(activeBoutiqueId!, item.id, 1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    minWidth: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text2)',
                  }}
                  aria-label="Augmenter"
                >
                  <Plus size={13} />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(activeBoutiqueId!, item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DC2626',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
