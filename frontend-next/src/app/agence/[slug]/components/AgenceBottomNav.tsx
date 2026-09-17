'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Plus, Users2, Menu } from 'lucide-react'

interface AgenceBottomNavProps {
  slug: string
  onOpenQuickActions: () => void
  onOpenDrawer: () => void
  compteursTotal?: number
}

export function AgenceBottomNav({
  slug,
  onOpenQuickActions,
  onOpenDrawer,
  compteursTotal = 0,
}: AgenceBottomNavProps) {
  const pathname = usePathname()

  const isDashboardActive = pathname === `/agence/${slug}`
  const isBiensActive = pathname.startsWith(`/agence/${slug}/biens`)
  const isProspectsActive = pathname.startsWith(`/agence/${slug}/prospects`)

  return (
    <nav className="immo-bottom-nav immo-mobile-only" aria-label="Navigation principale mobile">
      {/* 1. Tableau de bord */}
      <Link
        href={`/agence/${slug}`}
        className={`immo-bottom-nav-item ${isDashboardActive ? 'active' : ''}`}
        aria-label="Tableau de bord agence"
      >
        <LayoutDashboard size={20} />
        <span>Accueil</span>
      </Link>

      {/* 2. Biens Immobiliers */}
      <Link
        href={`/agence/${slug}/biens`}
        className={`immo-bottom-nav-item ${isBiensActive ? 'active' : ''}`}
        aria-label="Portefeuille de biens"
      >
        <Building2 size={20} />
        <span>Biens</span>
      </Link>

      {/* 3. Action Rapide FAB "+" */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onOpenQuickActions}
          className="immo-bottom-nav-fab"
          aria-label="Actions rapides agence"
          title="Ajouter un bien, prospect ou visite"
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>
      </div>

      {/* 4. Leads & CRM */}
      <Link
        href={`/agence/${slug}/prospects`}
        className={`immo-bottom-nav-item ${isProspectsActive ? 'active' : ''}`}
        aria-label="CRM Prospects et acquéreurs"
      >
        <Users2 size={20} />
        <span>Leads</span>
      </Link>

      {/* 5. Menu / Plus (Drawer) */}
      <button
        type="button"
        onClick={onOpenDrawer}
        className="immo-bottom-nav-item"
        aria-label="Menu complet des services de l'agence"
      >
        <div style={{ position: 'relative' }}>
          <Menu size={20} />
          {compteursTotal > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -6,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: 900,
                width: 15,
                height: 15,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {compteursTotal > 9 ? '9+' : compteursTotal}
            </span>
          )}
        </div>
        <span>Plus</span>
      </button>
    </nav>
  )
}

export default AgenceBottomNav
