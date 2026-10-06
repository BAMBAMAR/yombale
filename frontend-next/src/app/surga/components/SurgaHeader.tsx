'use client'

import React from 'react'
import { Wifi, WifiOff, ChevronLeft } from 'lucide-react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

interface SurgaHeaderProps {
  titre?: string
  sousTitre?: string
  onRetour?: () => void
  afficherRetour?: boolean
}

export default function SurgaHeader({
  titre = 'Surga',
  sousTitre,
  onRetour,
  afficherRetour = false,
}: SurgaHeaderProps) {
  const isOnline = useOnlineStatus()
  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  // Mettre la première lettre en majuscule
  const dateFormatted = today.charAt(0).toUpperCase() + today.slice(1)

  const handleBrandClick = () => {
    if (onRetour) {
      onRetour()
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header className="surga-header" aria-label="En-tête Surga">
      <div
        className="surga-header-brand"
        onClick={handleBrandClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleBrandClick()
          }
        }}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          userSelect: 'none',
        }}
        title={onRetour ? "Retourner à l'accueil" : "Surga — Haut de page"}
      >
        {afficherRetour && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#F1F5F9',
              border: '1px solid var(--surga-border, #E2E8F0)',
              color: 'var(--surga-primary, #0F172A)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Retour à l'accueil"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </div>
        )}
        <div className="surga-header-logo-wrap" title="Surga — Assistant de poche" aria-hidden="true" style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/surga/surga-symbol.png"
            alt="Surga"
            width={34}
            height={34}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
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
