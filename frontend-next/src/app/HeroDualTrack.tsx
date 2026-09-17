'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Store, Building2 } from 'lucide-react'
import HeroAcheteurView from './hero/HeroAcheteurView'
import HeroMarchandView from './hero/HeroMarchandView'

interface Props {
  initialMode?: 'acheteur' | 'marchand'
  activeTab?: 'acheteur' | 'marchand'
  onTabChange?: (tab: 'acheteur' | 'marchand') => void
  prixTafTaf?: number
  searchBarSlot: React.ReactNode
  categoriesSlot: React.ReactNode
}

export default function HeroDualTrack({
  initialMode = 'acheteur',
  activeTab: activeTabProp,
  onTabChange,
  prixTafTaf = 2500,
  searchBarSlot,
  categoriesSlot
}: Props) {
  const [internalTab, setInternalTab] = useState<'acheteur' | 'marchand'>(initialMode)
  const activeTab = activeTabProp !== undefined ? activeTabProp : internalTab
  const [activeBoutiqueNom, setActiveBoutiqueNom] = useState<string | null>(null)

  useEffect(() => {
    if (activeTabProp !== undefined) return // Géré par le parent
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const urlMode = urlParams.get('mode')
        const hasSearchOrCat =
          urlParams.has('q') ||
          urlParams.has('cat') ||
          urlParams.has('tri') ||
          urlParams.has('prix_max')

        // 1. Si recherche ou catégorie -> Toujours Acheteur
        if (hasSearchOrCat) {
          setInternalTab('acheteur')
          return
        }

        // 2. Si URL explicite ?mode=marchand
        if (urlMode === 'marchand' || urlMode === 'commercant') {
          setInternalTab('marchand')
          return
        }

        // 3. Par défaut : Toujours Acheteur
        setInternalTab('acheteur')
      }
    } catch (err) {
      console.warn('[Nopalou:HeroDualTrack]', err)
    }
  }, [activeTabProp])

  function switchTab(tab: 'acheteur' | 'marchand') {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* ── SÉLECTEUR D'INTENTION DUAL-TRACK (ACHETEUR / COMMERÇANT / AGENCES) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          flexWrap: 'wrap'
        }}
      >
        <div
          role="tablist"
          aria-label="Mode d'utilisation Nopalou"
          style={{
            display: 'inline-flex',
            background: '#EDE8E1',
            padding: '4px',
            borderRadius: '9999px',
            border: '1px solid var(--border, #E8DDD2)',
            gap: 4,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'acheteur'}
            onClick={() => switchTab('acheteur')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: 13,
              fontWeight: activeTab === 'acheteur' ? 800 : 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'acheteur' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'acheteur' ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
              boxShadow: activeTab === 'acheteur' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingBag
              size={16}
              color={activeTab === 'acheteur' ? 'var(--accent, #C75B00)' : 'currentColor'}
            />
            <span>Acheteur &amp; Comparateur</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'marchand'}
            onClick={() => switchTab('marchand')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: 13,
              fontWeight: activeTab === 'marchand' ? 800 : 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'marchand' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: activeTab === 'marchand' ? '#FFFFFF' : 'var(--text2, #5A4E42)',
              boxShadow: activeTab === 'marchand' ? '0 3px 10px rgba(28,43,74,0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Store size={16} color={activeTab === 'marchand' ? '#FED7AA' : 'currentColor'} />
            <span>Commerçant &amp; Caisse POS</span>
            <span className="badge-npl badge-npl-accent" style={{ fontSize: 10, padding: '2px 6px' }}>
              PRO
            </span>
          </button>
        </div>

        {/* Passerelle Immédiate : Agences & Baux Pro */}
        <Link
          href="/agence"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: '9999px',
            fontSize: 12.5,
            fontWeight: 800,
            background: 'var(--bg, #F8F5F0)',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid var(--border, #E8DDD2)',
            textDecoration: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
          title="Accéder à l'espace dédié aux agences immobilières et bailleurs"
        >
          <Building2 size={15} color="var(--price, #0A5C36)" />
          <span>Agences &amp; Baux</span>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 900,
              background: 'rgba(10, 92, 54, 0.12)',
              color: 'var(--price, #0A5C36)',
              padding: '1px 6px',
              borderRadius: 6
            }}
          >
            IMMO
          </span>
        </Link>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* VUE 1 : EXPÉRIENCE 100% ACHETEUR & COMPARATEUR DE PRIX        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'acheteur' ? (
        <HeroAcheteurView
          searchBarSlot={searchBarSlot}
          categoriesSlot={categoriesSlot}
        />
      ) : (
        /* ───────────────────────────────────────────────────────────── */
        /* VUE 2 : HUB MARCHAND, CAISSE POS & AGENCES IMMOBILIÈRES       */
        /* ───────────────────────────────────────────────────────────── */
        <HeroMarchandView
          prixTafTaf={prixTafTaf}
          activeBoutiqueNom={activeBoutiqueNom}
        />
      )}
    </div>
  )
}
