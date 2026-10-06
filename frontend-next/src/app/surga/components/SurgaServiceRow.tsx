'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface SurgaServiceRowProps {
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  titre: string
  description: string
  actionLabel?: string
  actionVariant?: 'primary' | 'secondary'
  onAction?: () => void
}

export default function SurgaServiceRow({
  icon: Icon,
  iconColor = 'var(--navy, #1C2B4A)',
  iconBg = 'rgba(28, 43, 74, 0.07)',
  titre,
  description,
  actionLabel,
  actionVariant = 'secondary',
  onAction,
}: SurgaServiceRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        paddingBottom: 2,
        borderTop: '1px solid var(--border, #E8DDD2)',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={iconColor} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)', lineHeight: 1.3 }}>
            {titre}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text3, #73675E)',
              lineHeight: 1.3,
            }}
          >
            {description}
          </div>
        </div>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={actionVariant === 'primary' ? 'surga-btn-primary' : 'surga-btn-secondary'}
          style={{ fontSize: 11, padding: '6px 12px', flexShrink: 0 }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
