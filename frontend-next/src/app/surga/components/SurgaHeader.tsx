'use client'

import React from 'react'
import { Wifi, WifiOff, ChevronLeft, ChevronDown, User, UserCheck } from 'lucide-react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

interface SurgaHeaderProps {
  titre?: string
  sousTitre?: string
  onRetour?: () => void
  afficherRetour?: boolean
  user?: {
    id: string
    nom?: string
    telephone?: string
    email?: string
  } | null
  onOpenAuth?: () => void
  onOpenCompte?: () => void
}

export default function SurgaHeader({
  titre = 'Surga',
  sousTitre,
  onRetour,
  afficherRetour = false,
  user,
  onOpenAuth,
  onOpenCompte,
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
        <div
          className={`surga-header-logo-wrap${afficherRetour ? ' hide-on-subview-mobile' : ''}`}
          title="Surga — Assistant de poche"
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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
              <span className="surga-header-badge-text">En ligne</span>
            </>
          ) : (
            <>
              <WifiOff size={13} strokeWidth={2.5} />
              <span className="surga-header-badge-text">Hors-ligne</span>
            </>
          )}
        </span>

        {/* Bouton Compte / Connexion (Taille tactile confortable >= 38px) */}
        {(onOpenAuth || onOpenCompte) && (
          <button
            type="button"
            onClick={user ? (onOpenCompte || onOpenAuth) : onOpenAuth}
            className="surga-header-badge"
            style={{
              cursor: 'pointer',
              border: user ? '1px solid rgba(5, 150, 105, 0.35)' : '1px solid var(--surga-border, #E2E8F0)',
              backgroundColor: user ? 'var(--surga-emerald-soft, rgba(5, 150, 105, 0.08))' : 'var(--surga-surface, #FFFFFF)',
              color: user ? 'var(--surga-emerald, #059669)' : 'var(--surga-primary, #0F172A)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              minHeight: 38,
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
            }}
            title={user ? `Gérer mon compte : ${user.nom || user.telephone || 'Connecté'}` : 'Se connecter / Compte'}
          >
            {user ? (
              <>
                <UserCheck size={14} strokeWidth={2.5} />
                <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.nom ? user.nom.split(' ')[0] : 'Compte'}
                </span>
                <ChevronDown size={12} strokeWidth={2.5} style={{ opacity: 0.7 }} />
              </>
            ) : (
              <>
                <User size={14} strokeWidth={2} />
                <span>Connexion</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
