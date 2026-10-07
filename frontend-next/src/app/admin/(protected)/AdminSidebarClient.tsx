'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import type { AdminUserSession } from '@/app/actions/admin'
import { DOMAINS, type DomainSection } from './adminNavConfig'

interface AdminSidebarProps {
  logoutAction: () => Promise<void>
  adminUser?: AdminUserSession | null
}

export default function AdminSidebarClient({ logoutAction, adminUser }: AdminSidebarProps) {
  const pathname = usePathname() || ''
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const userRole = adminUser?.role || 'super_admin'

  // Écoute des bascules mobiles depuis la barre basse, le header ou le clavier
  useEffect(() => {
    const handleToggle = () => setMobileMenuOpen((prev) => !prev)
    const handleOpen = () => setMobileMenuOpen(true)
    const handleClose = () => setMobileMenuOpen(false)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }

    window.addEventListener('toggle-admin-menu', handleToggle)
    window.addEventListener('open-admin-menu', handleOpen)
    window.addEventListener('close-admin-menu', handleClose)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('toggle-admin-menu', handleToggle)
      window.removeEventListener('open-admin-menu', handleOpen)
      window.removeEventListener('close-admin-menu', handleClose)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Synchronisation de l'état ouvert vers les autres composants
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('admin-menu-state', { detail: { open: mobileMenuOpen } }))
    if (typeof document !== 'undefined') {
      if (mobileMenuOpen) {
        document.body.classList.add('admin-drawer-open')
      } else {
        document.body.classList.remove('admin-drawer-open')
      }
    }
  }, [mobileMenuOpen])

  // Filtrage RBAC par rôle
  const rbacDomains = useMemo(() => {
    return DOMAINS.map((domain) => {
      if (userRole === 'super_admin') return domain

      if (userRole === 'finance') {
        if (domain.id === 'direction' || domain.id === 'finances') return domain
        if (domain.id === 'systeme') {
          return { ...domain, items: domain.items.filter((it) => it.href === '/admin/compte') }
        }
        return null
      }

      if (userRole === 'moderateur') {
        if (['moderation', 'immo'].includes(domain.id)) return domain
        if (domain.id === 'commerce') {
          return { ...domain, items: domain.items.filter((it) => it.href === '/admin/produits') }
        }
        if (domain.id === 'systeme') {
          return { ...domain, items: domain.items.filter((it) => it.href === '/admin/compte') }
        }
        return null
      }

      if (userRole === 'support_client') {
        if (domain.id === 'direction') {
          return { ...domain, items: domain.items.filter((it) => it.href === '/admin') }
        }
        if (domain.id === 'commerce') {
          return { ...domain, items: domain.items.filter((it) => it.href === '/admin/commandes') }
        }
        if (domain.id === 'moderation') {
          return {
            ...domain,
            items: domain.items.filter((it) => ['/admin/signalements', '/admin/support'].includes(it.href)),
          }
        }
        if (domain.id === 'croissance') {
          return { ...domain, items: domain.items.filter((it) => it.href === '/admin/whatsapp') }
        }
        if (domain.id === 'systeme') {
          return {
            ...domain,
            items: domain.items.filter((it) => ['/admin/comptes', '/admin/compte'].includes(it.href)),
          }
        }
        return null
      }

      if (userRole === 'admin_operationnel') {
        if (domain.id === 'systeme') {
          return {
            ...domain,
            items: domain.items.filter(
              (it) => !['/admin/equipe-admin', '/admin/audit-logs', '/admin/developer'].includes(it.href)
            ),
          }
        }
        return domain
      }

      return domain
    }).filter(Boolean) as DomainSection[]
  }, [userRole])

  // Filtrage dynamique avec la barre de recherche rapide de la sidebar
  const visibleDomains = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rbacDomains

    return rbacDomains
      .map((domain) => {
        const matchingItems = domain.items.filter(
          (it) => it.label.toLowerCase().includes(q) || it.href.toLowerCase().includes(q)
        )
        const domainMatches = domain.title.toLowerCase().includes(q)
        if (domainMatches) return domain
        if (matchingItems.length > 0) return { ...domain, items: matchingItems }
        return null
      })
      .filter(Boolean) as DomainSection[]
  }, [rbacDomains, searchQuery])

  // État des accordéons
  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    DOMAINS.forEach((domain) => {
      const isDomainActive = domain.items.some(
        (it) => it.href === pathname || (it.href !== '/admin' && pathname.startsWith(it.href))
      )
      initial[domain.id] = isDomainActive || domain.id === 'direction' || domain.id === 'commerce'
    })
    return initial
  })

  // Quand une recherche est en cours, ouvrir automatiquement les domaines correspondants
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const allOpen: Record<string, boolean> = {}
      visibleDomains.forEach((d) => {
        allOpen[d.id] = true
      })
      setOpenDomains((prev) => ({ ...prev, ...allOpen }))
    }
  }, [searchQuery, visibleDomains])

  const toggleDomain = (domainId: string) => {
    setOpenDomains((prev) => ({ ...prev, [domainId]: !prev[domainId] }))
  }

  const userInitial = (adminUser?.nom || 'Admin').charAt(0).toUpperCase()
  const userRoleFormatted = (adminUser?.role || 'super_admin').replace('_', ' ')

  return (
    <>
      {/* En-tête mobile sticky (visible uniquement <= 900px) */}
      <header className="admin-mobile-topbar" aria-label="En-tête mobile administration">
        <Link href="/admin" className="admin-mobile-topbar-logo" onClick={() => setMobileMenuOpen(false)}>
          <Image src="/icons/logo-mark.svg" alt="" width={22} height={22} priority />
          <div>
            Nopa<span>lou</span>
            <em>Control Center</em>
          </div>
        </Link>
        <button
          type="button"
          className="admin-mobile-topbar-toggle"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Ouvrir le menu complet"
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </header>

      {/* Backdrop sombre pour le mode tiroir mobile */}
      <div
        className={`admin-sidebar-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'admin-sidebar--mobile-open' : ''}`} aria-label="Menu principal administration">
        {/* En-tête de la sidebar avec logo & bouton fermeture mobile */}
        <div className="admin-sidebar-header-row">
          <Link
            href="/admin"
            className="admin-logo"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image src="/icons/logo-mark.svg" alt="" width={24} height={24} style={{ flexShrink: 0 }} priority />
            <div>
              Nopa<span>lou</span>
              <em>Control Center</em>
            </div>
          </Link>
          <button
            type="button"
            className="admin-drawer-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profil de l'administrateur connecté */}
        <div className="admin-user-profile-badge">
          <div className="admin-user-avatar">{userInitial}</div>
          <div className="admin-user-info">
            <span className="admin-user-name">{adminUser?.nom || 'Super Admin'}</span>
            <span className="admin-user-role">{userRoleFormatted}</span>
          </div>
        </div>

        {/* Barre de recherche instantanée interne à la sidebar */}
        <div className="admin-sidebar-search-box">
          <Search size={14} className="admin-sidebar-search-icon" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer les modules..."
            className="admin-sidebar-search-input"
            aria-label="Filtrer les modules du menu"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="admin-sidebar-search-clear"
              aria-label="Effacer le filtre"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Corps défilable de navigation */}
        <div className={`admin-sidebar-body ${mobileMenuOpen ? 'admin-sidebar-body--open' : ''}`}>
          <nav className="admin-nav">
            {visibleDomains.length === 0 ? (
              <div className="admin-nav-empty">
                Aucun module ne correspond à &quot;{searchQuery}&quot;
              </div>
            ) : (
              visibleDomains.map((domain) => {
                const isOpen = openDomains[domain.id]
                const isDomainActive = domain.items.some(
                  (it) => it.href === pathname || (it.href !== '/admin' && pathname.startsWith(it.href))
                )

                return (
                  <div key={domain.id} className="admin-nav-group">
                    <button
                      type="button"
                      onClick={() => toggleDomain(domain.id)}
                      className={`admin-nav-accordion-header ${isDomainActive ? 'active-domain' : ''}`}
                      aria-expanded={isOpen}
                    >
                      <span>{domain.title}</span>
                      {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>

                    {isOpen && (
                      <div className="admin-nav-sublist">
                        {domain.items.map((item) => {
                          const isActive =
                            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`admin-nav-link ${isActive ? 'active' : ''}`}
                              style={item.highlight ? { color: item.highlight, fontWeight: 600 } : undefined}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <span className="admin-nav-icon">{item.icon}</span>
                              <span className="admin-nav-label">{item.label}</span>
                              {item.badge && (
                                <span className={`admin-nav-badge ${item.badge === 'Urgent' ? 'urgent' : ''}`}>
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </nav>

          <form action={logoutAction} className="admin-logout-form">
            <button type="submit" className="admin-logout-btn">
              <LogOut size={14} style={{ marginRight: 6 }} />
              <span>Déconnexion</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
