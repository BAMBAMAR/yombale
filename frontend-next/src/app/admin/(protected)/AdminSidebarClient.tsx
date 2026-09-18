'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  User,
  Store,
  Package,
  ShoppingBag,
  Monitor,
  CreditCard,
  Rocket,
  Building2,
  Home,
  FileSpreadsheet,
  Wallet,
  ArrowDownLeft,
  Receipt,
  Crown,
  TrendingUp,
  Target,
  Sparkles,
  Award,
  Handshake,
  MousePointer,
  Briefcase,
  Layers,
  FileText,
  MessageCircle,
  Share2,
  Palette,
  Search,
  Smartphone,
  ShieldCheck,
  Flag,
  Activity,
  Server,
  Code,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import type { AdminUserSession } from '@/app/actions/admin'

interface AdminSidebarProps {
  logoutAction: () => Promise<void>
  adminUser?: AdminUserSession | null
}

interface DomainSection {
  id: string
  title: string
  items: {
    href: string
    label: string
    icon: React.ReactNode
    badge?: string
    highlight?: string
  }[]
}

const DOMAINS: DomainSection[] = [
  {
    id: 'direction',
    title: 'Pilotage & Direction',
    items: [
      { href: '/admin', label: 'Dashboard Métier', icon: <LayoutDashboard size={15} /> },
      { href: '/admin/system', label: 'Santé Système & Exports', icon: <Server size={15} /> },
    ],
  },
  {
    id: 'identites',
    title: 'Identités & Équipe',
    items: [
      { href: '/admin/comptes', label: 'Comptes Utilisateurs', icon: <Users size={15} /> },
      { href: '/admin/equipe-admin', label: 'Équipe & Droits RBAC', icon: <ShieldAlert size={15} />, highlight: '#f59e0b' },
      { href: '/admin/compte', label: 'Mon Compte', icon: <User size={15} /> },
    ],
  },
  {
    id: 'commerce',
    title: 'Commerce & POS',
    items: [
      { href: '/admin/boutiques', label: 'Réseau Boutiques', icon: <Store size={15} /> },
      { href: '/admin/produits', label: 'Modération Produits & Stock', icon: <Package size={15} />, highlight: '#0284c7' },
      { href: '/admin/commandes', label: 'Commandes Web', icon: <ShoppingBag size={15} /> },
      { href: '/admin/pos', label: 'Réseau POS & Caisses', icon: <Monitor size={15} />, highlight: '#10b981' },
      { href: '/admin/carnet-dettes', label: 'Carnet de Dettes & Crédits', icon: <CreditCard size={15} />, highlight: '#f97316' },
      { href: '/admin/migration', label: 'Migration Marchands', icon: <Rocket size={15} /> },
    ],
  },
  {
    id: 'immo',
    title: 'Immobilier & Patrimoine',
    items: [
      { href: '/admin/immo', label: "Vue d'ensemble & Validation", icon: <Home size={15} /> },
      { href: '/admin/immo/agences', label: 'Agences & Comptes Pro', icon: <Building2 size={15} />, highlight: '#8b5cf6' },
      { href: '/admin/immo/biens', label: 'Biens, Baux & Loyers', icon: <FileSpreadsheet size={15} /> },
      { href: '/admin/plans?categorie=immo', label: 'Forfaits Agences Immo', icon: <Crown size={15} />, highlight: '#f59e0b' },
    ],
  },
  {
    id: 'finances',
    title: 'Finances & Payouts',
    items: [
      { href: '/admin/paiements', label: 'Flux Wave/OM & Journal', icon: <Wallet size={15} />, highlight: '#3b82f6' },
      { href: '/admin/reversements', label: 'Reversements Wave 1-Clic', icon: <ArrowDownLeft size={15} /> },
      { href: '/admin/paiements-manuels', label: 'Paiements Manuels', icon: <Receipt size={15} /> },
      { href: '/admin/abonnements', label: 'Abonnements Marchands', icon: <Crown size={15} /> },
      { href: '/admin/plans', label: 'Plans & Grille Tarifaire', icon: <Award size={15} /> },
      { href: '/admin/revenus', label: 'Compte d\'Exploitation', icon: <TrendingUp size={15} /> },
    ],
  },
  {
    id: 'crm',
    title: 'CRM & Croissance',
    items: [
      { href: '/admin/prospection', label: 'Prospection & Leads', icon: <Target size={15} /> },
      { href: '/admin/prospection/intelligence', label: 'Intelligence Marché', icon: <Sparkles size={15} /> },
      { href: '/admin/force-de-vente', label: 'Force de Vente Terrain', icon: <Rocket size={15} /> },
      { href: '/admin/partenaires', label: 'Partenaires B2B', icon: <Handshake size={15} /> },
      { href: '/admin/affiliation', label: 'Réseau Affiliation', icon: <MousePointer size={15} /> },
      { href: '/admin/apporteurs', label: 'Apporteurs d\'Affaires', icon: <Briefcase size={15} /> },
    ],
  },
  {
    id: 'contenu',
    title: 'Contenu & Communication',
    items: [
      { href: '/admin/categories', label: 'Arborescence Catégories', icon: <Layers size={15} /> },
      { href: '/admin/annonces', label: 'Annonces Classifiées', icon: <FileText size={15} /> },
      { href: '/admin/whatsapp', label: 'WhatsApp Bot & Automation', icon: <MessageCircle size={15} /> },
      { href: '/admin/publications', label: 'Publications Réseaux', icon: <Share2 size={15} /> },
      { href: '/admin/communication', label: 'Kit Communication', icon: <Palette size={15} /> },
      { href: '/admin/seo', label: 'SEO & Référencement', icon: <Search size={15} /> },
      { href: '/admin/telecom', label: 'Forfaits Télécom', icon: <Smartphone size={15} /> },
    ],
  },
  {
    id: 'systeme',
    title: 'Sécurité & Infrastructure',
    items: [
      { href: '/admin/audit-logs', label: 'Audit Logs & Traçabilité', icon: <ShieldCheck size={15} />, highlight: '#10b981' },
      { href: '/admin/feature-flags', label: 'Feature Flags No-Code', icon: <Flag size={15} /> },
      { href: '/admin/qualite', label: 'Qualité Données', icon: <Activity size={15} /> },
      { href: '/admin/integrations', label: 'Intégrations & Webhooks', icon: <Code size={15} /> },
      { href: '/admin/developer', label: 'Portail Développeur API', icon: <Server size={15} /> },
    ],
  },
]

export default function AdminSidebarClient({ logoutAction, adminUser }: AdminSidebarProps) {
  const pathname = usePathname() || ''
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Accordeons ouverts par défaut si un lien est actif dedans
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

  const toggleDomain = (domainId: string) => {
    setOpenDomains((prev) => ({ ...prev, [domainId]: !prev[domainId] }))
  }

  const userInitial = (adminUser?.nom || 'Admin').charAt(0).toUpperCase()
  const userRoleFormatted = (adminUser?.role || 'super_admin').replace('_', ' ')

  return (
    <aside className={`admin-sidebar ${mobileMenuOpen ? 'admin-sidebar--mobile-open' : ''}`}>
      {/* Header Sidebar */}
      <div className="admin-sidebar-header-row">
        <Link
          href="/admin"
          className="admin-logo"
          onClick={() => setMobileMenuOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Image src="/icons/logo-mark.svg" alt="" width={24} height={24} style={{ flexShrink: 0 }} priority />
          <div>
            Nopa<span>lou</span>
            <em>Control Center</em>
          </div>
        </Link>
        <button
          type="button"
          className="admin-mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu administration"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          <span>{mobileMenuOpen ? 'Fermer' : 'Menu'}</span>
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

      <div className={`admin-sidebar-body ${mobileMenuOpen ? 'admin-sidebar-body--open' : ''}`}>
        <nav className="admin-nav">
          {DOMAINS.map((domain) => {
            const isOpen = openDomains[domain.id]
            const isDomainActive = domain.items.some(
              (it) => it.href === pathname || (it.href !== '/admin' && pathname.startsWith(it.href))
            )

            return (
              <div key={domain.id} className="admin-nav-group" style={{ marginTop: 8 }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 4, marginTop: 2 }}>
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
                          {item.icon}
                          <span style={{ flex: 1 }}>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <form action={logoutAction} className="admin-logout-form">
          <button type="submit" className="admin-logout-btn">
            <LogOut size={14} style={{ marginRight: 6 }} />
            <span>Déconnexion</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
