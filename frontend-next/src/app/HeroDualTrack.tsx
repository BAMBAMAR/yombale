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
}

export default function HeroDualTrack({
  initialMode = 'acheteur',
  activeTab: activeTabProp,
  onTabChange,
  prixTafTaf = 2500,
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

        if (hasSearchOrCat) { setInternalTab('acheteur'); return }
        if (urlMode === 'marchand' || urlMode === 'commercant') { setInternalTab('marchand'); return }
        if (urlMode === 'agence' || urlMode === 'immo-pro') { setInternalTab('agence'); return }

        const savedMode = localStorage.getItem('nopalou_user_mode')
        if (savedMode === 'marchand' || savedMode === 'agence' || savedMode === 'acheteur') {
          setInternalTab(savedMode); return
        }
        setInternalTab('acheteur')
      }
    } catch (err) {
      console.warn('[Nopalou:HeroDualTrack]', err)
    }
  }, [activeTabProp])

  function switchTab(tab: 'acheteur' | 'marchand' | 'agence') {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('nopalou_user_mode', tab)
    } catch (err) {
      console.warn('[HeroDualTrack:localStorage]', err)
    }
    if (onTabChange) { onTabChange(tab) } else { setInternalTab(tab) }
  }

  // ── Sélecteur d'intention tripartite ──────────────────────────────────────
  const tabSelector = (
    <div
      role="tablist"
      aria-label="Mode d'utilisation Nopalou"
      className="hero-mode-tabs-pill"
      style={{ width: '100%' }}
    >
      <button
        type="button" role="tab"
        aria-selected={activeTab === 'acheteur'}
        onClick={() => switchTab('acheteur')}
        className={`hero-mode-tab-btn${activeTab === 'acheteur' ? ' active' : ''}`}
      >
        <ShoppingBag size={16} color={activeTab === 'acheteur' ? '#FED7AA' : 'var(--accent, #C75B00)'} />
        <span className="tab-label-full">Acheteur &amp; Comparateur</span>
        <span className="tab-label-short">Acheteur</span>
      </button>

      <button
        type="button" role="tab"
        aria-selected={activeTab === 'marchand'}
        onClick={() => switchTab('marchand')}
        className={`hero-mode-tab-btn${activeTab === 'marchand' ? ' active' : ''}`}
      >
        <Store size={16} color={activeTab === 'marchand' ? '#FED7AA' : 'currentColor'} />
        <span>Caisse</span>
        <span className="tab-badge-pro badge-npl badge-npl-accent">PRO</span>
      </button>

      <button
        type="button" role="tab"
        aria-selected={activeTab === 'agence'}
        onClick={() => switchTab('agence')}
        className={`hero-mode-tab-btn${activeTab === 'agence' ? ' active' : ''}`}
      >
        <Building2 size={16} color={activeTab === 'agence' ? '#FED7AA' : 'var(--price, #0A5C36)'} />
        <span className="tab-label-full">Agences Immo</span>
        <span className="tab-label-short">Immo</span>
        <span className="tab-badge-pro badge-npl badge-npl-accent">PRO</span>
      </button>
    </div>
  )

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {activeTab === 'acheteur' ? (
        // Tabs EN PREMIER, puis H1, puis passerelles
        <HeroAcheteurView tabSelectorSlot={tabSelector} />
      ) : activeTab === 'marchand' ? (
        <>
          <div style={{ marginBottom: 14, width: '100%', boxSizing: 'border-box' }}>{tabSelector}</div>
          <HeroMarchandView prixTafTaf={prixTafTaf} activeBoutiqueNom={activeBoutiqueNom} />
        </>
      ) : (
        <>
          <div style={{ marginBottom: 14, width: '100%', boxSizing: 'border-box' }}>{tabSelector}</div>
          <HeroAgenceHeaderView />
        </>
      )}
    </div>
  )
}
