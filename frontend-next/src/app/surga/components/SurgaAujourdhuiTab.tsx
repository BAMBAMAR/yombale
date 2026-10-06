'use client'

import React from 'react'
import { Sun, Newspaper } from 'lucide-react'
import SurgaBriefingActions from './SurgaBriefingActions'
import SurgaAudioPlayer from './SurgaAudioPlayer'
import SurgaMeteoCard, { type MeteoData } from './SurgaMeteoCard'
import SurgaNewsList, { type BriefingNewsItem } from './SurgaNewsList'
import SurgaSportCard, { type SportEventItem } from './SurgaSportCard'
import SurgaTraficCard from './SurgaTraficCard'
import SurgaImmoDashboardCard from './SurgaImmoDashboardCard'
import SurgaConcoursDashboardCard from './SurgaConcoursDashboardCard'
import SurgaPlacesDashboardCard from './SurgaPlacesDashboardCard'
import SurgaDashboardTools from './SurgaDashboardTools'
import type { SurgaTab } from './SurgaBottomNav'
import type { SurgaDepensesStats } from '@/lib/surga-offline-sync'

export interface BriefingData {
  message_synthese?: string
  heure_briefing?: string
  date?: string
  items?: BriefingNewsItem[]
  sports?: SportEventItem[]
  meteo?: MeteoData
}

interface SurgaAujourdhuiTabProps {
  preferences: any
  briefingData: BriefingData | null
  audioScript: string
  soldeKalpeFormate: string
  statsApercu: SurgaDepensesStats | null
  nbNotes: number
  nbAgenda: number
  chargerBriefing: () => void
  onOpenPodcastModal: () => void
  openRadioModal: () => void
  onVilleChange: (ville: string) => void
  onOpenPresse: () => void
  onOpenTrafic: () => void
  onOpenImmo: () => void
  onOpenConcours: () => void
  onOpenPlaces: () => void
  onNavigateTab: (tab: SurgaTab) => void
  onOpenCalc: () => void
  onOpenVoice: () => void
  onReinitialiser: () => void
}

export default function SurgaAujourdhuiTab({
  preferences,
  briefingData,
  audioScript,
  soldeKalpeFormate,
  statsApercu,
  nbNotes,
  nbAgenda,
  chargerBriefing,
  onOpenPodcastModal,
  openRadioModal,
  onVilleChange,
  onOpenPresse,
  onOpenTrafic,
  onOpenImmo,
  onOpenConcours,
  onOpenPlaces,
  onNavigateTab,
  onOpenCalc,
  onOpenVoice,
  onReinitialiser,
}: SurgaAujourdhuiTabProps) {
  const heureBriefing = preferences?.heure_briefing || briefingData?.heure_briefing || '07:30'
  const quartier = preferences?.quartiers?.[0] || 'Dakar'

  return (
    <>
      {/* Carte Briefing du jour */}
      <div className="surga-card" style={{ borderLeft: '4px solid var(--accent, #C75B00)' }}>
        <div className="surga-card-header">
          <span className="surga-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sun size={18} color="var(--accent, #C75B00)" />
            <span>Briefing du Matin</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3, #73675E)' }}>
            Prévu à {heureBriefing}
          </span>
        </div>

        <p style={{ fontSize: 14, color: 'var(--text1, #1A1612)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
          {briefingData?.message_synthese || (
            <>
              Bonjour. Votre Surga est configuré pour <strong>{quartier}</strong>. Vos briques actives préparent votre premier briefing complet.
            </>
          )}
        </p>

        <SurgaBriefingActions
          heureBriefing={heureBriefing}
          titrePremierItem={briefingData?.items?.[0]?.titre}
          onRefresh={chargerBriefing}
        />

        {preferences?.audio_actif && audioScript && (
          <SurgaAudioPlayer
            script={audioScript}
            onOpenPodcastModal={onOpenPodcastModal}
            onOpenRadiosModal={openRadioModal}
          />
        )}
      </div>

      {/* Section Briques : Météo & Marées Dakar */}
      {(!preferences?.modules_actifs || preferences.modules_actifs.includes('meteo') || !preferences.modules_actifs.includes('sans_meteo')) && (
        <SurgaMeteoCard
          initialMeteo={briefingData?.meteo}
          ville={quartier}
          onVilleChange={onVilleChange}
        />
      )}

      {/* Section Briques : Actualités & Presse */}
      {(preferences?.modules_actifs?.includes('actualites') || !preferences?.modules_actifs) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Newspaper size={17} color="var(--accent, #C75B00)" />
              <span>Actualités &amp; Revue de presse</span>
            </h2>
            <button
              type="button"
              onClick={onOpenPresse}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent, #C75B00)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              Explorer
            </button>
          </div>

          <SurgaNewsList
            items={briefingData?.items || []}
            onVoirPlus={onOpenPresse}
          />
        </div>
      )}

      {/* Section Briques : Sport & Résultats */}
      {preferences?.modules_actifs?.includes('sport') && (
        <SurgaSportCard sports={briefingData?.sports || []} />
      )}

      {/* Section Briques : Trafic Dakar */}
      {(preferences?.modules_actifs?.includes('trafic') || !preferences?.modules_actifs) && (
        <SurgaTraficCard onOuvrirDetail={onOpenTrafic} />
      )}

      {/* Section Briques : Immobilier & Alertes Dakar */}
      {(preferences?.modules_actifs?.includes('immo') || !preferences?.modules_actifs) && (
        <SurgaImmoDashboardCard onOuvrirModal={onOpenImmo} />
      )}

      {/* Section Briques : Concours & Examens du Sénégal */}
      {(preferences?.modules_actifs?.includes('concours') || !preferences?.modules_actifs) && (
        <SurgaConcoursDashboardCard onOuvrirModal={onOpenConcours} />
      )}

      {/* Section Briques : Bons Plans & Bonnes Adresses à Dakar */}
      {(preferences?.modules_actifs?.includes('places') || !preferences?.modules_actifs) && (
        <SurgaPlacesDashboardCard onOuvrirModal={onOpenPlaces} />
      )}

      {/* Section Noyau : Raccourcis Dépenses, Notes, Calculs & Micro */}
      <SurgaDashboardTools
        soldeKalpeFormate={soldeKalpeFormate}
        statsApercu={statsApercu}
        nbNotes={nbNotes}
        nbAgenda={nbAgenda}
        onNavigateTab={onNavigateTab}
        onOpenCalc={onOpenCalc}
        onOpenVoice={onOpenVoice}
        onReinitialiser={onReinitialiser}
      />
    </>
  )
}
