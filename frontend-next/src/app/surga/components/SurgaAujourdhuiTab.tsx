'use client'

import React from 'react'
import { Sun, Newspaper, Headphones, Calendar, Trophy } from 'lucide-react'
import SurgaBriefingActions from './SurgaBriefingActions'
import SurgaAudioPlayer from './SurgaAudioPlayer'
import SurgaBriefingSkeleton from './SurgaBriefingSkeleton'
import SurgaMeteoCard, { type MeteoData } from './SurgaMeteoCard'
import SurgaNewsList, { type BriefingNewsItem } from './SurgaNewsList'
import SurgaSportCard, { type SportEventItem } from './SurgaSportCard'
import SurgaTraficCard from './SurgaTraficCard'
import SurgaImmoDashboardCard from './SurgaImmoDashboardCard'
import SurgaConcoursDashboardCard from './SurgaConcoursDashboardCard'
import SurgaPlacesDashboardCard from './SurgaPlacesDashboardCard'
import SurgaShoppingDashboardCard from './SurgaShoppingDashboardCard'
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
  agenda_du_jour?: any[]
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
  onOpenShopping?: () => void
  onOpenPlaces: () => void
  onNavigateTab: (tab: SurgaTab) => void
  onOpenCalc: () => void
  onOpenVoice: () => void
  onReinitialiser: () => void
  onToggleAudio?: () => void
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
  onOpenShopping,
  onOpenPlaces,
  onNavigateTab,
  onOpenCalc,
  onOpenVoice,
  onReinitialiser,
  onToggleAudio,
}: SurgaAujourdhuiTabProps) {
  const heureBriefing = preferences?.heure_briefing || briefingData?.heure_briefing || '07:30'
  const quartier = preferences?.quartiers?.[0] || 'Dakar'
  const brevesPhares = (briefingData?.items || []).slice(0, 3)
  const prochainRdv = briefingData?.agenda_du_jour?.[0]
  const prochainMatch = (briefingData?.sports || [])[0]

  return (
    <>
      {/* Squelette de chargement anti-CLS si pas encore de briefing chargé */}
      {!briefingData ? (
        <SurgaBriefingSkeleton />
      ) : (
        /* Carte Briefing du jour */
        <div className="surga-card" style={{ borderLeft: '4px solid var(--surga-accent, #D97706)' }}>
          <div className="surga-card-header">
            <span className="surga-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sun size={18} color="var(--surga-accent, #D97706)" />
              <span>Briefing du Matin</span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-text2, #475569)' }}>
              Prévu à {heureBriefing}
            </span>
          </div>

          <p style={{ fontSize: 14, color: 'var(--surga-text1, #0F172A)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
            {briefingData?.message_synthese || (
              <>
                Bonjour. Votre Surga est configuré pour <strong>{quartier}</strong>. Vos briques actives préparent votre premier briefing complet.
              </>
            )}
          </p>

          {/* Digest Actif : Le contenu arrive directement sous les yeux */}
          {(brevesPhares.length > 0 || prochainRdv || prochainMatch) && (
            <div
              style={{
                marginTop: 6,
                padding: '10px 12px',
                backgroundColor: 'var(--surga-bg, #F8FAFC)',
                borderRadius: 8,
                border: '1px solid var(--surga-border, #E2E8F0)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {/* Titres phares du matin */}
              {brevesPhares.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--surga-accent, #D97706)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    À la Une ce matin
                  </span>
                  {brevesPhares.map((it, idx) => (
                    <a
                      key={it.id || it.url || idx}
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--surga-primary, #0F172A)',
                        textDecoration: 'none',
                        lineHeight: 1.35,
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 6,
                      }}
                    >
                      <span style={{ color: 'var(--surga-accent, #D97706)', fontWeight: 800 }}>•</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                        {it.titre}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {/* Agenda du jour */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--surga-primary, #0F172A)', paddingTop: 6, borderTop: '1px solid var(--surga-border, #E2E8F0)' }}>
                <Calendar size={13} color="var(--surga-accent, #D97706)" style={{ flexShrink: 0 }} />
                {prochainRdv ? (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>{prochainRdv.heure_evenement ? `${prochainRdv.heure_evenement} : ` : ''}</strong>
                    {prochainRdv.titre}
                  </span>
                ) : (
                  <span style={{ color: 'var(--surga-text2, #475569)' }}>
                    {nbAgenda > 0 ? `${nbAgenda} rappel(s) dans votre agenda` : 'Journée libre — Aucun rappel programmé'}
                  </span>
                )}
              </div>

              {/* Match phare du jour */}
              {prochainMatch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--surga-primary, #0F172A)' }}>
                  <Trophy size={13} color="var(--surga-accent, #D97706)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>{prochainMatch.competition} :</strong> {prochainMatch.equipe_domicile} vs {prochainMatch.equipe_exterieur}
                  </span>
                </div>
              )}
            </div>
          )}

          <SurgaBriefingActions
            heureBriefing={heureBriefing}
            titrePremierItem={briefingData?.items?.[0]?.titre}
            onRefresh={chargerBriefing}
          />

          {preferences?.audio_actif && audioScript ? (
            <SurgaAudioPlayer script={audioScript} />
          ) : (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                backgroundColor: 'var(--surga-bg, #F8FAFC)',
                borderRadius: 8,
                border: '1px dashed var(--surga-border, #E2E8F0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--surga-primary, #0F172A)' }}>
                <Headphones size={15} color="var(--surga-accent, #D97706)" />
                <span>Écouter le briefing à la voix <strong>(0 Mo de données)</strong></span>
              </div>
              {onToggleAudio && (
                <button
                  type="button"
                  onClick={onToggleAudio}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: 'var(--surga-accent, #D97706)',
                    color: '#0F172A',
                    cursor: 'pointer',
                    minHeight: 28,
                  }}
                >
                  Activer
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Section Briques : Météo & Marées Dakar */}
      {(!preferences?.modules_actifs || preferences.modules_actifs.includes('meteo') || !preferences.modules_actifs.includes('sans_meteo')) && (
        <SurgaMeteoCard
          initialMeteo={briefingData?.meteo}
          ville={quartier}
          onVilleChange={onVilleChange}
        />
      )}

      {/* Section Briques : Actualités & Presse (Plafonné à 3 brèves majeures pour l'ergonomie mobile) */}
      {(preferences?.modules_actifs?.includes('actualites') || !preferences?.modules_actifs) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-primary, #0F172A)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Newspaper size={17} color="var(--surga-accent, #D97706)" />
              <span>Actualités &amp; Revue de presse</span>
            </h2>
            <button
              type="button"
              onClick={onOpenPresse}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--surga-accent, #D97706)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 8px',
                minHeight: 32,
              }}
            >
              Explorer ({briefingData?.items?.length || 0})
            </button>
          </div>

          <SurgaNewsList
            items={(briefingData?.items || []).slice(0, 3)}
            onVoirPlus={onOpenPresse}
          />
        </div>
      )}

      {/* Section Briques : Sport & Résultats */}
      {preferences?.modules_actifs?.includes('sport') && (
        <SurgaSportCard
          sports={briefingData?.sports || []}
          equipesFavoritesCompte={preferences?.equipes_suivies}
        />
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

      {/* Section Briques : Shopping & Boutiques Nopalou (au-dessus de Bonnes Adresses) */}
      {onOpenShopping && (
        <SurgaShoppingDashboardCard onOuvrirModal={onOpenShopping} />
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
