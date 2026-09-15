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
  Wallet
} from 'lucide-react'
import '../agence.css'

interface AgenceData {
  id: string
  nom: string
  slug: string
  ville: string
  statut: string
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
      const res = await fetch(`/api/agences/${slug}`)
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

  const navItems = [
    { href: `/agence/${slug}`, label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
    { href: `/agence/${slug}/biens`, label: 'Biens Immobiliers', icon: Home },
    { href: `/agence/${slug}/prospects`, label: 'CRM Prospects', icon: Users2 },
    { href: `/agence/${slug}/locataires`, label: 'Locataires', icon: UserCheck },
    { href: `/agence/${slug}/visites`, label: 'Visites & Agenda', icon: Calendar },
    { href: `/agence/${slug}/locatif`, label: 'Loyers & Quittances', icon: Key },
    { href: `/agence/${slug}/bailleurs`, label: 'Bailleurs & Mandats', icon: Building2 },
    { href: `/agence/${slug}/compta`, label: 'Comptabilité & Bilan', icon: Wallet },
    { href: `/agence/${slug}/social`, label: 'Réseaux Sociaux & Vitrine', icon: ExternalLink },
    { href: `/agence/${slug}/fiscalite`, label: 'Fiscalité & Légal', icon: ShieldAlert },
    { href: `/agence/${slug}/equipe`, label: 'Équipe & Agents', icon: Users2 },
    { href: `/agence/${slug}/parametres`, label: 'Paramètres & Statut', icon: Settings },
  ]

  function isLinkActive(item: typeof navItems[0]) {
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
      <aside className="workspace-sidebar" style={{ display: 'none' }} id="agence-sidebar-desktop">
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
              <div style={{ fontSize: 11.5, color: '#64748B' }}>{agence?.ville || 'Dakar'}</div>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav style={{ padding: '12px 4px', flex: 1 }}>
          {navItems.map(item => {
            const Icon = item.icon
            const active = isLinkActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
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

      {/* ── Menu Mobile Toggle Bar ── */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
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

        {/* Tiroir Mobile */}
        {mobileMenuOpen && (
          <div
            style={{
              background: '#FFFFFF',
              borderBottom: '1px solid var(--border, #E8DDD2)',
              padding: '12px 16px',
            }}
          >
            {navItems.map(item => {
              const Icon = item.icon
              const active = isLinkActive(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sidebar-nav-item ${active ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Main Content Area ── */}
        <main className="workspace-content">{children}</main>
      </div>

      <style jsx global>{`
        @media (min-width: 1024px) {
          #agence-sidebar-desktop {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
