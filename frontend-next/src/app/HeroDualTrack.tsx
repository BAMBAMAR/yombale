'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingBag, Store, Building2 } from 'lucide-react'
import HeroAcheteurView from './hero/HeroAcheteurView'
import HeroMarchandView from './hero/HeroMarchandView'
import HeroAgenceHeaderView from './hero/HeroAgenceHeaderView'

interface Props {
  initialMode?: 'acheteur' | 'marchand' | 'agence'
  activeTab?: 'acheteur' | 'marchand' | 'agence'
  onTabChange?: (tab: 'acheteur' | 'marchand' | 'agence') => void
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
  const [internalTab, setInternalTab] = useState<'acheteur' | 'marchand' | 'agence'>(initialMode)
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

        // 3. Si URL explicite ?mode=agence
        if (urlMode === 'agence' || urlMode === 'immo-pro') {
          setInternalTab('agence')
          return
        }

        // 4. Par défaut : Toujours Acheteur
        setInternalTab('acheteur')
      }
    } catch (err) {
      console.warn('[Nopalou:HeroDualTrack]', err)
    }
  }, [activeTabProp])

  function switchTab(tab: 'acheteur' | 'marchand' | 'agence') {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* ── SÉLECTEUR D'INTENTION TRIPARTITE UNIFIÉ DANS LA MÊME CAPSULE (HAUTE VISIBILITÉ) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
          padding: '0 8px'
        }}
      >
        <div
          role="tablist"
          aria-label="Mode d'utilisation Nopalou"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#FFFFFF',
            padding: '5px',
            borderRadius: '9999px',
            border: '1.5px solid var(--border, #D8CEC0)',
            gap: 5,
            boxShadow: '0 4px 16px rgba(28, 43, 74, 0.08), 0 1px 3px rgba(0,0,0,0.04)',
            maxWidth: '100%',
            overflowX: 'auto',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {/* 1. Acheteur & Comparateur */}
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
              fontSize: 13.5,
              fontWeight: activeTab === 'acheteur' ? 800 : 650,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'acheteur' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: activeTab === 'acheteur' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              boxShadow: activeTab === 'acheteur' ? '0 3px 10px rgba(28,43,74,0.25)' : 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <ShoppingBag
              size={16}
              color={activeTab === 'acheteur' ? '#FED7AA' : 'var(--accent, #C75B00)'}
            />
            <span>Acheteur &amp; Comparateur</span>
          </button>

          {/* 2. Commerçant & Caisse POS [PRO] */}
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
              fontSize: 13.5,
              fontWeight: activeTab === 'marchand' ? 800 : 650,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'marchand' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: activeTab === 'marchand' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              boxShadow: activeTab === 'marchand' ? '0 3px 10px rgba(28,43,74,0.25)' : 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Store size={16} color={activeTab === 'marchand' ? '#FED7AA' : 'currentColor'} />
            <span>Commerçant &amp; Caisse POS</span>
            <span className="badge-npl badge-npl-accent" style={{ fontSize: 10, padding: '2px 6px', fontWeight: 800 }}>
              PRO
            </span>
          </button>

          {/* 3. Agences Immo [PRO] (même badge PRO que commerçant) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'agence'}
            onClick={() => switchTab('agence')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: 13.5,
              fontWeight: activeTab === 'agence' ? 800 : 650,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'agence' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: activeTab === 'agence' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              boxShadow: activeTab === 'agence' ? '0 3px 10px rgba(28,43,74,0.25)' : 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Building2 size={16} color={activeTab === 'agence' ? '#FED7AA' : 'var(--price, #0A5C36)'} />
            <span>Agences Immo</span>
            <span className="badge-npl badge-npl-accent" style={{ fontSize: 10, padding: '2px 6px', fontWeight: 800 }}>
              PRO
            </span>
          </button>
        </div>
      </div>

      {/* ── RENDU DYNAMIQUE DU HERO SELON L'ONGLET ACTIF ── */}
      {activeTab === 'acheteur' ? (
        <HeroAcheteurView
          searchBarSlot={searchBarSlot}
          categoriesSlot={categoriesSlot}
        />
      ) : activeTab === 'marchand' ? (
        <HeroMarchandView
          prixTafTaf={prixTafTaf}
          activeBoutiqueNom={activeBoutiqueNom}
        />
      ) : (
        <HeroAgenceHeaderView />
      )}
    </div>
  )
}
