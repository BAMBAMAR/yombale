import React from 'react'
import { TabStatus } from './types'

interface AdminAnnoncesTabsProps {
  activeTab: TabStatus
  onTabChange: (tab: TabStatus) => void
  counts: {
    attente: number
    actives: number
    boostees: number
    rejetees: number
    toutes: number
  }
}

export default function AdminAnnoncesTabs({
  activeTab,
  onTabChange,
  counts
}: AdminAnnoncesTabsProps) {
  const tabs: { id: TabStatus; label: string; count: number; activeColor: string; shadowColor: string }[] = [
    { id: 'attente', label: 'En attente', count: counts.attente, activeColor: '#f59e0b', shadowColor: 'rgba(245, 158, 11, 0.25)' },
    { id: 'actives', label: 'Actives', count: counts.actives, activeColor: '#16a34a', shadowColor: 'rgba(22, 163, 74, 0.25)' },
    { id: 'boostees', label: 'Boostées', count: counts.boostees, activeColor: '#d97706', shadowColor: 'rgba(217, 119, 6, 0.25)' },
    { id: 'rejetees', label: 'Rejetées', count: counts.rejetees, activeColor: '#dc2626', shadowColor: 'rgba(220, 38, 38, 0.25)' },
    { id: 'toutes', label: 'Toutes', count: counts.toutes, activeColor: '#1d4ed8', shadowColor: 'rgba(29, 78, 216, 0.25)' },
  ]

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: 4 }}>
      {tabs.map(tab => {
        const isSelected = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              background: isSelected ? tab.activeColor : '#f8fafc',
              color: isSelected ? '#fff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: isSelected ? `0 4px 12px ${tab.shadowColor}` : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                background: isSelected ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12
              }}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
