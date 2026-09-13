import React from 'react'
import { Target, Award, MessageSquare, BookOpen, Printer, UserCheck, Calculator, LucideIcon } from 'lucide-react'
import { TabType } from './types'

interface ForceDeVenteTabBarProps {
  activeTab: TabType
  onSelectTab: (tab: TabType) => void
}

const TABS: { id: TabType; label: string; icon: LucideIcon }[] = [
  { id: 'strategie', label: '1. Stratégie & Zones', icon: Target },
  { id: 'formation', label: '2. Académie & Formation', icon: Award },
  { id: 'pitchs', label: '3. Matrice Pitchs & Objections', icon: MessageSquare },
  { id: 'guide', label: '4. Guide Marchand', icon: BookOpen },
  { id: 'supports', label: '5. Supports Print HD', icon: Printer },
  { id: 'generateur', label: '6. Kit Personnalisé Agent', icon: UserCheck },
  { id: 'simulateur', label: '7. Simulateur de Gains', icon: Calculator },
]

export default function ForceDeVenteTabBar({ activeTab, onSelectTab }: ForceDeVenteTabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        borderBottom: '2px solid var(--border, #E2E8F0)',
        paddingBottom: 2,
        marginBottom: 28,
      }}
    >
      {TABS.map(t => {
        const Icon = t.icon
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTab(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: isActive ? 800 : 600,
              color: isActive ? 'var(--accent, #C75B00)' : '#64748B',
              borderBottom: isActive ? '3px solid var(--accent, #C75B00)' : '3px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={18} color={isActive ? 'var(--accent, #C75B00)' : '#64748B'} />
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
