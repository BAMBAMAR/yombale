'use client'

import React from 'react'

interface PosToastProps {
  toastMsg: { text: string; type: 'success' | 'warning' } | null
}

export default function PosToast({ toastMsg }: PosToastProps) {
  if (!toastMsg) return null

  const isWarning = toastMsg.type === 'warning'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: isWarning ? '#fef3c7' : '#dcfce7',
        color: isWarning ? '#92400e' : '#166534',
        border: `1px solid ${isWarning ? '#fcd34d' : '#bbf7d0'}`,
        padding: '10px 18px',
        borderRadius: 24,
        fontWeight: 800,
        fontSize: 13,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      {toastMsg.text}
    </div>
  )
}
