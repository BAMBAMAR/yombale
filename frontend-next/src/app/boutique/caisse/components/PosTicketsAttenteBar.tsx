'use client'
import React from 'react'

export interface TicketEnAttenteItem {
  id: string
  clientLabel: string
  heure: string
  panier: any[]
}

interface PosTicketsAttenteBarProps {
  tickets: TicketEnAttenteItem[]
  onReprendre: (id: string) => void
}

export default function PosTicketsAttenteBar({ tickets, onReprendre }: PosTicketsAttenteBarProps) {
  if (!tickets || tickets.length === 0) return null

  return (
    <div className="no-print" style={{ padding: '10px 14px', background: 'var(--pos-surface)', borderBottom: '1px solid var(--pos-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--pos-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>👥</span> Clients en file d&apos;attente ({tickets.length}) :
        </span>
        <span style={{ fontSize: 11, color: 'var(--pos-text2)', fontWeight: 600 }}>Cliquez pour reprendre un panier</span>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {tickets.map(t => (
          <button
            key={t.id}
            onClick={() => onReprendre(t.id)}
            style={{
              background: 'var(--pos-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              boxShadow: 'var(--pos-shadow)',
            }}
          >
            <span>▶️</span> {t.clientLabel} ({t.panier.length} art. • {t.heure})
          </button>
        ))}
      </div>
    </div>
  )
}
