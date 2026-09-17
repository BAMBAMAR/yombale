'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  X,
  Search,
  ExternalLink,
  BookOpen,
  User,
  Store,
  ChevronRight,
} from 'lucide-react'
import type { Boutique, ManageTab } from '../types'
import { getBoutiqueNavSections } from './manage/constants'

interface BoutiqueMobileDrawerProps {
  boutique: Boutique
  isOpen: boolean
  onClose: () => void
  currentTab: string
  onNavigateTab: (tab: any, subTab?: string) => void
  onBack: () => void
  nbEnAttente?: number
  isAllowed?: (minPlan?: 'pro' | 'business') => boolean
  t?: (key: string, params?: any) => string
  hasMultipleBoutiques?: boolean
  boutiques?: Boutique[]
  onSelectBoutique?: (b: Boutique) => void
}

export default function BoutiqueMobileDrawer({
  boutique,
  isOpen,
  onClose,
  currentTab,
  onNavigateTab,
  onBack,
  nbEnAttente = 0,
  isAllowed = () => true,
  t = (k: string) => '',
  hasMultipleBoutiques = false,
  boutiques = [],
  onSelectBoutique,
}: BoutiqueMobileDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const sections = useMemo(() => {
    return getBoutiqueNavSections(t, boutique.id)
  }, [t, boutique.id])

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return sections

    return sections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.key.toLowerCase().includes(q)
        ),
      }))
      .filter((sec) => sec.items.length > 0)
  }, [sections, searchQuery])

  if (!isOpen) return null

  const nom = boutique?.nom || 'Ma Boutique'
  const slug = boutique?.slug || boutique?.id || ''
  const vitrineUrl = `/boutiques/${slug}`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Menu de navigation complet de la boutique"
    >
      {/* Fond sombre translucide */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(28, 43, 74, 0.48)',
          backdropFilter: 'blur(3px)',
        }}
        onClick={onClose}
      />

      {/* Tiroir coulissant latéral */}
      <aside
        style={{
          position: 'relative',
          width: '86%',
          maxWidth: 340,
          height: '100%',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 28px rgba(0, 0, 0, 0.2)',
          zIndex: 1,
        }}
      >
        {/* Entête du tiroir */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            background: 'var(--surface-muted, #FAF8F5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nom}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--accent, #C75B00)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 2,
              }}
            >
              <Store size={12} />
              <span>Espace Marchand • 27 outils</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Fermer le menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Barre de recherche instantanée */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            background: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface-muted, #FAF8F5)',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 8,
              padding: '6px 10px',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-subtle, #8C7E74)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher (caisse, compta, stock, tva...)"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--navy, #1C2B4A)',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-subtle)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
                aria-label="Effacer recherche"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Sélecteur Multi-Boutiques (si plusieurs boutiques) */}
        {hasMultipleBoutiques && boutiques.length > 1 && (
          <div
            style={{
              padding: '8px 14px',
              background: 'var(--surface-muted, #FAF8F5)',
              borderBottom: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: 'var(--text-subtle, #8C7E74)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Mes Boutiques ({boutiques.length})
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {boutiques.map((b) => {
                const isCurrent = b.id === boutique.id
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onClose()
                      if (!isCurrent && onSelectBoutique) onSelectBoutique(b)
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 7,
                      border: isCurrent
                        ? '1.5px solid var(--navy, #1C2B4A)'
                        : '1px solid var(--border, #E8DDD2)',
                      background: isCurrent ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                      color: isCurrent ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                      fontWeight: isCurrent ? 800 : 600,
                      fontSize: 11.5,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: isCurrent ? 'default' : 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <span>{b.nom}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Liste des 6 Pôles Métiers & 27 Outils */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 24px' }}>
          {filteredSections.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--text-subtle, #8C7E74)',
                fontSize: 13,
              }}
            >
              Aucun outil ne correspond à votre recherche.
            </div>
          ) : (
            filteredSections.map((sec, secIdx) => (
              <div key={secIdx} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px 4px',
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--navy, #1C2B4A)',
                  }}
                >
                  <sec.icon size={13} style={{ color: 'var(--accent, #C75B00)' }} />
                  <span>{sec.title}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                  {sec.items.map((item) => {
                    const allowed = isAllowed(item.minPlan)
                    const isActive = currentTab === item.key
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
                            onClose()
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            padding: '9px 12px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 750,
                            color: 'var(--price, #0A5C36)',
                            background: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            textDecoration: 'none',
                            marginBottom: 2,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                            <ItemIcon size={16} style={{ color: 'var(--price, #0A5C36)', flexShrink: 0 }} />
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
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              background: '#DCFCE7',
                              color: '#166534',
                              padding: '2px 6px',
                              borderRadius: 4,
                              flexShrink: 0,
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
                        type="button"
                        onClick={() => {
                          onNavigateTab(item.key)
                          onClose()
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: isActive ? 750 : 600,
                          color: isActive ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                          background: isActive ? 'var(--orange2, #FFF3E8)' : 'transparent',
                          border: isActive ? '1px solid var(--accent, #C75B00)' : 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.12s ease',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                          <ItemIcon
                            size={16}
                            style={{
                              color: isActive ? 'var(--accent, #C75B00)' : 'var(--text-subtle, #8C7E74)',
                              flexShrink: 0,
                            }}
                          />
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {!allowed && (
                            <span
                              style={{
                                fontSize: 9,
                                background:
                                  item.minPlan === 'business'
                                    ? 'var(--navy, #1C2B4A)'
                                    : 'var(--accent, #C75B00)',
                                color: '#FFFFFF',
                                padding: '1px 5px',
                                borderRadius: 4,
                                fontWeight: 800,
                              }}
                            >
                              {item.minPlan === 'business' ? 'VIP' : 'PRO'}
                            </span>
                          )}
                          {allowed && item.key === 'commandes' && nbEnAttente > 0 && (
                            <span
                              style={{
                                background: 'var(--accent, #C75B00)',
                                color: '#FFFFFF',
                                fontSize: 10,
                                fontWeight: 900,
                                padding: '1px 6px',
                                borderRadius: 10,
                              }}
                            >
                              {nbEnAttente}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pied du tiroir : Raccourcis Vitrine, Guide et Mon Compte */}
        <div
          style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border, #E8DDD2)',
            background: 'var(--surface-muted, #FAF8F5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <a
            href={vitrineUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--navy, #1C2B4A)',
              textDecoration: 'none',
              borderRadius: 7,
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ExternalLink size={13} style={{ color: 'var(--accent, #C75B00)' }} />
              <span>Voir ma vitrine en ligne</span>
            </span>
            <ChevronRight size={13} style={{ color: 'var(--text-subtle)' }} />
          </a>

          <div style={{ display: 'flex', gap: 6 }}>
            <Link
              href="/compte"
              onClick={onClose}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--navy, #1C2B4A)',
                textDecoration: 'none',
                padding: '6px 8px',
                borderRadius: 6,
                background: '#FFFFFF',
                border: '1px solid var(--border, #E8DDD2)',
              }}
            >
              <User size={13} />
              <span>Mon compte</span>
            </Link>

            <a
              href="/guide-utilisation"
              target="_blank"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--navy, #1C2B4A)',
                textDecoration: 'none',
                padding: '6px 8px',
                borderRadius: 6,
                background: '#FFFFFF',
                border: '1px solid var(--border, #E8DDD2)',
              }}
            >
              <BookOpen size={13} />
              <span>Guide d&apos;aide</span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  )
}
