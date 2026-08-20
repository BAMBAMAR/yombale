'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/context'

interface NavLinkItem {
  href: string
  label: string
  emoji: string
  tab?: string
  badgeText?: string
  badgeBg?: string
  badgeColor?: string
  isCta?: boolean
  isShop?: boolean
  external?: boolean
}

interface NavGroup {
  id: string
  title: string
  icon: string
  items: NavLinkItem[]
}

export default function AccountNavLinks({ overrideTab }: { overrideTab?: string }) {
  const pathname = usePathname()
  const { t, formatNumber } = useTranslation()

  const groupes: NavGroup[] = [
    {
      id: 'annonces-achats',
      title: t('account.groupAdsPurchases'),
      icon: '📦',
      items: [
        { href: '/compte?tab=suivi-commande',    label: t('account.navTrackOrder'),     emoji: '📦', tab: 'suivi-commande' },
        { href: '/compte?tab=mes-annonces',      label: t('account.navMyAds'),          emoji: '📋', tab: 'mes-annonces' },
        { href: '/compte?tab=mes-annonces-immo', label: t('account.navMyRealEstate'),   emoji: '🏠', tab: 'mes-annonces-immo' },
        { href: '/compte?tab=mes-alertes',       label: t('account.navPriceAlerts'),    emoji: '🔔', tab: 'mes-alertes' },
        { href: '/compte?tab=favoris',           label: t('account.navFavorites'),      emoji: '♥',  tab: 'favoris' },
      ],
    },
    {
      id: 'boutique-caisse',
      title: t('account.groupShop'),
      icon: '🏪',
      items: [
        {
          href: '/boutique',
          label: t('account.navMyShop'),
          emoji: '🏪',
          isShop: true,
          badgeText: t('account.manageShopBadge'),
          badgeBg: 'var(--accent, #C75B00)',
          badgeColor: '#ffffff',
        },
        {
          href: '/boutique/caisse',
          label: t('caisse.posTitle') || 'Caisse POS',
          emoji: '🛒',
          badgeText: 'POS',
          badgeBg: '#16a34a',
          badgeColor: '#ffffff',
        },
      ],
    },
    {
      id: 'compte-parrainage',
      title: t('account.groupAccount'),
      icon: '⚙️',
      items: [
        { href: '/compte?tab=profil',         label: t('account.navMyProfile'),      emoji: '✏️', tab: 'profil' },
        {
          href: '/compte?tab=apporteur',
          label: t('account.navBusinessPartner'),
          emoji: '🤝',
          tab: 'apporteur',
          badgeText: '20%',
          badgeBg: '#FFEDD5',
          badgeColor: '#9A3412',
        },
        { href: '/compte?tab=fonctionnalites', label: t('account.navFeaturesPlans'), emoji: '📖', tab: 'fonctionnalites' },
      ],
    },
    {
      id: 'actions-publier',
      title: 'Publier & Déposer',
      icon: '➕',
      items: [
        {
          href: '/deposer-annonce',
          label: t('account.navPublishAd'),
          emoji: '➕',
          isCta: true,
          badgeText: t('common.new'),
          badgeBg: '#DCFCE7',
          badgeColor: '#166534',
        },
        {
          href: '/deposer-immo',
          label: t('account.navPublishRealEstate'),
          emoji: '🏡',
          isCta: true,
          badgeText: t('common.new'),
          badgeBg: '#E0F2FE',
          badgeColor: '#0369A1',
        },
      ],
    },
  ]

  // Déplier tous les groupes par défaut
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'annonces-achats': true,
    'boutique-caisse': true,
    'compte-parrainage': true,
    'actions-publier': true,
  })

  function toggleGroup(id: string) {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Vérifier si un item est actif
  function isItemActive(lien: NavLinkItem): boolean {
    if (overrideTab && lien.tab) {
      return lien.tab === overrideTab
    }
    if (overrideTab && !lien.tab) {
      return false
    }
    return pathname === lien.href || pathname.startsWith(lien.href + '/')
  }

  // Déplier automatiquement le groupe contenant l'élément actif
  useEffect(() => {
    groupes.forEach(group => {
      const hasActive = group.items.some(item => isItemActive(item))
      if (hasActive) {
        setExpandedGroups(prev => ({ ...prev, [group.id]: true }))
      }
    })
  }, [pathname, overrideTab])

  return (
    <nav
      className="account-nav-container"
      aria-label={t('account.navTitle')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {groupes.map(group => {
        const isExpanded = expandedGroups[group.id] !== false
        const hasActiveItem = group.items.some(item => isItemActive(item))

        return (
          <div key={group.id} className="account-nav-group" style={{ marginBottom: 4 }}>
            {/* Header Accordéon */}
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 11px',
                background: hasActiveItem
                  ? 'linear-gradient(135deg, #FFF9F5 0%, #FFF3E8 100%)'
                  : '#FAF8F5',
                border: hasActiveItem
                  ? '1.5px solid var(--accent, #C75B00)'
                  : '1px solid var(--border, #E8DDD2)',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                boxShadow: hasActiveItem
                  ? '0 2px 6px rgba(199,91,0,0.12)'
                  : '0 1px 2px rgba(26,22,18,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{group.icon}</span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: hasActiveItem ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {group.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 750,
                    padding: '2px 6px',
                    borderRadius: 12,
                    background: hasActiveItem ? '#FED7AA' : 'rgba(28,43,74,0.08)',
                    color: hasActiveItem ? '#9A3412' : '#334155',
                  }}
                >
                  {formatNumber(group.items.length)}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={hasActiveItem ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>

            {/* Liste des Liens Déroulants */}
            {isExpanded && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  marginTop: 4,
                  paddingLeft: 6,
                  borderLeft: hasActiveItem
                    ? '2.5px solid var(--accent, #C75B00)'
                    : '2px solid #E8DDD2',
                  marginLeft: 8,
                }}
              >
                {group.items.map(item => {
                  const actif = isItemActive(item)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: actif ? 750 : 600,
                        color: actif ? 'var(--accent, #C75B00)' : '#1F2937',
                        background: actif ? '#FFF3E8' : 'transparent',
                        textDecoration: 'none',
                        transition: 'all 0.12s ease',
                      }}
                      className={`account-nav-link${actif ? ' account-nav-link--active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 15, flexShrink: 0 }}>{item.emoji}</span>
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.label}
                        </span>
                      </div>

                      {item.badgeText && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: item.badgeBg || '#FED7AA',
                            color: item.badgeColor || '#9A3412',
                            flexShrink: 0,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {item.badgeText}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
