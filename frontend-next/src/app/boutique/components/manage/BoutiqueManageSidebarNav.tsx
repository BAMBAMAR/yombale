'use client'

import React, { useState } from 'react'
import type { Boutique, ManageTab, NavGroup } from '../../types'
import { ChevronRight, ShoppingCart, BookOpen, ExternalLink, Store } from 'lucide-react'

interface BoutiqueManageSidebarNavProps {
  navGroups: NavGroup[]
  navAdvanced?: NavGroup[]
  tab: ManageTab
  onNavigateTab: (targetTab: ManageTab) => void
  showAdvancedNav?: boolean
  navTier?: 'essential' | 'commerce' | 'all'
  onToggleAdvancedNav?: () => void
  isAllowed: (minPlan?: 'pro' | 'business') => boolean
  nbEnAttente: number
  formatNumber: (n: number) => string
  boutique: Boutique
  onBack: () => void
  hasMultipleBoutiques?: boolean
  boutiques?: Boutique[]
  onSelectBoutique?: (b: Boutique) => void
  t: (key: string) => string
}

export default function BoutiqueManageSidebarNav({
  navGroups,
  tab,
  onNavigateTab,
  isAllowed,
  nbEnAttente,
  formatNumber,
  boutique,
  t,
}: BoutiqueManageSidebarNavProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(() => {
    const defaultExpanded: Record<number, boolean> = {}
    navGroups.forEach((_, idx) => {
      defaultExpanded[idx] = true
    })
    return defaultExpanded
  })

  return (
    <>
      {/* ── Menu Latéral Desktop : 6 Pôles Métiers & 27 Outils (Zéro Omission) ── */}
      <nav className="bq-nav bq-nav-desktop" style={{ padding: '8px 4px' }}>
        {navGroups.map((group, gIdx) => {
          const hasActiveItem = group.items.some((i) => i.key === tab)
          const isExpanded = expandedGroups[gIdx] ?? true
          const GroupIcon = group.icon
          return (
            <div key={gIdx} className="bq-nav-group" style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={`bq-nav-group-header${hasActiveItem ? ' bq-nav-group-header--active' : ''}`}
                onClick={() => setExpandedGroups((prev) => ({ ...prev, [gIdx]: !isExpanded }))}
                aria-expanded={isExpanded}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 11px',
                  background: hasActiveItem
                    ? 'linear-gradient(135deg, #FFF9F5 0%, #FFF3E8 100%)'
                    : 'var(--surface-muted, #FAF8F5)',
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
                  <GroupIcon
                    size={15}
                    style={{ color: hasActiveItem ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)', flexShrink: 0 }}
                  />
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
                      color: hasActiveItem ? '#9A3412' : 'var(--text-strong)',
                    }}
                  >
                    {formatNumber(group.items.length)}
                  </span>
                  <ChevronRight
                    size={14}
                    style={{
                      color: hasActiveItem ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </button>

              <div
                style={{
                  display: isExpanded ? 'flex' : 'none',
                  flexDirection: 'column',
                  gap: 2,
                  marginTop: 4,
                  paddingLeft: 6,
                  borderLeft: hasActiveItem
                    ? '2.5px solid var(--accent, #C75B00)'
                    : '2px solid var(--border)',
                  marginLeft: 8,
                  animation: 'fadeSlideDown 0.15s ease-out',
                }}
              >
                {group.items.map((item) => {
                  const allowed = isAllowed(item.minPlan)
                  const isActive = tab === item.key
                  const ItemIcon = item.icon

                  if (item.href) {
                    return (
                      <a
                        key={item.key}
                        href={item.href}
                        onClick={() => {
                          if (item.key === 'caisse' && typeof window !== 'undefined') {
                            localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)
                          }
                        }}
                        className={`bq-nav-item${isActive ? ' active' : ''}`}
                        style={{
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--price, #0A5C36)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.12s, color 0.12s',
                        }}
                      >
                        <ItemIcon
                          size={16}
                          style={{
                            color: 'var(--price, #0A5C36)',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            background: '#DCFCE7',
                            color: '#166534',
                            padding: '1px 5px',
                            borderRadius: 4,
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            marginLeft: 'auto',
                          }}
                        >
                          POS
                        </span>
                      </a>
                    )
                  }

                  return (
                    <button
                      key={item.key}
                      onClick={() => onNavigateTab(item.key as ManageTab)}
                      className={`bq-nav-item${isActive ? ' active' : ''}`}
                      style={{
                        opacity: allowed ? 1 : 0.85,
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: isActive ? 750 : 600,
                        color: isActive ? 'var(--accent, #C75B00)' : 'var(--text-strong)',
                        background: isActive ? 'var(--orange2, #FFF3E8)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.12s, color 0.12s',
                      }}
                    >
                      <ItemIcon
                        size={16}
                        style={{
                          color: isActive ? 'var(--accent, #C75B00)' : 'var(--text-subtle)',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </span>
                      {!allowed && (
                        <span
                          style={{
                            fontSize: 9,
                            background: item.minPlan === 'business' ? 'var(--navy)' : 'var(--accent)',
                            color: '#fff',
                            padding: '2px 5px',
                            borderRadius: 4,
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            marginLeft: 'auto',
                          }}
                        >
                          {item.minPlan === 'business' ? 'VIP' : 'PRO'}
                        </span>
                      )}
                      {allowed && item.key === 'commandes' && nbEnAttente > 0 && (
                        <span className="bq-nav-badge">{formatNumber(nbEnAttente)}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── Liens Rapides Bas de Sidebar (Desktop Seulement) ── */}
      <div
        className="bq-sidebar-quick-links"
        style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border-light, #E8DDD2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {boutique.mode_fonctionnement === 'pure_player' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              fontSize: 12,
              color: 'var(--accent)',
              borderRadius: 8,
              fontWeight: 800,
              background: 'var(--orange2)',
              border: '1px solid #fed7aa',
            }}
          >
            <span>{t('shop.purePlayerMode')}</span>
          </div>
        ) : (
          <a
            href={`/boutique/caisse?b=${boutique.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              fontSize: 12,
              color: '#16a34a',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 700,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
            }}
            onClick={() =>
              typeof window !== 'undefined' &&
              localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)
            }
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingCart size={14} />
              <span>{t('shop.posPhysicalLink')}</span>
            </span>
          </a>
        )}
        <a
          href="/guide-utilisation"
          target="_blank"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: 'var(--accent)',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 750,
            background: 'var(--orange2)',
            border: '1px solid #fed7aa',
          }}
        >
          <BookOpen size={14} />
          <span>Guide d&apos;utilisation</span>
        </a>
        <a
          href={`/boutiques/${boutique.slug || boutique.id}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: 'var(--text-subtle)',
            textDecoration: 'none',
            borderRadius: 8,
          }}
        >
          <ExternalLink size={14} />
          <span>{t('shop.viewPublicShopLink')}</span>
        </a>
        <a
          href="/compte"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: 'var(--navy)',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 700,
            background: 'var(--surface-subtle)',
          }}
        >
          <Store size={14} />
          <span>{t('shop.merchantAccount')}</span>
        </a>
      </div>
    </>
  )
}
