'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import HeroDualTrack from './HeroDualTrack'
import MerchantShowcase from './MerchantShowcase'
import { AgenceLandingPublicView } from './agence/components/AgenceLandingPublicView'

interface Props {
  initialMode?: 'acheteur' | 'marchand' | 'agence'
  prixTafTaf?: number
  searchBarSlot: React.ReactNode
  categoriesSlot: React.ReactNode
  buyerContentSlot: React.ReactNode
}

function HomeDualTrackContainerContent({
  initialMode = 'acheteur',
  prixTafTaf = 2500,
  searchBarSlot,
  categoriesSlot,
  buyerContentSlot
}: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlMode = searchParams.get('mode')
  const hasFilter = Boolean(
    searchParams.get('q') ||
    searchParams.get('categorie') ||
    searchParams.get('cat') ||
    searchParams.get('tri') ||
    searchParams.get('prixMin') ||
    searchParams.get('prixMax') ||
    searchParams.get('etat') ||
    searchParams.get('sousType')
  )

  // Calcul du mode effectif : Acheteur prioritaire si filtre de recherche actif
  const effectiveMode: 'acheteur' | 'marchand' | 'agence' = (
    !hasFilter && (urlMode === 'marchand' || urlMode === 'commercant')
  ) ? 'marchand' : (
    !hasFilter && (urlMode === 'agence' || urlMode === 'immo-pro')
  ) ? 'agence' : 'acheteur'

  const [activeTab, setActiveTab] = useState<'acheteur' | 'marchand' | 'agence'>(effectiveMode)

  // Synchronisation réactive immédiate quand l'URL ou les filtres changent
  useEffect(() => {
    setActiveTab(effectiveMode)
  }, [effectiveMode])

  function handleTabChange(tab: 'acheteur' | 'marchand' | 'agence') {
    setActiveTab(tab)
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        if (tab === 'marchand') {
          url.searchParams.set('mode', 'marchand')
          url.searchParams.delete('q')
          url.searchParams.delete('categorie')
          url.searchParams.delete('prixMin')
          url.searchParams.delete('prixMax')
          url.searchParams.delete('etat')
          url.searchParams.delete('tri')
          url.searchParams.delete('sousType')
        } else if (tab === 'agence') {
          url.searchParams.set('mode', 'agence')
          url.searchParams.delete('q')
          url.searchParams.delete('categorie')
          url.searchParams.delete('prixMin')
          url.searchParams.delete('prixMax')
          url.searchParams.delete('etat')
          url.searchParams.delete('tri')
          url.searchParams.delete('sousType')
        } else {
          url.searchParams.delete('mode')
        }
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + (url.hash || ''))
      }
    } catch (err) {
      console.warn('[Nopalou:HomeDualTrackContainer:handleTabChange]', err)
    }
  }

  return (
    <>
      {/* ── SECTION HERO AVEC TRANSFORMATION DUELLE & TRIPARTITE ── */}
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

      {/* ── CONTENU DU CORPS DE PAGE : METAMORPHOSE TOTALE SANS RECHARGEMENT ── */}
      <main id="resultats" className="page-container" style={{ maxWidth: 'var(--max-w, 1380px)', paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
        {activeTab === 'acheteur' ? (
          /* VUE 1 : CATALOGUE ACHETEUR, COMPARATEUR DE PRIX & FILTRES */
          <div>
            {buyerContentSlot}
          </div>
        ) : activeTab === 'marchand' ? (
          /* VUE 2 : SHOWCASE COMPLET DÉDIÉ AUX COMMERÇANTS & CAISSE POS */
          <div>
            <MerchantShowcase prixTafTaf={prixTafTaf} />
          </div>
        ) : (
          /* VUE 3 : SHOWCASE COMPLET DÉDIÉ AUX AGENCES IMMOBILIÈRES & GESTION LOCATIVE */
          <div>
            <AgenceLandingPublicView hideHero={true} />
          </div>
        )}
      </main>
    </>
  )
}

export default function HomeDualTrackContainer(props: Props) {
  return (
    <Suspense fallback={
      <main id="resultats" className="page-container" style={{ maxWidth: 'var(--max-w, 1380px)', paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
        <div>
          {props.buyerContentSlot}
        </div>
      </main>
    }>
      <HomeDualTrackContainerContent {...props} />
    </Suspense>
  )
}
