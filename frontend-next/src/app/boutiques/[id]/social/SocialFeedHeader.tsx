'use client'

import React from 'react'
import { Sparkles, ShoppingBag, ExternalLink } from 'lucide-react'
import { SocialAccount, SocialPost, PLATFORM_CONFIG, formatHandle } from './types'

interface SocialFeedHeaderProps {
  accounts: SocialAccount[]
  posts: SocialPost[]
  activeFilter: string
  setActiveFilter: (filter: string) => void
  boutiqueNom: string
}

export default function SocialFeedHeader({
  accounts,
  posts,
  activeFilter,
  setActiveFilter,
  boutiqueNom,
}: SocialFeedHeaderProps) {
  return (
    <>
      {/* ── BANNIÈRE D'ACCROCHE & BADGES OFFICIELS DES RÉSEAUX MARCHAND ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '20px 24px',
          color: '#fff',
          marginBottom: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(199, 91, 0, 0.25)',
                border: '1px solid rgba(199, 91, 0, 0.5)',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                color: '#fed7aa',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <Sparkles size={12} />
              <span>Autres Produits & Vidéos</span>
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(18px, 3.5vw, 22px)',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              Autres produits de la boutique
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', maxWidth: 650 }}>
              Retrouvez ici les articles présentés sur nos réseaux sociaux officiels (vidéos, Reels, publications). Commandez en 1 clic !
            </p>
          </div>

          {/* Profils officiels connectés */}
          {accounts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {accounts.map(acc => {
                const conf = PLATFORM_CONFIG[acc.plateforme]
                if (!conf) return null
                const Icon = conf.IconComponent

                return (
                  <a
                    key={acc.plateforme}
                    href={acc.profil_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '6px 12px',
                      borderRadius: 20,
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'background 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} />
                    <span>{formatHandle(acc.nom_compte)}</span>
                    <ExternalLink size={12} style={{ opacity: 0.6 }} />
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── BARRE DE FILTRES RESPONSIVE MOBILE ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 16,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          style={{
            padding: '7px 14px',
            borderRadius: 20,
            border: activeFilter === 'all' ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
            background: activeFilter === 'all' ? '#0f172a' : '#ffffff',
            color: activeFilter === 'all' ? '#ffffff' : '#475569',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Tous ({posts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('with_products')}
          style={{
            padding: '7px 14px',
            borderRadius: 20,
            border: activeFilter === 'with_products' ? '1.5px solid var(--accent, #C75B00)' : '1px solid #e2e8f0',
            background: activeFilter === 'with_products' ? 'var(--accent, #C75B00)' : '#ffffff',
            color: activeFilter === 'with_products' ? '#ffffff' : '#475569',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShoppingBag size={13} />
          <span>Liés au catalogue ({posts.filter(p => p.produits_associes?.length > 0).length})</span>
        </button>

        {['tiktok', 'instagram', 'facebook'].map(platKey => {
          const conf = PLATFORM_CONFIG[platKey]
          if (!conf) return null
          const count = posts.filter(p => p.plateforme === platKey).length
          if (count === 0) return null
          const isActive = activeFilter === platKey
          const Icon = conf.IconComponent

          return (
            <button
              key={platKey}
              type="button"
              onClick={() => setActiveFilter(platKey)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: isActive ? `1.5px solid ${conf.color}` : '1px solid #e2e8f0',
                background: isActive ? conf.color : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon size={13} />
              <span>
                {conf.label} ({count})
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
