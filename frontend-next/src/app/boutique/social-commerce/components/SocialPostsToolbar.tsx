'use client'

import React from 'react'
import { Plus, Search, CheckSquare, Square } from 'lucide-react'
import { PlatformFilter, PostFilter, TriOption } from '../types'

interface SocialPostsToolbarProps {
  totalCount: number
  unlinkedCount: number
  featuredCount: number
  hiddenCount: number
  displayedCount: number
  selectedCount: number
  postFilter: PostFilter
  setPostFilter: (f: PostFilter) => void
  onAddClick: () => void
  rechercheTexte: string
  setRechercheTexte: (v: string) => void
  filtrePlatform: PlatformFilter
  setFiltrePlatform: (f: PlatformFilter) => void
  triOption: TriOption
  setTriOption: (t: TriOption) => void
  toggleSelectAllPosts: () => void
}

export function SocialPostsToolbar({
  totalCount,
  unlinkedCount,
  featuredCount,
  hiddenCount,
  displayedCount,
  selectedCount,
  postFilter,
  setPostFilter,
  onAddClick,
  rechercheTexte,
  setRechercheTexte,
  filtrePlatform,
  setFiltrePlatform,
  triOption,
  setTriOption,
  toggleSelectAllPosts,
}: SocialPostsToolbarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' }}>
        <div className="social-filter-pills">
          <button
            type="button"
            onClick={() => setPostFilter('all')}
            className={`social-filter-pill ${postFilter === 'all' ? 'active' : ''}`}
          >
            Toutes ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setPostFilter('unlinked')}
            className={`social-filter-pill ${postFilter === 'unlinked' ? (unlinkedCount > 0 ? 'warning-active' : 'active') : ''}`}
            style={{
              color: postFilter !== 'unlinked' && unlinkedCount > 0 ? '#ea580c' : undefined,
              borderColor: postFilter !== 'unlinked' && unlinkedCount > 0 ? '#fed7aa' : undefined,
              background: postFilter !== 'unlinked' && unlinkedCount > 0 ? '#fff7ed' : undefined,
            }}
          >
            À associer ({unlinkedCount})
          </button>

          <button
            type="button"
            onClick={() => setPostFilter('featured')}
            className={`social-filter-pill ${postFilter === 'featured' ? 'active' : ''}`}
          >
            À la une ({featuredCount})
          </button>

          <button
            type="button"
            onClick={() => setPostFilter('hidden')}
            className={`social-filter-pill ${postFilter === 'hidden' ? 'active' : ''}`}
          >
            Masquées ({hiddenCount})
          </button>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#fff7ed',
            color: '#C75B00',
            border: '1px solid #fed7aa',
            borderRadius: 20,
            padding: '4px 10px',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={12} />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Ligne Omni-Recherche, Filtre Plateforme, Tri & Sélection Globale */}
      <div className="saas-toolbar-container">
        <div className="saas-search-wrap saas-toolbar-full">
          <Search size={14} className="saas-search-icon" />
          <input
            type="text"
            value={rechercheTexte}
            onChange={e => setRechercheTexte(e.target.value)}
            placeholder="Rechercher par mot-clé, produit, @auteur..."
            className="saas-search-input"
          />
          {rechercheTexte && (
            <button
              type="button"
              onClick={() => setRechercheTexte('')}
              className="saas-search-clear"
              title="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>

        <div className="saas-toolbar-grid">
          <select
            value={filtrePlatform}
            onChange={e => setFiltrePlatform(e.target.value as PlatformFilter)}
            className="saas-select-control"
            title="Filtrer par plateforme"
          >
            <option value="all">Toutes plateformes</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
          </select>

          <select
            value={triOption}
            onChange={e => setTriOption(e.target.value as TriOption)}
            className="saas-select-control"
            title="Trier les publications"
          >
            <option value="date_desc">Plus récentes</option>
            <option value="date_asc">Plus anciennes</option>
            <option value="unlinked_first">Non associées d&apos;abord</option>
            <option value="linked_first">Produits liés d&apos;abord</option>
            <option value="featured_first">À la une d&apos;abord</option>
            <option value="platform">Par plateforme</option>
          </select>

          {displayedCount > 0 && (
            <button
              type="button"
              onClick={toggleSelectAllPosts}
              className={`saas-toolbar-btn ${selectedCount > 0 ? 'selected' : ''}`}
              title={selectedCount === displayedCount ? 'Tout désélectionner' : 'Tout sélectionner'}
            >
              {selectedCount === displayedCount ? <CheckSquare size={13} /> : <Square size={13} />}
              <span>{selectedCount === displayedCount ? 'Désélectionner' : 'Tout cocher'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
