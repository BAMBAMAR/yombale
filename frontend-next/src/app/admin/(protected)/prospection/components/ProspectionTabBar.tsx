import { Users, Layers, Send, History, ShieldCheck, Ban, LucideIcon } from 'lucide-react'
import type { TabType } from './types'

interface TabItem {
  id: TabType
  label: string
  icon: LucideIcon
}

interface Props {
  activeTab: TabType
  onSelectTab: (tab: TabType) => void
  totalLeads: number
  blacklistCount: number
}

export default function ProspectionTabBar({
  activeTab,
  onSelectTab,
  totalLeads,
  blacklistCount,
}: Props) {
  const tabs: TabItem[] = [
    { id: 'crm', label: `1. Base CRM Leads (${totalLeads})`, icon: Users },
    { id: 'import', label: '2. Collecteur & Import Vrac', icon: Layers },
    { id: 'campagnes', label: '3. Dispatcher & Campagnes', icon: Send },
    { id: 'logs', label: '4. Historique d\'Envois', icon: History },
    { id: 'control', label: '5. Centre de Contrôle & Crons', icon: ShieldCheck },
    { id: 'blacklist', label: `6. Liste Noire (${blacklistCount})`, icon: Ban },
  ]

  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto', background: '#F8FAFC',
      padding: '6px', borderRadius: 16, marginBottom: 28, border: '1px solid #E2E8F0',
    }}>
      {tabs.map((t) => {
        const Icon = t.icon
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            onClick={() => onSelectTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontWeight: isActive ? 800 : 600,
              color: isActive ? '#16A34A' : '#64748B',
              background: isActive ? '#ffffff' : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
          >
            <Icon size={18} color={isActive ? '#16A34A' : '#64748B'} />
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
