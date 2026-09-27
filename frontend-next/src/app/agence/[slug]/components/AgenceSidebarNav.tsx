'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Home,
  FileSignature,
  Briefcase,
  Users2,
  Calendar,
  Key,
  UserCheck,
  Building2,
  Wrench,
  FileText,
  Percent,
  Wallet,
  CreditCard,
  Sparkles,
  Share2,
  ExternalLink,
  History,
  ShieldAlert,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface CompteursNavAlertes {
  demandes_visite: number
  loyers_retard: number
  mandats_expirants: number
  baux_expirants: number
  tickets_urgents: number
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  badge?: number | null
  badgeColor?: string
}

interface NavSection {
  titre: string
  items: NavItem[]
}

interface AgenceSidebarNavProps {
  slug: string
  compteurs?: CompteursNavAlertes
}

export function AgenceSidebarNav({
  slug,
  compteurs = {
    demandes_visite: 0,
    loyers_retard: 0,
    mandats_expirants: 0,
    baux_expirants: 0,
    tickets_urgents: 0,
  },
}: AgenceSidebarNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab')

  const navSections: NavSection[] = [
    {
      titre: 'Vue d’ensemble',
      items: [
        { href: `/agence/${slug}`, label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      titre: 'Transactions & Ventes',
      items: [
        { href: `/agence/${slug}/biens`, label: 'Biens Immobiliers', icon: Home },
        {
          href: `/agence/${slug}/mandats`,
          label: 'Mandats de Vente & Gestion',
          icon: FileSignature,
          badge: compteurs.mandats_expirants > 0 ? compteurs.mandats_expirants : null,
          badgeColor: '#D97706',
        },
        { href: `/agence/${slug}/transactions`, label: 'Pipeline des Transactions', icon: Briefcase },
        { href: `/agence/${slug}/prospects`, label: 'CRM Prospects & Acquéreurs', icon: Users2 },
        {
          href: `/agence/${slug}/visites`,
          label: 'Agenda & Visites',
          icon: Calendar,
          badge: compteurs.demandes_visite > 0 ? compteurs.demandes_visite : null,
          badgeColor: 'var(--accent, #C75B00)',
        },
      ],
    },
    {
      titre: 'Gestion Locative',
      items: [
        {
          href: `/agence/${slug}/locatif`,
          label: 'Loyers & Quittances',
          icon: Key,
          badge: compteurs.loyers_retard > 0 ? compteurs.loyers_retard : null,
          badgeColor: '#DC2626',
        },
        {
          href: `/agence/${slug}/locatif?tab=baux`,
          label: 'Contrats de Bail',
          icon: FileSignature,
          badge: compteurs.baux_expirants > 0 ? compteurs.baux_expirants : null,
          badgeColor: '#D97706',
        },
        { href: `/agence/${slug}/locataires`, label: 'Locataires', icon: UserCheck },
        { href: `/agence/${slug}/bailleurs`, label: 'Bailleurs Propriétaires', icon: Building2 },
        {
          href: `/agence/${slug}/maintenance`,
          label: 'Maintenance & Travaux',
          icon: Wrench,
          badge: compteurs.tickets_urgents > 0 ? compteurs.tickets_urgents : null,
          badgeColor: '#991B1B',
        },
      ],
    },
    {
      titre: 'Finance & Facturation',
      items: [
        { href: `/agence/${slug}/factures`, label: 'Factures d’Honoraires', icon: FileText },
        { href: `/agence/${slug}/commissions`, label: 'Commissions & Courtiers', icon: Percent },
        { href: `/agence/${slug}/compta`, label: 'Comptabilité & Bilan', icon: Wallet },
        { href: `/agence/${slug}/credits`, label: 'Crédits & Échelonnement', icon: CreditCard },
      ],
    },
    {
      titre: 'Marketing & Vitrine',
      items: [
        { href: `/agence/${slug}/studio`, label: 'Studio & Thèmes', icon: Sparkles },
        { href: `/agence/${slug}/social`, label: 'Social Shop & Réseaux', icon: Share2 },
        { href: `/agence/${slug}/vitrine`, label: 'Vitrine Publique', icon: ExternalLink },
      ],
    },
    {
      titre: 'Organisation & Légal',
      items: [
        { href: `/agence/${slug}/abonnement`, label: 'Abonnement & Sponsoring', icon: CreditCard },
        { href: `/agence/${slug}/equipe`, label: 'Équipe, Agents & Courtiers', icon: Users2 },
        { href: `/agence/${slug}/journal`, label: 'Journal d’Activité & Audit', icon: History },
        { href: `/agence/${slug}/fiscalite`, label: 'Fiscalité & Légal COCC', icon: ShieldAlert },
        { href: `/agence/${slug}/parametres`, label: 'Paramètres Agence', icon: Settings },
      ],
    },
  ]

  function isLinkActive(item: NavItem) {
    if (!pathname) return false

    const [baseHref, queryString] = item.href.split('?')
    const itemParams = new URLSearchParams(queryString || '')
    const itemTab = itemParams.get('tab')

    const pathMatches = item.exact
      ? pathname === baseHref
      : pathname === baseHref || (pathname.startsWith(baseHref + '/') && baseHref !== `/agence/${slug}`)

    if (!pathMatches) {
      return false
    }

    if (itemTab) {
      return currentTab === itemTab
    }

    if (baseHref.endsWith('/locatif')) {
      return !currentTab || currentTab === 'loyers'
    }

    return true
  }

  return (
    <nav className="workspace-sidebar-nav" aria-label="Menu principal de l'agence">
      {navSections.map(section => (
        <div key={section.titre} className="sidebar-section">
          <div className="sidebar-section-title">
            <span>{section.titre}</span>
          </div>
          <div>
            {section.items.map(item => {
              const Icon = item.icon
              const active = isLinkActive(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item ${active ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      style={{
                        background: item.badgeColor || 'var(--accent, #C75B00)',
                        color: '#FFFFFF',
                        fontSize: 10.5,
                        fontWeight: 900,
                        padding: '1px 6px',
                        borderRadius: 10,
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

export default AgenceSidebarNav
