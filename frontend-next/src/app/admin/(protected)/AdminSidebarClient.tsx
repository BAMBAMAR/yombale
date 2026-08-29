'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Home, Store, Smartphone, ShieldCheck, Users, Star, Receipt, DollarSign, Target, Rocket, Handshake, MousePointer, Link2, Briefcase, Tag, MessageCircle, BookOpen, Palette, Terminal, Search, User, LogOut, Menu, X, Layers, Flag, Crown, Activity } from 'lucide-react'

interface AdminSidebarProps {
  logoutAction: () => Promise<void>
}

export default function AdminSidebarClient({ logoutAction }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navSections = [
    {
      title: 'Contenu & Catalogue',
      items: [
        { href: '/admin/categories', label: 'Catégories', icon: <Layers size={16} />, highlight: '#0284c7' },
        { href: '/admin/annonces', label: 'Annonces classifiées', icon: <FileText size={16} /> },
        { href: '/admin/immo', label: 'Immo à valider', icon: <Home size={16} /> },
        { href: '/admin/boutiques', label: 'Boutiques', icon: <Store size={16} /> },
        { href: '/admin/telecom', label: 'Forfaits télécom', icon: <Smartphone size={16} /> },
        { href: '/admin/qualite', label: 'Qualité Données', icon: <ShieldCheck size={16} /> },
      ]
    },
    {
      title: 'Monétisation & Facturation',
      items: [
        { href: '/admin/plans', label: 'Plans & Forfaits', icon: <Crown size={16} />, highlight: '#eab308' },
        { href: '/admin/abonnements', label: 'Abonnements', icon: <Star size={16} /> },
        { href: '/admin/comptes', label: 'Comptes utilisateurs', icon: <Users size={16} /> },
        { href: '/admin/paiements-manuels', label: 'Paiements manuels', icon: <Receipt size={16} /> },
        { href: '/admin/reversements', label: 'Reversements Wave 1-Clic', icon: <DollarSign size={16} />, highlight: '#1d4ed8' },
        { href: '/admin/revenus', label: 'Revenus & Finances', icon: <DollarSign size={16} /> },
      ]
    },
    {
      title: 'Marketing & Partenaires',
      items: [
        { href: '/admin/prospection', label: 'Prospection & Leads', icon: <Target size={16} />, highlight: '#16a34a' },
        { href: '/admin/force-de-vente', label: 'Force de Vente Terrain', icon: <Rocket size={16} />, highlight: '#C75B00' },
        { href: '/admin/partenaires', label: 'Partenaires', icon: <Handshake size={16} /> },
        { href: '/admin/affiliation', label: 'Affiliation', icon: <MousePointer size={16} /> },
        { href: '/admin/affiliates/tracking', label: 'Tracking Affiliates', icon: <Link2 size={16} /> },
        { href: '/admin/apporteurs', label: 'Apporteurs d\'affaires', icon: <Briefcase size={16} /> },
        { href: '/admin/tarifs', label: 'Tarifs & Promos', icon: <Tag size={16} /> },
      ]
    },
    {
      title: 'Canaux & Outils',
      items: [
        { href: '/admin/whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} /> },
        { href: '/admin/publications', label: 'Publications Facebook', icon: <BookOpen size={16} /> },
        { href: '/admin/communication', label: 'Kit communication', icon: <Palette size={16} /> },
        { href: '/admin/developer', label: 'Portail Développeur API', icon: <Terminal size={16} /> },
        { href: '/admin/seo', label: 'SEO', icon: <Search size={16} /> },
      ]
    },
    {
      title: 'Système & Pilotage',
      items: [
        { href: '/admin/feature-flags', label: 'Feature Flags (No-Code)', icon: <Flag size={16} />, highlight: '#9333ea' },
        { href: '/admin/audit-logs', label: 'Audit Logs & Traçabilité', icon: <ShieldCheck size={16} />, highlight: '#059669' },
        { href: '/admin/system', label: 'Santé Système & Exports', icon: <Activity size={16} />, highlight: '#0284c7' },
        { href: '/admin/compte', label: 'Mon compte', icon: <User size={16} /> },
      ]
    }
  ]

  return (
    <aside className={`admin-sidebar ${mobileMenuOpen ? 'admin-sidebar--mobile-open' : ''}`}>
      {/* Header Sidebar Desktop & Mobile */}
      <div className="admin-sidebar-header-row">
        <Link href="/admin" className="admin-logo" onClick={() => setMobileMenuOpen(false)}>
          Nopa<span>lou</span>
          <em>Admin</em>
        </Link>
        <button
          type="button"
          className="admin-mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu administration"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          <span>{mobileMenuOpen ? 'Fermer' : 'Menu Admin'}</span>
        </button>
      </div>

      <div className={`admin-sidebar-body ${mobileMenuOpen ? 'admin-sidebar-body--open' : ''}`}>
        <nav className="admin-nav">
          <Link
            href="/admin"
            className={`admin-nav-link ${pathname === '/admin' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="admin-nav-group">
              <span className="admin-nav-group-title">{section.title}</span>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-nav-link ${isActive ? 'active' : ''}`}
                    style={item.highlight ? { color: item.highlight, fontWeight: 700 } : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <form action={logoutAction} className="admin-logout-form">
          <button type="submit" className="admin-logout-btn">
            <LogOut size={15} style={{ marginRight: 6 }} />
            <span>Déconnexion</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
