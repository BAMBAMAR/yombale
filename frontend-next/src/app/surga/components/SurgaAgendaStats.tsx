'use client'

import React from 'react'

interface SurgaAgendaStatsProps {
  aujourdhui: number
  enRetard: number
  termines: number
}

export default function SurgaAgendaStats({ aujourdhui, enRetard, termines }: SurgaAgendaStatsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        padding: '10px 12px',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        border: '1px solid var(--border, #E8DDD2)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{aujourdhui}</div>
        <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
          Aujourd’hui
        </div>
      </div>
      <div
        style={{
          textAlign: 'center',
          borderLeft: '1px solid var(--border, #E8DDD2)',
          borderRight: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: enRetard > 0 ? '#DC2626' : 'var(--text3, #73675E)' }}>
          {enRetard}
        </div>
        <div
          style={{
            fontSize: 12,
            color: enRetard > 0 ? '#DC2626' : 'var(--text3, #73675E)',
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}
        >
          En retard
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>{termines}</div>
        <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
          Complétés
        </div>
      </div>
    </div>
  )
}
