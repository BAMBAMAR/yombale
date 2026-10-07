'use client'

import React, { useState, useEffect, useCallback } from 'react'
import SurgaHeader from './components/SurgaHeader'
import type { SurgaTab } from './components/SurgaBottomNav'
import SurgaLayoutShell from './components/SurgaLayoutShell'
import SurgaOnboarding, { type SurgaPreferencesData } from './components/SurgaOnboarding'
import SurgaAujourdhuiTab from './components/SurgaAujourdhuiTab'
import SurgaNotesView from './components/SurgaNotesView'
import SurgaSamaXaalisView from './components/SurgaSamaXaalisView'
import SurgaAgendaView from './components/SurgaAgendaView'
import SurgaParametresTab from './components/SurgaParametresTab'
import SurgaModalsContainer from './components/SurgaModalsContainer'
import SurgaLandingHero from './components/SurgaLandingHero'
import { deleteSessionAction } from '@/app/actions/auth'
import { useSurgaRadio } from '@/lib/surga-radio-context'
import { getSoldeKalpeFormate } from '@/lib/surga-kalpe'
import {
  getLocalNotes, getLocalAgenda, calculerStatsLocales,
  saveLocalDepense, saveLocalNote, saveLocalEvenement,
  synchroniserSurga, type SurgaDepensesStats,
} from '@/lib/surga-offline-sync'
import { demarrerSurveillanceRappels } from '@/lib/surga-reminders'
import { useFabAutoHide } from '@/lib/useFabAutoHide'

export interface SurgaUser {
  id: string
  nom?: string
  telephone?: string
  email?: string
}

export default function SurgaPage() {
  const { openRadioModal } = useSurgaRadio()
  const isFabHidden = useFabAutoHide()
  const [activeTab, setActiveTab] = useState<SurgaTab>('aujourdhui')
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null)
  const [afficherFormulaireOnboarding, setAfficherFormulaireOnboarding] = useState<boolean>(false)
  const [preferences, setPreferences] = useState<SurgaPreferencesData | null>(null)
  const [briefingData, setBriefingData] = useState<any | null>(null)
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false)

  // Modales
  const [isCalcOpen, setIsCalcOpen] = useState(false), [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [isPresseOpen, setIsPresseOpen] = useState(false), [isPodcastOpen, setIsPodcastOpen] = useState(false)
  const [isTraficOpen, setIsTraficOpen] = useState(false), [isImmoOpen, setIsImmoOpen] = useState(false)
  const [isConcoursOpen, setIsConcoursOpen] = useState(false), [isPlacesOpen, setIsPlacesOpen] = useState(false)
  const [isPremiumOpen, setIsPremiumOpen] = useState(false), [isProOpen, setIsProOpen] = useState(false)
  const [isDonneesOpen, setIsDonneesOpen] = useState(false), [isVideosOpen, setIsVideosOpen] = useState(false)
  const [isEmploiOpen, setIsEmploiOpen] = useState(false), [isDemarchesOpen, setIsDemarchesOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false), [isCompteOpen, setIsCompteOpen] = useState(false)

  // Statuts et Utilisateur
  const [user, setUser] = useState<SurgaUser | null>(null)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [statutPremium, setStatutPremium] = useState<{ estPremium: boolean; plan?: string | null; joursRestants?: number }>({ estPremium: false })
  const [audioScript, setAudioScript] = useState<string>('')
  const [statsApercu, setStatsApercu] = useState<SurgaDepensesStats | null>(null)
  const [soldeKalpeFormate, setSoldeKalpeFormate] = useState<string>('0 FCFA')
  const [nbNotes, setNbNotes] = useState<number>(0)
  const [nbAgenda, setNbAgenda] = useState<number>(0)

  // Surveillance des rappels en tâche de fond
  useEffect(() => {
    const stopper = demarrerSurveillanceRappels()
    return () => stopper()
  }, [])

  // Chargement profil utilisateur connecté
  const chargerProfilUser = useCallback(() => {
    fetch('/api/auth/profil')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setUser({ id: d.user.id, nom: d.user.nom, telephone: d.user.telephone, email: d.user.email })
        } else {
          setUser(null)
        }
      })
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    chargerProfilUser()
  }, [chargerProfilUser])

  // Chargement des aperçus locaux (dépenses, notes, agenda, Kalpé)
  const rafraichirApercus = useCallback(() => {
    try {
      setSoldeKalpeFormate(getSoldeKalpeFormate())
      setStatsApercu(calculerStatsLocales())
      setNbNotes(getLocalNotes().length)
      const todayStr = new Date().toISOString().slice(0, 10)
      const agendaToday = getLocalAgenda().filter((e) => e.date_evenement === todayStr && !e.termine)
      setNbAgenda(agendaToday.length)
    } catch {}
  }, [])

  useEffect(() => {
    rafraichirApercus()
    const onEvt = () => rafraichirApercus()
    window.addEventListener('surga-kalpe-change', onEvt)
    window.addEventListener('surga-data-change', onEvt)
    window.addEventListener('storage', onEvt)
    return () => {
      window.removeEventListener('surga-kalpe-change', onEvt)
      window.removeEventListener('surga-data-change', onEvt)
      window.removeEventListener('storage', onEvt)
    }
  }, [activeTab, rafraichirApercus])

  // Chargement des préférences utilisateur et statut Premium
  useEffect(() => {
    try {
      const storedDone = localStorage.getItem('surga_onboarding_done')
      const storedPrefs = localStorage.getItem('surga_preferences')
      if (storedDone === 'true' && storedPrefs) {
        const parsed = JSON.parse(storedPrefs)
        if (Array.isArray(parsed.modules_actifs) && !parsed.modules_actifs.includes('meteo')) {
          parsed.modules_actifs.push('meteo')
          try { localStorage.setItem('surga_preferences', JSON.stringify(parsed)) } catch {}
        }
        setPreferences(parsed)
        setIsOnboarded(true)
        return
      }
    } catch {}

    fetch('/api/surga/preferences')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.preferences?.onboarding_termine) {
          const pref = data.preferences
          if (Array.isArray(pref.modules_actifs) && !pref.modules_actifs.includes('meteo')) {
            pref.modules_actifs.push('meteo')
          }
          setPreferences(pref)
          setIsOnboarded(true)
          try {
            localStorage.setItem('surga_onboarding_done', 'true')
            localStorage.setItem('surga_preferences', JSON.stringify(pref))
          } catch {}
        } else {
          setIsOnboarded(false)
        }
      })
      .catch(() => setIsOnboarded(false))

    // Vérification du statut Premium
    fetch('/api/surga/abonnements/mon-statut')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatutPremium({
            estPremium: data.estPremium,
            plan: data.plan,
            joursRestants: data.joursRestants,
          })
        }
      })
      .catch(() => {})
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
      try { localStorage.removeItem('surga_onboarding_done'); localStorage.removeItem('surga_preferences') } catch {}
      setBriefingData(null); setIsOnboarded(false)
    }
  }

  // Déconnexion propre
  const handleDeconnexion = async () => {
    try {
      await fetch('/api/auth/deconnexion', { method: 'POST' }).catch(() => {})
      await deleteSessionAction()
      try { localStorage.removeItem('token') } catch {}
      setUser(null)
    } catch (err) {
      console.error('[SURGA LOGOUT ERROR]:', err)
    }
  }

  // Synchronisation forcée
  const handleSynchroniser = async () => {
    setIsSyncing(true)
    try {
      await synchroniserSurga()
      rafraichirApercus()
    } catch {} finally {
      setIsSyncing(false)
    }
  }

  // Succès authentification
  const handleAuthSuccess = (authUser: SurgaUser) => {
    setUser(authUser)
    fetch('/api/surga/abonnements/mon-statut')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatutPremium({
            estPremium: data.estPremium,
            plan: data.plan,
            joursRestants: data.joursRestants,
          })
        }
      })
      .catch(() => {})
    rafraichirApercus()
  }

  // Écran de chargement et pré-rendu SEO initial
  if (isOnboarded === null) {
    return <SurgaLandingHero onDemarrerOnboarding={() => setAfficherFormulaireOnboarding(true)} />
  }

  // Écran d'accueil public ou formulaire Onboarding
  if (!isOnboarded) {
    if (!afficherFormulaireOnboarding) {
      return (
        <SurgaLandingHero
          onDemarrerOnboarding={() => setAfficherFormulaireOnboarding(true)}
          onIgnorerVersApp={() => handleOnboardingComplete({
            heure_briefing: '07:30', langue: 'fr', quartiers: ['Plateau'], equipes_suivies: [],
            audio_actif: false, modules_actifs: ['actualites', 'meteo', 'trafic', 'depenses'], onboarding_termine: true,
          })}
        />
      )
    }
    return (
      <>
        <SurgaHeader titre="Surga" sousTitre="Configuration initiale" user={user} onOpenAuth={() => setIsAuthOpen(true)} onOpenCompte={() => setIsCompteOpen(true)} />
        <SurgaOnboarding onComplete={handleOnboardingComplete} initialData={preferences || undefined} />
      </>
    )
  }

  return (
    <>
      <SurgaLayoutShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        briefingDate={briefingData?.date}
        nbNotes={nbNotes}
        nbAgenda={nbAgenda}
        statsApercu={statsApercu}
        soldeKalpeFormate={soldeKalpeFormate}
        quartier={preferences?.quartiers?.[0] || 'Dakar'}
        isFabHidden={isFabHidden}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenTrafic={() => setIsTraficOpen(true)}
        onOpenPresse={() => setIsPresseOpen(true)}
        onOpenRadios={openRadioModal}
        onOpenConcours={() => setIsConcoursOpen(true)}
        onOpenImmo={() => setIsImmoOpen(true)}
        onOpenPlaces={() => setIsPlacesOpen(true)}
        onOpenCompte={() => setIsCompteOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onConfirmerDepense={handleVoiceDepense}
        onConfirmerNote={handleVoiceNote}
        onConfirmerRappel={handleVoiceRappel}
      >
        {/* Onglet 1 : Aujourd'hui */}
        {activeTab === 'aujourdhui' && (
          <SurgaAujourdhuiTab
            preferences={preferences}
            briefingData={briefingData}
            audioScript={audioScript}
            onToggleAudio={handleToggleAudio}
            soldeKalpeFormate={soldeKalpeFormate}
            statsApercu={statsApercu}
            nbNotes={nbNotes}
            nbAgenda={nbAgenda}
            chargerBriefing={chargerBriefing}
            onOpenPodcastModal={() => setIsPodcastOpen(true)}
            openRadioModal={openRadioModal}
            onVilleChange={(nv) => {
              setPreferences((prev: any) => {
                const maj = { ...(prev || {}), quartiers: [nv] }
                try { localStorage.setItem('surga_preferences', JSON.stringify(maj)) } catch {}
                return maj
              })
            }}
            onOpenPresse={() => setIsPresseOpen(true)}
            onOpenTrafic={() => setIsTraficOpen(true)}
            onOpenImmo={() => setIsImmoOpen(true)}
            onOpenConcours={() => setIsConcoursOpen(true)}
            onOpenPlaces={() => setIsPlacesOpen(true)}
            onNavigateTab={setActiveTab}
            onOpenCalc={() => setIsCalcOpen(true)}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onReinitialiser={handleReinitialiser}
          />
        )}

        {/* Onglets 2, 3, 4 : Vues dédiées */}
        {activeTab === 'notes' && <SurgaNotesView />}
        {activeTab === 'depenses' && <SurgaSamaXaalisView />}
        {activeTab === 'agenda' && <SurgaAgendaView />}

        {/* Onglet 5 : Services & Préférences */}
        {(activeTab === 'services' || activeTab === 'plus') && (
          <SurgaParametresTab
            preferences={preferences}
            statutPremium={statutPremium}
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenCompte={() => setIsCompteOpen(true)}
            onDeconnexion={handleDeconnexion}
            onSynchroniser={handleSynchroniser}
            isSyncing={isSyncing}
            onToggleAudio={handleToggleAudio}
            onOpenRadio={openRadioModal}
            onOpenTrafic={() => setIsTraficOpen(true)}
            onOpenImmo={() => setIsImmoOpen(true)}
            onOpenConcours={() => setIsConcoursOpen(true)}
            onOpenDemarches={() => setIsDemarchesOpen(true)}
            onOpenPlaces={() => setIsPlacesOpen(true)}
            onOpenVideos={() => setIsVideosOpen(true)}
            onOpenEmploi={() => setIsEmploiOpen(true)}
            onOpenPremium={() => setIsPremiumOpen(true)}
            onOpenPro={() => setIsProOpen(true)}
            onOpenDonnees={() => setIsDonneesOpen(true)}
            onReinitialiser={handleReinitialiser}
          />
        )}
      </SurgaLayoutShell>

      {/* Modales globales de Surga */}
      <SurgaModalsContainer
        isCalcOpen={isCalcOpen} isVoiceOpen={isVoiceOpen} isPresseOpen={isPresseOpen}
        isPodcastOpen={isPodcastOpen} isTraficOpen={isTraficOpen} isImmoOpen={isImmoOpen}
        isConcoursOpen={isConcoursOpen} isPlacesOpen={isPlacesOpen} isPremiumOpen={isPremiumOpen}
        isProOpen={isProOpen} isDonneesOpen={isDonneesOpen} isVideosOpen={isVideosOpen}
        isEmploiOpen={isEmploiOpen} isDemarchesOpen={isDemarchesOpen}
        isAuthOpen={isAuthOpen} isCompteOpen={isCompteOpen}
        onCloseCalc={() => setIsCalcOpen(false)} onCloseVoice={() => setIsVoiceOpen(false)}
        onClosePresse={() => setIsPresseOpen(false)} onClosePodcast={() => setIsPodcastOpen(false)}
        onCloseTrafic={() => setIsTraficOpen(false)} onCloseImmo={() => setIsImmoOpen(false)}
        onCloseConcours={() => setIsConcoursOpen(false)} onClosePlaces={() => setIsPlacesOpen(false)}
        onClosePremium={() => setIsPremiumOpen(false)} onClosePro={() => setIsProOpen(false)}
        onCloseDonnees={() => setIsDonneesOpen(false)} onCloseVideos={() => setIsVideosOpen(false)}
        onCloseEmploi={() => setIsEmploiOpen(false)} onCloseDemarches={() => setIsDemarchesOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)} onCloseAuth={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess} onCloseCompte={() => setIsCompteOpen(false)}
        user={user} statutPremium={statutPremium}
        onUserUpdated={(u) => { setUser(u); chargerProfilUser() }}
        onDeconnexion={handleDeconnexion} onSynchroniser={handleSynchroniser} isSyncing={isSyncing}
        onOpenPremium={() => setIsPremiumOpen(true)} onOpenEmploi={() => setIsEmploiOpen(true)}
        onOpenConcours={() => setIsConcoursOpen(true)} onOpenPlaces={() => setIsPlacesOpen(true)}
        onOpenImmo={() => setIsImmoOpen(true)} onOpenTrafic={() => setIsTraficOpen(true)}
        onOpenDemarches={() => setIsDemarchesOpen(true)} onOpenPresse={() => setIsPresseOpen(true)}
        onOpenVideos={() => setIsVideosOpen(true)} onOpenCalc={() => setIsCalcOpen(true)}
        onOpenCompte={() => setIsCompteOpen(true)} onOpenPro={() => setIsProOpen(true)}
        onNavigateTab={(t) => setActiveTab(t)} onInjectMontantCalc={() => setActiveTab('depenses')}
        onOpenRadioFromPresse={() => { setIsPresseOpen(false); openRadioModal() }}
        onConfirmerVoiceDepense={handleVoiceDepense} onConfirmerVoiceNote={handleVoiceNote}
        onConfirmerVoiceRappel={handleVoiceRappel} onDonneesSupprimees={handleReinitialiser}
        onAbonnementActive={() => setStatutPremium({ estPremium: true, joursRestants: 30 })}
        onCreerNoteChecklist={(titre, items) => { saveLocalNote({ titre, contenu: items.join('\n'), categorie: 'general', is_checklist: true }); rafraichirApercus() }}
        onAjouterDepenseDemarche={(m, d) => { saveLocalDepense({ montant_xof: m, categorie: 'autre', note: d, date_depense: new Date().toISOString() }); rafraichirApercus() }}
        onAjouterAgendaDemarche={(t, date) => { saveLocalEvenement({ titre: t, date_evenement: date, heure_evenement: '09:00', categorie: 'demarche' }); rafraichirApercus() }}
      />
    </>
  )
}
