'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Wallet, Plus, Tag, Menu } from 'lucide-react'

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
  const isKalpe = tab === 'kalpe' || tab === 'sama-xaalis'
  const isAnnonces = tab === 'mes-annonces' || pathname.startsWith('/mes-annonces')

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

      {/* 2. Sama Xaalis */}
      <Link
        href="/compte?tab=kalpe"
        className={`account-bottom-nav-item ${isKalpe ? 'active' : ''}`}
        aria-label="Sama Xaalis"
      >
        <Wallet size={20} />
        <span>Xaalis</span>
      </Link>

      {/* 3. Bouton FAB Central Surélevé (+) */}
      <button
        type="button"
        onClick={onOpenQuickActions}
        className="account-bottom-nav-fab"
        aria-label={isKalpe ? 'Actions rapides Sama Xaalis (Dépense, entrée, créance, dette, épargne)' : 'Publier ou ajouter'}
        title={isKalpe ? 'Sama Xaalis : Dépense, entrée, créance, dette, épargne' : 'Publier une annonce, vendre, créer boutique'}
      >
        <Plus size={24} strokeWidth={2.8} />
      </button>

      {/* 4. Mes Annonces */}
      <Link
        href="/compte?tab=mes-annonces"
        className={`account-bottom-nav-item ${isAnnonces ? 'active' : ''}`}
        aria-label="Mes annonces"
      >
        <Tag size={20} />
        <span>Annonces</span>
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
