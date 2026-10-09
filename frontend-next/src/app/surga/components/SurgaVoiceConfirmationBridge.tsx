'use client'

import React from 'react'
import type { ActionVocaleDetectee } from '@/lib/surga-voice'
import SurgaVoiceConfirmation from './SurgaVoiceConfirmation'

interface SurgaVoiceConfirmationBridgeProps {
  actionDetectee: ActionVocaleDetectee
  statutSauvegarde: 'IDLE' | 'EN_COURS' | 'VALIDE' | 'ERREUR'
  onConfirmer: () => void
  onAnnuler: () => void
  onClose: () => void
  onOpenConcours?: (query?: string) => void
  onOpenPlaces?: (query?: string) => void
  onOpenTrafic?: (axe?: string) => void
  onOpenDemarches?: (query?: string) => void
  onOpenImmo?: (query?: string) => void
  onOpenMeteo?: () => void
  onOpenSport?: () => void
  onOpenPresse?: () => void
  onOpenRadio?: (station?: string) => void
  onOpenEmploi?: () => void
  onOpenVideos?: () => void
  onOpenCalc?: () => void
  onOpenCompte?: () => void
  onOpenPremium?: () => void
  onOpenPro?: () => void
  onNavigateTab?: (tab: 'notes' | 'depenses' | 'agenda' | 'aujourdhui' | 'services') => void
}

export default function SurgaVoiceConfirmationBridge({
  actionDetectee,
  statutSauvegarde,
  onConfirmer,
  onAnnuler,
  onClose,
  onOpenConcours,
  onOpenPlaces,
  onOpenTrafic,
  onOpenDemarches,
  onOpenImmo,
  onOpenMeteo,
  onOpenSport,
  onOpenPresse,
  onOpenRadio,
  onOpenEmploi,
  onOpenVideos,
  onOpenCalc,
  onOpenCompte,
  onOpenPremium,
  onOpenPro,
  onNavigateTab,
}: SurgaVoiceConfirmationBridgeProps) {
  const wrapClose = <T extends (...args: any[]) => void>(fn?: T) => {
    return ((...args: Parameters<T>) => {
      onClose()
      if (fn) fn(...args)
    }) as T
  }

  return (
    <SurgaVoiceConfirmation
      actionDetectee={actionDetectee}
      statutSauvegarde={statutSauvegarde}
      onConfirmer={onConfirmer}
      onAnnuler={onAnnuler}
      onOpenConcours={wrapClose(onOpenConcours)}
      onOpenPlaces={wrapClose(onOpenPlaces)}
      onOpenTrafic={wrapClose(onOpenTrafic)}
      onOpenDemarches={wrapClose(onOpenDemarches)}
      onOpenImmo={wrapClose(onOpenImmo)}
      onOpenMeteo={wrapClose(onOpenMeteo)}
      onOpenSport={wrapClose(onOpenSport)}
      onOpenPresse={wrapClose(onOpenPresse)}
      onOpenRadio={wrapClose(onOpenRadio)}
      onOpenEmploi={wrapClose(onOpenEmploi)}
      onOpenVideos={wrapClose(onOpenVideos)}
      onOpenCalc={wrapClose(onOpenCalc)}
      onOpenCompte={wrapClose(onOpenCompte)}
      onOpenPremium={wrapClose(onOpenPremium)}
      onOpenPro={wrapClose(onOpenPro)}
      onNavigateTab={wrapClose(onNavigateTab)}
    />
  )
}
