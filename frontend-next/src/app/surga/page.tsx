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
  synchroniserSurga, adopterProprietaire, enregistrerPuisSynchroniser, preparerDeconnexion, retirerDonneesDuCompte, type SurgaDepensesStats,
} from '@/lib/surga-offline-sync'
import { quartierDe } from '@/lib/surga-meteo'
import { useSurgaBriefing } from '@/lib/useSurgaBriefing'
import { useSurgaOnglet } from '@/lib/useSurgaOnglet'
import { marquerConfigure } from '@/lib/surga-demarrage'
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
  const [activeTab, setActiveTab] = useSurgaOnglet()
  const [isOnboarded, definirOnboarded] = useState<boolean | null>(null)
  // L'état « configuré » est aussi posé en témoin, pour que le serveur n'envoie plus l'accueil public (SRG-A3-003).
  const setIsOnboarded = (oui: boolean) => { definirOnboarded(oui); marquerConfigure(oui) }
  const [afficherFormulaireOnboarding, setAfficherFormulaireOnboarding] = useState<boolean>(false)
  const [preferences, setPreferences] = useState<SurgaPreferencesData | null>(null)
  const { briefingData, setBriefingData, etatBriefing, briefingRecuLe, chargerBriefing } = useSurgaBriefing(isOnboarded === true)

  // Modales
  const [isCalcOpen, setIsCalcOpen] = useState(false), [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [isPresseOpen, setIsPresseOpen] = useState(false), [isPodcastOpen, setIsPodcastOpen] = useState(false)
  const [isTraficOpen, setIsTraficOpen] = useState(false), [isImmoOpen, setIsImmoOpen] = useState(false)
  const [isConcoursOpen, setIsConcoursOpen] = useState(false), [isPlacesOpen, setIsPlacesOpen] = useState(false), [isShoppingOpen, setIsShoppingOpen] = useState(false), [isPlusServicesOpen, setIsPlusServicesOpen] = useState(false)
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
  const [prochainRdvTitre, setProchainRdvTitre] = useState<string | undefined>(undefined)

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
          setUser({ id: d.user.id, nom: d.user.nom, telephone: d.user.telephone, email: d.user.email }); adopterProprietaire(d.user.id)
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
      setProchainRdvTitre(agendaToday[0] ? (agendaToday[0].heure_evenement ? `${agendaToday[0].heure_evenement} : ${agendaToday[0].titre}` : agendaToday[0].titre) : undefined)
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

  // SRG-A3-008 : session expirée ou révoquée constatée pendant un envoi. L'écran cesse d'afficher « connecté » et
  // propose la reconnexion ; les saisies restent en attente sur l'appareil.
  useEffect(() => {
    const surSessionPerdue = () => { deleteSessionAction().catch(() => {}); setUser(null); setIsAuthOpen(true) }
    window.addEventListener('surga-session-perdue', surSessionPerdue)
    return () => window.removeEventListener('surga-session-perdue', surSessionPerdue)
  }, [])

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

  const handleUpdatePreferences = async (patch: Partial<SurgaPreferencesData> & { sidebar_services?: string[]; rail_widgets?: string[] }) => {
    const updated = { ...(preferences || {}), ...patch } as SurgaPreferencesData
    setPreferences(updated)
    try {
      localStorage.setItem('surga_preferences', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('surga-data-change'))
      await fetch('/api/surga/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {})
    } catch {}
  }

  const handleOnboardingComplete = (data: SurgaPreferencesData) => {
    setPreferences(data)
    setIsOnboarded(true)
  }

  // SRG-A2-006 : une commande confirmée passe par un seul chemin d'écriture (pose sur l'appareil, puis synchronisation).
  const handleVoiceDepense = async (dep: { montant: number; categorie: string; note: string }) =>
    enregistrerPuisSynchroniser(() => saveLocalDepense({ montant_xof: dep.montant, categorie: dep.categorie, note: dep.note }), rafraichirApercus)
  const handleVoiceNote = async (n: { titre: string; contenu: string }) =>
    enregistrerPuisSynchroniser(() => saveLocalNote({ titre: n.titre, contenu: n.contenu }), rafraichirApercus)
  const handleVoiceRappel = async (r: { titre: string; date: string; heure: string }) =>
    enregistrerPuisSynchroniser(() => saveLocalEvenement({ titre: r.titre, date_evenement: r.date, heure_evenement: r.heure, est_rappel: true }), rafraichirApercus)

  const handleReinitialiser = () => {
    if (confirm('Voulez-vous réinitialiser votre configuration Surga pour recommencer l’onboarding ?')) {
      try { localStorage.removeItem('surga_onboarding_done'); localStorage.removeItem('surga_preferences') } catch {}
      setBriefingData(null); setIsOnboarded(false)
    }
  }

  // Déconnexion propre
  const handleDeconnexion = async () => {
    try {
      if (!(await preparerDeconnexion())) return
      await fetch('/api/auth/deconnexion', { method: 'POST' }).catch(() => {})
      await deleteSessionAction()
      try { localStorage.removeItem('token') } catch {}
      retirerDonneesDuCompte(); setUser(null); setBriefingData(null); setIsOnboarded(false); rafraichirApercus()
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
    setUser(authUser); adopterProprietaire(authUser.id); synchroniserSurga().then(() => rafraichirApercus()).catch(() => {})
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

  // Fenêtres de Surga, montées aussi sur l'écran de configuration : le bouton « Connexion » y restait sans effet.
  const modales = (
    <SurgaModalsContainer
      isCalcOpen={isCalcOpen} isVoiceOpen={isVoiceOpen} isPresseOpen={isPresseOpen}
      isPodcastOpen={isPodcastOpen} isTraficOpen={isTraficOpen} isImmoOpen={isImmoOpen}
      isConcoursOpen={isConcoursOpen} isPlacesOpen={isPlacesOpen} isShoppingOpen={isShoppingOpen} isPlusServicesOpen={isPlusServicesOpen} isPremiumOpen={isPremiumOpen}
      isProOpen={isProOpen} isDonneesOpen={isDonneesOpen} isVideosOpen={isVideosOpen}
      isEmploiOpen={isEmploiOpen} isDemarchesOpen={isDemarchesOpen}
      isAuthOpen={isAuthOpen} isCompteOpen={isCompteOpen}
      onCloseCalc={() => setIsCalcOpen(false)} onCloseVoice={() => setIsVoiceOpen(false)} onClosePresse={() => setIsPresseOpen(false)}
      onClosePodcast={() => setIsPodcastOpen(false)} onCloseTrafic={() => setIsTraficOpen(false)} onCloseImmo={() => setIsImmoOpen(false)}
      onCloseConcours={() => setIsConcoursOpen(false)} onClosePlaces={() => setIsPlacesOpen(false)} onCloseShopping={() => setIsShoppingOpen(false)}
      onClosePlusServices={() => setIsPlusServicesOpen(false)} onOpenPodcastModal={() => setIsPodcastOpen(true)}
      onClosePremium={() => setIsPremiumOpen(false)} onClosePro={() => setIsProOpen(false)} onCloseDonnees={() => setIsDonneesOpen(false)}
      onCloseVideos={() => setIsVideosOpen(false)} onCloseEmploi={() => setIsEmploiOpen(false)} onCloseDemarches={() => setIsDemarchesOpen(false)}
      onOpenAuth={() => setIsAuthOpen(true)} onCloseAuth={() => setIsAuthOpen(false)} onAuthSuccess={handleAuthSuccess}
      onCloseCompte={() => setIsCompteOpen(false)} user={user} statutPremium={statutPremium} onUserUpdated={(u) => { setUser(u); chargerProfilUser() }}
      onDeconnexion={handleDeconnexion} onSynchroniser={handleSynchroniser} isSyncing={isSyncing}
      onOpenPremium={() => setIsPremiumOpen(true)} onOpenEmploi={() => setIsEmploiOpen(true)} onOpenConcours={() => setIsConcoursOpen(true)}
      onOpenPlaces={() => setIsPlacesOpen(true)} onOpenShopping={() => setIsShoppingOpen(true)} onOpenImmo={() => setIsImmoOpen(true)}
      onOpenTrafic={() => setIsTraficOpen(true)} onOpenDemarches={() => setIsDemarchesOpen(true)} onOpenPresse={() => setIsPresseOpen(true)}
      onOpenVideos={() => setIsVideosOpen(true)} onOpenCalc={() => setIsCalcOpen(true)} onOpenCompte={() => setIsCompteOpen(true)} onOpenPro={() => setIsProOpen(true)}
      onNavigateTab={(t) => setActiveTab(t)} onInjectMontantCalc={() => setActiveTab('depenses')} onOpenRadioFromPresse={() => { setIsPresseOpen(false); openRadioModal() }}
      onConfirmerVoiceDepense={handleVoiceDepense} onConfirmerVoiceNote={handleVoiceNote} onConfirmerVoiceRappel={handleVoiceRappel} onDonneesSupprimees={handleReinitialiser}
      onAbonnementActive={() => setStatutPremium({ estPremium: true, joursRestants: 30 })}
      onCreerNoteChecklist={(titre, items) => { saveLocalNote({ titre, contenu: items.join('\n'), categorie: 'general', is_checklist: true }); rafraichirApercus() }}
      onAjouterDepenseDemarche={(m, d) => { saveLocalDepense({ montant_xof: m, categorie: 'autre', note: d, date_depense: new Date().toISOString() }); rafraichirApercus() }}
      onAjouterAgendaDemarche={(t, date) => { saveLocalEvenement({ titre: t, date_evenement: date, heure_evenement: '09:00', categorie: 'demarche' }); rafraichirApercus() }}
    />
  )

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
        {modales}
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
        nbAgenda={nbAgenda > 0 ? nbAgenda : (briefingData?.agenda_du_jour?.length || 0)}
        prochainRdvTitre={prochainRdvTitre || (briefingData?.agenda_du_jour?.[0] ? `${briefingData.agenda_du_jour[0].heure ? briefingData.agenda_du_jour[0].heure + ' : ' : ''}${briefingData.agenda_du_jour[0].titre}` : undefined)}
        statsApercu={statsApercu}
        soldeKalpeFormate={soldeKalpeFormate}
        quartier={quartierDe(preferences)}
        isFabHidden={isFabHidden}
        sidebarServices={preferences?.sidebar_services}
        railWidgets={preferences?.rail_widgets}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenTrafic={() => setIsTraficOpen(true)}
        onOpenPresse={() => setIsPresseOpen(true)}
        onOpenRadios={openRadioModal}
        onOpenConcours={() => setIsConcoursOpen(true)}
        onOpenImmo={() => setIsImmoOpen(true)}
        onOpenShopping={() => setIsShoppingOpen(true)}
        onOpenPlaces={() => setIsPlacesOpen(true)}
        onOpenPlusServices={() => setIsPlusServicesOpen(true)}
        onOpenDemarches={() => setIsDemarchesOpen(true)}
        onOpenEmploi={() => setIsEmploiOpen(true)}
        onOpenVideos={() => setIsVideosOpen(true)}
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
            briefingData={briefingData} etatBriefing={etatBriefing} briefingRecuLe={briefingRecuLe}
            audioScript={audioScript}
            onToggleAudio={handleToggleAudio}
            soldeKalpeFormate={soldeKalpeFormate}
            statsApercu={statsApercu}
            nbNotes={nbNotes}
            nbAgenda={nbAgenda}
            chargerBriefing={chargerBriefing}
            onOpenPodcastModal={() => setIsPodcastOpen(true)}
            openRadioModal={openRadioModal}
            onVilleChange={() => {
              // SRG-UI-01 : Consulter une autre ville ponctuellement ne modifie pas la ville de référence du profil
            }}
            onOpenPresse={() => setIsPresseOpen(true)}
            onOpenTrafic={() => setIsTraficOpen(true)}
            onOpenImmo={() => setIsImmoOpen(true)}
            onOpenConcours={() => setIsConcoursOpen(true)}
            onOpenShopping={() => setIsShoppingOpen(true)}
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
            onOpenPremium={() => setIsPremiumOpen(true)}
            onOpenPro={() => setIsProOpen(true)}
            onOpenDonnees={() => setIsDonneesOpen(true)}
            onReinitialiser={handleReinitialiser}
            onSavePreferences={handleUpdatePreferences}
          />
        )}
      </SurgaLayoutShell>

      {modales}
    </>
  )
}
