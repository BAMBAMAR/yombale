'use client'

import React, { useState, useRef } from 'react'
import BoutiqueCard, { BoutiqueItem } from './BoutiqueCard'
import { ChevronLeft, ChevronRight, LayoutGrid, SlidersHorizontal, Store } from 'lucide-react'
import Link from 'next/link'

interface Props {
  boutiques: BoutiqueItem[]
  searchQuery?: string
}

export default function BoutiquesDirectoryList({ boutiques, searchQuery = '' }: Props) {
  const [viewMode, setViewMode] = useState<'rail' | 'grid'>('rail')
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    trackRef.current?.scrollBy({ left: -320, behavior: 'smooth' })
  }

  const scrollRight = () => {
    trackRef.current?.scrollBy({ left: 320, behavior: 'smooth' })
  }

  if (boutiques.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
        }}
      >
        <Store size={40} style={{ margin: '0 auto 14px', color: '#94a3b8' }} />
        <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#111827', fontWeight: 900 }}>
          Aucune boutique ne correspond à ces critères
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>
          Essayez de modifier votre recherche ou d'élargir les filtres de budget, de ville ou de statut.
        </p>
        <Link
          href="/boutiques"
          style={{
            display: 'inline-block',
            background: 'var(--accent, #C75B00)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Voir toutes les boutiques
        </Link>
      </div>
    )
  }

  return (
    <div>
      <style>{`
        /* Desktop: always a responsive grid */
        .boutiques-display-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 22px;
        }
        .boutiques-mobile-controls {
          display: none;
        }

        /* Mobile: switchable between horizontal rail and full list */
        @media (max-width: 768px) {
          .boutiques-mobile-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 0 4px;
          }
          .boutiques-display-container.mode-rail {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            gap: 12px !important;
            padding-bottom: 8px !important;
            scrollbar-width: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .boutiques-display-container.mode-rail::-webkit-scrollbar {
            display: none !important;
          }
          .boutiques-display-container.mode-rail > div {
            flex: 0 0 285px !important;
            min-width: 0 !important;
            scroll-snap-align: start !important;
          }
          .boutiques-display-container.mode-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
          }
          .boutiques-display-container.mode-grid > div {
            width: 100% !important;
          }
        }
      `}</style>

      {/* Barre de contrôle Mobile : Mode Carrousel Horizontal vs Liste Verticale */}
      <div className="boutiques-mobile-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>
            {viewMode === 'rail' ? 'Défilement horizontal (Swipe)' : 'Vue liste verticale'}
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            ({boutiques.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {viewMode === 'rail' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Boutiques précédentes"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label="Boutiques suivantes"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'rail' ? 'grid' : 'rail')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {viewMode === 'rail' ? (
              <>
                <LayoutGrid size={11} />
                <span>Voir en liste</span>
              </>
            ) : (
              <>
                <SlidersHorizontal size={11} />
                <span>Mode Carrousel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conteneur des fiches Boutiques */}
      <div
        ref={trackRef}
        className={`boutiques-display-container mode-${viewMode}`}
      >
        {boutiques.map(b => (
          <BoutiqueCard key={b.id} boutique={b} searchQuery={searchQuery} />
        ))}
      </div>
    </div>
  )
}
