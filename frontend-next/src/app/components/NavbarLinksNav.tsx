'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NavbarGuides from '../NavbarGuides'

interface NavItem {
  href: string
  label: string
  badge?: string
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Produits', exact: true },
  { href: '/boutiques', label: 'Boutiques', badge: 'PRO' },
  { href: '/immo', label: 'Immobilier' },
  { href: '/agences', label: 'Agences Immo', badge: 'PRO' },
  { href: '/telecom', label: 'Télécoms' },
  { href: '/annonces', label: 'Annonces' },
]

export default function NavbarLinksNav() {
  const pathname = usePathname()

  return (
    <div className="navbar-links" style={{ whiteSpace: 'nowrap' }}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`navbar-link ${isActive ? 'navbar-link--active' : ''}`}
          >
            <span>{item.label}</span>
            {item.badge && (
              <span className="navbar-pro-badge">
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
      <NavbarGuides />
    </div>
  )
}
