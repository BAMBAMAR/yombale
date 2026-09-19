'use client'

import React from 'react'
import { Wallet, Mic, Download, Layers } from 'lucide-react'
import type { ContexteType } from '../types'

interface KalpeHeaderProps {
  contexte: ContexteType
  onSelectContexte: (ctx: ContexteType) => void
  hasBoutique: boolean
  onToggleVoice: () => void
  isListeningVoice?: boolean
  onExportCSV: () => void
}

export default function KalpeHeader({
  contexte,
  onSelectContexte,
  hasBoutique,
  onToggleVoice,
  isListeningVoice = false,
  onExportCSV,
}: KalpeHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingBottom: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(28, 43, 74, 0.2)',
            }}
          >
            <Wallet size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: 'var(--navy, #1C2B4A)',
                margin: 0,
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Sama Xaalis</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--price, #0A5C36)',
                  background: 'rgba(10, 92, 54, 0.1)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  border: '1px solid rgba(10, 92, 54, 0.2)',
                }}
              >
                Actif
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Mon argent • Ma gestion • Ma tranquillité
            </p>
          </div>
        </div>

        {/* Boutons d'outils audio & export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onToggleVoice}
            className="btn-npl"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 10,
              border: isListeningVoice ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
              background: isListeningVoice ? '#FFF7ED' : '#ffffff',
              color: isListeningVoice ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Assistant vocal bilingue Wolof / Français"
            aria-label="Assistant vocal"
          >
            <Mic size={14} strokeWidth={2.4} style={{ color: isListeningVoice ? 'var(--accent, #C75B00)' : 'inherit' }} />
            <span className="hidden sm:inline">{isListeningVoice ? 'Écoute...' : 'Dicter'}</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 10,
              border: '1px solid var(--border, #E8DDD2)',
              background: '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
            }}
            title="Exporter le journal en CSV"
            aria-label="Exporter"
          >
            <Download size={14} strokeWidth={2.4} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Sélecteur de Contexte Monoligne */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(28, 43, 74, 0.05)',
          padding: 4,
          borderRadius: 12,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <button
          type="button"
          onClick={() => onSelectContexte('all')}
          style={{
            flex: 1,
            padding: '7px 10px',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: contexte === 'all' ? 'var(--navy, #1C2B4A)' : 'transparent',
            color: contexte === 'all' ? '#ffffff' : '#64748B',
            transition: 'background 0.15s ease, color 0.15s ease',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          Tout
        </button>

        <button
          type="button"
          onClick={() => onSelectContexte('personnel')}
          style={{
            flex: 1,
            padding: '7px 10px',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: contexte === 'personnel' ? 'var(--navy, #1C2B4A)' : 'transparent',
            color: contexte === 'personnel' ? '#ffffff' : '#64748B',
            transition: 'background 0.15s ease, color 0.15s ease',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          Personnel
        </button>

        {hasBoutique && (
          <button
            type="button"
            onClick={() => onSelectContexte('activite')}
            style={{
              flex: 1,
              padding: '7px 10px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: contexte === 'activite' ? 'var(--accent, #C75B00)' : 'transparent',
              color: contexte === 'activite' ? '#ffffff' : '#64748B',
              transition: 'background 0.15s ease, color 0.15s ease',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            Activité
          </button>
        )}
      </div>
    </div>
  )
}
