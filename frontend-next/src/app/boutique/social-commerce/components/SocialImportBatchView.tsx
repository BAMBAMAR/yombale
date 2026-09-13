'use client'

import React from 'react'
import { Layers, RefreshCw } from 'lucide-react'

interface SocialImportBatchViewProps {
  batchUrlsText: string
  setBatchUrlsText: (text: string) => void
  batchImporting: boolean
  handleImportBatch: (e: React.FormEvent) => Promise<void>
}

export function SocialImportBatchView({
  batchUrlsText,
  setBatchUrlsText,
  batchImporting,
  handleImportBatch,
}: SocialImportBatchViewProps) {
  const detectedCount = (batchUrlsText.match(/https?:\/\/[^\s]+/g) || []).length

  return (
    <form onSubmit={handleImportBatch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 12.5,
          color: '#0369a1',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Layers size={16} style={{ flexShrink: 0 }} />
        <span>
          Collez un ou plusieurs liens (un par ligne ou séparés par des espaces). TikTok, Instagram Reels ou Facebook Vidéos.
        </span>
      </div>

      <textarea
        rows={4}
        placeholder="https://www.tiktok.com/@.../video/...&#10;https://www.instagram.com/reel/...&#10;https://www.facebook.com/watch/..."
        value={batchUrlsText}
        onChange={e => setBatchUrlsText(e.target.value)}
        required
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1.5px solid #cbd5e1',
          fontSize: 12.5,
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'monospace',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: detectedCount > 0 ? '#C75B00' : '#64748b' }}>
          {detectedCount} lien(s) détecté(s)
        </span>

        <button
          type="submit"
          disabled={batchImporting || !batchUrlsText.trim()}
          style={{
            background: batchImporting ? '#94a3b8' : '#C75B00',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 900,
            cursor: batchImporting ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            flex: '1 1 auto',
          }}
        >
          {batchImporting ? (
            <>
              <RefreshCw size={14} className="spin" />
              <span>Traitement en cours…</span>
            </>
          ) : (
            <>
              <Layers size={14} />
              <span>Importer le lot en 1 clic</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
