'use client'

import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Package,
  Plus,
  ShoppingBag,
  Menu,
  Users,
  Clock,
  ArrowDownLeft,
  ShoppingCart,
  Receipt,
  BarChart3,
} from 'lucide-react'

interface BoutiqueBottomNavProps {
  currentTab: string
  subTabCompta?: string
  onNavigateTab: (tab: any, subTab?: string) => void
  onOpenQuickActions: () => void
  onOpenDrawer: () => void
  nbEnAttente?: number
}

export default function BoutiqueBottomNav({
  currentTab,
  subTabCompta,
  onNavigateTab,
  onOpenQuickActions,
  onOpenDrawer,
  nbEnAttente = 0,
}: BoutiqueBottomNavProps) {
  const [isExpressMounted, setIsExpressMounted] = useState(false)
  const isCarnet = currentTab === 'carnet'
  const isExpress = currentTab === 'express' || (currentTab === 'compta' && subTabCompta === 'express') || isExpressMounted

  // État local synchronisé pour le filtre Carnet
  const [carnetFilter, setCarnetFilter] = useState<'tous' | 'retard' | 'credits'>('tous')
  // État local synchronisé pour le mode Express
  const [expressMode, setExpressMode] = useState<'vente' | 'depense'>('vente')

  useEffect(() => {
    const handleCarnetActiveFilter = (e: any) => {
      if (e.detail) setCarnetFilter(e.detail)
    }
    const handleExpressActiveMode = (e: any) => {
      if (e.detail) setExpressMode(e.detail)
    }
    const handleExpressMounted = (e: any) => {
      setIsExpressMounted(Boolean(e.detail))
    }

    window.addEventListener('nopalou:carnet:active_filter', handleCarnetActiveFilter)
    window.addEventListener('nopalou:express:active_mode', handleExpressActiveMode)
    window.addEventListener('nopalou:express:mounted', handleExpressMounted)
    return () => {
      window.removeEventListener('nopalou:carnet:active_filter', handleCarnetActiveFilter)
      window.removeEventListener('nopalou:express:active_mode', handleExpressActiveMode)
      window.removeEventListener('nopalou:express:mounted', handleExpressMounted)
    }
  }, [])

  // ── 1. MODE CONTEXTUEL : CARNET DE DETTES ──
  if (isCarnet) {
    return (
      <nav className="bq-bottom-nav" aria-label="Navigation contextuelle carnet de dettes">
        {/* Tous les Débiteurs */}
        <button
          type="button"
          onClick={() => {
            setCarnetFilter('tous')
            window.dispatchEvent(new CustomEvent('nopalou:carnet:filter', { detail: 'tous' }))
          }}
          className={`bq-bottom-nav-item ${carnetFilter === 'tous' ? 'active' : ''}`}
          aria-label="Afficher tous les clients débiteurs"
        >
          <Users size={20} />
          <span>Clients</span>
        </button>

        {/* Retards / Échéances dépassées */}
        <button
          type="button"
          onClick={() => {
            setCarnetFilter('retard')
            window.dispatchEvent(new CustomEvent('nopalou:carnet:filter', { detail: 'retard' }))
          }}
          className={`bq-bottom-nav-item ${carnetFilter === 'retard' ? 'active' : ''}`}
          aria-label="Filtrer les clients en retard de paiement"
        >
          <Clock size={20} />
          <span>Retards</span>
        </button>

        {/* FAB Central (+) Action Rapide Carnet */}
        <button
          type="button"
          onClick={onOpenQuickActions}
          className="bq-bottom-nav-fab"
          aria-label="Nouvelle dette ou encaissement carnet"
          title="Nouvelle dette, versement ou nouveau client"
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>

        {/* Avances / Soldes positifs */}
        <button
          type="button"
          onClick={() => {
            setCarnetFilter('credits')
            window.dispatchEvent(new CustomEvent('nopalou:carnet:filter', { detail: 'credits' }))
          }}
          className={`bq-bottom-nav-item ${carnetFilter === 'credits' ? 'active' : ''}`}
          aria-label="Clients avec solde créditeur ou avance"
        >
          <ArrowDownLeft size={20} />
          <span>Avances</span>
        </button>

        {/* Menu Général */}
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

  // ── 2. MODE CONTEXTUEL : SAISIE EXPRESS ──
  if (isExpress) {
    return (
      <nav className="bq-bottom-nav" aria-label="Navigation contextuelle saisie express">
        {/* Vente Express */}
        <button
          type="button"
          onClick={() => {
            setExpressMode('vente')
            window.dispatchEvent(new CustomEvent('nopalou:express:mode', { detail: 'vente' }))
          }}
          className={`bq-bottom-nav-item ${expressMode === 'vente' ? 'active' : ''}`}
          aria-label="Basculer sur l'enregistrement de vente express"
        >
          <ShoppingCart size={20} />
          <span>Ventes</span>
        </button>

        {/* Dépense Express */}
        <button
          type="button"
          onClick={() => {
            setExpressMode('depense')
            window.dispatchEvent(new CustomEvent('nopalou:express:mode', { detail: 'depense' }))
          }}
          className={`bq-bottom-nav-item ${expressMode === 'depense' ? 'active' : ''}`}
          aria-label="Basculer sur l'enregistrement de dépense express"
        >
          <Receipt size={20} />
          <span>Dépenses</span>
        </button>

        {/* FAB Central (+) Action Rapide Express */}
        <button
          type="button"
          onClick={onOpenQuickActions}
          className="bq-bottom-nav-fab"
          aria-label="Valider ou ajouter une saisie express"
          title="Valider la saisie"
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>

        {/* Bilan / Compta */}
        <button
          type="button"
          onClick={() => onNavigateTab('compta', 'bilan')}
          className="bq-bottom-nav-item"
          aria-label="Consulter le bilan comptable"
        >
          <BarChart3 size={20} />
          <span>Bilan</span>
        </button>

        {/* Menu Général */}
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

  // ── 3. MODE STANDARD (ACCUEIL MARCHAND) ──
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
