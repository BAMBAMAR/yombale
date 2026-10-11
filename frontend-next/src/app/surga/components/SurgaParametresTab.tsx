'use client'

import React, { useState } from 'react'
import {
  RotateCcw,
  Volume2,
  Crown,
  Briefcase,
  Shield,
  Smartphone,
  MapPin,
} from 'lucide-react'
import SurgaServiceRow from './SurgaServiceRow'
import { quartierDe } from '@/lib/surga-meteo'
import { libelleAbonnement, nomOffre, resumeGratuit, useSurgaOffre } from '@/lib/surga-offre'
import SurgaPersonnalisationSection from './SurgaPersonnalisationSection'
import SurgaAideApropos from './SurgaAideApropos'
import SurgaServicesListe, { type CleService } from './SurgaServicesListe'
import SurgaMeteoLocaliteModal from './SurgaMeteoLocaliteModal'
import SurgaCompteCarte from './SurgaCompteCarte'

interface SurgaParametresTabProps {
  preferences: any
  statutPremium?: {
    estPremium: boolean
    plan?: string | null
    joursRestants?: number
    source?: string
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
  // Téléphone : ouvre un service depuis la liste de l'onglet (SRG-A2-015).
  onOuvrirService?: (cle: CleService) => void
  onVilleChange?: (nouvelleVille: string) => void
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
  onOuvrirService,
  onVilleChange,
}: SurgaParametresTabProps) {
  const { offre } = useSurgaOffre()
  const estPremium = statutPremium?.estPremium ?? false
  const inclusNopalou = estPremium && statutPremium?.source === 'nopalou'
  // Les espaces professionnels ne s'affichent que si au moins une formule pro est en vente (console d'administration).
  const proProposes = Boolean(offre?.plans.some((pl) => pl.type === 'b2b'))
  const joursRestants = statutPremium?.joursRestants ?? 0

  const [isLocaliteModalOpen, setIsLocaliteModalOpen] = useState(false)
  const [gpsEnCours, setGpsEnCours] = useState(false)

  const handleChoisirLocalite = (nomVille: string) => {
    setIsLocaliteModalOpen(false)
    if (onVilleChange) onVilleChange(nomVille)
  }

  const handleDetecterGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('La géolocalisation n’est pas disponible sur votre navigateur.')
      return
    }
    setGpsEnCours(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        try {
          localStorage.setItem('surga_meteo_gps', JSON.stringify({ lat, lon }))
          localStorage.removeItem('surga_meteo_ville')
          window.dispatchEvent(new CustomEvent('surga-meteo-change', { detail: { lat, lon, isGps: true } }))
          window.dispatchEvent(new CustomEvent('surga-data-change'))
        } catch {}
        setIsLocaliteModalOpen(false)
        setGpsEnCours(false)
      },
      (err) => {
        console.warn('[SURGA GPS ERR]:', err.message)
        alert('Impossible de récupérer la position GPS. Vérifiez les autorisations de localisation.')
        setGpsEnCours(false)
      },
      { timeout: 9000, enableHighAccuracy: true }
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingBottom: 24,
      }}
    >
      {/* Liste des services : sur téléphone seulement, l'ordinateur les a dans son menu de gauche */}
      {onOuvrirService && (
        <div className="surga-context-only-mobile">
          <SurgaServicesListe onOuvrir={onOuvrirService} />
        </div>
      )}

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
        <div
          style={{
            fontSize: 12,
            color: 'var(--text3, #73675E)',
            margin: '4px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <span>Heure du briefing : <strong>{preferences?.heure_briefing || '07:30'}</strong></span>
          <span>•</span>
          <span>Quartier : <strong>{quartierDe(preferences)}</strong></span>
          {onVilleChange && (
            <button
              type="button"
              onClick={() => setIsLocaliteModalOpen(true)}
              style={{
                background: 'rgba(199, 91, 0, 0.08)',
                border: '1px solid rgba(199, 91, 0, 0.25)',
                color: 'var(--accent, #C75B00)',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Changer de quartier ou de localité de référence"
            >
              <MapPin size={11} />
              <span>Modifier</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Carte Compte & Authentification */}
      <SurgaCompteCarte
        user={user}
        onOpenCompte={onOpenCompte}
        onSynchroniser={onSynchroniser}
        onDeconnexion={onDeconnexion}
        onOpenAuth={onOpenAuth}
        isSyncing={isSyncing}
      />

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
                {estPremium ? (inclusNopalou ? 'Accès total inclus' : `${nomOffre(offre)} actif`) : 'Formule gratuite'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
                {estPremium
                  ? (inclusNopalou ? `Inclus avec votre abonnement Nopalou (encore ${joursRestants} jour(s))` : `Expiration dans ${joursRestants} jour(s)`)
                  : resumeGratuit(offre?.gratuit) || 'Les droits gratuits se règlent dans la console.'}
              </div>
            </div>
          </div>
          {onOpenPremium && !inclusNopalou && (estPremium || offre?.ventes_ouvertes) && (
            <button
              type="button"
              onClick={onOpenPremium}
              className={estPremium ? 'surga-btn-secondary' : 'surga-btn-primary'}
              style={{ fontSize: 12, padding: '6px 14px', fontWeight: 700, width: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {estPremium ? 'Gérer' : libelleAbonnement(offre)}
            </button>
          )}
        </div>

        {/* Lien Professionnels B2B */}
        {onOpenPro && proProposes && (
          <div
            style={{
              paddingTop: 8,
              borderTop: '1px dashed var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={13} color="var(--navy, #1C2B4A)" />
              <span>Vous êtes restaurateur, agence immo ou centre de formation ?</span>
            </div>
            <button
              type="button"
              onClick={onOpenPro}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--surga-accent-ink, #A64B08)',
                fontSize: 12,
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
      <div className="surga-ordinateur-seulement">
        <SurgaPersonnalisationSection
          preferences={preferences}
          onSavePreferences={onSavePreferences || (() => {})}
        />
      </div>

      {/* 4. Option Audio du briefing */}
      <SurgaServiceRow
        icon={Volume2}
        iconColor="var(--accent, #C75B00)"
        iconBg="rgba(199, 91, 0, 0.08)"
        titre="Option Audio du briefing"
        description="Lecture à voix haute par le téléphone (0 Mo)"
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
          description="Export JSON de vos données & droit à l’oubli définitif"
          actionLabel="Gérer"
          onAction={onOpenDonnees}
        />
      )}

      {/* 5. Application de poche Surga (Installation PWA) */}
      <SurgaServiceRow
        icon={Smartphone}
        iconColor="var(--surga-accent-ink, #A64B08)"
        iconBg="rgba(217, 119, 6, 0.08)"
        titre="Application Surga (PWA)"
        description="Installer sur l'écran d'accueil pour un accès direct & hors-ligne"
        actionLabel="Installer"
        actionVariant="primary"
        onAction={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('surga-demande-installation-pwa'))
          }
        }}
      />

      {/* 6. Bouton de réinitialisation des préférences de briefing */}
      <button
        type="button"
        onClick={onReinitialiser}
        className="surga-btn-secondary"
        style={{ fontSize: 13, padding: '8px 14px', alignSelf: 'flex-start', marginTop: 6 }}
      >
        <RotateCcw size={14} />
        <span>Modifier mes préférences de briefing</span>
      </button>

      {/* 7. Partage, aide, à propos de l'éditeur et contact */}
      <SurgaAideApropos />

      {/* Modale de changement de quartier/localité de référence */}
      <SurgaMeteoLocaliteModal
        isOpen={isLocaliteModalOpen}
        onClose={() => setIsLocaliteModalOpen(false)}
        onSelectLocalite={handleChoisirLocalite}
        onDetecterGps={handleDetecterGps}
        gpsEnCours={gpsEnCours}
        estGpsActif={false}
        localiteActuelle={quartierDe(preferences)}
      />
    </div>
  )
}
