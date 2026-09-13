'use client'

import React from 'react'
import { Link2, RefreshCw, Sparkles } from 'lucide-react'

interface SocialImportSingleViewProps {
  importUrl: string
  setImportUrl: (url: string) => void
  importing: boolean
  handleImportUrl: (e: React.FormEvent) => Promise<void>
}

export function SocialImportSingleView({
  importUrl,
  setImportUrl,
  importing,
  handleImportUrl,
}: SocialImportSingleViewProps) {
  return (
    <form onSubmit={handleImportUrl} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px', minWidth: 0, position: 'relative' }}>
          <Link2
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="url"
            placeholder="https://www.tiktok.com/@... ou instagram.com/reel/..."
            value={importUrl}
            onChange={e => setImportUrl(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 10,
              border: '1.5px solid #cbd5e1',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={importing || !importUrl.trim()}
          style={{
            background: importing ? '#94a3b8' : '#C75B00',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 900,
            cursor: importing ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            flex: '1 1 auto',
          }}
        >
          {importing ? (
            <>
              <RefreshCw size={14} className="spin" />
              <span>Analyse…</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Importer &amp; Associer</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
