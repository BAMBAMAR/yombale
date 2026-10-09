'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Info } from 'lucide-react'

interface ToastState {
  id: number
  message: string
  type: 'succes' | 'info'
}

export default function SurgaToastContainer() {
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleToastEvent = (e: Event) => {
      const custom = e as CustomEvent<{ message: string; type?: 'succes' | 'info'; duree?: number }>
      if (custom.detail?.message) {
        setToast({
          id: Date.now(),
          message: custom.detail.message,
          type: custom.detail.type || 'succes',
        })
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          setToast(null)
        }, custom.detail.duree || 3200)
      }
    }

    window.addEventListener('surga-toast', handleToastEvent)
    return () => {
      window.removeEventListener('surga-toast', handleToastEvent)
      clearTimeout(timeoutId)
    }
  }, [])

  if (!toast) return null

  return (
    // Le message est annoncé par la zone permanente de SurgaAccessibiliteAuto : une zone créée avec son texte n'est
    // pas annoncée. Cette pastille est donc cachée aux lecteurs d'écran pour ne pas répéter.
    <div
      aria-hidden="true"
      className="surga-global-toast"
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--navy, #1C2B4A)',
        color: '#FFFFFF',
        padding: '9px 18px',
        borderRadius: 24,
        fontSize: 12,
        fontWeight: 600,
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.28)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: '90vw',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none',
      }}
    >
      {toast.type === 'succes' ? (
        <CheckCircle2 size={16} color="var(--price, #0A5C36)" style={{ flexShrink: 0 }} />
      ) : (
        <Info size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0 }} />
      )}
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {toast.message}
      </span>
    </div>
  )
}
