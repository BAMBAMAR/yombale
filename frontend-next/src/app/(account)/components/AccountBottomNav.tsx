'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Tag, Plus, Package, Menu } from 'lucide-react'

interface AccountBottomNavProps {
  onOpenQuickActions: () => void
  onOpenDrawer: () => void
}

export default function AccountBottomNav({
  onOpenQuickActions,
  onOpenDrawer,
}: AccountBottomNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || ''

  const isDashboard = pathname === '/compte' && (!tab || tab === 'accueil' || tab === 'dashboard')
  const isAnnonces = tab === 'mes-annonces' || pathname.startsWith('/mes-annonces')
  const isCommandes = tab === 'suivi-commande'

  return (
    <nav className="account-bottom-nav" aria-label="Navigation mobile de mon compte">
      {/* 1. Tableau de bord */}
      <Link
        href="/compte"
        className={`account-bottom-nav-item ${isDashboard ? 'active' : ''}`}
        aria-label="Tableau de bord"
      >
        <LayoutDashboard size={20} />
        <span>Accueil</span>
      </Link>

      {/* 2. Mes Annonces */}
      <Link
        href="/compte?tab=mes-annonces"
        className={`account-bottom-nav-item ${isAnnonces ? 'active' : ''}`}
        aria-label="Mes annonces"
      >
        <Tag size={20} />
        <span>Annonces</span>
      </Link>

      {/* 3. Bouton FAB Central Surélevé (+) */}
      <button
        type="button"
        onClick={onOpenQuickActions}
        className="account-bottom-nav-fab"
        aria-label="Publier ou ajouter"
        title="Publier une annonce, vendre, créer boutique"
      >
        <Plus size={24} strokeWidth={2.8} />
      </button>

      {/* 4. Suivi Commandes */}
      <Link
        href="/compte?tab=suivi-commande"
        className={`account-bottom-nav-item ${isCommandes ? 'active' : ''}`}
        aria-label="Suivi de mes commandes"
      >
        <Package size={20} />
        <span>Commandes</span>
      </Link>

      {/* 5. Menu / Tiroir latéral */}
      <button
        type="button"
        onClick={onOpenDrawer}
        className="account-bottom-nav-item"
        aria-label="Menu et réglages du compte"
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  )
}
