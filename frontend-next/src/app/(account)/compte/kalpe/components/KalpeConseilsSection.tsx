'use client'

import React from 'react'
import { Lightbulb, AlertTriangle, ShieldCheck } from 'lucide-react'
import type { KalpeConseil, KalpeStats } from '../types'

interface KalpeConseilsSectionProps {
  conseils: KalpeConseil[]
  tendances?: KalpeStats['tendances']
}

export default function KalpeConseilsSection({
  conseils,
  tendances,
}: KalpeConseilsSectionProps) {
  if ((!conseils || conseils.length === 0) && !tendances) return null

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid var(--border, #E8DDD2)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Lightbulb size={16} color="var(--accent, #C75B00)" />
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Conseils Personnalisés & Points de Vigilance
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conseils.map((c, idx) => {
          const isWarning = c.type === 'warning'
          return (
            <div
              key={idx}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: isWarning ? '#FFFBEB' : '#F0FDF4',
                border: `1px solid ${isWarning ? '#FDE68A' : '#BBF7D0'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isWarning ? (
                  <AlertTriangle size={14} color="#D97706" />
                ) : (
                  <ShieldCheck size={14} color="var(--price, #0A5C36)" />
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: isWarning ? '#92400E' : 'var(--price, #0A5C36)',
                  }}
                >
                  {c.titre}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.4 }}>
                {c.message}
              </div>
              {c.impact && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--navy, #1C2B4A)',
                    marginTop: 2,
                  }}
                >
                  {c.impact}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
