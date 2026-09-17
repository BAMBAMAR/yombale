'use client'

import React from 'react'
import { LayoutDashboard, Package, Plus, ShoppingBag, Menu } from 'lucide-react'

interface BoutiqueBottomNavProps {
  currentTab: string
  onNavigateTab: (tab: any, subTab?: string) => void
  onOpenQuickActions: () => void
  onOpenDrawer: () => void
  nbEnAttente?: number
}

export default function BoutiqueBottomNav({
  currentTab,
  onNavigateTab,
  onOpenQuickActions,
  onOpenDrawer,
  nbEnAttente = 0,
}: BoutiqueBottomNavProps) {
  const isAccueil = currentTab === 'dashboard' || currentTab === 'analytics'
  const isCatalogue = currentTab === 'produits'
  const isCommandes = currentTab === 'commandes'

  return (
    <nav className="bq-bottom-nav" aria-label="Navigation marchande mobile">
      {/* 1. Accueil */}
      <button
        type="button"
        onClick={() => onNavigateTab('dashboard')}
        className={`bq-bottom-nav-item ${isAccueil ? 'active' : ''}`}
        aria-label="Tableau de bord accueil boutique"
      >
        <LayoutDashboard size={20} />
        <span>Accueil</span>
      </button>

      {/* 2. Catalogue (Stock) */}
      <button
        type="button"
        onClick={() => onNavigateTab('produits')}
        className={`bq-bottom-nav-item ${isCatalogue ? 'active' : ''}`}
        aria-label="Catalogue et stocks de la boutique"
      >
        <Package size={20} />
        <span>Catalogue</span>
      </button>

      {/* 3. Bouton FAB Central Surélevé (+) */}
      <button
        type="button"
        onClick={onOpenQuickActions}
        className="bq-bottom-nav-fab"
        aria-label="Actions rapides marchandes"
        title="Ajouter un produit, vente express, commande"
      >
        <Plus size={24} strokeWidth={2.6} />
      </button>

      {/* 4. Commandes */}
      <button
        type="button"
        onClick={() => onNavigateTab('commandes')}
        className={`bq-bottom-nav-item ${isCommandes ? 'active' : ''}`}
        aria-label="Commandes clients de la boutique"
      >
        <div style={{ position: 'relative' }}>
          <ShoppingBag size={20} />
          {nbEnAttente > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontSize: 9.5,
                fontWeight: 900,
                minWidth: 15,
                height: 15,
                padding: '0 3px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {nbEnAttente}
            </span>
          )}
        </div>
        <span>Commandes</span>
      </button>

      {/* 5. Menu (Tiroir complet) */}
      <button
        type="button"
        onClick={onOpenDrawer}
        className="bq-bottom-nav-item"
        aria-label="Menu complet de gestion"
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  )
}
