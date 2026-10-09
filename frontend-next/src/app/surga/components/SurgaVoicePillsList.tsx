'use client'

import React from 'react'
import { interpreterCommandeVocale, type ActionVocaleDetectee } from '@/lib/surga-voice'

export const PASTILLES_EXEMPLES = [
  { label: 'Concours', texte: 'concours' },
  { label: 'Bon coin', texte: 'bon coin' },
  { label: 'Rappel 8h', texte: 'rappel demain 8h' },
  { label: '2 500 taxi', texte: 'note 2500 taxi' },
  { label: 'Trafic VDN', texte: 'trafic VDN' },
  { label: 'Passeport', texte: 'comment faire mon passeport' },
  { label: 'Appartement', texte: 'appartement' },
  { label: 'Météo', texte: 'météo' },
  { label: 'Radio', texte: 'radio' },
  { label: '15 000 * 3', texte: '15000 fois 3' },
]

interface SurgaVoicePillsListProps {
  onSelect: (texte: string, action: ActionVocaleDetectee) => void
}

export default function SurgaVoicePillsList({ onSelect }: SurgaVoicePillsListProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: 'var(--surga-text3, #94A3B8)', marginBottom: 8, fontWeight: 700 }}>
        Exemples de commandes vocales ou écrites :
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {PASTILLES_EXEMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => {
              const action = interpreterCommandeVocale(ex.texte)
              onSelect(ex.texte, action)
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: '1px solid var(--surga-border, #E2E8F0)',
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              fontSize: 12,
              color: 'var(--surga-primary, #0F172A)',
              cursor: 'pointer',
              fontWeight: 600,
              minHeight: 34,
              transition: 'all 0.15s ease',
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}
