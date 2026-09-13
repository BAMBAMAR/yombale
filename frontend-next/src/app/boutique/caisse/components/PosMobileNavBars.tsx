'use client'

import React from 'react'
import { LayoutGrid, Receipt } from 'lucide-react'

interface PosMobileTabsProps {
  tabMobile: 'catalogue' | 'ticket'
  setTabMobile: (tab: 'catalogue' | 'ticket') => void
  produitsFiltresCount: number
  totalArticlesPanier: number
  netAPayer: number
  formatPrice: (amount: number) => string
}

export function PosMobileTabs({
  tabMobile,
  setTabMobile,
  produitsFiltresCount,
  totalArticlesPanier,
  netAPayer,
  formatPrice,
}: PosMobileTabsProps) {
  return (
    <div className="caisse-mobile-tabs no-print" role="tablist" aria-label="Navigation caisse mobile">
      <button
        type="button"
        role="tab"
        aria-selected={tabMobile === 'catalogue'}
        onClick={() => setTabMobile('catalogue')}
        className={`caisse-mobile-tab-btn ${tabMobile === 'catalogue' ? 'active' : ''}`}
      >
        <LayoutGrid size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        <span>Catalogue ({produitsFiltresCount})</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={tabMobile === 'ticket'}
        onClick={() => setTabMobile('ticket')}
        className={`caisse-mobile-tab-btn ${totalArticlesPanier > 0 ? 'has-items' : ''} ${tabMobile === 'ticket' ? 'active' : ''}`}
      >
        <Receipt size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        <span>
          Ticket {totalArticlesPanier > 0 ? `(${totalArticlesPanier} · ${formatPrice(netAPayer)})` : '(0)'}
        </span>
      </button>
    </div>
  )
}

interface PosMobileStickyBottomProps {
  tabMobile: 'catalogue' | 'ticket'
  setTabMobile: (tab: 'catalogue' | 'ticket') => void
  totalArticlesPanier: number
  netAPayer: number
  formatPrice: (amount: number) => string
}

export function PosMobileStickyBottom({
  tabMobile,
  setTabMobile,
  totalArticlesPanier,
  netAPayer,
  formatPrice,
}: PosMobileStickyBottomProps) {
  if (tabMobile !== 'catalogue' || totalArticlesPanier === 0) {
    return null
  }

  return (
    <div className="caisse-sticky-bottom-bar no-print" aria-live="polite">
      <div className="caisse-sticky-bottom-info">
        <span className="caisse-sticky-count">
          {totalArticlesPanier} article{totalArticlesPanier > 1 ? 's' : ''} au ticket
        </span>
        <span className="caisse-sticky-total">{formatPrice(netAPayer)}</span>
      </div>
      <button
        type="button"
        onClick={() => setTabMobile('ticket')}
        className="caisse-sticky-btn"
        aria-label="Voir le ticket et encaisser"
      >
        <Receipt size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        <span>Voir le ticket ({totalArticlesPanier})</span>
      </button>
    </div>
  )
}
