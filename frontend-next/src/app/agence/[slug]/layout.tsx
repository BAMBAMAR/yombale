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
import AgenceBottomNav from './components/AgenceBottomNav'
import AgenceQuickActionsSheet from './components/AgenceQuickActionsSheet'
import AgenceTopNavbar from './components/AgenceTopNavbar'
import AgenceMobileDrawer from './components/AgenceMobileDrawer'
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

  const [agence, setAgence] = useState<AgenceData | null>(() => {
    if (typeof window !== 'undefined' && slug) {
      try {
        const cachedAgenceStr = localStorage.getItem(`nopalou_offline_agence_${slug}`)
        if (cachedAgenceStr) {
          const parsed = JSON.parse(cachedAgenceStr)
          if (parsed?.id) return parsed
        }
        const allMineStr = localStorage.getItem('nopalou_offline_agences_mine')
        if (allMineStr) {
          const list = JSON.parse(allMineStr)
          if (Array.isArray(list)) {
            const found = list.find((a: any) => a.slug === slug || a.id === slug)
            if (found) return found
          }
        }
      } catch (_) {}
    }
    return null
  })
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && slug) {
      const cachedAgenceStr = localStorage.getItem(`nopalou_offline_agence_${slug}`)
      if (cachedAgenceStr) return false
      const allMineStr = localStorage.getItem('nopalou_offline_agences_mine')
      if (allMineStr) {
        try {
          const list = JSON.parse(allMineStr)
          if (Array.isArray(list) && list.some((a: any) => a.slug === slug || a.id === slug)) return false
        } catch (_) {}
      }
    }
    return true
  })
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
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
    const cachedNotifsStr = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_offline_agence_notifs_${slug}`) : null
    if (cachedNotifsStr) {
      try {
        const parsed = JSON.parse(cachedNotifsStr)
        if (Array.isArray(parsed?.notifications)) setNotifications(parsed.notifications)
        if (parsed?.compteurs) setCompteurs(parsed.compteurs)
      } catch (_) {}
    }

    try {
      const res = await fetch(`/api/agences/agence/${slug}/notifications`, {
        headers: getImmoAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
        if (data.compteurs) setCompteurs(data.compteurs)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nopalou_offline_agence_notifs_${slug}`, JSON.stringify(data))
        }
      }
    } catch (err) {
      console.warn('[LOAD_NOTIFS_ERR] (mode hors-ligne)', err)
    }
  }

  async function chargerAgence() {
    // 1. Initialisation instantanée depuis le cache hors-ligne
    let cachedAgenceStr = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_offline_agence_${slug}`) : null
    let hasCache = false
    if (!cachedAgenceStr && typeof window !== 'undefined') {
      const allMineStr = localStorage.getItem('nopalou_offline_agences_mine')
      if (allMineStr) {
        try {
          const list = JSON.parse(allMineStr)
          if (Array.isArray(list)) {
            const found = list.find((a: any) => a.slug === slug || a.id === slug)
            if (found) cachedAgenceStr = JSON.stringify(found)
          }
        } catch (_) {}
      }
    }
    if (cachedAgenceStr) {
      try {
        const parsed = JSON.parse(cachedAgenceStr)
        if (parsed?.id) {
          setAgence(parsed)
          hasCache = true
          setLoading(false)
        }
      } catch (_) {}
    }

    try {
      if (!hasCache) setLoading(true)
      const res = await fetch(`/api/agences/${slug}`, {
        headers: getImmoAuthHeaders(),
      })
      if (res.status === 401) {
        if (!hasCache) router.push(`/connexion?redirect=/agence/${slug}`)
        return
      }
      if (res.status === 403 || res.status === 404) {
        if (!hasCache) router.push('/agence')
        return
      }
      const data = await res.json()
      if (data.success && data.agence) {
        setAgence(data.agence)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nopalou_offline_agence_${slug}`, JSON.stringify(data.agence))
        }
      }
    } catch (err) {
      console.warn('[LOAD_AGENCE_ERR] (mode hors-ligne actif)', err)
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

  useEffect(() => {
    if (!isVitrineRoute) {
      document.body.classList.add('in-agence-workspace')
      return () => {
        document.body.classList.remove('in-agence-workspace')
      }
    }
  }, [isVitrineRoute])

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
        { href: `/agence/${slug}/locatif`, label: 'Loyers & Quittances', icon: Key, badge: compteurs.loyers_retard > 0 ? compteurs.loyers_retard : null, badgeColor: '#DC2626' },
        { href: `/agence/${slug}/locatif?tab=baux`, label: 'Contrats de Bail', icon: FileSignature },
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Entête Unique au niveau Nopalou (Desktop & Mobile 56px) ── */}
      <AgenceTopNavbar
        nom={agence?.nom || 'Agence'}
        slug={slug}
        ville={agence?.ville}
        sponsorise={agence?.sponsorise}
        totalAlertes={compteurs.demandes_visite + compteurs.loyers_retard + compteurs.mandats_expirants + compteurs.tickets_urgents}
        onOpenAlertes={() => setShowNotifCenter(true)}
        onOpenMenu={() => setMobileDrawerOpen(true)}
      />

      {/* ── Corps : Sidebar à gauche sous Nopalou + Contenu Principal ── */}
      <div className="workspace-layout">
        {/* ── Sidebar Desktop (Directement sous Nopalou à gauche) ── */}
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

        {/* ── Main Content Area (Directement sous l'entête unique sans barre redondante) ── */}
        <main className="workspace-content">{children}</main>
      </div>

      {/* ── Navigation Basse Persistante Mobile (< 768px) ── */}
      <AgenceBottomNav
        slug={slug}
        onOpenQuickActions={() => setQuickActionsOpen(true)}
        onOpenDrawer={() => setMobileDrawerOpen(true)}
        compteursTotal={compteurs.demandes_visite + compteurs.loyers_retard + compteurs.mandats_expirants + compteurs.tickets_urgents}
      />

      {/* ── Bottom Sheet d'Actions Rapides ── */}
      <AgenceQuickActionsSheet
        slug={slug}
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
      />

      {/* ── Tiroir Latéral Navigation Complète Mobile ── */}
      <AgenceMobileDrawer
        slug={slug}
        nom={agence?.nom || 'Agence'}
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        compteurs={compteurs}
      />

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
