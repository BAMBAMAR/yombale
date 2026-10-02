'use client'

import React, { useState, useRef } from 'react'
import AgenceDirectoryCard, { AgenceItem } from './AgenceDirectoryCard'
import { ChevronLeft, ChevronRight, LayoutGrid, SlidersHorizontal, Building2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  agences: AgenceItem[]
}

export default function AgencesDirectoryList({ agences }: Props) {
  const [viewMode, setViewMode] = useState<'rail' | 'grid'>('rail')
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    trackRef.current?.scrollBy({ left: -320, behavior: 'smooth' })
  }

  const scrollRight = () => {
    trackRef.current?.scrollBy({ left: 320, behavior: 'smooth' })
  }

  if (agences.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        <Building2 size={40} style={{ margin: '0 auto 14px', color: '#94A3B8' }} />
        <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
          Aucune agence trouvée
        </h3>
        <p style={{ fontSize: 13, color: '#64748B', maxWidth: 460, margin: '0 auto 16px', lineHeight: 1.45 }}>
          Aucune agence ne correspond exactement à vos critères de recherche actuels. Essayez d'élargir votre localisation ou de réinitialiser vos filtres.
        </p>
        <Link
          href="/agences"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            borderRadius: 8,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          Réinitialiser tous les filtres
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* AUD-229 : `>` dans un <style>{texte}</style> = `&gt;` côté serveur, `>` côté client : erreur d'hydratation #425.
          Contenu statique : innerHTML identique des deux côtés. */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Desktop: always a responsive grid */
        .agences-display-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 16px;
        }
        .agences-mobile-controls {
          display: none;
        }

        /* Mobile: switchable between horizontal rail and full list */
        @media (max-width: 768px) {
          .agences-mobile-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 0 4px;
          }
          .agences-display-container.mode-rail {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            gap: 12px !important;
            padding-bottom: 8px !important;
            scrollbar-width: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .agences-display-container.mode-rail::-webkit-scrollbar {
            display: none !important;
          }
          .agences-display-container.mode-rail > div {
            flex: 0 0 285px !important;
            min-width: 0 !important;
            scroll-snap-align: start !important;
          }
          .agences-display-container.mode-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
          }
          .agences-display-container.mode-grid > div {
            width: 100% !important;
          }
        }
      ` }} />

      {/* Barre de contrôle Mobile : Mode Carrousel Horizontal vs Liste Verticale */}
      <div className="agences-mobile-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>
            {viewMode === 'rail' ? 'Défilement horizontal (Swipe)' : 'Vue liste verticale'}
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            ({agences.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {viewMode === 'rail' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Agences précédentes"
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
                aria-label="Agences suivantes"
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

      {/* Conteneur des fiches Agences */}
      <div
        ref={trackRef}
        className={`agences-display-container mode-${viewMode}`}
      >
        {agences.map(ag => (
          <AgenceDirectoryCard key={ag.id} agence={ag} />
        ))}
      </div>
    </div>
  )
}
