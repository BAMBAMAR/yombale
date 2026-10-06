'use client'

// frontend-next/src/app/surga/components/SurgaEmploiNav.tsx
// Barre de navigation à 5 onglets pour le pôle Emploi Surga

import React from 'react'
import { User, FileText, Mail, HelpCircle, FolderArchive } from 'lucide-react'

export type TabEmploi = 'profil' | 'cv' | 'lettre' | 'entretien' | 'documents'

interface SurgaEmploiNavProps {
  activeTab: TabEmploi
  onSelectTab: (tab: TabEmploi) => void
  nbDocuments: number
}

const ONGLETS: Array<{ id: TabEmploi; label: string; icon: React.ElementType }> = [
  { id: 'profil', label: 'Profil Pro', icon: User },
  { id: 'cv', label: 'Mon CV PDF', icon: FileText },
  { id: 'lettre', label: 'Lettres', icon: Mail },
  { id: 'entretien', label: 'Entretien', icon: HelpCircle },
  { id: 'documents', label: 'Docs', icon: FolderArchive },
]

export default function SurgaEmploiNav({
  activeTab,
  onSelectTab,
  nbDocuments,
}: SurgaEmploiNavProps) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--border, #E8DDD2)',
        backgroundColor: 'var(--bg, #F8F5F0)',
        overflowX: 'auto',
      }}
    >
      {ONGLETS.map(({ id, label, icon: Icon }) => {
        const estActif = activeTab === id
        const libelle = id === 'documents' ? `${label} (${nbDocuments})` : label
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectTab(id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '10px 8px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: estActif ? '#FFFFFF' : 'transparent',
              color: estActif ? 'var(--accent, #C75B00)' : 'var(--text2, #5A4E42)',
              borderBottom: estActif ? '2px solid var(--accent, #C75B00)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={14} />
            <span>{libelle}</span>
          </button>
        )
      })}
    </div>
  )
}
