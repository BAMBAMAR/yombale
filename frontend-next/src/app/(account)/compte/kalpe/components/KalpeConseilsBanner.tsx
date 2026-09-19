'use client'

import React from 'react'
import { Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { KalpeConseil } from '../types'

interface KalpeConseilsBannerProps {
  conseils: KalpeConseil[]
}

export default function KalpeConseilsBanner({ conseils }: KalpeConseilsBannerProps) {
  if (!conseils || conseils.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {conseils.map((c, idx) => {
        const isWarning = c.type === 'warning'
        const isSuccess = c.type === 'success'

        const bg = isWarning
          ? '#FEF2F2'
          : isSuccess
          ? '#F0FDF4'
          : '#F8FAFC'

        const border = isWarning
          ? '#FECACA'
          : isSuccess
          ? '#BBF7D0'
          : 'var(--border, #E8DDD2)'

        const textColor = isWarning
          ? '#991B1B'
          : isSuccess
          ? 'var(--price, #0A5C36)'
          : 'var(--navy, #1C2B4A)'

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 14,
              background: bg,
              border: `1px solid ${border}`,
            }}
          >
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              {isWarning ? (
                <AlertCircle size={16} strokeWidth={2.4} style={{ color: '#DC2626' }} />
              ) : isSuccess ? (
                <CheckCircle2 size={16} strokeWidth={2.4} style={{ color: 'var(--price, #0A5C36)' }} />
              ) : (
                <Sparkles size={16} strokeWidth={2.4} style={{ color: 'var(--accent, #C75B00)' }} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, marginBottom: 2 }}>
                {c.titre}
              </div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4, fontWeight: 500 }}>
                {c.message}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
