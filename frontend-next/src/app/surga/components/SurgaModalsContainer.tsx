'use client'

import React from 'react'
import SurgaCalculatorModal from './SurgaCalculatorModal'
import SurgaVoiceModal from './SurgaVoiceModal'
import SurgaPresseView from './SurgaPresseView'
import SurgaPodcastModal from './SurgaPodcastModal'
import SurgaRadioModal from './SurgaRadioModal'
import SurgaTraficModal from './SurgaTraficModal'
import SurgaImmoModal from './SurgaImmoModal'
import SurgaConcoursModal from './SurgaConcoursModal'
import SurgaPlacesModal from './SurgaPlacesModal'
import SurgaPremiumModal from './SurgaPremiumModal'
import SurgaProModal from './SurgaProModal'
import SurgaDonneesModal from './SurgaDonneesModal'

interface SurgaModalsContainerProps {
  isCalcOpen: boolean
  isVoiceOpen: boolean
  isPresseOpen: boolean
  isPodcastOpen: boolean
  isRadioOpen: boolean
  isTraficOpen: boolean
  isImmoOpen: boolean
  isConcoursOpen: boolean
  isPlacesOpen: boolean
  isPremiumOpen: boolean
  isProOpen: boolean
  isDonneesOpen?: boolean

  onCloseCalc: () => void
  onCloseVoice: () => void
  onClosePresse: () => void
  onClosePodcast: () => void
  onCloseRadio: () => void
  onCloseTrafic: () => void
  onCloseImmo: () => void
  onCloseConcours: () => void
  onClosePlaces: () => void
  onClosePremium: () => void
  onClosePro: () => void
  onCloseDonnees?: () => void
  onDonneesSupprimees?: () => void

  onInjectMontantCalc: () => void
  onOpenRadioFromPresse: () => void
  onConfirmerVoiceDepense: (depense: { montant: number; categorie: string; note: string }) => Promise<void>
  onConfirmerVoiceNote: (note: { titre: string; contenu: string }) => Promise<void>
  onConfirmerVoiceRappel: (rappel: { titre: string; date: string; heure: string }) => Promise<void>
  onAbonnementActive?: () => void
}

export default function SurgaModalsContainer({
  isCalcOpen,
  isVoiceOpen,
  isPresseOpen,
  isPodcastOpen,
  isRadioOpen,
  isTraficOpen,
  isImmoOpen,
  isConcoursOpen,
  isPlacesOpen,
  isPremiumOpen,
  isProOpen,
  isDonneesOpen = false,

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
  onDonneesSupprimees,

  onInjectMontantCalc,
  onOpenRadioFromPresse,
  onConfirmerVoiceDepense,
  onConfirmerVoiceNote,
  onConfirmerVoiceRappel,
  onAbonnementActive,
}: SurgaModalsContainerProps) {
  return (
    <>
      <SurgaCalculatorModal
        isOpen={isCalcOpen}
        onClose={onCloseCalc}
        onInjectMontant={onInjectMontantCalc}
      />
      <SurgaVoiceModal
        isOpen={isVoiceOpen}
        onClose={onCloseVoice}
        onConfirmerDepense={onConfirmerVoiceDepense}
        onConfirmerNote={onConfirmerVoiceNote}
        onConfirmerRappel={onConfirmerVoiceRappel}
      />
      <SurgaPresseView
        isOpen={isPresseOpen}
        onClose={onClosePresse}
        onOpenRadios={onOpenRadioFromPresse}
      />
      <SurgaPodcastModal
        isOpen={isPodcastOpen}
        onClose={onClosePodcast}
      />
      <SurgaRadioModal
        isOpen={isRadioOpen}
        onClose={onCloseRadio}
      />
      <SurgaTraficModal
        isOpen={isTraficOpen}
        onClose={onCloseTrafic}
      />
      <SurgaImmoModal
        isOpen={isImmoOpen}
        onClose={onCloseImmo}
      />
      <SurgaConcoursModal
        isOpen={isConcoursOpen}
        onClose={onCloseConcours}
      />
      <SurgaPlacesModal
        isOpen={isPlacesOpen}
        onClose={onClosePlaces}
      />
      <SurgaPremiumModal
        isOpen={isPremiumOpen}
        onClose={onClosePremium}
        onAbonnementActive={onAbonnementActive}
      />
      <SurgaProModal
        isOpen={isProOpen}
        onClose={onClosePro}
      />
      <SurgaDonneesModal
        isOpen={isDonneesOpen}
        onClose={onCloseDonnees}
        onDonneesSupprimees={onDonneesSupprimees}
      />
    </>
  )
}
