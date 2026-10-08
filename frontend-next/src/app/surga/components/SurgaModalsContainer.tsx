'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useSurgaRadio } from '@/lib/surga-radio-context'

// Optimisation Bundle Initial : Chargement à la demande (lazy-loading / code splitting)
const SurgaCalculatorModal = dynamic(() => import('./SurgaCalculatorModal'), { ssr: false })
const SurgaVoiceModal = dynamic(() => import('./SurgaVoiceModal'), { ssr: false })
const SurgaPresseView = dynamic(() => import('./SurgaPresseView'), { ssr: false })
const SurgaPodcastModal = dynamic(() => import('./SurgaPodcastModal'), { ssr: false })
const SurgaRadioModal = dynamic(() => import('./SurgaRadioModal'), { ssr: false })
const SurgaTraficModal = dynamic(() => import('./SurgaTraficModal'), { ssr: false })
const SurgaImmoModal = dynamic(() => import('./SurgaImmoModal'), { ssr: false })
const SurgaConcoursModal = dynamic(() => import('./SurgaConcoursModal'), { ssr: false })
const SurgaPlacesModal = dynamic(() => import('./SurgaPlacesModal'), { ssr: false })
const SurgaShoppingModal = dynamic(() => import('./SurgaShoppingModal'), { ssr: false })
const SurgaPremiumModal = dynamic(() => import('./SurgaPremiumModal'), { ssr: false })
const SurgaProModal = dynamic(() => import('./SurgaProModal'), { ssr: false })
const SurgaDonneesModal = dynamic(() => import('./SurgaDonneesModal'), { ssr: false })
const SurgaVideosModal = dynamic(() => import('./SurgaVideosModal'), { ssr: false })
const SurgaEmploiModal = dynamic(() => import('./SurgaEmploiModal'), { ssr: false })
const SurgaDemarchesModal = dynamic(() => import('./SurgaDemarchesModal'), { ssr: false })
const SurgaPlusServicesModal = dynamic(() => import('./SurgaPlusServicesModal'), { ssr: false })
const SurgaAuthModal = dynamic(() => import('./SurgaAuthModal'), { ssr: false })
const SurgaCompteModal = dynamic(() => import('./SurgaCompteModal'), { ssr: false })

interface SurgaModalsContainerProps {
  isCalcOpen: boolean
  isVoiceOpen: boolean
  isPresseOpen: boolean
  isPodcastOpen: boolean
  isRadioOpen?: boolean
  isTraficOpen: boolean
  isImmoOpen: boolean
  isConcoursOpen: boolean
  isPlacesOpen: boolean
  isShoppingOpen?: boolean
  isPlusServicesOpen?: boolean
  isPremiumOpen: boolean
  isProOpen: boolean
  isDonneesOpen?: boolean
  isVideosOpen?: boolean
  isEmploiOpen?: boolean
  isDemarchesOpen?: boolean
  isAuthOpen?: boolean
  isCompteOpen?: boolean

  onCloseCalc: () => void
  onCloseVoice: () => void
  onClosePresse: () => void
  onClosePodcast: () => void
  onCloseRadio?: () => void
  onCloseTrafic: () => void
  onCloseImmo: () => void
  onCloseConcours: () => void
  onClosePlaces: () => void
  onCloseShopping?: () => void
  onClosePlusServices?: () => void
  onClosePremium: () => void
  onClosePro: () => void
  onCloseDonnees?: () => void
  onCloseVideos?: () => void
  onCloseEmploi?: () => void
  onCloseDemarches?: () => void
  onOpenPodcastModal?: () => void
  onOpenAuth?: () => void
  onCloseAuth?: () => void
  onAuthSuccess?: (user: any) => void
  onDonneesSupprimees?: () => void
  onCloseCompte?: () => void
  user?: any
  statutPremium?: { estPremium: boolean; plan?: string | null; joursRestants?: number }
  onUserUpdated?: (user: any) => void
  onDeconnexion?: () => void
  onSynchroniser?: () => void
  isSyncing?: boolean
  onOpenPremium?: () => void
  onOpenEmploi?: () => void
  onOpenConcours?: () => void
  onOpenPlaces?: () => void
  onOpenShopping?: () => void
  onOpenImmo?: () => void
  onOpenTrafic?: () => void
  onOpenDemarches?: () => void
  onOpenPresse?: () => void
  onOpenVideos?: () => void
  onOpenCalc?: () => void
  onOpenCompte?: () => void
  onOpenPro?: () => void
  onNavigateTab?: (tab: 'notes' | 'depenses' | 'agenda' | 'aujourdhui' | 'services') => void

  onInjectMontantCalc: (montant: number) => void
  onOpenRadioFromPresse?: () => void
  onConfirmerVoiceDepense: (depense: { montant: number; categorie: string; note: string }) => Promise<void>
  onConfirmerVoiceNote: (note: { titre: string; contenu: string }) => Promise<void>
  onConfirmerVoiceRappel: (rappel: { titre: string; date: string; heure: string }) => Promise<void>
  onAbonnementActive?: () => void
  onCreerNoteChecklist?: (titre: string, pieces: string[]) => void
  onAjouterDepenseDemarche?: (montant: number, description: string) => void
  onAjouterAgendaDemarche?: (titre: string, date: string) => void
}

export default function SurgaModalsContainer({
  isCalcOpen,
  isVoiceOpen,
  isPresseOpen,
  isPodcastOpen,
  isRadioOpen = false,
  isTraficOpen,
  isImmoOpen,
  isConcoursOpen,
  isPlacesOpen,
  isShoppingOpen = false,
  isPlusServicesOpen = false,
  isPremiumOpen,
  isProOpen,
  isDonneesOpen = false,
  isVideosOpen = false,
  isEmploiOpen = false,
  isDemarchesOpen = false,
  isAuthOpen = false,
  isCompteOpen = false,

  onCloseCalc,
  onCloseVoice,
  onClosePresse,
  onClosePodcast,
  onCloseRadio,
  onCloseTrafic,
  onCloseImmo,
  onCloseConcours,
  onClosePlaces,
  onCloseShopping = () => {},
  onClosePlusServices = () => {},
  onClosePremium,
  onClosePro,
  onCloseDonnees = () => {},
  onCloseVideos = () => {},
  onCloseEmploi = () => {},
  onCloseDemarches = () => {},
  onOpenPodcastModal,
  onOpenAuth,
  onCloseAuth = () => {},
  onAuthSuccess = () => {},
  onDonneesSupprimees,
  onCloseCompte = () => {},
  user,
  statutPremium,
  onUserUpdated = () => {},
  onDeconnexion = () => {},
  onSynchroniser = () => {},
  isSyncing = false,
  onOpenPremium,
  onOpenEmploi,
  onOpenConcours,
  onOpenPlaces,
  onOpenImmo,
  onOpenTrafic,
  onOpenDemarches,
  onOpenPresse,
  onOpenVideos,
  onOpenCalc,
  onOpenCompte,
  onOpenPro,
  onNavigateTab,

  onInjectMontantCalc,
  onOpenRadioFromPresse,
  onConfirmerVoiceDepense,
  onConfirmerVoiceNote,
  onConfirmerVoiceRappel,
  onAbonnementActive,
  onCreerNoteChecklist,
  onAjouterDepenseDemarche,
  onAjouterAgendaDemarche,
}: SurgaModalsContainerProps) {
  const { isRadioModalOpen, closeRadioModal, openRadioModal } = useSurgaRadio()
  const modalRadioOuvert = isRadioModalOpen || isRadioOpen
  const fermerRadioModal = onCloseRadio || closeRadioModal

  return (
    <>
      {isCalcOpen && (
        <SurgaCalculatorModal
          isOpen={isCalcOpen}
          onClose={onCloseCalc}
          onInjectMontant={onInjectMontantCalc}
        />
      )}
      {isVoiceOpen && (
        <SurgaVoiceModal
          isOpen={isVoiceOpen}
          onClose={onCloseVoice}
          onConfirmerDepense={onConfirmerVoiceDepense}
          onConfirmerNote={onConfirmerVoiceNote}
          onConfirmerRappel={onConfirmerVoiceRappel}
          onOpenConcours={() => {
            onCloseVoice()
            if (onOpenConcours) onOpenConcours()
          }}
          onOpenPlaces={() => {
            onCloseVoice()
            if (onOpenPlaces) onOpenPlaces()
          }}
          onOpenTrafic={() => {
            onCloseVoice()
            if (onOpenTrafic) onOpenTrafic()
          }}
          onOpenDemarches={() => {
            onCloseVoice()
            if (onOpenDemarches) onOpenDemarches()
          }}
          onOpenImmo={() => {
            onCloseVoice()
            if (onOpenImmo) onOpenImmo()
          }}
          onOpenMeteo={() => {
            onCloseVoice()
            if (onNavigateTab) onNavigateTab('services')
          }}
          onOpenSport={() => {
            onCloseVoice()
            if (onNavigateTab) onNavigateTab('services')
          }}
          onOpenPresse={() => {
            onCloseVoice()
            if (onOpenPresse) onOpenPresse()
          }}
          onOpenRadio={() => {
            onCloseVoice()
            openRadioModal()
          }}
          onOpenEmploi={() => {
            onCloseVoice()
            if (onOpenEmploi) onOpenEmploi()
          }}
          onOpenVideos={() => {
            onCloseVoice()
            if (onOpenVideos) onOpenVideos()
          }}
          onOpenCalc={() => {
            onCloseVoice()
            if (onOpenCalc) onOpenCalc()
          }}
          onOpenCompte={() => {
            onCloseVoice()
            if (onOpenCompte) onOpenCompte()
          }}
          onOpenPremium={() => {
            onCloseVoice()
            if (onOpenPremium) onOpenPremium()
          }}
          onOpenPro={() => {
            onCloseVoice()
            if (onOpenPro) onOpenPro()
          }}
          onNavigateTab={(tab) => {
            onCloseVoice()
            if (onNavigateTab) onNavigateTab(tab)
          }}
        />
      )}
      {isPresseOpen && (
        <SurgaPresseView
          isOpen={isPresseOpen}
          onClose={onClosePresse}
          onOpenRadios={
            onOpenRadioFromPresse ||
            (() => {
              onClosePresse()
              openRadioModal()
            })
          }
        />
      )}
      {isPodcastOpen && (
        <SurgaPodcastModal
          isOpen={isPodcastOpen}
          onClose={onClosePodcast}
        />
      )}
      {modalRadioOuvert && (
        <SurgaRadioModal
          isOpen={modalRadioOuvert}
          onClose={fermerRadioModal}
        />
      )}
      {isTraficOpen && (
        <SurgaTraficModal
          isOpen={isTraficOpen}
          onClose={onCloseTrafic}
        />
      )}
      {isImmoOpen && (
        <SurgaImmoModal
          isOpen={isImmoOpen}
          onClose={onCloseImmo}
        />
      )}
      {isConcoursOpen && (
        <SurgaConcoursModal
          isOpen={isConcoursOpen}
          onClose={onCloseConcours}
          onOpenAuth={onOpenAuth}
        />
      )}
      {isPlacesOpen && (
        <SurgaPlacesModal
          isOpen={isPlacesOpen}
          onClose={onClosePlaces}
        />
      )}
      {isShoppingOpen && (
        <SurgaShoppingModal
          isOpen={isShoppingOpen}
          onClose={onCloseShopping}
        />
      )}
      {isPremiumOpen && (
        <SurgaPremiumModal
          isOpen={isPremiumOpen}
          onClose={onClosePremium}
          onAbonnementActive={onAbonnementActive}
        />
      )}
      {isProOpen && (
        <SurgaProModal
          isOpen={isProOpen}
          onClose={onClosePro}
        />
      )}
      {isDonneesOpen && (
        <SurgaDonneesModal
          isOpen={isDonneesOpen}
          onClose={onCloseDonnees || (() => {})}
          onDonneesSupprimees={onDonneesSupprimees}
        />
      )}
      {isVideosOpen && (
        <SurgaVideosModal
          isOpen={isVideosOpen}
          onClose={onCloseVideos || (() => {})}
        />
      )}
      {isEmploiOpen && (
        <SurgaEmploiModal
          isOpen={isEmploiOpen}
          onClose={onCloseEmploi || (() => {})}
          onOpenPremium={() => {
            onCloseEmploi?.()
            onClosePremium?.() // Si besoin
          }}
          onOpenAuth={onOpenAuth}
        />
      )}
      {isDemarchesOpen && (
        <SurgaDemarchesModal
          isOpen={isDemarchesOpen}
          onClose={onCloseDemarches || (() => {})}
          onOpenPremium={onClosePremium}
          onCreerNoteChecklist={onCreerNoteChecklist}
          onAjouterDepense={onAjouterDepenseDemarche}
          onAjouterAgenda={onAjouterAgendaDemarche}
        />
      )}
      {isPlusServicesOpen && (
        <SurgaPlusServicesModal
          isOpen={isPlusServicesOpen}
          onClose={onClosePlusServices || (() => {})}
          onOpenRadios={openRadioModal}
          onOpenConcours={onOpenConcours}
          onOpenDemarches={onOpenDemarches}
          onOpenEmploi={onOpenEmploi}
          onOpenVideos={onOpenVideos}
          onOpenPodcast={onOpenPodcastModal}
          onOpenCalc={onOpenCalc}
        />
      )}
      {isAuthOpen && (
        <SurgaAuthModal
          isOpen={isAuthOpen}
          onClose={onCloseAuth || (() => {})}
          onSuccess={onAuthSuccess || (() => {})}
        />
      )}
      {isCompteOpen && (
        <SurgaCompteModal
          isOpen={isCompteOpen}
          onClose={onCloseCompte || (() => {})}
          user={user}
          statutPremium={statutPremium}
          onUserUpdated={onUserUpdated || (() => {})}
          onDeconnexion={onDeconnexion || (() => {})}
          onSynchroniser={onSynchroniser || (() => {})}
          isSyncing={isSyncing}
          onOpenPremium={onOpenPremium}
          onOpenEmploi={onOpenEmploi}
          onOpenConcours={onOpenConcours}
          onOpenImmo={onOpenImmo}
          onOpenAuth={onOpenAuth}
        />
      )}
    </>
  )
}
