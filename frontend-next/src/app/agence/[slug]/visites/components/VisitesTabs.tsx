'use client'

import React from 'react'
import { Calendar, Clock } from 'lucide-react'

interface VisitesTabsProps {
  ongletActif: 'agenda' | 'demandes'
  onSelectOnglet: (onglet: 'agenda' | 'demandes') => void
  totalAgenda: number
  totalDemandes: number
}

export default function VisitesTabs({
  ongletActif,
  onSelectOnglet,
  totalAgenda,
  totalDemandes,
}: VisitesTabsProps) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
      <button
        type="button"
        onClick={() => onSelectOnglet('agenda')}
        style={{
          padding: '9px 16px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 13.5,
          cursor: 'pointer',
          border: '1px solid var(--border, #E8DDD2)',
          background: ongletActif === 'agenda' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
          color: ongletActif === 'agenda' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Calendar size={15} />
        <span>Agenda des Visites ({totalAgenda})</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectOnglet('demandes')}
        style={{
          padding: '9px 16px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 13.5,
          cursor: 'pointer',
          border: '1px solid var(--border, #E8DDD2)',
          background: ongletActif === 'demandes' ? 'var(--accent, #C75B00)' : '#FFFFFF',
          color: ongletActif === 'demandes' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Clock size={15} />
        <span>Demandes reçues en attente</span>
        {totalDemandes > 0 && (
          <span
            style={{
              background: ongletActif === 'demandes' ? '#FFFFFF' : 'var(--accent, #C75B00)',
              color: ongletActif === 'demandes' ? 'var(--accent, #C75B00)' : '#FFFFFF',
              fontSize: 11,
              fontWeight: 900,
              padding: '2px 7px',
              borderRadius: 10,
            }}
          >
            {totalDemandes}
          </span>
        )}
      </button>
    </div>
  )
}
