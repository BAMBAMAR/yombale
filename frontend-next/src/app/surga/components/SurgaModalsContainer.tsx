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
const SurgaPremiumModal = dynamic(() => import('./SurgaPremiumModal'), { ssr: false })
const SurgaProModal = dynamic(() => import('./SurgaProModal'), { ssr: false })
const SurgaDonneesModal = dynamic(() => import('./SurgaDonneesModal'), { ssr: false })
const SurgaVideosModal = dynamic(() => import('./SurgaVideosModal'), { ssr: false })
const SurgaEmploiModal = dynamic(() => import('./SurgaEmploiModal'), { ssr: false })
const SurgaDemarchesModal = dynamic(() => import('./SurgaDemarchesModal'), { ssr: false })
const SurgaAuthModal = dynamic(() => import('./SurgaAuthModal'), { ssr: false })

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
  isPremiumOpen: boolean
  isProOpen: boolean
  isDonneesOpen?: boolean
  isVideosOpen?: boolean
  isEmploiOpen?: boolean
  isDemarchesOpen?: boolean
  isAuthOpen?: boolean

  onCloseCalc: () => void
  onCloseVoice: () => void
  onClosePresse: () => void
  onClosePodcast: () => void
  onCloseRadio?: () => void
  onCloseTrafic: () => void
  onCloseImmo: () => void
  onCloseConcours: () => void
  onClosePlaces: () => void
  onClosePremium: () => void
  onClosePro: () => void
  onCloseDonnees?: () => void
  onCloseVideos?: () => void
  onCloseEmploi?: () => void
  onCloseDemarches?: () => void
  onCloseAuth?: () => void
  onAuthSuccess?: (user: any) => void
  onDonneesSupprimees?: () => void

  onInjectMontantCalc: () => void
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
  isPremiumOpen,
  isProOpen,
  isDonneesOpen = false,
  isVideosOpen = false,
  isEmploiOpen = false,
  isDemarchesOpen = false,
  isAuthOpen = false,

  onCloseCalc,
  onCloseVoice,
  onClosePresse,
  onClosePodcast,
  onCloseRadio,
  onCloseTrafic,
  onCloseImmo,
  onCloseConcours,
  onClosePlaces,
  onClosePremium,
  onClosePro,
  onCloseDonnees = () => {},
  onCloseVideos = () => {},
  onCloseEmploi = () => {},
  onCloseDemarches = () => {},
  onCloseAuth = () => {},
  onAuthSuccess = () => {},
  onDonneesSupprimees,

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
        />
      )}
      {isPlacesOpen && (
        <SurgaPlacesModal
          isOpen={isPlacesOpen}
          onClose={onClosePlaces}
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
      {isAuthOpen && (
        <SurgaAuthModal
          isOpen={isAuthOpen}
          onClose={onCloseAuth || (() => {})}
          onSuccess={onAuthSuccess || (() => {})}
        />
      )}
    </>
  )
}
