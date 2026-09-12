'use client'

import React, { useState, useEffect } from 'react'
import HeroDualTrack from './HeroDualTrack'
import MerchantShowcase from './MerchantShowcase'

interface Props {
  initialMode?: 'acheteur' | 'marchand'
  prixTafTaf?: number
  searchBarSlot: React.ReactNode
  categoriesSlot: React.ReactNode
  buyerContentSlot: React.ReactNode
}

export default function HomeDualTrackContainer({
  initialMode = 'acheteur',
  prixTafTaf = 2500,
  searchBarSlot,
  categoriesSlot,
  buyerContentSlot
}: Props) {
  const [activeTab, setActiveTab] = useState<'acheteur' | 'marchand'>(initialMode)

  useEffect(() => {
    try {
      // 1. Détection paramètre d'URL direct (?mode=marchand ou ?mode=commercant)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const urlMode = urlParams.get('mode')
        if (urlMode === 'marchand' || urlMode === 'commercant') {
          setActiveTab('marchand')
          return
        } else if (urlMode === 'acheteur') {
          setActiveTab('acheteur')
          return
        }
      }

      // 2. Mémorisation du choix précédent dans localStorage
      const savedMode = localStorage.getItem('nopalou_home_mode')
      if (savedMode === 'marchand' || savedMode === 'acheteur') {
        setActiveTab(savedMode)
        return
      }

      // 3. Détection automatique si l'utilisateur est un commerçant connecté
      const isMerchant = localStorage.getItem('nopalou_is_merchant') === 'true'
      const activeBoutique = localStorage.getItem('nopalou_boutique_active')
      const posUnlocked = localStorage.getItem('nopalou_pos_user_boutiques')

      if (isMerchant || (activeBoutique && activeBoutique !== 'null' && activeBoutique !== '[]') || posUnlocked) {
        setActiveTab('marchand')
      }
    } catch (err) { console.warn('[Nopalou:HomeDualTrackContainer:L54]', err); }
  }, [])

  function handleTabChange(tab: 'acheteur' | 'marchand') {
    setActiveTab(tab)
    try {
      localStorage.setItem('nopalou_home_mode', tab)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        if (tab === 'marchand') {
          url.searchParams.set('mode', 'marchand')
        } else {
          url.searchParams.delete('mode')
        }
        window.history.replaceState(null, '', url.toString())
      }
    } catch (err) { console.warn('[Nopalou:HomeDualTrackContainer:L70]', err); }
  }

  return (
    <>
      {/* ── SECTION HERO AVEC BASSE TRANSFORMATION DUELLE ── */}
      <section style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 60%, var(--bg, #F8F5F0) 100%)',
        borderBottom: '1px solid var(--border, #E8DDD2)',
        padding: '16px 20px 14px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <HeroDualTrack
            activeTab={activeTab}
            onTabChange={handleTabChange}
            prixTafTaf={prixTafTaf}
            searchBarSlot={searchBarSlot}
            categoriesSlot={categoriesSlot}
          />
        </div>
      </section>

      {/* ── CONTENU DU CORPS DE PAGE : METAMORPHOSE TOTALE ── */}
      <main id="resultats" className="page-container" style={{ maxWidth: 'var(--max-w, 1380px)', paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
        {activeTab === 'acheteur' ? (
          /* VUE 1 : CATALOGUE ACHETEUR, COMPARATEUR DE PRIX & FILTRES */
          <div>
            {buyerContentSlot}
          </div>
        ) : (
          /* VUE 2 : SHOWCASE COMPLET DÉDIÉ AUX COMMERÇANTS & CAISSE POS */
          <div>
            <MerchantShowcase prixTafTaf={prixTafTaf} />
          </div>
        )}
      </main>
    </>
  )
}
