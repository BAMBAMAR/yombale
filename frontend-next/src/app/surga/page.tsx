'use client'

import React, { useState, useEffect, useCallback } from 'react'
import SurgaHeader from './components/SurgaHeader'
import SurgaBottomNav, { type SurgaTab } from './components/SurgaBottomNav'
import SurgaOnboarding, { type SurgaPreferencesData } from './components/SurgaOnboarding'
import SurgaBriefingActions from './components/SurgaBriefingActions'
import SurgaNewsList, { type BriefingNewsItem } from './components/SurgaNewsList'
import SurgaSportCard, { type SportEventItem } from './components/SurgaSportCard'
import SurgaNotesView from './components/SurgaNotesView'
import SurgaDepensesView from './components/SurgaDepensesView'
import SurgaCalculatorModal from './components/SurgaCalculatorModal'
import SurgaAgendaView from './components/SurgaAgendaView'
import SurgaDashboardTools from './components/SurgaDashboardTools'
import SurgaVoiceModal from './components/SurgaVoiceModal'
import SurgaPresseView from './components/SurgaPresseView'
import SurgaAudioPlayer from './components/SurgaAudioPlayer'
import SurgaPodcastModal from './components/SurgaPodcastModal'
import SurgaRadioModal from './components/SurgaRadioModal'
import SurgaTraficCard from './components/SurgaTraficCard'
import SurgaTraficModal from './components/SurgaTraficModal'
import SurgaImmoDashboardCard from './components/SurgaImmoDashboardCard'
import SurgaImmoModal from './components/SurgaImmoModal'
import SurgaConcoursDashboardCard from './components/SurgaConcoursDashboardCard'
import SurgaConcoursModal from './components/SurgaConcoursModal'
import SurgaParametresTab from './components/SurgaParametresTab'
import {
  getLocalNotes,
  getLocalAgenda,
  calculerStatsLocales,
  saveLocalDepense,
  saveLocalNote,
  saveLocalEvenement,
  type SurgaDepensesStats,
} from '@/lib/surga-offline-sync'
import { demarrerSurveillanceRappels } from '@/lib/surga-reminders'
import {
  Mic,
  Sun,
  Sparkles,
  RotateCcw,
  Newspaper,
  Volume2,
  Radio,
} from 'lucide-react'

interface BriefingApiResponse {
  success: boolean
  date: string
  heure_briefing: string
  quartier: string
  message_synthese: string
  modules_actifs: string[]
  items: BriefingNewsItem[]
  sports: SportEventItem[]
  agenda_du_jour?: Array<{ id: string; titre: string; heure_evenement?: string }>
}

export default function SurgaPage() {
  const [activeTab, setActiveTab] = useState<SurgaTab>('aujourdhui')
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null)
  const [preferences, setPreferences] = useState<SurgaPreferencesData | null>(null)
  const [briefingData, setBriefingData] = useState<BriefingApiResponse | null>(null)
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false)
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false)
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false)
  const [isPresseOpen, setIsPresseOpen] = useState<boolean>(false)
  const [isPodcastOpen, setIsPodcastOpen] = useState<boolean>(false)
  const [isRadioOpen, setIsRadioOpen] = useState<boolean>(false)
  const [isTraficOpen, setIsTraficOpen] = useState<boolean>(false)
  const [isImmoOpen, setIsImmoOpen] = useState<boolean>(false)
  const [isConcoursOpen, setIsConcoursOpen] = useState<boolean>(false)
  const [audioScript, setAudioScript] = useState<string>('')
  const [statsApercu, setStatsApercu] = useState<SurgaDepensesStats | null>(null)
  const [nbNotes, setNbNotes] = useState<number>(0)
  const [nbAgenda, setNbAgenda] = useState<number>(0)

  // Surveillance des rappels en tâche de fond
  useEffect(() => {
    const stopper = demarrerSurveillanceRappels()
    return () => stopper()
  }, [])

  // Chargement des aperçus locaux (dépenses, notes, agenda)
  const rafraichirApercus = useCallback(() => {
    try {
      setStatsApercu(calculerStatsLocales())
      setNbNotes(getLocalNotes().length)
      const todayStr = new Date().toISOString().slice(0, 10)
      const agendaToday = getLocalAgenda().filter((e) => e.date_evenement === todayStr && !e.termine)
      setNbAgenda(agendaToday.length)
    } catch {}
  }, [])

  useEffect(() => {
    rafraichirApercus()
  }, [activeTab, rafraichirApercus])

  // Chargement des préférences utilisateur
  useEffect(() => {
    try {
      const storedDone = localStorage.getItem('surga_onboarding_done')
      const storedPrefs = localStorage.getItem('surga_preferences')
      if (storedDone === 'true' && storedPrefs) {
        setPreferences(JSON.parse(storedPrefs))
        setIsOnboarded(true)
        return
      }
    } catch {}

    fetch('/api/surga/preferences')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.preferences?.onboarding_termine) {
          setPreferences(data.preferences)
          setIsOnboarded(true)
          try {
            localStorage.setItem('surga_onboarding_done', 'true')
            localStorage.setItem('surga_preferences', JSON.stringify(data.preferences))
          } catch {}
        } else {
          setIsOnboarded(false)
        }
      })
      .catch(() => {
        setIsOnboarded(false)
      })
  }, [])

  // Chargement du briefing dynamique
  const chargerBriefing = useCallback(() => {
    setLoadingBriefing(true)
    fetch('/api/surga/briefing')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBriefingData(data)
        }
      })
      .catch((err) => {
        console.warn('[SURGA BRIEFING FETCH WARN]:', err)
      })
      .finally(() => {
        setLoadingBriefing(false)
      })
  }, [])

  useEffect(() => {
    if (isOnboarded) {
      chargerBriefing()
    }
  }, [isOnboarded, chargerBriefing])

  // Chargement du script audio si l'option est active
  useEffect(() => {
    if (preferences?.audio_actif) {
      fetch('/api/surga/audio/script')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.script) setAudioScript(data.script)
        })
        .catch(() => {})
    }
  }, [preferences?.audio_actif, briefingData])

  const handleToggleAudio = async () => {
    const nouveauStatut = !preferences?.audio_actif
    const updated = { ...(preferences || {}), audio_actif: nouveauStatut } as SurgaPreferencesData
    setPreferences(updated)
    try {
      localStorage.setItem('surga_preferences', JSON.stringify(updated))
      await fetch('/api/surga/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch {}
  }

  const handleOnboardingComplete = (data: SurgaPreferencesData) => {
    setPreferences(data)
    setIsOnboarded(true)
  }

  const handleVoiceDepense = async (dep: { montant: number; categorie: string; note: string }) => {
    saveLocalDepense({ montant_xof: dep.montant, categorie: dep.categorie, note: dep.note })
    rafraichirApercus()
    fetch('/api/surga/depenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ montant_xof: dep.montant, categorie: dep.categorie, note: dep.note }) }).catch(() => {})
  }

  const handleVoiceNote = async (n: { titre: string; contenu: string }) => {
    saveLocalNote({ titre: n.titre, contenu: n.contenu })
    rafraichirApercus()
    fetch('/api/surga/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(n) }).catch(() => {})
  }

  const handleVoiceRappel = async (r: { titre: string; date: string; heure: string }) => {
    saveLocalEvenement({ titre: r.titre, date_evenement: r.date, heure_evenement: r.heure, est_rappel: true })
    rafraichirApercus()
    fetch('/api/surga/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titre: r.titre, date_evenement: r.date, heure_evenement: r.heure, est_rappel: true }) }).catch(() => {})
  }

  const handleReinitialiser = () => {
    if (confirm('Voulez-vous réinitialiser votre configuration Surga pour recommencer l’onboarding ?')) {
      try {
        localStorage.removeItem('surga_onboarding_done')
        localStorage.removeItem('surga_preferences')
      } catch {}
      setBriefingData(null)
      setIsOnboarded(false)
    }
  }

  // Écran de chargement minimal
  if (isOnboarded === null) {
    return (
      <div className="surga-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text2, #5A4E42)' }}>
          <Sparkles size={28} color="var(--accent, #C75B00)" style={{ animation: 'spin 2s linear infinite' }} />
          <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600 }}>Chargement de votre Surga...</div>
        </div>
      </div>
    )
  }

  // Écran Onboarding si non configuré
  if (!isOnboarded) {
    return (
      <>
        <SurgaHeader titre="Surga" sousTitre="Configuration initiale" />
        <SurgaOnboarding onComplete={handleOnboardingComplete} initialData={preferences || undefined} />
      </>
    )
  }

  // Écran principal configuré
  return (
    <>
      <SurgaHeader
        titre={
          activeTab === 'notes'
            ? 'Mes Notes'
            : activeTab === 'depenses'
            ? 'Mes Dépenses'
            : activeTab === 'agenda'
            ? 'Mon Agenda'
            : activeTab === 'plus'
            ? 'Paramètres'
            : 'Surga'
        }
        sousTitre={activeTab === 'aujourdhui' ? briefingData?.date : undefined}
      />

      <div className="surga-container">
        {/* Onglet 1 : Aujourd'hui */}
        {activeTab === 'aujourdhui' && (
          <>
            {/* Carte Briefing du jour */}
            <div className="surga-card" style={{ borderLeft: '4px solid var(--accent, #C75B00)' }}>
              <div className="surga-card-header">
                <span className="surga-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sun size={18} color="var(--accent, #C75B00)" />
                  <span>Briefing du Matin</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3, #73675E)' }}>
                  Prévu à {preferences?.heure_briefing || briefingData?.heure_briefing || '07:30'}
                </span>
              </div>

              <p style={{ fontSize: 14, color: 'var(--text1, #1A1612)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                {briefingData?.message_synthese || (
                  <>
                    Bonjour. Votre Surga est configuré pour <strong>{preferences?.quartiers?.[0] || 'Dakar'}</strong>. Vos briques actives préparent votre premier briefing complet.
                  </>
                )}
              </p>

              <SurgaBriefingActions
                heureBriefing={preferences?.heure_briefing || briefingData?.heure_briefing || '07:30'}
                titrePremierItem={briefingData?.items?.[0]?.titre}
                onRefresh={chargerBriefing}
              />

              {/* Lecteur Audio Optionnel (Low-Data) */}
              {preferences?.audio_actif && audioScript && (
                <SurgaAudioPlayer
                  script={audioScript}
                  onOpenPodcastModal={() => setIsPodcastOpen(true)}
                  onOpenRadiosModal={() => setIsRadioOpen(true)}
                />
              )}
            </div>

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
                    onClick={() => setIsPresseOpen(true)}
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
                  onVoirPlus={() => setIsPresseOpen(true)}
                />
              </div>
            )}

            {/* Section Briques : Sport & Résultats */}
            {preferences?.modules_actifs?.includes('sport') && (
              <SurgaSportCard sports={briefingData?.sports || []} />
            )}

            {/* Section Briques : Trafic Dakar */}
            {(preferences?.modules_actifs?.includes('trafic') || !preferences?.modules_actifs) && (
              <SurgaTraficCard onOuvrirDetail={() => setIsTraficOpen(true)} />
            )}

            {/* Section Briques : Immobilier & Alertes Dakar */}
            {(preferences?.modules_actifs?.includes('immo') || !preferences?.modules_actifs) && (
              <SurgaImmoDashboardCard onOuvrirModal={() => setIsImmoOpen(true)} />
            )}

            {/* Section Briques : Concours & Examens du Sénégal */}
            {(preferences?.modules_actifs?.includes('concours') || !preferences?.modules_actifs) && (
              <SurgaConcoursDashboardCard onOuvrirModal={() => setIsConcoursOpen(true)} />
            )}

            {/* Section Noyau : Raccourcis Dépenses, Notes, Calculs & Micro */}
            <SurgaDashboardTools
              statsApercu={statsApercu}
              nbNotes={nbNotes}
              nbAgenda={nbAgenda}
              onNavigateTab={setActiveTab}
              onOpenCalc={() => setIsCalcOpen(true)}
              onOpenVoice={() => setIsVoiceOpen(true)}
              onReinitialiser={handleReinitialiser}
            />
          </>
        )}

        {/* Onglets 2, 3, 4 : Vues dédiées */}
        {activeTab === 'notes' && <SurgaNotesView />}
        {activeTab === 'depenses' && <SurgaDepensesView />}
        {activeTab === 'agenda' && <SurgaAgendaView />}

        {/* Onglet 5 : Plus / Paramètres */}
        {activeTab === 'plus' && (
          <SurgaParametresTab
            preferences={preferences}
            onToggleAudio={handleToggleAudio}
            onOpenRadio={() => setIsRadioOpen(true)}
            onOpenTrafic={() => setIsTraficOpen(true)}
            onOpenImmo={() => setIsImmoOpen(true)}
            onOpenConcours={() => setIsConcoursOpen(true)}
            onReinitialiser={handleReinitialiser}
          />
        )}
      </div>

      {/* Bouton micro flottant (FAB) */}
      <button
        type="button"
        className="surga-fab-mic"
        aria-label="Commande vocale Surga"
        title="Parler à Surga"
        onClick={() => setIsVoiceOpen(true)}
      >
        <Mic size={24} />
      </button>

      {/* Modales globales de Surga */}
      <SurgaCalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} onInjectMontant={() => setActiveTab('depenses')} />
      <SurgaVoiceModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onConfirmerDepense={handleVoiceDepense} onConfirmerNote={handleVoiceNote} onConfirmerRappel={handleVoiceRappel} />
      <SurgaPresseView isOpen={isPresseOpen} onClose={() => setIsPresseOpen(false)} onOpenRadios={() => { setIsPresseOpen(false); setIsRadioOpen(true) }} />
      <SurgaPodcastModal isOpen={isPodcastOpen} onClose={() => setIsPodcastOpen(false)} />
      <SurgaRadioModal isOpen={isRadioOpen} onClose={() => setIsRadioOpen(false)} />
      <SurgaTraficModal isOpen={isTraficOpen} onClose={() => setIsTraficOpen(false)} />
      <SurgaImmoModal isOpen={isImmoOpen} onClose={() => setIsImmoOpen(false)} />
      <SurgaConcoursModal isOpen={isConcoursOpen} onClose={() => setIsConcoursOpen(false)} />

      {/* Navigation basse */}
      <SurgaBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}

