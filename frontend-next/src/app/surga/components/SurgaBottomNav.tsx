'use client'

import React from 'react'
import Link from 'next/link'
import { Sun, FileText, Wallet, Calendar, SlidersHorizontal, type LucideIcon } from 'lucide-react'

export type SurgaTab = 'aujourdhui' | 'notes' | 'depenses' | 'agenda' | 'plus'

interface SurgaBottomNavProps {
  activeTab: SurgaTab
  onTabChange?: (tab: SurgaTab) => void
}

export default function SurgaBottomNav({ activeTab, onTabChange }: SurgaBottomNavProps) {
  const tabs: Array<{ id: SurgaTab; label: string; icon: LucideIcon }> = [
    { id: 'aujourdhui', label: "Aujourd'hui", icon: Sun },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'depenses', label: 'Dépenses', icon: Wallet },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'plus', label: 'Plus', icon: SlidersHorizontal },
  ]

  const handleTabClick = (tabId: SurgaTab, e: React.MouseEvent) => {
    if (onTabChange) {
      e.preventDefault()
      onTabChange(tabId)
    }
  }

  return (
    <nav className="surga-bottom-nav" aria-label="Navigation principale Surga">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <Link
            key={tab.id}
            href={`/surga?tab=${tab.id}`}
            onClick={(e) => handleTabClick(tab.id, e)}
            className={`surga-nav-item${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
