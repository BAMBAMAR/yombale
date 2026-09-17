'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Store, ShoppingCart, LayoutDashboard, X } from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import type { Boutique, ManageTab, NavGroup } from '../types'

interface BoutiqueMobileBottomSheetProps {
  navGroups: NavGroup[]
  activeTab: ManageTab
  onSetTab: (tab: ManageTab) => void
  isAllowed: (minPlan?: 'pro' | 'business') => boolean
  nbEnAttente: number
  formatNumber: (n: number) => string
  sheetTitle: string
  onBack: () => void
  boutiqueId: string
  hasMultipleBoutiques?: boolean
  boutiques?: Boutique[]
  onSelectBoutique?: (b: Boutique) => void
  showAdvancedNav?: boolean
  onToggleAdvancedNav?: () => void
}

export default function BoutiqueMobileBottomSheet({
  navGroups,
  activeTab,
  onSetTab,
  isAllowed,
  nbEnAttente,
  formatNumber,
  sheetTitle,
  onBack,
  boutiqueId,
  hasMultipleBoutiques = false,
  boutiques = [],
  onSelectBoutique,
  showAdvancedNav = false,
  onToggleAdvancedNav,
}: BoutiqueMobileBottomSheetProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const activeItem = navGroups.flatMap(g => g.items).find(i => i.key === activeTab)
  const CurrentIcon = activeItem?.icon || LayoutDashboard
  const currentLabel = activeItem?.label || sheetTitle

  function openSheet() {
    setIsOpen(true)
    setIsClosing(false)
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
  }

  function closeSheet() {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }, 200)
  }

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }
  }, [])

  return (
    <div className="mobile-nav-compact mobile-nav-compact--boutique">
      {/* Barre compacte */}
      <div className="mobile-nav-compact-bar">
        <button
          type="button"
          className="mobile-nav-compact-back"
          onClick={() => {
            if (activeTab !== 'dashboard') {
              onSetTab('dashboard')
            } else if (hasMultipleBoutiques) {
              onBack()
            } else {
              router.push('/compte')
            }
          }}
          aria-label={
            activeTab !== 'dashboard'
              ? "Retour à l'accueil de la boutique"
              : hasMultipleBoutiques
                ? "Retour à mes boutiques"
                : "Retour à mon compte"
          }
          title={
            activeTab !== 'dashboard'
              ? "Retour au tableau de bord"
              : hasMultipleBoutiques
                ? "Retour à mes boutiques"
                : "Retour à mon compte"
          }
        >
          <ArrowLeft size={16} />
        </button>

        <button
          type="button"
          className="mobile-nav-compact-dropdown"
          onClick={openSheet}
          aria-label={`Menu boutique: ${currentLabel}`}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className="mobile-nav-compact-dropdown-content">
            <span className="mobile-nav-compact-current-icon">
              <CurrentIcon size={16} style={{ color: 'var(--accent, #C75B00)' }} />
            </span>
            <span className="mobile-nav-compact-current-label">{currentLabel}</span>
            {nbEnAttente > 0 && (
              <span className="mobile-bs-item-badge mobile-bs-item-badge--count" style={{ fontSize: 10, padding: '1px 6px' }}>
                {formatNumber(nbEnAttente)}
              </span>
            )}
          </div>
          <ChevronDown size={14} className="mobile-nav-compact-chevron" />
        </button>
      </div>

      {/* Bottom Sheet */}
      {isOpen && (
        <>
          <div className="mobile-bs-overlay" onClick={closeSheet} aria-hidden="true" />
          <div className={`mobile-bs-panel${isClosing ? ' mobile-bs-panel--closing' : ''}`}>
            <div className="mobile-bs-handle">
              <div className="mobile-bs-handle-bar" />
            </div>

            <div className="mobile-bs-header">
              <span className="mobile-bs-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Store size={16} style={{ color: 'var(--accent, #C75B00)' }} />
                <span>{sheetTitle}</span>
              </span>
              <button type="button" className="mobile-bs-close" onClick={closeSheet} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>

            {/* Sélecteur Multi-Boutiques Rapide (Mobile) */}
            {boutiques && boutiques.length > 1 && (
              <div style={{ padding: '8px 16px', background: '#F8FAF5', borderBottom: '1px solid #E8DDD2', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Mes Boutiques ({boutiques.length})
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {boutiques.map(b => {
                    const isCurrent = b.id === boutiqueId;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          closeSheet();
                          if (!isCurrent && onSelectBoutique) onSelectBoutique(b);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: isCurrent ? '1.5px solid #16a34a' : '1px solid #d1d5db',
                          background: isCurrent ? '#f0fdf4' : '#ffffff',
                          color: isCurrent ? '#166534' : '#1C2B4A',
                          fontWeight: isCurrent ? 800 : 600,
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: isCurrent ? 'default' : 'pointer',
                          flexShrink: 0,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        }}
                      >
                        <span>{b.nom}</span>
                        {isCurrent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mobile-bs-body">
              {navGroups.map((group, gIdx) => {
                const hasActive = group.items.some(i => i.key === activeTab)
                const GroupIcon = group.icon
                return (
                  <div key={gIdx} className={`mobile-bs-group${hasActive ? ' mobile-bs-group--active' : ''}`}>
                    <div className="mobile-bs-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GroupIcon size={14} className="mobile-bs-group-title-icon" />
                      <span>{group.title}</span>
                    </div>
                    <div className="mobile-bs-group-items">
                      {group.items.map(item => {
                        const allowed = isAllowed(item.minPlan)
                        const isActive = activeTab === item.key
                        const ItemIcon = item.icon
                        return (
                          <button
                            key={item.key}
                            type="button"
                            className={`mobile-bs-item${isActive ? ' mobile-bs-item--active' : ''}`}
                            onClick={() => {
                              if (item.key === 'caisse') {
                                if (typeof window !== 'undefined') {
                                  localStorage.setItem('nopalou_pos_active_boutique_id', boutiqueId)
                                  window.location.href = `/boutique/caisse?b=${boutiqueId}`
                                }
                              } else {
                                onSetTab(item.key as ManageTab)
                              }
                              closeSheet()
                            }}
                          >
                            <ItemIcon size={16} className="mobile-bs-item-icon" />
                            <span className="mobile-bs-item-label">{item.label}</span>
                            {!allowed && (
                              <span className={`mobile-bs-item-badge ${item.minPlan === 'business' ? 'mobile-bs-item-badge--lock-business' : 'mobile-bs-item-badge--lock'}`}>
                                {item.minPlan === 'business' ? 'Business' : 'Pro'}
                              </span>
                            )}
                            {allowed && item.key === 'commandes' && nbEnAttente > 0 && (
                              <span className="mobile-bs-item-badge mobile-bs-item-badge--count">
                                {formatNumber(nbEnAttente)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {onToggleAdvancedNav && (
                <div style={{ padding: '6px 8px 12px' }}>
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
                      border: showAdvancedNav ? '1.5px solid var(--accent, #C75B00)' : '1.5px dashed var(--border-medium, #D1C4B4)',
                      background: showAdvancedNav ? 'var(--orange2, #FFF3E8)' : '#FAF8F5',
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
                    <span>{showAdvancedNav ? 'Masquer les options avancées' : 'Plus d\'options (comptabilité, rapports...)'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mobile-bs-footer">
              <a
                href={`/boutique/caisse?b=${boutiqueId}`}
                className="mobile-bs-footer-link"
                style={{ background: '#F0FDF4', color: '#16a34a', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => {
                  if (typeof window !== 'undefined') localStorage.setItem('nopalou_pos_active_boutique_id', boutiqueId);
                  closeSheet();
                }}
              >
                <ShoppingCart size={15} />
                <span>{t('caisse.posTitle') || 'Caisse POS'}</span>
              </a>
              <a
                href="/compte"
                className="mobile-bs-footer-link"
                style={{ background: 'var(--surface-subtle)', color: 'var(--navy)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={closeSheet}
              >
                <Store size={15} />
                <span>{t('shop.merchantAccount')}</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
