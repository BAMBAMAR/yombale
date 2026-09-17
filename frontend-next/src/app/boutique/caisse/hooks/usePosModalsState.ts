'use client'

import { useState, useCallback } from 'react'

export function usePosModalsState() {
  const [menuOutilsOuvert, setMenuOutilsOuvert] = useState(false)
  const [modalChangerCaissier, setModalChangerCaissier] = useState(false)
  const [modalSessionOuverture, setModalSessionOuverture] = useState(false)
  const [modalClotureZ, setModalClotureZ] = useState(false)
  const [modalTiroirCaisse, setModalTiroirCaisse] = useState(false)
  const [modalBilanSession, setModalBilanSession] = useState(false)
  const [modalHistorique, setModalHistorique] = useState(false)
  const [modalImportBatch, setModalImportBatch] = useState(false)
  const [modalConfigPin, setModalConfigPin] = useState(false)
  const [modalRemise, setModalRemise] = useState(false)
  const [modalFidelite, setModalFidelite] = useState(false)
  const [modalScannerCamera, setModalScannerCamera] = useState(false)
  const [modalPairageSmartphone, setModalPairageSmartphone] = useState(false)
  const [modalCarnet, setModalCarnet] = useState(false)
  const [modalMaterielGuide, setModalMaterielGuide] = useState(false)

  // Superviseur Modal State
  const [modalSuperviseur, setModalSuperviseur] = useState(false)
  const [superviseurTitre, setSuperviseurTitre] = useState('')
  const [superviseurAction, setSuperviseurAction] = useState<(() => void) | null>(null)
  const pinSuperviseur = '9999'

  const demanderValidationSuperviseur = useCallback((titre: string, onValide: () => void) => {
    setSuperviseurTitre(titre)
    setSuperviseurAction(() => onValide)
    setModalSuperviseur(true)
  }, [])

  return {
    menuOutilsOuvert,
    setMenuOutilsOuvert,
    modalChangerCaissier,
    setModalChangerCaissier,
    modalSessionOuverture,
    setModalSessionOuverture,
    modalClotureZ,
    setModalClotureZ,
    modalTiroirCaisse,
    setModalTiroirCaisse,
    modalBilanSession,
    setModalBilanSession,
    modalHistorique,
    setModalHistorique,
    modalImportBatch,
    setModalImportBatch,
    modalConfigPin,
    setModalConfigPin,
    modalRemise,
    setModalRemise,
    modalFidelite,
    setModalFidelite,
    modalScannerCamera,
    setModalScannerCamera,
    modalPairageSmartphone,
    setModalPairageSmartphone,
    modalCarnet,
    setModalCarnet,
    modalMaterielGuide,
    setModalMaterielGuide,
    modalSuperviseur,
    setModalSuperviseur,
    superviseurTitre,
    superviseurAction,
    pinSuperviseur,
    demanderValidationSuperviseur,
  }
}

export type PosModalsState = ReturnType<typeof usePosModalsState>

