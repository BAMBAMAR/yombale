'use client'

import React from 'react'

interface ComptaKpiCardProps {
  label: string
  value: string
  sub?: string
  color?: string
  bg?: string
}

export function KpiCard({
  label,
  value,
  sub,
  color,
  bg,
}: ComptaKpiCardProps) {
  return (
    <div
      style={{
        background: bg || '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '14px 16px',
        flex: '1 1 140px',
        minWidth: 130,
        boxSizing: 'border-box',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
      }}
    >
      <p
        style={{
          margin: '0 0 4px',
          fontSize: 11.5,
          color: '#64748b',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: color ?? '#111827' }}>
        {value}
      </p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8' }}>{sub}</p>}
    </div>
  )
}
