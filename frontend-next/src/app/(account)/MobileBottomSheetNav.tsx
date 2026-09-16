'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, LogOut, ShoppingBag, ChevronRight, X } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export interface NavLinkItem {
  href: string
  label: string
  emoji?: string
  icon?: React.ReactNode
  tab?: string
  badgeText?: string
  badgeBg?: string
  badgeColor?: string
  isCta?: boolean
  isShop?: boolean
  external?: boolean
}

export interface NavGroup {
  id: string
  title: string
  icon?: string
  items: NavLinkItem[]
}

export default function MobileBottomSheetNav({
  groupes,
  isItemActive,
  backHref,
  sheetTitle,
  variant,
}: {
  groupes: NavGroup[]
  isItemActive: (item: NavLinkItem) => boolean
  backHref?: string
  sheetTitle: string
  variant: 'account' | 'boutique'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Trouver l'item actif pour la barre compacte
  const activeItem = groupes.flatMap(g => g.items).find(item => isItemActive(item))
  const currentLabel = activeItem?.label || 'Tableau de bord'

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
    <div className={`mobile-nav-compact mobile-nav-compact--${variant}`}>
      {/* Barre compacte */}
      <div className="mobile-nav-compact-bar">
        {backHref && (
          <Link href={backHref} className="mobile-nav-compact-back" aria-label="Retour">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
        )}

        <button
          type="button"
          className="mobile-nav-compact-dropdown"
          onClick={openSheet}
          aria-label={`Menu compte: ${currentLabel}`}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className="mobile-nav-compact-dropdown-content">
            <span className="mobile-nav-compact-current-label">{currentLabel}</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mobile-nav-compact-chevron">
            <polyline points="6 9 12 15 18 9" />
          </svg>
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
              <span className="mobile-bs-title">{sheetTitle}</span>
              <button type="button" className="mobile-bs-close" onClick={closeSheet} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>

            <div className="mobile-bs-body">
              {groupes.map(group => {
                const hasActive = group.items.some(item => isItemActive(item))
                return (
                  <div key={group.id} className={`mobile-bs-group${hasActive ? ' mobile-bs-group--active' : ''}`}>
                    <div className="mobile-bs-group-title">
                      <span>{group.title}</span>
                    </div>
                    <div className="mobile-bs-group-items">
                      {group.items.map(item => {
                        const actif = isItemActive(item)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`mobile-bs-item${actif ? ' mobile-bs-item--active' : ''}`}
                            onClick={closeSheet}
                          >
                            <span className="mobile-bs-item-label">{item.label}</span>
                            {item.badgeText && (
                              <span
                                className="mobile-bs-item-badge mobile-bs-item-badge--brand"
                                style={{ background: item.badgeBg, color: item.badgeColor }}
                              >
                                {item.badgeText}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mobile-bs-footer" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                <Link
                  href="/guide-utilisation"
                  target="_blank"
                  className="mobile-bs-footer-link"
                  style={{ flex: 1, background: '#FFF7ED', color: '#C75B00', border: '1px solid #FFEDD5', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={closeSheet}
                >
                  <BookOpen size={14} />
                  <span>Guide</span>
                </Link>
                <Link
                  href="/boutique"
                  className="mobile-bs-footer-link"
                  style={{ flex: 1, background: '#F1F5F9', color: 'var(--navy, #1C2B4A)', border: '1px solid #E2E8F0', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={closeSheet}
                >
                  <ShoppingBag size={14} />
                  <span>Boutique</span>
                </Link>
              </div>

              <form action={logout} style={{ width: '100%', margin: 0 }}>
                <button
                  type="submit"
                  className="mobile-bs-footer-link"
                  style={{ width: '100%', boxSizing: 'border-box', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', justifyContent: 'center', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={closeSheet}
                >
                  <LogOut size={14} />
                  <span>Se déconnecter</span>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
