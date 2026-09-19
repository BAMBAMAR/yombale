'use client'

import React from 'react'
import { ShieldAlert, AlertTriangle, ChevronRight } from 'lucide-react'
import type { KalpeAlerte } from '../types'

interface KalpeAlertsBannerProps {
  alertes: KalpeAlerte[]
  onNavigateTab?: (tab: 'apercu' | 'journal' | 'dettes' | 'epargne' | 'stats') => void
}

export default function KalpeAlertsBanner({ alertes, onNavigateTab }: KalpeAlertsBannerProps) {
  if (!alertes || alertes.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alertes.map((a, idx) => {
        const isDanger = a.type === 'danger'
        const bg = isDanger ? '#FEF2F2' : '#FFFBEB'
        const border = isDanger ? '#FECACA' : '#FDE68A'
        const titleColor = isDanger ? '#991B1B' : '#92400E'

        return (
          <div
            key={idx}
            style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {isDanger ? (
                  <ShieldAlert size={16} style={{ color: '#DC2626' }} />
                ) : (
                  <AlertTriangle size={16} style={{ color: '#D97706' }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: titleColor }}>
                  {a.titre}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2, lineHeight: 1.35 }}>
                  {a.description}
                </div>
              </div>
            </div>

            {a.actionTab && (
              <button
                type="button"
                onClick={() => onNavigateTab?.(a.actionTab as any)}
                style={{
                  flexShrink: 0,
                  background: isDanger ? '#DC2626' : 'var(--navy, #1C2B4A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                {a.actionLabel || 'Voir'} <ChevronRight size={12} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
