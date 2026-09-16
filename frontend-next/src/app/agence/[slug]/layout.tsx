'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import {
  Building2,
  LayoutDashboard,
  Home,
  Users2,
  Calendar,
  Key,
  UserCheck,
  ShieldAlert,
  Settings,
  ArrowLeft,
  Menu,
  X,
  ExternalLink,
  Wallet,
  Wrench,
  FileText,
  CreditCard,
  Briefcase,
  FileSignature,
  Percent,
  History,
  Share2
} from 'lucide-react'
import '../agence.css'

interface AgenceData {
  id: string
  nom: string
  slug: string
  ville: string
  statut: string
  abonnement_plan?: string
  sponsorise?: boolean
  sponsor_jusqu_au?: string
}

export default function AgenceWorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const slug = params?.slug as string

  const [agence, setAgence] = useState<AgenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function chargerAgence() {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`/api/agences/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.status === 401) {
        router.push(`/connexion?redirect=/agence/${slug}`)
        return
      }
      if (res.status === 403 || res.status === 404) {
        router.push('/agence')
        return
      }
      const data = await res.json()
      if (data.success) {
        setAgence(data.agence)
      }
    } catch (err) {
      console.error('[LOAD_AGENCE_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerAgence()
  }, [slug])

  const navSections = [
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
        { href: `/agence/${slug}/mandats`, label: 'Mandats de Vente & Gestion', icon: FileSignature },
        { href: `/agence/${slug}/transactions`, label: 'Pipeline des Transactions', icon: Briefcase },
        { href: `/agence/${slug}/prospects`, label: 'CRM Prospects & Acquéreurs', icon: Users2 },
        { href: `/agence/${slug}/visites`, label: 'Agenda & Visites', icon: Calendar },
      ],
    },
    {
      titre: 'Gestion Locative',
      items: [
        { href: `/agence/${slug}/locatif`, label: 'Baux, Loyers & Quittances', icon: Key },
        { href: `/agence/${slug}/locataires`, label: 'Locataires', icon: UserCheck },
        { href: `/agence/${slug}/bailleurs`, label: 'Bailleurs Propriétaires', icon: Building2 },
        { href: `/agence/${slug}/maintenance`, label: 'Maintenance & Travaux', icon: Wrench },
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

  function isLinkActive(item: { href: string; exact?: boolean }) {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
        <p>Chargement de l'espace Agence...</p>
      </div>
    )
  }

  return (
    <div className="workspace-layout">
      {/* ── Sidebar Desktop ── */}
      <aside className="workspace-sidebar">
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
          <Link
            href="/agence"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: '#64748B',
              textDecoration: 'none',
              marginBottom: 10,
            }}
          >
            <ArrowLeft size={14} />
            Toutes mes agences
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              {agence?.nom?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {agence?.nom}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ fontSize: 11, color: '#64748B' }}>{agence?.ville || 'Dakar'}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: agence?.sponsorise ? '#FEF3C7' : 'rgba(10, 92, 54, 0.1)',
                    color: agence?.sponsorise ? '#92400E' : 'var(--price, #0A5C36)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  {agence?.sponsorise ? '⭐ Vedette' : 'Essentiel'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Navigation avec Rubriques Thématiques */}
        <nav className="workspace-sidebar-nav">
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
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Pied de sidebar */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border, #E8DDD2)' }}>
          <Link
            href="/immo"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--accent, #C75B00)',
              textDecoration: 'none',
              padding: '8px',
              borderRadius: 6,
              background: 'rgba(199, 91, 0, 0.06)',
            }}
          >
            Marketplace Immo
            <ExternalLink size={13} />
          </Link>
        </div>
      </aside>

      {/* ── Menu Mobile Toggle Bar (Visible uniquement < 768px) ── */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="agence-topbar-mobile">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 6,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              {agence?.nom}
            </span>
          </div>

          <Link
            href="/agence"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#64748B',
              textDecoration: 'none',
            }}
          >
            Changer d'agence
          </Link>
        </div>

        {/* Tiroir Mobile avec Rubriques */}
        {mobileMenuOpen && (
          <div
            style={{
              background: '#FFFFFF',
              borderBottom: '1px solid var(--border, #E8DDD2)',
              padding: '12px 16px',
              maxHeight: '75vh',
              overflowY: 'auto',
            }}
          >
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
                        onClick={() => setMobileMenuOpen(false)}
                        className={`sidebar-nav-item ${active ? 'active' : ''}`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Main Content Area ── */}
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  )
}
