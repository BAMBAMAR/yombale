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
    <header className="surga-header" aria-label="En-tête Surga">
      <div className="surga-header-brand">
        <div className="surga-header-logo-wrap" title="Surga — Assistant de poche" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hdrAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A"/>
                <stop offset="40%" stopColor="#F59E0B"/>
                <stop offset="100%" stopColor="#D97706"/>
              </linearGradient>
              <linearGradient id="hdrSlate" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF"/>
                <stop offset="50%" stopColor="#F1F5F9"/>
                <stop offset="100%" stopColor="#CBD5E1"/>
              </linearGradient>
            </defs>
            <path fill="url(#hdrSlate)" d="M 240 268 C 278 248, 332 258, 364 290 C 402 328, 400 388, 360 426 C 320 464, 252 468, 192 444 C 150 426, 122 396, 110 368 L 168 326 C 178 342, 194 360, 218 372 C 252 388, 290 384, 314 360 C 334 340, 332 316, 312 296 C 296 280, 268 274, 244 282 L 182 302 C 150 312, 122 300, 108 274 L 176 224 Z"/>
            <path fill="url(#hdrAmber)" d="M 272 244 C 234 264, 180 254, 148 222 C 110 184, 112 124, 152 86 C 192 48, 260 44, 320 68 C 362 86, 390 116, 402 144 L 344 186 C 334 170, 318 152, 294 140 C 260 124, 222 128, 198 152 C 178 172, 180 196, 200 216 C 216 232, 244 238, 268 230 L 330 210 C 362 200, 390 212, 404 238 L 336 288 Z"/>
            <circle cx="256" cy="256" r="16" fill="#10B981"/>
            <circle cx="256" cy="256" r="8" fill="#6EE7B7"/>
          </svg>
        </div>
        <div>
          <h1 className="surga-header-title">
            {titre === 'Surga' ? (
              <>
                <span>SUR</span>
                <span style={{ color: 'var(--surga-accent, #D97706)' }}>GA</span>
              </>
            ) : (
              titre
            )}
          </h1>
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
