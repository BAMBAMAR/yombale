'use client'

import React from 'react'
import type { KalpeSynthese } from '../types'
import { LayoutDashboard, Receipt, Users, Target, BarChart2 } from 'lucide-react'

export type KalpeTab = 'apercu' | 'journal' | 'dettes' | 'epargne' | 'stats'

interface KalpeSubTabsProps {
  activeTab: KalpeTab
  setActiveTab: (tab: KalpeTab) => void
  synthese: KalpeSynthese | null
}

export function KalpeSubTabs({ activeTab, setActiveTab, synthese }: KalpeSubTabsProps) {
  return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F8F5F0',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid #E8DDD2',
          margin: '16px 0 20px 0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          flexWrap: 'nowrap',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('apercu')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'apercu' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'apercu' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <LayoutDashboard size={15} style={{ flexShrink: 0 }} />
          <span>Aperçu</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'journal' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'journal' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <Receipt size={15} style={{ flexShrink: 0 }} />
          <span>Journal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dettes')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'dettes' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'dettes' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={15} style={{ flexShrink: 0 }} />
          <span>Créances & Dettes</span>
          {synthese && synthese.nb_creances > 0 && (
            <span
              style={{
                background: activeTab === 'dettes' ? '#C75B00' : '#E8DDD2',
                color: activeTab === 'dettes' ? '#FFFFFF' : '#1C2B4A',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '999px',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {synthese.nb_creances}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('epargne')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'epargne' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'epargne' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <Target size={15} style={{ flexShrink: 0 }} />
          <span>Épargne</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'stats' ? '#1C2B4A' : 'transparent',
            color: activeTab === 'stats' ? '#FFFFFF' : '#555',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'all 0.15s ease',
          }}
        >
          <BarChart2 size={15} style={{ flexShrink: 0 }} />
          <span>Statistiques</span>
        </button>
      </div>
  )
}
