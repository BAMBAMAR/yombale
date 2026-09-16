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
  Share2,
  Sparkles,
  Bell
} from 'lucide-react'
import '../agence.css'
import NotificationCenterModal, { NotificationItem, CompteursAlertes } from './components/NotificationCenterModal'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

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

  const isVitrineRoute = pathname?.endsWith('/vitrine') || pathname?.includes('/vitrine/')

  const [agence, setAgence] = useState<AgenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [compteurs, setCompteurs] = useState<CompteursAlertes>({
    demandes_visite: 0,
    loyers_retard: 0,
    mandats_expirants: 0,
    baux_expirants: 0,
    tickets_urgents: 0,
  })
  const [showNotifCenter, setShowNotifCenter] = useState(false)

  async function chargerNotifications() {
    try {
      const res = await fetch(`/api/agences/agence/${slug}/notifications`, {
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
        if (data.compteurs) setCompteurs(data.compteurs)
      }
    } catch (err) {
      console.error('[LOAD_NOTIFS_ERR]', err)
    }
  }

  async function chargerAgence() {
    try {
      setLoading(true)
      const res = await fetch(`/api/agences/${slug}`, {
        headers: getImmoAuthHeaders(),
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
    if (!isVitrineRoute && slug) {
      chargerAgence()
      chargerNotifications()
    }
  }, [slug, isVitrineRoute])

  if (isVitrineRoute) {
    return <>{children}</>
  }

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
        { href: `/agence/${slug}/mandats`, label: 'Mandats de Vente & Gestion', icon: FileSignature, badge: compteurs.mandats_expirants > 0 ? compteurs.mandats_expirants : null, badgeColor: '#D97706' },
        { href: `/agence/${slug}/transactions`, label: 'Pipeline des Transactions', icon: Briefcase },
        { href: `/agence/${slug}/prospects`, label: 'CRM Prospects & Acquéreurs', icon: Users2 },
        { href: `/agence/${slug}/visites`, label: 'Agenda & Visites', icon: Calendar, badge: compteurs.demandes_visite > 0 ? compteurs.demandes_visite : null, badgeColor: 'var(--accent, #C75B00)' },
      ],
    },
    {
      titre: 'Gestion Locative',
      items: [
        { href: `/agence/${slug}/locatif`, label: 'Baux, Loyers & Quittances', icon: Key, badge: compteurs.loyers_retard > 0 ? compteurs.loyers_retard : null, badgeColor: '#DC2626' },
        { href: `/agence/${slug}/locataires`, label: 'Locataires', icon: UserCheck },
        { href: `/agence/${slug}/bailleurs`, label: 'Bailleurs Propriétaires', icon: Building2 },
        { href: `/agence/${slug}/maintenance`, label: 'Maintenance & Travaux', icon: Wrench, badge: compteurs.tickets_urgents > 0 ? compteurs.tickets_urgents : null, badgeColor: '#991B1B' },
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
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {(item as any).badge ? (
                        <span
                          style={{
                            background: (item as any).badgeColor || 'var(--accent, #C75B00)',
                            color: '#FFFFFF',
                            fontSize: 10.5,
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: 10,
                          }}
                        >
                          {(item as any).badge}
                        </span>
                      ) : null}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowNotifCenter(true)}
              style={{
                position: 'relative',
                background: '#FAF8F5',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 6,
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--navy, #1C2B4A)',
              }}
              title="Centre d'alertes"
            >
              <Bell size={16} />
              {compteurs.demandes_visite + compteurs.loyers_retard + compteurs.mandats_expirants > 0 && (
                <span
                  style={{
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: 8,
                  }}
                >
                  {compteurs.demandes_visite + compteurs.loyers_retard + compteurs.mandats_expirants}
                </span>
              )}
            </button>

            <Link
              href="/agence"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#64748B',
                textDecoration: 'none',
              }}
            >
              Changer
            </Link>
          </div>
        </div>

        {/* Topbar Desktop */}
        <div
          style={{
            height: 52,
            borderBottom: '1px solid var(--border, #E8DDD2)',
            background: '#FFFFFF',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          className="desktop-topbar-immo"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              {agence?.nom}
            </span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>•</span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Portail de Gestion Immobilière</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setShowNotifCenter(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: '#FAF8F5',
                border: '1px solid var(--border, #E8DDD2)',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Centre de notifications et alertes"
            >
              <Bell size={15} />
              <span>Alertes & Notifs</span>
              {compteurs.demandes_visite + compteurs.loyers_retard + compteurs.mandats_expirants > 0 && (
                <span
                  style={{
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    fontSize: 10.5,
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: 10,
                  }}
                >
                  {compteurs.demandes_visite + compteurs.loyers_retard + compteurs.mandats_expirants}
                </span>
              )}
            </button>

            <Link
              href={`/agence/${slug}/vitrine`}
              target="_blank"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--navy, #1C2B4A)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                background: '#FAF8F5',
                border: '1px solid var(--border, #E8DDD2)',
              }}
            >
              <span>Vitrine Publique</span>
              <ExternalLink size={13} />
            </Link>
          </div>
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

      {/* ── Centre de Notifications Déroulant ── */}
      {showNotifCenter && (
        <NotificationCenterModal
          slug={slug}
          notifications={notifications}
          compteurs={compteurs}
          onClose={() => setShowNotifCenter(false)}
          onRefresh={chargerNotifications}
        />
      )}
    </div>
  )
}
