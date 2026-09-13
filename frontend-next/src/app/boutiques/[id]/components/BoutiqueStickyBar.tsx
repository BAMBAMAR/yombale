'use client'

import React from 'react'
import { Store, ShoppingCart, MessageCircle, CreditCard } from 'lucide-react'
import { BoutiqueData } from './types'

interface BoutiqueStickyBarProps {
  isSticky: boolean
  isCreditMode: boolean
  boutique: BoutiqueData
  boutiqueKey: string
  whatsappUrl: string | null
  couleurTheme: string
  contrastBtnText: string
  currentRadius: string
  cartCount: number
  openCart: (boutiqueKey: string, id: string) => void
}

export default function BoutiqueStickyBar({
  isSticky,
  isCreditMode,
  boutique,
  boutiqueKey,
  whatsappUrl,
  couleurTheme,
  contrastBtnText,
  currentRadius,
  cartCount,
  openCart,
}: BoutiqueStickyBarProps) {
  return (
    <>
      {/* BARRE STICKY D'EN-TÊTE AU DÉFILEMENT */}
      {isSticky && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 900,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e5e7eb',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            animation: 'slideDown 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Store size={20} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: 14,
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {boutique.nom}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{boutique.ville}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25d366',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
            <button
              onClick={() => openCart(boutiqueKey, boutique.id)}
              style={{
                background: couleurTheme,
                color: contrastBtnText,
                border: 'none',
                borderRadius: currentRadius,
                padding: '7px 14px',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ShoppingCart size={15} />
              <span>Panier</span>
              {cartCount > 0 && (
                <span
                  style={{
                    background: '#fff',
                    color: couleurTheme,
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* BANNIÈRE DEMANDE DE CRÉDIT CLIENT EN BOUTIQUE */}
      {isCreditMode && (
        <div
          style={{
            background: '#f0f9ff',
            border: '1.5px solid #0284c7',
            padding: '14px 18px',
            borderRadius: 16,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: 14.5, color: '#0369a1' }}>
                Mode Demande d&apos;Achat à Crédit (Carnet Client)
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                Choisissez vos articles, ajoutez-les au panier et sélectionnez &quot;Demande d&apos;Achat à Crédit&quot;. Le commerçant la validera au comptoir !
              </p>
            </div>
          </div>
          <button
            onClick={() => openCart(boutiqueKey, boutique.id)}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShoppingCart size={16} /> Ouvrir mon Panier
          </button>
        </div>
      )}
    </>
  )
}
