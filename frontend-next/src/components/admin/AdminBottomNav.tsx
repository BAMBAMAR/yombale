'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Store, ShoppingBag, AlertTriangle, Menu } from 'lucide-react'

export default function AdminBottomNav() {
  const pathname = usePathname() || ''
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleMenuState = (e: Event) => {
      const custom = e as CustomEvent<{ open: boolean }>
      if (custom.detail && typeof custom.detail.open === 'boolean') {
        setIsMenuOpen(custom.detail.open)
      }
    }
    window.addEventListener('admin-menu-state', handleMenuState)
    return () => window.removeEventListener('admin-menu-state', handleMenuState)
  }, [])

  const toggleMenu = () => {
    window.dispatchEvent(new CustomEvent('toggle-admin-menu'))
  }

  const isTabActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="admin-bottom-nav" aria-label="Navigation mobile rapide administration">
      <Link
        href="/admin"
        className={`admin-bottom-nav-item ${isTabActive('/admin') ? 'active' : ''}`}
        aria-current={pathname === '/admin' ? 'page' : undefined}
      >
        <LayoutDashboard size={20} className="admin-bottom-nav-icon" />
        <span className="admin-bottom-nav-label">Accueil</span>
      </Link>

      <Link
        href="/admin/boutiques"
        className={`admin-bottom-nav-item ${isTabActive('/admin/boutiques') ? 'active' : ''}`}
        aria-current={isTabActive('/admin/boutiques') ? 'page' : undefined}
      >
        <Store size={20} className="admin-bottom-nav-icon" />
        <span className="admin-bottom-nav-label">Boutiques</span>
      </Link>

      <Link
        href="/admin/commandes"
        className={`admin-bottom-nav-item ${isTabActive('/admin/commandes') ? 'active' : ''}`}
        aria-current={isTabActive('/admin/commandes') ? 'page' : undefined}
      >
        <ShoppingBag size={20} className="admin-bottom-nav-icon" />
        <span className="admin-bottom-nav-label">Commandes</span>
      </Link>

      <Link
        href="/admin/signalements"
        className={`admin-bottom-nav-item ${isTabActive('/admin/signalements') || isTabActive('/admin/moderation') || isTabActive('/admin/avis') ? 'active' : ''}`}
        aria-current={isTabActive('/admin/signalements') ? 'page' : undefined}
      >
        <AlertTriangle size={20} className="admin-bottom-nav-icon" />
        <span className="admin-bottom-nav-label">Modération</span>
      </Link>

      <button
        type="button"
        onClick={toggleMenu}
        className={`admin-bottom-nav-item admin-bottom-nav-menu-btn ${isMenuOpen ? 'active' : ''}`}
        aria-label="Ouvrir le menu complet d'administration"
        aria-expanded={isMenuOpen}
      >
        <Menu size={20} className="admin-bottom-nav-icon" />
        <span className="admin-bottom-nav-label">Menu</span>
      </button>
    </nav>
  )
}
