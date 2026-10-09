'use client'

import React from 'react'
import { Sun, Newspaper, Calendar, Trophy } from 'lucide-react'
import SurgaBriefingActions from './SurgaBriefingActions'
import SurgaAudioPlayer from './SurgaAudioPlayer'
import SurgaBriefingSkeleton from './SurgaBriefingSkeleton'
import { SurgaBriefingIndisponible, SurgaBriefingNonActualise } from './SurgaBriefingEtat'
import type { EtatBriefing } from '@/lib/useSurgaBriefing'
import SurgaMeteoCard, { type MeteoData } from './SurgaMeteoCard'
import SurgaNewsList, { type BriefingNewsItem } from './SurgaNewsList'
import SurgaSportCard, { type SportEventItem } from './SurgaSportCard'
import SurgaTraficCard from './SurgaTraficCard'
import SurgaImmoDashboardCard from './SurgaImmoDashboardCard'
import SurgaConcoursDashboardCard from './SurgaConcoursDashboardCard'
import SurgaPlacesDashboardCard from './SurgaPlacesDashboardCard'
import SurgaShoppingDashboardCard from './SurgaShoppingDashboardCard'
import SurgaDashboardTools from './SurgaDashboardTools'
import SurgaShareButton from './SurgaShareButton'
import type { SurgaTab } from './SurgaBottomNav'
import type { SurgaDepensesStats } from '@/lib/surga-offline-sync'
import { quartierDe } from '@/lib/surga-meteo'

export interface BriefingData {
  message_synthese?: string
  heure_briefing?: string
  date?: string
  items?: BriefingNewsItem[]
  sports?: SportEventItem[]
  sport_indisponible?: boolean
  meteo?: MeteoData
  agenda_du_jour?: any[]
}

interface SurgaAujourdhuiTabProps {
  preferences: any
  briefingData: BriefingData | null
  etatBriefing?: EtatBriefing
  briefingRecuLe?: string | null
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
  // Les équipes choisies dans « Mes clubs » deviennent un réglage du compte (appareil, puis serveur).
  onEquipesChange?: (equipes: string[]) => void
}

import {
  formaterHeurePublication,
  formaterHoraireMatch,
  normaliserTypographieFrancaise,
} from '@/lib/surga-formatting'

export default function SurgaAujourdhuiTab({
  preferences,
  briefingData,
  etatBriefing = 'pret',
  briefingRecuLe = null,
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
  onEquipesChange,
}: SurgaAujourdhuiTabProps) {
  const heureBriefing = preferences?.heure_briefing || briefingData?.heure_briefing || '07:30'
  const quartier = quartierDe(preferences)
  // Sur mobile et dans le digest, afficher 2 à 3 brèves complètes sans troncature agressive
  const brevesPhares = (briefingData?.items || []).slice(0, 3)
  const prochainRdv = briefingData?.agenda_du_jour?.[0]
  const prochainMatch = (briefingData?.sports || [])[0]

  return (
    <>
      {/* SRG-A3-006 : briefing montré depuis la copie de l'appareil : sa date, et un bouton si l'actualisation a échoué */}
      {briefingData && briefingRecuLe && (
        <SurgaBriefingNonActualise recuLe={briefingRecuLe} enCours={etatBriefing === 'chargement'} onReessayer={chargerBriefing} />
      )}

      {/* Sans briefing : squelette pendant l'attente, message et bouton si le chargement a échoué */}
      {!briefingData ? (
        etatBriefing === 'erreur' ? <SurgaBriefingIndisponible onReessayer={chargerBriefing} /> : <SurgaBriefingSkeleton />
      ) : (
        /* Carte Briefing du jour */
        <div className="surga-card" style={{ borderLeft: '4px solid var(--surga-accent, #D97706)' }}>
          <div className="surga-card-header">
            <span className="surga-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sun size={18} color="var(--surga-accent, #D97706)" />
              <span>Briefing du matin</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('services')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 4px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--surga-text2, #475569)',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '2px',
              }}
              title="Modifier l'heure ou les réglages du briefing"
            >
              Prévu à {heureBriefing}
            </button>
          </div>

          <p style={{ fontSize: 14, color: 'var(--surga-text1, #0F172A)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
            {briefingData?.message_synthese || (
              <>
                Bonjour. Pour {quartier} ce matin : {(briefingData?.items || []).length} brève{(briefingData?.items || []).length > 1 ? 's' : ''}, {(briefingData?.sports || []).length} actualité{(briefingData?.sports || []).length > 1 ? 's' : ''} sportive{(briefingData?.sports || []).length > 1 ? 's' : ''}{nbAgenda === 1 ? (prochainRdv?.heure_evenement ? ` et 1 rappel à ${prochainRdv.heure_evenement.replace(':', ' h ')}` : ' et 1 rappel') : nbAgenda > 1 ? ` et ${nbAgenda} rappels` : ''}.
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-text2, #64748B)', letterSpacing: '0.02em' }}>
                    À la une ce matin
                  </span>
                  {brevesPhares.map((it, idx) => (
                    <div
                      key={it.id || it.url || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--surga-primary, #0F172A)',
                            textDecoration: 'none',
                            lineHeight: 1.35,
                            // Le titre d'un fait d'actualité s'affiche en entier : une coupure au milieu d'un mot ou d'un nom propre le rend ambigu.
                            display: 'block',
                            overflowWrap: 'anywhere',
                          }}
                          title={it.titre}
                        >
                          <span style={{ color: 'var(--surga-accent-ink, #A64B08)', fontWeight: 800, marginRight: 5 }}>•</span>
                          {it.titre}
                        </a>
                        <div style={{ fontSize: 12, color: 'var(--surga-text3, #94A3B8)', marginTop: 2, paddingLeft: 10 }}>
                          {it.source_nom} · {formaterHeurePublication(it.published_at)}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0, paddingTop: 2 }}>
                        <SurgaShareButton
                          payload={{
                            titre: it.titre,
                            texte: `${it.titre}\nSource : ${it.source_nom}\n${it.url}`,
                          }}
                          taille="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Agenda du jour : affiché seulement s'il y a un rendez-vous planifié pour éviter le doublon « Journée libre » */}
              {(prochainRdv || nbAgenda > 0) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--surga-primary, #0F172A)', paddingTop: 6, borderTop: '1px solid var(--surga-border, #E2E8F0)' }}>
                  <Calendar size={13} color="var(--surga-accent, #D97706)" style={{ flexShrink: 0 }} />
                  {prochainRdv ? (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>{prochainRdv.heure_evenement ? `${prochainRdv.heure_evenement.replace(':', ' h ')} : ` : ''}</strong>
                      {prochainRdv.titre}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--surga-text2, #475569)' }}>
                      {nbAgenda} rappel{nbAgenda > 1 ? 's' : ''} dans votre agenda
                    </span>
                  )}
                </div>
              )}

              {/* Match phare du jour avec heure ou score (SRG-UI-09) */}
              {prochainMatch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--surga-primary, #0F172A)' }}>
                  <Trophy size={13} color="var(--surga-accent, #D97706)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>{prochainMatch.competition} :</strong> {prochainMatch.equipe_domicile} vs {prochainMatch.equipe_exterieur}{' '}
                    <span style={{ fontWeight: 700, color: 'var(--surga-text2, #475569)' }}>
                      ({formaterHoraireMatch(prochainMatch)})
                    </span>
                    {prochainMatch.raison_presence && (
                      <span style={{ fontSize: 12, color: 'var(--surga-text3, #94A3B8)', marginLeft: 6 }}>
                        ({prochainMatch.raison_presence})
                      </span>
                    )}
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
          ) : null}
        </div>
      )}

      {/* Section Briques : Météo (mobile uniquement sous 1024px car présente dans le rail droit sur desktop) */}
      {(!preferences?.modules_actifs || preferences.modules_actifs.includes('meteo') || !preferences.modules_actifs.includes('sans_meteo')) && (
        <div className="surga-context-only-mobile">
          <SurgaMeteoCard
            initialMeteo={briefingData?.meteo}
            ville={quartier}
            onVilleChange={onVilleChange}
          />
        </div>
      )}

      {/* Section Briques : Actualités & Revue de presse (SRG-UI-05, SRG-UI-24 : sans doublon, typographie épurée) */}
      {briefingData && (preferences?.modules_actifs?.includes('actualites') || !preferences?.modules_actifs) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-primary, #0F172A)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Newspaper size={17} color="var(--surga-accent, #D97706)" />
              <span>Actualités et revue de presse</span>
            </h2>
            <button
              type="button"
              onClick={onOpenPresse}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--surga-accent-ink, #A64B08)',
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
            items={(briefingData?.items || []).slice(brevesPhares.length, brevesPhares.length + 3)}
            onVoirPlus={onOpenPresse}
          />
        </div>
      )}

      {/* Section Briques : Sport & Résultats */}
      {briefingData && preferences?.modules_actifs?.includes('sport') && (
        <SurgaSportCard
          sports={briefingData?.sports || []}
          sourceMuette={Boolean(briefingData?.sport_indisponible)}
          equipesFavoritesCompte={preferences?.equipes_suivies}
          onEquipesChange={onEquipesChange}
        />
      )}

      {/* Section Briques : Trafic Dakar (mobile uniquement sous 1024px car présent dans le rail droit sur desktop) */}
      {(preferences?.modules_actifs?.includes('trafic') || !preferences?.modules_actifs) && (
        <div className="surga-context-only-mobile">
          <SurgaTraficCard ville={quartier} onOuvrirDetail={onOpenTrafic} />
        </div>
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

      {/* Section Noyau : Raccourcis Dépenses, Notes, Calculs & Micro (mobile uniquement sous 1024px car présents dans le rail droit sur desktop) */}
      <div className="surga-context-only-mobile">
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
      </div>
    </>
  )
}
