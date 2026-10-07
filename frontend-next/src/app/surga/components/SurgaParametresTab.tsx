'use client'

import React from 'react'
import {
  RotateCcw,
  Volume2,
  Crown,
  Briefcase,
  Shield,
  User,
  UserCheck,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import SurgaServiceRow from './SurgaServiceRow'
import SurgaPersonnalisationSection from './SurgaPersonnalisationSection'

interface SurgaParametresTabProps {
  preferences: any
  statutPremium?: {
    estPremium: boolean
    plan?: string | null
    joursRestants?: number
  }
  user?: {
    id: string
    nom?: string
    telephone?: string
    email?: string
  } | null
  onOpenAuth?: () => void
  onOpenCompte?: () => void
  onDeconnexion?: () => void
  onSynchroniser?: () => void
  isSyncing?: boolean
  onToggleAudio: () => void
  onOpenPremium?: () => void
  onOpenPro?: () => void
  onOpenDonnees?: () => void
  onReinitialiser: () => void
  onSavePreferences?: (nouveauxParametres: { sidebar_services?: string[]; rail_widgets?: string[] }) => void
}

export default function SurgaParametresTab({
  preferences,
  statutPremium,
  user,
  onOpenAuth,
  onOpenCompte,
  onDeconnexion,
  onSynchroniser,
  isSyncing = false,
  onToggleAudio,
  onOpenPremium,
  onOpenPro,
  onOpenDonnees,
  onReinitialiser,
  onSavePreferences,
}: SurgaParametresTabProps) {
  const estPremium = statutPremium?.estPremium ?? false
  const joursRestants = statutPremium?.joursRestants ?? 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingBottom: 24,
      }}
    >
      {/* En-tête de section */}
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Réglages &amp; Préférences
        </h2>
        <p
          style={{
            fontSize: 12,
            color: 'var(--text3, #73675E)',
            margin: '4px 0 0',
          }}
        >
          Heure du briefing : <strong>{preferences?.heure_briefing || '07:30'}</strong>
          {' • '}
          Quartier : <strong>{preferences?.quartiers?.[0] || 'Dakar'}</strong>
        </p>
      </div>

      {/* 1. Carte Compte & Authentification */}
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
              <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
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
                    fontSize: 11,
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
                    fontSize: 11,
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
                    fontSize: 11,
                    padding: '6px 9px',
                    fontWeight: 700,
                    width: 'auto',
                    color: 'var(--accent, #C75B00)',
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
                  fontSize: 11,
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
              fontSize: 11,
              color: 'var(--text2, #5A4E42)',
            }}
          >
            <span>Connectez-vous avec WhatsApp pour sauvegarder et synchroniser vos données.</span>
          </div>
        )}
      </div>

      {/* 2. Carte Statut Abonnement */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 12,
          backgroundColor: estPremium ? 'rgba(10, 92, 54, 0.06)' : 'var(--bg, #F8F5F0)',
          border: estPremium ? '1.5px solid var(--price, #0A5C36)' : '1px solid var(--border, #E8DDD2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crown size={20} color={estPremium ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)'} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {estPremium ? 'Surga Premium Actif' : 'Formule Standard (Gratuite)'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                {estPremium
                  ? `Expiration dans ${joursRestants} jour(s) • Vocal & alertes illimités`
                  : 'Plafond de 20 commandes/jour • Alertes standards'}
              </div>
            </div>
          </div>
          {onOpenPremium && (
            <button
              type="button"
              onClick={onOpenPremium}
              className={estPremium ? 'surga-btn-secondary' : 'surga-btn-primary'}
              style={{ fontSize: 11, padding: '6px 14px', fontWeight: 700, width: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {estPremium ? 'Gérer' : 'Passer à Premium'}
            </button>
          )}
        </div>

        {/* Lien Professionnels B2B */}
        {onOpenPro && (
          <div
            style={{
              paddingTop: 8,
              borderTop: '1px dashed var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={13} color="var(--navy, #1C2B4A)" />
              <span>Vous êtes restaurateur, agence immo ou centre de formation ?</span>
            </div>
            <button
              type="button"
              onClick={onOpenPro}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent, #C75B00)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Espaces Pro
            </button>
          </div>
        )}
      </div>

      {/* 3. Personnalisation de l'affichage (Desktop) : Menu gauche & Bande droite */}
      <SurgaPersonnalisationSection
        preferences={preferences}
        onSavePreferences={onSavePreferences || (() => {})}
      />

      {/* 4. Option Audio du briefing */}
      <SurgaServiceRow
        icon={Volume2}
        iconColor="var(--accent, #C75B00)"
        iconBg="rgba(199, 91, 0, 0.08)"
        titre="Option Audio du briefing"
        description="Synthèse vocale locale et flux podcast privé (0 Mo)"
        actionLabel={preferences?.audio_actif ? 'Activée' : 'Désactivée'}
        actionVariant={preferences?.audio_actif ? 'primary' : 'secondary'}
        onAction={onToggleAudio}
      />

      {/* 4. Données personnelles & Droit à l'oubli */}
      {onOpenDonnees && (
        <SurgaServiceRow
          icon={Shield}
          iconColor="var(--text3, #73675E)"
          iconBg="rgba(115, 103, 94, 0.08)"
          titre="Protection & Données personnelles"
          description="Export JSON de vos données & droit à l oubli définitif"
          actionLabel="Gérer"
          onAction={onOpenDonnees}
        />
      )}

      {/* 5. Bouton de réinitialisation des préférences de briefing */}
      <button
        type="button"
        onClick={onReinitialiser}
        className="surga-btn-secondary"
        style={{ fontSize: 13, padding: '8px 14px', alignSelf: 'flex-start', marginTop: 6 }}
      >
        <RotateCcw size={14} />
        <span>Modifier mes préférences de briefing</span>
      </button>
    </div>
  )
}
