'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingBag, ChevronRight, Store, Tag } from 'lucide-react'
import { type BoutiqueItem } from './SurgaShoppingCards'

interface SurgaShoppingDashboardCardProps {
  onOuvrirModal: () => void
}

export default function SurgaShoppingDashboardCard({
  onOuvrirModal,
}: SurgaShoppingDashboardCardProps) {
  const [boutiqueDuMoment, setBoutiqueDuMoment] = useState<BoutiqueItem | null>(null)

  useEffect(() => {
    fetch('/api/surga/shopping?limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.boutiques) && data.boutiques.length > 0) {
          setBoutiqueDuMoment(data.boutiques[0])
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div
      className="surga-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        backgroundColor: '#FFFFFF',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(199, 91, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #C75B00)',
            }}
          >
            <ShoppingBag size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Shopping &amp; Boutiques Nopalou
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
              Boutiques marchandes et articles certifiés
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOuvrirModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent, #C75B00)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span>Explorer</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {boutiqueDuMoment && (
        <div
          onClick={onOuvrirModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: 8,
            backgroundColor: 'var(--surga-bg, #F8FAFC)',
            border: '1px solid var(--surga-border, #E2E8F0)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {boutiqueDuMoment.logo ? (
              <img
                src={boutiqueDuMoment.logo}
                alt={boutiqueDuMoment.nom}
                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: 'var(--navy, #1C2B4A)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {boutiqueDuMoment.nom.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                {boutiqueDuMoment.nom}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                {boutiqueDuMoment.categorie} • {boutiqueDuMoment.ville}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--price, #0A5C36)',
              backgroundColor: 'rgba(10, 92, 54, 0.08)',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {boutiqueDuMoment.total_produits || 12} articles
          </span>
        </div>
      )}
    </div>
  )
}
