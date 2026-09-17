'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  X,
  LayoutDashboard,
  Tag,
  Home,
  Package,
  Bell,
  Heart,
  User,
  Users,
  Sparkles,
  Store,
  Building2,
  BookOpen,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

interface DrawerItem {
  href: string
  label: string
  tab?: string
  icon: any
  badge?: string
  external?: boolean
}

interface DrawerSection {
  titre: string
  items: DrawerItem[]
}

interface AccountMobileDrawerProps {
  nom: string
  email: string | null
  initiale: string
  isOpen: boolean
  onClose: () => void
}

export default function AccountMobileDrawer({
  nom,
  email,
  initiale,
  isOpen,
  onClose,
}: AccountMobileDrawerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'accueil'

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const sections: DrawerSection[] = [
    {
      titre: 'Mon Espace',
      items: [
        { href: '/compte', label: 'Tableau de bord', tab: 'accueil', icon: LayoutDashboard },
      ],
    },
    {
      titre: 'Annonces & Commandes',
      items: [
        { href: '/compte?tab=mes-annonces', label: 'Mes annonces', tab: 'mes-annonces', icon: Tag },
        { href: '/compte?tab=mes-annonces-immo', label: 'Mes annonces immo', tab: 'mes-annonces-immo', icon: Home },
        { href: '/compte?tab=suivi-commande', label: 'Suivi de commande', tab: 'suivi-commande', icon: Package },
        { href: '/compte?tab=mes-alertes', label: 'Mes alertes prix', tab: 'mes-alertes', icon: Bell },
        { href: '/compte?tab=favoris', label: 'Mes favoris', tab: 'favoris', icon: Heart },
      ],
    },
    {
      titre: 'Mon Compte',
      items: [
        { href: '/compte?tab=profil', label: 'Mon profil & sécurité', tab: 'profil', icon: User },
        {
          href: '/compte?tab=apporteur',
          label: 'Programme Apporteur',
          tab: 'apporteur',
          icon: Users,
          badge: '20%',
        },
        { href: '/compte?tab=fonctionnalites', label: 'Formules & Avantages', tab: 'fonctionnalites', icon: Sparkles },
      ],
    },
    {
      titre: 'Aide & Assistance',
      items: [
        { href: '/guide-emploi', label: 'Guide d’utilisation', icon: BookOpen, external: true },
      ],
    },
  ]

  function isItemActive(href: string, tab?: string) {
    if (tab === 'accueil') {
      return pathname === '/compte' && (!searchParams.get('tab') || searchParams.get('tab') === 'accueil')
    }
    if (tab) {
      return currentTab === tab
    }
    return pathname === href
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="account-drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="account-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '85%',
          maxWidth: 320,
          background: '#FFFFFF',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.15)',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu du compte"
      >
        {/* En-tête du Tiroir : Identité Utilisateur */}
        <div
          style={{
            padding: '18px 16px',
            background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 100%)',
            borderBottom: '1px solid #E8DDD2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {initiale}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nom}
              </div>
              {email && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#64748B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {email}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Fermer le menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Multi-Activity Switcher dans le Tiroir */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Link
              href="/boutique"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 8,
                background: '#FAF8F5',
                border: '1px solid #E8DDD2',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 11.5,
                fontWeight: 750,
                textDecoration: 'none',
              }}
            >
              <Store size={14} style={{ color: 'var(--accent, #C75B00)' }} />
              <span>Ma Boutique</span>
            </Link>

            <Link
              href="/agence"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 8,
                background: '#FAF8F5',
                border: '1px solid #E8DDD2',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 11.5,
                fontWeight: 750,
                textDecoration: 'none',
              }}
            >
              <Building2 size={14} style={{ color: 'var(--navy, #1C2B4A)' }} />
              <span>Agence Immo</span>
            </Link>
          </div>
        </div>

        {/* Corps du Tiroir (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {sections.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94A3B8',
                  padding: '6px 8px 4px',
                }}
              >
                {sec.titre}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sec.items.map(item => {
                  const Icon = item.icon
                  const actif = isItemActive(item.href, item.tab)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      onClick={onClose}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 10px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: actif ? 800 : 650,
                        color: actif ? 'var(--accent, #C75B00)' : '#334155',
                        background: actif ? '#FFF3E8' : 'transparent',
                        textDecoration: 'none',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Icon size={16} style={{ color: actif ? 'var(--accent, #C75B00)' : '#64748B' }} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: '#FFEDD5',
                            color: '#9A3412',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Pied du Tiroir : Déconnexion */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', background: '#FAFAFA' }}>
          <form action={logout} style={{ margin: 0, width: '100%' }}>
            <button
              type="submit"
              onClick={onClose}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 750,
                color: '#DC2626',
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              <span>Se déconnecter</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
