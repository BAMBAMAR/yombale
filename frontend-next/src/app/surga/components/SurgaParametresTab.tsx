'use client'

import React from 'react'
import {
  RotateCcw,
  Volume2,
  Radio,
  Navigation,
  Building,
  Crown,
  Briefcase,
  Sparkles,
  Shield,
  ShieldCheck,
  GraduationCap,
  Tv,
} from 'lucide-react'
import SurgaServiceRow from './SurgaServiceRow'

interface SurgaParametresTabProps {
  preferences: any
  statutPremium?: {
    estPremium: boolean
    plan?: string | null
    joursRestants?: number
  }
  onToggleAudio: () => void
  onOpenRadio: () => void
  onOpenTrafic: () => void
  onOpenImmo: () => void
  onOpenConcours: () => void
  onOpenDemarches?: () => void
  onOpenPlaces?: () => void
  onOpenVideos?: () => void
  onOpenEmploi?: () => void
  onOpenPremium?: () => void
  onOpenPro?: () => void
  onOpenDonnees?: () => void
  onReinitialiser: () => void
}

export default function SurgaParametresTab({
  preferences,
  statutPremium,
  onToggleAudio,
  onOpenRadio,
  onOpenTrafic,
  onOpenImmo,
  onOpenConcours,
  onOpenDemarches,
  onOpenPlaces,
  onOpenVideos,
  onOpenEmploi,
  onOpenPremium,
  onOpenPro,
  onOpenDonnees,
  onReinitialiser,
}: SurgaParametresTabProps) {
  const estPremium = Boolean(statutPremium?.estPremium)
  const joursRestants = statutPremium?.joursRestants || 0

  return (
    <div className="surga-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
        Services &amp; Formule Surga
      </div>
      <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
        Heure du briefing : <strong>{preferences?.heure_briefing || '07:30'}</strong> &bull; Quartier :{' '}
        <strong>{preferences?.quartiers?.[0] || 'Dakar'}</strong>
      </p>

      {/* Carte Statut Abonnement */}
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

      {/* 1. Option Audio */}
      <SurgaServiceRow
        icon={Volume2}
        iconColor="var(--accent, #C75B00)"
        iconBg="rgba(199, 91, 0, 0.08)"
        titre="Option Audio du briefing"
        description="Synthèse vocale et flux podcast privé (0 Mo)"
        actionLabel={preferences?.audio_actif ? 'Activée' : 'Désactivée'}
        actionVariant={preferences?.audio_actif ? 'primary' : 'secondary'}
        onAction={onToggleAudio}
      />

      {/* 2. Radios locales */}
      <SurgaServiceRow
        icon={Radio}
        iconColor="var(--navy, #1C2B4A)"
        iconBg="rgba(28, 43, 74, 0.08)"
        titre="Radios Locales du Sénégal"
        description="Directs FM & revues de presse matinales"
        actionLabel="Écouter"
        onAction={onOpenRadio}
      />

      {/* 3. Trafic Dakar */}
      <SurgaServiceRow
        icon={Navigation}
        iconColor="var(--accent, #C75B00)"
        iconBg="rgba(199, 91, 0, 0.08)"
        titre="Trafic & Corridors Dakar"
        description="État A1, VDN, Corniche, TER & BRT"
        actionLabel="Consulter"
        onAction={onOpenTrafic}
      />

      {/* 4. Immobilier Dakar */}
      <SurgaServiceRow
        icon={Building}
        iconColor="var(--price, #0A5C36)"
        iconBg="rgba(10, 92, 54, 0.08)"
        titre="Immobilier & Alertes Logement"
        description="Recherche de biens et notifications d alertes"
        actionLabel="Ouvrir"
        onAction={onOpenImmo}
      />

      {/* 5. Concours & Examens du Sénégal */}
      <SurgaServiceRow
        icon={GraduationCap}
        iconColor="var(--navy, #1C2B4A)"
        iconBg="rgba(28, 43, 74, 0.08)"
        titre="Concours & Examens Nationaux"
        description="Suivi des dossiers et rappels J-30 / J-7 / J-1"
        actionLabel="Consulter"
        onAction={onOpenConcours}
      />

      {/* 6. Démarches Administratives Vérifiées */}
      {onOpenDemarches && (
        <SurgaServiceRow
          icon={ShieldCheck}
          iconColor="var(--price, #0A5C36)"
          iconBg="rgba(10, 92, 54, 0.08)"
          titre="Démarches Administratives Vérifiées"
          description="Fiches officielles de l État, pièces, coûts & délais"
          actionLabel="Consulter"
          onAction={onOpenDemarches}
        />
      )}

      {/* 7. Bons Plans & Bonnes Adresses Dakar */}
      <SurgaServiceRow
        icon={Sparkles}
        iconColor="var(--accent, #C75B00)"
        iconBg="rgba(199, 91, 0, 0.08)"
        titre="Bons Plans & Bonnes Adresses"
        description="Restaurants, dibiteries, cafés coworking & avis vérifiés"
        actionLabel="Explorer"
        onAction={onOpenPlaces}
      />

      {/* 8. Séries TV & Lutte du Sénégal */}
      <SurgaServiceRow
        icon={Tv}
        iconColor="var(--navy, #1C2B4A)"
        iconBg="rgba(28, 43, 74, 0.08)"
        titre="Séries TV & Lutte Sénégalaise"
        description="Alertes sorties d épisodes et vidéos officielles Low-Data"
        actionLabel="Consulter"
        onAction={onOpenVideos}
      />

      {/* 9. Emploi & CV Professionnel */}
      {onOpenEmploi && (
        <SurgaServiceRow
          icon={Briefcase}
          iconColor="var(--navy, #1C2B4A)"
          iconBg="rgba(28, 43, 74, 0.08)"
          titre="Emploi, CV PDF & Lettres"
          description="Profil professionnel, CV A4 sobre & lettres de motivation"
          actionLabel="Ouvrir"
          onAction={onOpenEmploi}
        />
      )}

      {/* 10. Données personnelles & Droit à l'oubli */}
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

      {/* Bouton de réinitialisation */}
      <button
        type="button"
        onClick={onReinitialiser}
        className="surga-btn-secondary"
        style={{ fontSize: 13, padding: '8px 14px', alignSelf: 'flex-start', marginTop: 6 }}
      >
        <RotateCcw size={14} />
        <span>Modifier mes préférences</span>
      </button>
    </div>
  )
}
