import React from 'react'
import { Zap, FileSpreadsheet, Wand2, Users, QrCode } from 'lucide-react'
import { MigrationTab } from './types'

interface MigrationTabBarProps {
  activeTab: MigrationTab
  onSelectTab: (tab: MigrationTab) => void
}

const TABS: { id: MigrationTab; label: string; icon: React.ReactNode }[] = [
  { id: 'shopify', label: 'Aspirateur Shopify (1-Clic)', icon: <Zap size={16} /> },
  { id: 'csv', label: 'Import CSV / Excel Universel', icon: <FileSpreadsheet size={16} /> },
  { id: 'magic', label: 'Baguette Magique par Lien', icon: <Wand2 size={16} /> },
  { id: 'dettes', label: 'Carnet de Dettes & Clients POS', icon: <Users size={16} /> },
  { id: 'kit', label: 'Kit Vitrine & WhatsApp', icon: <QrCode size={16} /> },
]

export default function MigrationTabBar({ activeTab, onSelectTab }: MigrationTabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        borderBottom: '2px solid var(--border, #e2e8f0)',
        marginBottom: 24,
        overflowX: 'auto',
        paddingBottom: 4,
      }}
    >
      {TABS.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelectTab(t.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === t.id ? '#0284c7' : 'transparent',
            color: activeTab === t.id ? '#ffffff' : '#64748b',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease-in-out',
          }}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}
