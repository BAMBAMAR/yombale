'use client'

import React from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Target,
  Zap,
} from 'lucide-react'

export type SaisieMode = 'revenu' | 'depense' | 'dette' | 'epargne' | 'vente_express'

interface KalpeSaisieModeTabsProps {
  mode: SaisieMode
  setMode: (mode: SaisieMode) => void
  setContexte: (contexte: 'personnel' | 'activite') => void
}

export function KalpeSaisieModeTabs({
  mode,
  setMode,
  setContexte,
}: KalpeSaisieModeTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: '#F8F5F0',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        flexWrap: 'nowrap',
        borderBottom: '1px solid #E8DDD2',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        onClick={() => setMode('depense')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 13px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          border: mode === 'depense' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
          background: mode === 'depense' ? '#FFF3EB' : '#FFFFFF',
          color: mode === 'depense' ? '#C75B00' : '#555',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          overflow: 'visible',
          transition: 'all 0.15s ease',
        }}
      >
        <ArrowUpRight size={14} style={{ flexShrink: 0 }} />
        <span>Dépense</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('revenu')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 13px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          border: mode === 'revenu' ? '1.5px solid #0A5C36' : '1px solid #E8DDD2',
          background: mode === 'revenu' ? '#E9F6ED' : '#FFFFFF',
          color: mode === 'revenu' ? '#0A5C36' : '#555',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          overflow: 'visible',
          transition: 'all 0.15s ease',
        }}
      >
        <ArrowDownLeft size={14} style={{ flexShrink: 0 }} />
        <span>Reçu</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('dette')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 13px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          border: mode === 'dette' ? '1.5px solid #1C2B4A' : '1px solid #E8DDD2',
          background: mode === 'dette' ? '#ECEFF5' : '#FFFFFF',
          color: mode === 'dette' ? '#1C2B4A' : '#555',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          overflow: 'visible',
          transition: 'all 0.15s ease',
        }}
      >
        <Users size={14} style={{ flexShrink: 0 }} />
        <span>Dette / Crédit</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('epargne')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 13px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          border: mode === 'epargne' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
          background: mode === 'epargne' ? '#FFF3EB' : '#FFFFFF',
          color: mode === 'epargne' ? '#C75B00' : '#555',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          overflow: 'visible',
          transition: 'all 0.15s ease',
        }}
      >
        <Target size={14} style={{ flexShrink: 0 }} />
        <span>Épargne</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setMode('vente_express')
          setContexte('activite')
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 13px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          border: mode === 'vente_express' ? '1.5px solid #C75B00' : '1px solid #E8DDD2',
          background: mode === 'vente_express' ? '#FFF3EB' : '#FFFFFF',
          color: mode === 'vente_express' ? '#C75B00' : '#555',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          overflow: 'visible',
          transition: 'all 0.15s ease',
        }}
      >
        <Zap size={14} style={{ flexShrink: 0 }} />
        <span>Vente Express</span>
      </button>
    </div>
  )
}
