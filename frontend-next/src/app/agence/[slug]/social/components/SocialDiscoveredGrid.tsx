'use client'

import React from 'react'
import { Check } from 'lucide-react'

export interface DiscoveredItem {
  externalPostId: string
  url: string
  platform: string
  mediaType: string
  thumbnailUrl: string
  caption: string
  author: string
}

interface SocialDiscoveredGridProps {
  discoveredPosts: DiscoveredItem[]
  selectedUrls: Set<string>
  onToggleUrl: (url: string) => void
  onConfirmImport: () => void
}

export function SocialDiscoveredGrid({
  discoveredPosts,
  selectedUrls,
  onToggleUrl,
  onConfirmImport,
}: SocialDiscoveredGridProps) {
  if (discoveredPosts.length === 0) return null

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Publications Découvertes ({selectedUrls.size}/{discoveredPosts.length} sélectionnée(s))
          </h3>
          <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0 0' }}>
            Cochez les vidéos à intégrer dans votre Social Shop.
          </p>
        </div>

        <button
          type="button"
          onClick={onConfirmImport}
          disabled={selectedUrls.size === 0}
          className="agence-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Check size={16} />
          <span>Confirmer l'import ({selectedUrls.size})</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {discoveredPosts.map(p => {
          const isSelected = selectedUrls.has(p.url)
          return (
            <div
              key={p.url}
              onClick={() => onToggleUrl(p.url)}
              style={{
                border: isSelected ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#FFFFFF',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ height: 130, background: '#F1F5F9', position: 'relative' }}>
                <img
                  src={p.thumbnailUrl}
                  alt={p.caption}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: isSelected ? 'var(--accent, #C75B00)' : 'rgba(0,0,0,0.4)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected ? <Check size={16} /> : null}
                </div>
              </div>

              <div style={{ padding: 10 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--navy, #1C2B4A)',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.caption || 'Sans légende'}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{p.author}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
