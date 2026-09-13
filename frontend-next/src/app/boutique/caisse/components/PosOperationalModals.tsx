'use client'

import React from 'react'
import PosRemiseModal from './PosRemiseModal'
import PosFideliteModal, { ClientFidelite } from './PosFideliteModal'
import PosScannerModal from './PosScannerModal'
import PosPairageModal from './PosPairageModal'
import PosTransactionCarnetModal from './PosTransactionCarnetModal'
import BatchImportModal from '@/app/boutique/BatchImportModal'
import CarnetDettes from '../../CarnetDettes'
import { X } from 'lucide-react'

export interface PosOperationalModalsProps {
  modalRemise: boolean
  setModalRemise: (v: boolean) => void
  sousTotalPanier: number
  remisePourcentage: number
  remiseMotif: string
  boutiqueActiveObj: any
  roleActif: 'caissier' | 'superviseur'
  setRemisePourcentage: (v: number) => void
  setRemiseMotif: (v: string) => void
  demanderValidationSuperviseur: (titre: string, onValide: () => void) => void
  modalFidelite: boolean
  setModalFidelite: (v: boolean) => void
  clientFidelite: ClientFidelite | null
  totalPanier: number
  cagnotteDeduite: number
  setClientFidelite: (c: ClientFidelite | null) => void
  setCagnotteDeduite: (v: number) => void
  modalScannerCamera: boolean
  scannerTorcheActive: boolean
  setScannerTorcheActive: (v: boolean) => void
  html5QrcodeScannerRef: any
  toggleTorcheCamera: any
  arreterScannerCamera: () => void
  scannerFlashActif: boolean
  scannerCameraStatus: string
  scannerDernierItem: any
  panier: any[]
  formatPrice: (p: number) => string
  modalPairageSmartphone: boolean
  setModalPairageSmartphone: (v: boolean) => void
  sessionScannerId: string
  boutiqueActiveId: string
  modalCarnet: boolean
  setModalCarnet: (v: boolean) => void
  boutiques: any[]
  planActifProp?: string | null
  terminalPlan?: string | null
  modalTransCarnet: boolean
  setModalTransCarnet: (v: boolean) => void
  clientCarnetSelectionne: any
  typeTransCarnet: any
  modeSaisieCarnet: any
  setModeSaisieCarnet: any
  panierCarnet: any
  setPanierCarnet: any
  produits: any[]
  rechercheProdCarnet: string
  setRechercheProdCarnet: any
  montantTransCarnet: any
  setMontantTransCarnet: any
  modePaiementTransCarnet: any
  setModePaiementTransCarnet: any
  produitsTransCarnet: string
  setProduitsTransCarnet: any
  dateEcheanceTransCarnet: string
  setDateEcheanceTransCarnet: any
  relanceAutoWaCarnet: boolean
  setRelanceAutoWaCarnet: any
  noteTransCarnet: string
  setNoteTransCarnet: any
  submittingCarnetTrans: boolean
  handleValiderTransCarnet: () => void
  fcfa: (n: number) => string
  modalImportBatch: boolean
  setModalImportBatch: (v: boolean) => void
  showToast: (text: string, type?: 'success' | 'warning') => void
  onRefreshProduits?: () => void
}

export default function PosOperationalModals(props: PosOperationalModalsProps) {
  const {
    modalRemise,
    setModalRemise,
    sousTotalPanier,
    remisePourcentage,
    remiseMotif,
    boutiqueActiveObj,
    roleActif,
    setRemisePourcentage,
    setRemiseMotif,
    demanderValidationSuperviseur,
    modalFidelite,
    setModalFidelite,
    clientFidelite,
    totalPanier,
    cagnotteDeduite,
    setClientFidelite,
    setCagnotteDeduite,
    modalScannerCamera,
    scannerTorcheActive,
    setScannerTorcheActive,
    html5QrcodeScannerRef,
    toggleTorcheCamera,
    arreterScannerCamera,
    scannerFlashActif,
    scannerCameraStatus,
    scannerDernierItem,
    panier,
    formatPrice,
    modalPairageSmartphone,
    setModalPairageSmartphone,
    sessionScannerId,
    boutiqueActiveId,
    modalCarnet,
    setModalCarnet,
    boutiques,
    planActifProp,
    terminalPlan,
    modalTransCarnet,
    setModalTransCarnet,
    clientCarnetSelectionne,
    typeTransCarnet,
    modeSaisieCarnet,
    setModeSaisieCarnet,
    panierCarnet,
    setPanierCarnet,
    produits,
    rechercheProdCarnet,
    setRechercheProdCarnet,
    montantTransCarnet,
    setMontantTransCarnet,
    modePaiementTransCarnet,
    setModePaiementTransCarnet,
    produitsTransCarnet,
    setProduitsTransCarnet,
    dateEcheanceTransCarnet,
    setDateEcheanceTransCarnet,
    relanceAutoWaCarnet,
    setRelanceAutoWaCarnet,
    noteTransCarnet,
    setNoteTransCarnet,
    submittingCarnetTrans,
    handleValiderTransCarnet,
    fcfa,
    modalImportBatch,
    setModalImportBatch,
    showToast,
    onRefreshProduits,
  } = props

  return (
    <>
      {modalImportBatch && (
        <BatchImportModal
          boutiqueId={boutiqueActiveId}
          onClose={() => setModalImportBatch(false)}
          onSuccess={() => {
            setModalImportBatch(false)
            showToast('Catalogue importé avec succès !', 'success')
            if (onRefreshProduits) onRefreshProduits()
          }}
        />
      )}

      {modalRemise && (
        <PosRemiseModal
          sousTotal={sousTotalPanier}
          remiseActuelle={remisePourcentage}
          motifActuel={remiseMotif}
          plafondCaissierPct={Number(boutiqueActiveObj?.pos_remise_max_caissier ?? 10)}
          motifsBoutique={boutiqueActiveObj?.pos_remise_motifs}
          isSuperviseur={roleActif === 'superviseur'}
          onApplyRemise={(pct, motif) => {
            setRemisePourcentage(pct)
            setRemiseMotif(motif || '')
          }}
          onRequestSupervisor={(titre, onValide) => demanderValidationSuperviseur(titre, onValide)}
          onClose={() => setModalRemise(false)}
        />
      )}

      {modalFidelite && (
        <PosFideliteModal
          boutiqueId={boutiqueActiveId}
          clientSelectionne={clientFidelite}
          totalPanier={totalPanier}
          cagnotteDeduite={cagnotteDeduite}
          onSelectClient={(c) => setClientFidelite(c)}
          onDeduireCagnotte={(m) => setCagnotteDeduite(m)}
          onClose={() => setModalFidelite(false)}
        />
      )}

      {modalScannerCamera && (
        <PosScannerModal
          scannerTorcheActive={scannerTorcheActive}
          onToggleTorche={async () => {
            const next = !scannerTorcheActive
            setScannerTorcheActive(next)
            if (html5QrcodeScannerRef.current) {
              try {
                const stream = (html5QrcodeScannerRef.current as any)?.localMediaStream
                await toggleTorcheCamera(stream, next)
              } catch (e) {
                console.warn('[Nopalou:ScannerModal]', e)
              }
            }
          }}
          onClose={arreterScannerCamera}
          scannerFlashActif={scannerFlashActif}
          scannerCameraStatus={scannerCameraStatus}
          scannerDernierItem={scannerDernierItem}
          panierArticlesCount={panier.reduce((sum, item) => sum + item.quantite, 0)}
          panierTotal={panier.reduce((sum, item) => sum + item.quantite * item.prixUnitaire, 0)}
          formatPrice={formatPrice}
        />
      )}

      {modalPairageSmartphone && (
        <PosPairageModal
          sessionScannerId={sessionScannerId}
          boutiqueActiveId={boutiqueActiveId}
          onClose={() => setModalPairageSmartphone(false)}
        />
      )}

      {modalCarnet && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 20,
              padding: 16,
              width: '100%',
              maxWidth: 1060,
              maxHeight: '96vh',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
              position: 'relative',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <button
              onClick={() => setModalCarnet(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: '#e2e8f0',
                border: 'none',
                color: '#0f172a',
                borderRadius: '50%',
                width: 36,
                height: 36,
                fontSize: 18,
                fontWeight: 900,
                cursor: 'pointer',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
            <CarnetDettes
              boutique={{
                id: boutiqueActiveId || '',
                nom: boutiques.find((b) => b.id === boutiqueActiveId)?.nom || 'Boutique',
                slug: '',
              }}
              planActif={planActifProp || terminalPlan}
            />
          </div>
        </div>
      )}

      <PosTransactionCarnetModal
        isOpen={modalTransCarnet && Boolean(clientCarnetSelectionne)}
        onClose={() => setModalTransCarnet(false)}
        client={clientCarnetSelectionne}
        typeTrans={typeTransCarnet}
        modeSaisie={modeSaisieCarnet}
        setModeSaisie={setModeSaisieCarnet}
        panierCarnet={panierCarnet}
        setPanierCarnet={setPanierCarnet}
        produits={produits}
        rechercheProd={rechercheProdCarnet}
        setRechercheProd={setRechercheProdCarnet}
        montantTrans={montantTransCarnet}
        setMontantTrans={setMontantTransCarnet}
        modePaiementTrans={modePaiementTransCarnet}
        setModePaiementTrans={setModePaiementTransCarnet}
        produitsTrans={produitsTransCarnet}
        setProduitsTrans={setProduitsTransCarnet}
        dateEcheanceTrans={dateEcheanceTransCarnet}
        setDateEcheanceTrans={setDateEcheanceTransCarnet}
        relanceAutoWa={relanceAutoWaCarnet}
        setRelanceAutoWa={setRelanceAutoWaCarnet}
        noteTrans={noteTransCarnet}
        setNoteTrans={setNoteTransCarnet}
        submitting={submittingCarnetTrans}
        onSubmit={handleValiderTransCarnet}
        fcfa={fcfa}
      />
    </>
  )
}
