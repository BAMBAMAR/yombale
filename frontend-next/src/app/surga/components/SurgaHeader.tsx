'use client'

import React from 'react'
import { Sparkles, Wifi, WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

interface SurgaHeaderProps {
  titre?: string
  sousTitre?: string
}

export default function SurgaHeader({ titre = 'Surga', sousTitre }: SurgaHeaderProps) {
  const isOnline = useOnlineStatus()
  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  // Mettre la première lettre en majuscule
  const dateFormatted = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <header className="surga-header" role="banner">
      <div className="surga-header-brand">
        <Sparkles size={20} color="var(--accent, #C75B00)" strokeWidth={2.2} />
        <div>
          <h1 className="surga-header-title">{titre}</h1>
          <div className="surga-header-date">{sousTitre || dateFormatted}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          className="surga-header-badge"
          title={isOnline ? 'Connecté au réseau' : 'Mode hors-ligne actif'}
        >
          {isOnline ? (
            <>
              <Wifi size={13} strokeWidth={2.5} />
              <span>En ligne</span>
            </>
          ) : (
            <>
              <WifiOff size={13} strokeWidth={2.5} />
              <span>Hors-ligne</span>
            </>
          )}
        </span>
      </div>
    </header>
  )
}
