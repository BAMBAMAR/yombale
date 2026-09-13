'use client'

import React from 'react'
import { Monitor, Check, Copy, ExternalLink } from 'lucide-react'

interface CaissierTerminalBannerProps {
  terminalUrl: string
  copie: boolean
  setCopie: (copie: boolean) => void
  t: (key: string) => string
}

export default function CaissierTerminalBanner({
  terminalUrl,
  copie,
  setCopie,
  t,
}: CaissierTerminalBannerProps) {
  if (!terminalUrl) return null

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #bfdbfe',
        borderLeft: '4px solid #2563eb',
        borderRadius: 16,
        padding: '16px 18px',
        marginBottom: 24,
        boxShadow: '0 2px 10px rgba(37, 99, 235, 0.04)',
        boxSizing: 'border-box',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            flexShrink: 0,
          }}
        >
          <Monitor size={18} />
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e40af' }}>
          {t('caisse.terminalCashier')}
        </h3>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
        {t('shop.terminalHelpText')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', boxSizing: 'border-box' }}>
        <input
          type="text"
          readOnly
          value={terminalUrl}
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            fontSize: 12.5,
            fontWeight: 600,
            color: '#1e40af',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(terminalUrl)
              setCopie(true)
              setTimeout(() => setCopie(false), 3000)
            }}
            className="npl-btn npl-btn-primary npl-btn-md"
            style={{ flex: '1 1 180px', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {copie ? <Check size={14} /> : <Copy size={14} />}
            <span>{copie ? t('account.copied') : t('account.copyLink')}</span>
          </button>

          <a
            href={terminalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="npl-btn npl-btn-secondary npl-btn-md"
            style={{ flex: '1 1 140px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <ExternalLink size={14} />
            <span>{t('shop.openTerminalBtn')}</span>
          </a>
        </div>
      </div>
    </div>
  )
}
