'use client'

import React, { useState } from 'react'
import type { Boutique, ManageTab, NavGroup } from '../../types'
import BoutiqueMobileBottomSheet from '../BoutiqueMobileBottomSheet'
import { ChevronRight, ChevronDown, ShoppingCart, BookOpen, ExternalLink, Store } from 'lucide-react'

interface BoutiqueManageSidebarNavProps {
  navGroups: NavGroup[]
  navAdvanced: NavGroup[]
  tab: ManageTab
  onNavigateTab: (targetTab: ManageTab) => void
  showAdvancedNav: boolean
  onToggleAdvancedNav: () => void
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
  navAdvanced,
  tab,
  onNavigateTab,
  showAdvancedNav,
  onToggleAdvancedNav,
  isAllowed,
  nbEnAttente,
  formatNumber,
  boutique,
  onBack,
  hasMultipleBoutiques = false,
  boutiques = [],
  onSelectBoutique,
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
      {/* Nav Desktop */}
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
                  return (
                    <button
                      key={item.key}
                      onClick={() => onNavigateTab(item.key)}
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
                          {item.minPlan === 'business' ? 'Business' : 'Pro'}
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

      {/* Bouton bascule : Afficher/Masquer les options avancées */}
      <div style={{ padding: '4px 12px 12px' }}>
        <button
          type="button"
          onClick={onToggleAdvancedNav}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 10,
            border: showAdvancedNav
              ? '1.5px solid var(--accent, #C75B00)'
              : '1.5px dashed var(--border-medium, #D1C4B4)',
            background: showAdvancedNav ? 'var(--orange2, #FFF3E8)' : 'transparent',
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 800,
            color: showAdvancedNav ? 'var(--accent, #C75B00)' : 'var(--text-subtle, #8C7E74)',
            transition: 'all 0.2s ease',
          }}
        >
          <ChevronDown
            size={14}
            style={{
              transform: showAdvancedNav ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
          <span>
            {showAdvancedNav ? 'Masquer les options avancées' : 'Plus d\'options (comptabilité, rapports...)'}
          </span>
        </button>

        {showAdvancedNav && (
          <div
            className="bq-advanced-mobile-panel"
            style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {navAdvanced.map((group, gIdx) => (
              <div
                key={gIdx}
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #E8DDD2',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--navy, #1C2B4A)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <group.icon size={13} style={{ color: 'var(--accent, #C75B00)' }} />
                  <span>{group.title}</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 6,
                  }}
                >
                  {group.items.map((item) => {
                    const allowed = isAllowed(item.minPlan)
                    const isActive = tab === item.key
                    const ItemIcon = item.icon
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onNavigateTab(item.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 10px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          color: isActive ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                          background: isActive ? 'var(--orange2, #FFF3E8)' : '#ffffff',
                          border: isActive ? '1.5px solid var(--accent, #C75B00)' : '1px solid #E2E8F0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxShadow: isActive ? '0 2px 6px rgba(199,91,0,0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <ItemIcon
                          size={14}
                          style={{ color: isActive ? 'var(--accent, #C75B00)' : '#64748B', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {item.label}
                        </span>
                        {!allowed && (
                          <span
                            style={{
                              fontSize: 8.5,
                              background: item.minPlan === 'business' ? 'var(--navy, #1C2B4A)' : 'var(--accent, #C75B00)',
                              color: '#fff',
                              padding: '1px 4px',
                              borderRadius: 3,
                              fontWeight: 800,
                            }}
                          >
                            {item.minPlan === 'business' ? 'VIP' : 'PRO'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom-Sheet Mobile Navigation — Boutique */}
      <BoutiqueMobileBottomSheet
        navGroups={navGroups}
        activeTab={tab}
        onSetTab={(newTab) => onNavigateTab(newTab)}
        isAllowed={isAllowed}
        nbEnAttente={nbEnAttente}
        formatNumber={formatNumber}
        sheetTitle={boutique.nom}
        onBack={onBack}
        boutiqueId={boutique.id}
        hasMultipleBoutiques={hasMultipleBoutiques}
        boutiques={boutiques}
        onSelectBoutique={onSelectBoutique}
        showAdvancedNav={showAdvancedNav}
        onToggleAdvancedNav={onToggleAdvancedNav}
      />

      {/* Liens rapides (Desktop seulement) */}
      <div
        className="bq-sidebar-quick-links"
        style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border-light)',
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
