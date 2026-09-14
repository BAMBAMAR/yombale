'use client'

import React from 'react'
import { useTranslation } from '@/i18n/context'
import { useGestionDocumentsData } from './documents/useGestionDocumentsData'
import { useGestionDocumentsModal } from './documents/useGestionDocumentsModal'
import GestionDocumentsTable from './documents/GestionDocumentsTable'
import GestionDocumentsModal from './documents/GestionDocumentsModal'
import GestionDocumentsScanners from './documents/GestionDocumentsScanners'

export default function GestionDocuments({ boutiqueId }: { boutiqueId: string }) {
  const { t } = useTranslation() as { t: any }
  const data = useGestionDocumentsData(boutiqueId, t)
  const modal = useGestionDocumentsModal({
    boutiqueId,
    produits: data.produits,
    chargerDonnees: data.chargerDonnees,
    afficherToast: data.afficherToast,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toast Notification */}
      {data.toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13.5,
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {data.toastMessage}
        </div>
      )}

      {/* Table & Toolbar */}
      <GestionDocumentsTable
        boutiqueId={boutiqueId}
        documentsFiltres={data.documentsFiltres}
        clients={data.clients}
        loading={data.loading}
        rechercheDoc={data.rechercheDoc}
        setRechercheDoc={data.setRechercheDoc}
        typeFiltre={data.typeFiltre}
        setTypeFiltre={data.setTypeFiltre}
        statutFiltreDoc={data.statutFiltreDoc}
        setStatutFiltreDoc={data.setStatutFiltreDoc}
        onNouveauDocument={() => {
          modal.setDocumentEnEdition(null)
          modal.resetForm()
          modal.setModalOuvert(true)
        }}
        onOuvrirEdition={modal.handleOuvrirEdition}
        onConvertirEnFacture={data.handleConvertirEnFacture}
        onSupprimerDocument={data.handleSupprimerDocument}
        t={t}
      />

      {/* Creation / Edition Document Modal */}
      {modal.modalOuvert && (
        <GestionDocumentsModal
          documentEnEdition={modal.documentEnEdition}
          typeDoc={modal.typeDoc}
          setTypeDoc={modal.setTypeDoc}
          statutDoc={modal.statutDoc}
          setStatutDoc={modal.setStatutDoc}
          clientIdSelected={modal.clientIdSelected}
          setClientIdSelected={modal.setClientIdSelected}
          clients={data.clients}
          produits={data.produits}
          modeAjout={modal.modeAjout}
          setModeAjout={modal.setModeAjout}
          rechercheProduitModal={modal.rechercheProduitModal}
          setRechercheProduitModal={modal.setRechercheProduitModal}
          categorieProduitModal={modal.categorieProduitModal}
          setCategorieProduitModal={modal.setCategorieProduitModal}
          categoriesCatalogue={modal.categoriesCatalogue}
          produitsFiltresModal={modal.produitsFiltresModal}
          libelleLibreInput={modal.libelleLibreInput}
          setLibelleLibreInput={modal.setLibelleLibreInput}
          prixLibreInput={modal.prixLibreInput}
          setPrixLibreInput={modal.setPrixLibreInput}
          qteLibreInput={modal.qteLibreInput}
          setQteLibreInput={modal.setQteLibreInput}
          ocrDetections={modal.ocrDetections}
          lignesSelectionnees={modal.lignesSelectionnees}
          noteDoc={modal.noteDoc}
          setNoteDoc={modal.setNoteDoc}
          isSubmitting={modal.isSubmitting}
          totalArticles={modal.totalArticles}
          totalTTC={modal.totalTTC}
          onClose={() => modal.setModalOuvert(false)}
          onSubmit={modal.handleSoumettreDocument}
          onAjouterProduitCatalogue={modal.handleAjouterProduitCatalogue}
          onDiminuerProduitCatalogue={modal.handleDiminuerProduitCatalogue}
          onAjouterLigneLibre={modal.handleAjouterLigneLibre}
          onModifierLigne={modal.handleModifierLigne}
          onSupprimerLigne={modal.handleSupprimerLigne}
          onViderPanier={modal.handleViderPanier}
          onDemarrerScannerEan={modal.demarrerScannerEan}
          onDemarrerScannerNom={modal.demarrerScannerNom}
          t={t}
        />
      )}

      {/* Scanners modals */}
      <GestionDocumentsScanners
        modalScannerEan={modal.modalScannerEan}
        scannerEanStatus={modal.scannerEanStatus}
        scanContinu={modal.scanContinu}
        setScanContinu={modal.setScanContinu}
        onArreterScannerEan={modal.arreterScannerEan}
        modalScannerNom={modal.modalScannerNom}
        statusScannerNom={modal.statusScannerNom}
        ocrLoading={modal.ocrLoading}
        imageFligeeDocNom={modal.imageFligeeDocNom}
        videoNomRef={modal.videoNomRef}
        onCapturerNomOCR={modal.capturerNomOCR}
        onArreterScannerNom={modal.arreterScannerNom}
        t={t}
      />
    </div>
  )
}
