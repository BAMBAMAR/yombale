'use client'

import React from 'react'
import { Tag, Sparkles, Info, Video } from 'lucide-react'

interface BoutiqueTabsNavProps {
  tab: 'produits' | 'social' | 'annonces' | 'infos'
  setTab: (tab: 'produits' | 'social' | 'annonces' | 'infos') => void
  currentRadius: string
  couleurTheme: string
  produitsCount: number
  socialPostsCount: number
  annoncesCount: number
}

export default function BoutiqueTabsNav({
  tab,
  setTab,
  currentRadius,
  couleurTheme,
  produitsCount,
  socialPostsCount,
  annoncesCount,
}: BoutiqueTabsNavProps) {
  return (
    <div
      className="nopalou-scroll-tabs"
      style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        background: '#f1f5f9',
        borderRadius: 14,
        marginBottom: 12,
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <button
        type="button"
        onClick={() => setTab('produits')}
        style={{
          flex: '0 0 auto',
          padding: '8px 14px',
          borderRadius: currentRadius,
          border: 'none',
          background: tab === 'produits' ? '#fff' : 'transparent',
          color: tab === 'produits' ? couleurTheme : '#64748b',
          fontWeight: tab === 'produits' ? 900 : 600,
          fontSize: 12.5,
          cursor: 'pointer',
          boxShadow: tab === 'produits' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
      >
        <Tag size={15} style={{ color: tab === 'produits' ? couleurTheme : '#94a3b8' }} />
        <span>Produits</span>
        {produitsCount > 0 && (
          <span
            style={{
              background: tab === 'produits' ? `${couleurTheme}15` : '#e2e8f0',
              color: tab === 'produits' ? couleurTheme : '#475569',
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {produitsCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setTab('social')}
        style={{
          flex: '0 0 auto',
          padding: '8px 14px',
          borderRadius: currentRadius,
          border: 'none',
          background: tab === 'social' ? '#fff' : 'transparent',
          color: tab === 'social' ? couleurTheme : '#64748b',
          fontWeight: tab === 'social' ? 900 : 600,
          fontSize: 12.5,
          cursor: 'pointer',
          boxShadow: tab === 'social' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
      >
        <Video size={15} style={{ color: tab === 'social' ? couleurTheme : '#94a3b8' }} />
        <span>Autres produits</span>
        {socialPostsCount > 0 && (
          <span
            style={{
              background: tab === 'social' ? `${couleurTheme}15` : '#e2e8f0',
              color: tab === 'social' ? couleurTheme : '#475569',
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {socialPostsCount}
          </span>
        )}
      </button>

      {annoncesCount > 0 && (
        <button
          type="button"
          onClick={() => setTab('annonces')}
          style={{
            flex: '1 0 auto',
            minWidth: 100,
            padding: '8px 12px',
            borderRadius: 10,
            border: 'none',
            background: tab === 'annonces' ? '#fff' : 'transparent',
            color: tab === 'annonces' ? '#1e3a5f' : '#64748b',
            fontWeight: tab === 'annonces' ? 900 : 600,
            fontSize: 12.5,
            cursor: 'pointer',
            boxShadow: tab === 'annonces' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={15} style={{ color: tab === 'annonces' ? '#1e3a5f' : '#94a3b8' }} />
          <span>Annonces</span>
          <span
            style={{
              background: tab === 'annonces' ? '#eff6ff' : '#e2e8f0',
              color: tab === 'annonces' ? '#1d4ed8' : '#475569',
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {annoncesCount}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setTab('infos')}
        style={{
          flex: '1 0 auto',
          minWidth: 100,
          padding: '8px 12px',
          borderRadius: 10,
          border: 'none',
          background: tab === 'infos' ? '#fff' : 'transparent',
          color: tab === 'infos' ? '#0f172a' : '#64748b',
          fontWeight: tab === 'infos' ? 900 : 600,
          fontSize: 12.5,
          cursor: 'pointer',
          boxShadow: tab === 'infos' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
      >
        <Info size={15} style={{ color: tab === 'infos' ? '#0f172a' : '#94a3b8' }} />
        <span>Infos & Contact</span>
      </button>
    </div>
  )
}
