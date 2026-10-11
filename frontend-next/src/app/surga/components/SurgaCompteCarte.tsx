'use client'

import React from 'react'
import { User, UserCheck, RefreshCw, LogOut } from 'lucide-react'

export interface SurgaCompteCarteProps {
  user?: {
    id: string
    nom?: string
    telephone?: string
    email?: string
  } | null
  onOpenCompte?: () => void
  onSynchroniser?: () => void
  onDeconnexion?: () => void
  onOpenAuth?: () => void
  isSyncing?: boolean
}

export default function SurgaCompteCarte({
  user,
  onOpenCompte,
  onSynchroniser,
  onDeconnexion,
  onOpenAuth,
  isSyncing = false,
}: SurgaCompteCarteProps) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        backgroundColor: user ? 'rgba(28, 43, 74, 0.04)' : 'var(--bg, #F8F5F0)',
        border: '1px solid var(--border, #E8DDD2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: user ? 'rgba(10, 92, 54, 0.12)' : 'rgba(28, 43, 74, 0.08)',
              color: user ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {user ? <UserCheck size={18} /> : <User size={18} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              {user ? (user.nom || user.telephone || 'Compte Surga actif') : 'Mode invité (Stockage local)'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
              {user
                ? `WhatsApp : ${user.telephone || 'Connecté'} • Synchronisé`
                : 'Données enregistrées uniquement sur cet appareil'}
            </div>
          </div>
        </div>

        {user ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {onOpenCompte && (
              <button
                type="button"
                onClick={onOpenCompte}
                className="surga-btn-secondary"
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  fontWeight: 700,
                  width: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Gérer mon profil et compte"
              >
                <User size={12} />
                <span>Mon Compte</span>
              </button>
            )}
            {onSynchroniser && (
              <button
                type="button"
                onClick={onSynchroniser}
                className="surga-btn-secondary"
                disabled={isSyncing}
                style={{
                  fontSize: 12,
                  padding: '6px 9px',
                  fontWeight: 700,
                  width: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Forcer la synchronisation avec le cloud"
              >
                <RefreshCw size={12} className={isSyncing ? 'surga-spin' : ''} />
                <span>{isSyncing ? 'Sync...' : 'Sync'}</span>
              </button>
            )}
            {onDeconnexion && (
              <button
                type="button"
                onClick={onDeconnexion}
                className="surga-btn-secondary"
                style={{
                  fontSize: 12,
                  padding: '6px 9px',
                  fontWeight: 700,
                  width: 'auto',
                  color: 'var(--surga-accent-ink, #A64B08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Se déconnecter"
              >
                <LogOut size={12} />
                <span>Déconnexion</span>
              </button>
            )}
          </div>
        ) : (
          onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="surga-btn-primary"
              style={{
                fontSize: 12,
                padding: '6px 14px',
                fontWeight: 700,
                width: 'auto',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              Se connecter
            </button>
          )
        )}
      </div>

      {!user && (
        <div
          style={{
            paddingTop: 8,
            borderTop: '1px dashed var(--border, #E8DDD2)',
            fontSize: 12,
            color: 'var(--text2, #5A4E42)',
          }}
        >
          <span>Connectez-vous avec WhatsApp pour sauvegarder et synchroniser vos données.</span>
        </div>
      )}
    </div>
  )
}
