'use client'

import React from 'react'
import ExternalImg from '@/components/ExternalImg'
import { Sparkles, RefreshCw, Film, CheckCircle2 } from 'lucide-react'
import { DiscoveredPost } from '../types'

interface SocialProfilePlaceholderCardProps {
  placeholderPost: DiscoveredPost
  profileUsername: string
  batchUrlsText?: string
  setBatchUrlsText?: (text: string) => void
  batchImporting?: boolean
  handleImportBatch?: (e: React.FormEvent) => Promise<void>
}

export function SocialProfilePlaceholderCard({
  placeholderPost,
  profileUsername,
  batchUrlsText = '',
  setBatchUrlsText,
  batchImporting = false,
  handleImportBatch,
}: SocialProfilePlaceholderCardProps) {
  return (
    <div
      style={{
        border: '1.5px solid #fed7aa',
        borderRadius: 14,
        padding: 16,
        background: '#fffdfa',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {placeholderPost.thumbnailUrl ? (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid #C75B00',
            }}
          >
            <ExternalImg
              src={placeholderPost.thumbnailUrl}
              alt={placeholderPost.author || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              flexShrink: 0,
            }}
          >
            <Film size={22} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              {placeholderPost.author || `@${profileUsername}`}
            </span>
            <span
              style={{
                fontSize: 11,
                background: '#f0fdf4',
                color: '#16a34a',
                border: '1px solid #bbf7d0',
                borderRadius: 20,
                padding: '1px 8px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <CheckCircle2 size={12} /> Compte authentifié
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
            {placeholderPost.caption}
          </p>
        </div>
      </div>

      {handleImportBatch && (
        <div style={{ borderTop: '1px solid #fed7aa', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
            Collez ici les liens directs de vos vidéos ou Reels pour les associer automatiquement à vos produits :
          </label>
          <textarea
            rows={3}
            value={batchUrlsText}
            onChange={e => setBatchUrlsText?.(e.target.value)}
            placeholder={'https://www.instagram.com/reel/...\nhttps://www.tiktok.com/@.../video/...'}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1.5px solid #cbd5e1',
              fontSize: 12.5,
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
          <button
            type="button"
            onClick={handleImportBatch}
            disabled={batchImporting || !batchUrlsText?.trim()}
            style={{
              alignSelf: 'flex-start',
              background: batchImporting || !batchUrlsText?.trim() ? '#cbd5e1' : '#C75B00',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: batchImporting || !batchUrlsText?.trim() ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {batchImporting ? (
              <>
                <RefreshCw size={13} className="spin" />
                <span>Importation en cours…</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Importer et associer à mes produits</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
