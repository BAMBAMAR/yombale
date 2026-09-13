'use client'

import React from 'react'
import QrCodeShareModal from '@/components/QrCodeShareModal'
import type { ClientCredit, ProduitBoutique } from '../types'
import CarnetModalNouveauClient from './CarnetModalNouveauClient'
import CarnetModalEditClient from './CarnetModalEditClient'
import CarnetModalTransaction from './CarnetModalTransaction'
import CarnetScannerModals from './CarnetScannerModals'
import CarnetModalImportClients from '../../components/CarnetModalImportClients'

interface CarnetModalsHostProps {
  boutique: {
    id: string
    nom: string
    slug?: string | null
  }
  isMobile: boolean
  // Modal Nouveau Client
  showModalNouveauClient: boolean
  setShowModalNouveauClient: (v: boolean) => void
  onCreerClient: (data: any) => Promise<any>
  // Modal Edit Client
  showModalEditClient: boolean
  setShowModalEditClient: (v: boolean) => void
  clientAEditer: ClientCredit | null
  onEnregistrerEditClient: (id: string, data: any) => Promise<any>
  // Modal Transaction
  showModalTransaction: boolean
  setShowModalTransaction: (v: boolean) => void
  clientSelectionne: ClientCredit | null
  clients: ClientCredit[]
  onSelectClient: (c: ClientCredit) => void
  typeTransaction: 'vente_credit' | 'remboursement'
  produits: ProduitBoutique[]
  onValiderTransaction: (params: any) => Promise<void>
  demarrerScannerEanCredit: () => void
  demarrerScannerNomCredit: () => void
  ocrDetectionsCredit: string[]
  // Scanners
  modalScannerEanCredit: boolean
  scannerEanStatusCredit: string
  scanContinuCredit: boolean
  setScanContinuCredit: (v: boolean) => void
  arreterScannerEanCredit: () => void
  modalScannerNomCredit: boolean
  statusScannerNomCredit: string
  imageFligeeCreditNom: string | null
  videoNomCreditRef: React.RefObject<HTMLVideoElement | null>
  ocrLoadingCredit: boolean
  capturerNomOCRCredit: () => void
  arreterScannerNomCredit: () => void
  // QR Modal
  showQrModalComptoir: boolean
  setShowQrModalComptoir: (v: boolean) => void
  // Import Batch Modal
  showModalImportClients: boolean
  setShowModalImportClients: (v: boolean) => void
  importClientsError: string | null
  importClientsSuccess: string | null
  clientsAImporter: any[]
  importingClients: boolean
  telechargerModeleClientsCSV: () => void
  handleClientFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  validerImportClients: () => void
}

export default function CarnetModalsHost({
  boutique,
  isMobile,
  showModalNouveauClient,
  setShowModalNouveauClient,
  onCreerClient,
  showModalEditClient,
  setShowModalEditClient,
  clientAEditer,
  onEnregistrerEditClient,
  showModalTransaction,
  setShowModalTransaction,
  clientSelectionne,
  clients,
  onSelectClient,
  typeTransaction,
  produits,
  onValiderTransaction,
  demarrerScannerEanCredit,
  demarrerScannerNomCredit,
  ocrDetectionsCredit,
  modalScannerEanCredit,
  scannerEanStatusCredit,
  scanContinuCredit,
  setScanContinuCredit,
  arreterScannerEanCredit,
  modalScannerNomCredit,
  statusScannerNomCredit,
  imageFligeeCreditNom,
  videoNomCreditRef,
  ocrLoadingCredit,
  capturerNomOCRCredit,
  arreterScannerNomCredit,
  showQrModalComptoir,
  setShowQrModalComptoir,
  showModalImportClients,
  setShowModalImportClients,
  importClientsError,
  importClientsSuccess,
  clientsAImporter,
  importingClients,
  telechargerModeleClientsCSV,
  handleClientFileUpload,
  validerImportClients,
}: CarnetModalsHostProps) {
  return (
    <>
      {/* Modal 1 : Nouveau Client */}
      <CarnetModalNouveauClient
        isOpen={showModalNouveauClient}
        onClose={() => setShowModalNouveauClient(false)}
        isMobile={isMobile}
        onCreerClient={onCreerClient}
      />

      {/* Modal 2 : Modifier Client */}
      <CarnetModalEditClient
        isOpen={showModalEditClient}
        client={clientAEditer}
        onClose={() => setShowModalEditClient(false)}
        isMobile={isMobile}
        onEnregistrerEditClient={onEnregistrerEditClient}
      />

      {/* Modal 3 : Transaction (Crédit / Remboursement) */}
      <CarnetModalTransaction
        isOpen={showModalTransaction}
        onClose={() => setShowModalTransaction(false)}
        clientSelectionne={clientSelectionne}
        clients={clients}
        onSelectClient={onSelectClient}
        typeTransaction={typeTransaction}
        produits={produits}
        isMobile={isMobile}
        onValiderTransaction={onValiderTransaction}
        demarrerScannerEanCredit={demarrerScannerEanCredit}
        demarrerScannerNomCredit={demarrerScannerNomCredit}
        ocrDetectionsCredit={ocrDetectionsCredit}
      />

      {/* Modales Scanner EAN et OCR Nom */}
      <CarnetScannerModals
        modalScannerEanCredit={modalScannerEanCredit}
        scannerEanStatusCredit={scannerEanStatusCredit}
        scanContinuCredit={scanContinuCredit}
        setScanContinuCredit={setScanContinuCredit}
        arreterScannerEanCredit={arreterScannerEanCredit}
        modalScannerNomCredit={modalScannerNomCredit}
        statusScannerNomCredit={statusScannerNomCredit}
        imageFligeeCreditNom={imageFligeeCreditNom}
        videoNomCreditRef={videoNomCreditRef}
        ocrLoadingCredit={ocrLoadingCredit}
        capturerNomOCRCredit={capturerNomOCRCredit}
        arreterScannerNomCredit={arreterScannerNomCredit}
      />

      {/* Modal Partage QR Code Client Comptoir */}
      <QrCodeShareModal
        isOpen={showQrModalComptoir}
        onClose={() => setShowQrModalComptoir(false)}
        url={
          typeof window !== 'undefined'
            ? `${window.location.origin}/boutiques/${boutique.slug || boutique.id}?mode=credit`
            : `https://nopalou.com/boutiques/${boutique.slug || boutique.id}?mode=credit`
        }
        boutiqueNom={boutique.nom}
        title="QR Code Client en Boutique / Comptoir"
      />

      {/* Modal Import Clients par Lot (CSV / Excel) */}
      <CarnetModalImportClients
        isOpen={showModalImportClients}
        onClose={() => setShowModalImportClients(false)}
        error={importClientsError}
        success={importClientsSuccess}
        clientsAImporter={clientsAImporter}
        importing={importingClients}
        onDownloadModeleCSV={telechargerModeleClientsCSV}
        onFileUpload={handleClientFileUpload}
        onValiderImport={validerImportClients}
      />
    </>
  )
}
