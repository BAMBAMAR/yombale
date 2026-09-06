'use client'

import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function NavbarCartBtn() {
  const { totalItemCount, openCart } = useCart()

  return (
    <button
      type="button"
      onClick={() => openCart()}
      className="navbar-cart-btn"
      aria-label={`Panier (${totalItemCount} article${totalItemCount > 1 ? 's' : ''})`}
      title="Mon panier"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'rgba(28,43,74,0.04)',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 10,
        width: 38,
        height: 38,
        color: 'var(--navy, #1C2B4A)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
    >
      <ShoppingCart size={18} />
      {totalItemCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            background: 'var(--accent, #C75B00)',
            color: '#ffffff',
            fontSize: 10.5,
            fontWeight: 900,
            height: 18,
            minWidth: 18,
            padding: '0 4px',
            borderRadius: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(199,91,0,0.35)',
            lineHeight: 1,
          }}
        >
          {totalItemCount > 99 ? '99+' : totalItemCount}
        </span>
      )}
    </button>
  )
}
