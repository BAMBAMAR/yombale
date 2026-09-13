'use client'

import React, { useRef, useState } from 'react'
import PosModalsManager from './PosModalsManager'
import PosModalGestionPins from './PosModalGestionPins'
import PosSuperviseurPinModal from './PosSuperviseurPinModal'
import PosTicketPrintView from './PosTicketPrintView'
import type { CaissierItem } from './PosChangerCaissierModal'
import type { PosModalsState } from '../hooks/usePosModalsState'

interface PosModalsHostProps {
  // Session & Auth
  session: any
  setSession: React.Dispatch<React.SetStateAction<any>>
  caissierNom: string
  setCaissierNom: (nom: string) => void
  roleActif: 'caissier' | 'superviseur'
  setRoleActif: (r: 'caissier' | 'superviseur') => void
  caissiersList: any[]
  setCaissierSelectionneId: (id: string) => void
  setVerrouille: (v: boolean) => void
  initialToken?: string | null

  // Boutique info
  boutiqueActiveId: string
  activeBoutiqueObj: any
  boutiques: any[]
  planActifProp?: string | null
  terminalPlan?: string | null
  regimeFiscal: string
  estExonereClient: boolean

  // Panier & Totals
  panier: any[]
  sousTotalPanier: number
  netAPayer: number
  remisePourcentage: number
  setRemisePourcentage: (pct: number) => void
  remiseMotif: string
  setRemiseMotif: (motif: string) => void
  clientFidelite: any
  setClientFidelite: (c: any) => void
  cagnotteDeduite: number
  setCagnotteDeduite: (amt: number) => void

  // Data & Utilities
  produits: any[]
  historiqueVentes: any[]
  derniereVente: any
  formatPrice: (p: number) => string
  showToast: (text: string, type?: 'success' | 'warning') => void
  imprimerTicketThermique: (vente: any) => Promise<void>
  chargerCaissiersEtSession: (bId: string) => Promise<void>

  // Modals state bundle
  modals: PosModalsState
}

export default function PosModalsHost(props: PosModalsHostProps) {
  const {
    session,
    setSession,
    caissierNom,
    setCaissierNom,
    roleActif,
    setRoleActif,
    caissiersList,
    setCaissierSelectionneId,
    setVerrouille,
    initialToken,
    boutiqueActiveId,
    activeBoutiqueObj,
    boutiques,
    planActifProp,
    terminalPlan,
    regimeFiscal,
    estExonereClient,
    panier,
    sousTotalPanier,
    netAPayer,
    remisePourcentage,
    setRemisePourcentage,
    remiseMotif,
    setRemiseMotif,
    clientFidelite,
    setClientFidelite,
    cagnotteDeduite,
    setCagnotteDeduite,
    produits,
    historiqueVentes,
    derniereVente,
    formatPrice,
    showToast,
    imprimerTicketThermique,
    chargerCaissiersEtSession,
    modals,
  } = props

  const {
    modalSessionOuverture,
    setModalSessionOuverture,
    modalClotureZ,
    setModalClotureZ,
    modalTiroirCaisse,
    setModalTiroirCaisse,
    modalBilanSession,
    setModalBilanSession,
    modalImportBatch,
    setModalImportBatch,
    modalConfigPin,
    setModalConfigPin,
    modalHistorique,
    setModalHistorique,
    modalCarnet,
    setModalCarnet,
    modalRemise,
    setModalRemise,
    modalFidelite,
    setModalFidelite,
    modalScannerCamera,
    setModalScannerCamera,
    modalPairageSmartphone,
    setModalPairageSmartphone,
    modalChangerCaissier,
    setModalChangerCaissier,
    modalSuperviseur,
    setModalSuperviseur,
    superviseurTitre,
    superviseurAction,
    pinSuperviseur,
    demanderValidationSuperviseur,
  } = modals

  const [fondDeCaisseSaisi, setFondDeCaisseSaisi] = useState('50000')
  const [, setEspecesComptees] = useState('')
  const [sessionScannerId] = useState(() => `SCAN-${Math.floor(100000 + Math.random() * 900000)}`)
  const [scannerTorcheActive, setScannerTorcheActive] = useState(false)
  const [modalTransCarnet, setModalTransCarnet] = useState(false)
  const [clientCarnetSelectionne] = useState<any>(null)
  const [typeTransCarnet] = useState<'remboursement' | 'vente_credit'>('remboursement')
  const [modeSaisieCarnet, setModeSaisieCarnet] = useState<'catalogue' | 'manuel'>('catalogue')
  const [panierCarnet, setPanierCarnet] = useState<Record<string, number>>({})
  const [rechercheProdCarnet, setRechercheProdCarnet] = useState('')
  const [montantTransCarnet, setMontantTransCarnet] = useState('')
  const [modePaiementTransCarnet, setModePaiementTransCarnet] = useState('especes')
  const [produitsTransCarnet, setProduitsTransCarnet] = useState('')
  const [dateEcheanceTransCarnet, setDateEcheanceTransCarnet] = useState('')
  const [relanceAutoWaCarnet, setRelanceAutoWaCarnet] = useState(true)
  const [noteTransCarnet, setNoteTransCarnet] = useState('')
  const html5QrcodeScannerRef = useRef<any>(null)

  return (
    <>
      <PosModalGestionPins
        isOpen={modalConfigPin}
        isObligatoire={false}
        boutiqueId={boutiqueActiveId}
        caissiersList={caissiersList}
        onClose={() => setModalConfigPin(false)}
        onSuccess={() => chargerCaissiersEtSession(boutiqueActiveId)}
        onRefreshCaissiers={() => chargerCaissiersEtSession(boutiqueActiveId)}
      />

      <PosSuperviseurPinModal
        isOpen={modalSuperviseur}
        titre={superviseurTitre}
        caissiersList={caissiersList}
        pinSuperviseurFallback={pinSuperviseur}
        onClose={() => setModalSuperviseur(false)}
        onSuccess={() => {
          setModalSuperviseur(false)
          if (superviseurAction) superviseurAction()
        }}
      />

      {derniereVente && (
        <PosTicketPrintView
          vente={derniereVente}
          boutiqueNom={activeBoutiqueObj?.nom}
          boutiqueAdresse={activeBoutiqueObj?.adresse}
          boutiqueTelephone={activeBoutiqueObj?.telephone}
          boutiqueLogo={activeBoutiqueObj?.logo}
          messageBasTicket={activeBoutiqueObj?.message_bas_ticket}
          regimeFiscal={regimeFiscal}
          estExonereClient={estExonereClient}
          clientFidelite={clientFidelite}
        />
      )}

      <PosModalsManager
        modalSessionOuverture={modalSessionOuverture}
        setModalSessionOuverture={setModalSessionOuverture}
        caissierNom={caissierNom}
        fondDeCaisseSaisi={fondDeCaisseSaisi}
        setFondDeCaisseSaisi={setFondDeCaisseSaisi}
        ouvrirSession={() => {
          setSession({
            id: `SESS-${Date.now()}`,
            dateOuverture: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            fondDeCaisse: Number(fondDeCaisseSaisi) || 50000,
            caissierNom,
            statut: 'ouverte',
            ventes: { total: 0, especes: 0, wave: 0, orangeMoney: 0, carte: 0, mixte: 0, nbVentes: 0 },
          })
          setModalSessionOuverture(false)
        }}
        formatPrice={formatPrice}
        modalClotureZ={modalClotureZ}
        setModalClotureZ={setModalClotureZ}
        session={session}
        boutiqueActiveId={boutiqueActiveId}
        exporterCloturePDF={() => {}}
        setSession={setSession}
        setEspecesComptees={setEspecesComptees}
        modalTiroirCaisse={modalTiroirCaisse}
        setModalTiroirCaisse={setModalTiroirCaisse}
        showToast={showToast}
        modalRemise={modalRemise}
        setModalRemise={setModalRemise}
        sousTotalPanier={sousTotalPanier}
        remisePourcentage={remisePourcentage}
        remiseMotif={remiseMotif}
        boutiqueActiveObj={activeBoutiqueObj}
        roleActif={roleActif}
        setRemisePourcentage={setRemisePourcentage}
        setRemiseMotif={setRemiseMotif}
        demanderValidationSuperviseur={demanderValidationSuperviseur}
        modalFidelite={modalFidelite}
        setModalFidelite={setModalFidelite}
        clientFidelite={clientFidelite}
        totalPanier={sousTotalPanier}
        cagnotteDeduite={cagnotteDeduite}
        setClientFidelite={setClientFidelite}
        setCagnotteDeduite={setCagnotteDeduite}
        modalScannerCamera={modalScannerCamera}
        scannerTorcheActive={scannerTorcheActive}
        setScannerTorcheActive={setScannerTorcheActive}
        html5QrcodeScannerRef={html5QrcodeScannerRef}
        toggleTorcheCamera={() => {}}
        arreterScannerCamera={() => setModalScannerCamera(false)}
        scannerFlashActif={false}
        scannerCameraStatus="Prêt pour le scan"
        scannerDernierItem={null}
        panier={panier}
        modalPairageSmartphone={modalPairageSmartphone}
        setModalPairageSmartphone={setModalPairageSmartphone}
        sessionScannerId={sessionScannerId}
        modalCarnet={modalCarnet}
        setModalCarnet={setModalCarnet}
        boutiques={boutiques}
        planActifProp={planActifProp}
        terminalPlan={terminalPlan}
        modalTransCarnet={modalTransCarnet}
        setModalTransCarnet={setModalTransCarnet}
        clientCarnetSelectionne={clientCarnetSelectionne}
        typeTransCarnet={typeTransCarnet}
        modeSaisieCarnet={modeSaisieCarnet}
        setModeSaisieCarnet={setModeSaisieCarnet}
        panierCarnet={panierCarnet}
        setPanierCarnet={setPanierCarnet}
        produits={produits}
        rechercheProdCarnet={rechercheProdCarnet}
        setRechercheProdCarnet={setRechercheProdCarnet}
        montantTransCarnet={montantTransCarnet}
        setMontantTransCarnet={setMontantTransCarnet}
        modePaiementTransCarnet={modePaiementTransCarnet}
        setModePaiementTransCarnet={setModePaiementTransCarnet}
        produitsTransCarnet={produitsTransCarnet}
        setProduitsTransCarnet={setProduitsTransCarnet}
        dateEcheanceTransCarnet={dateEcheanceTransCarnet}
        setDateEcheanceTransCarnet={setDateEcheanceTransCarnet}
        relanceAutoWaCarnet={relanceAutoWaCarnet}
        setRelanceAutoWaCarnet={setRelanceAutoWaCarnet}
        noteTransCarnet={noteTransCarnet}
        setNoteTransCarnet={setNoteTransCarnet}
        submittingCarnetTrans={false}
        handleValiderTransCarnet={() => {}}
        fcfa={(n) => `${n} FCFA`}
        modalBilanSession={modalBilanSession}
        setModalBilanSession={setModalBilanSession}
        netAPayer={netAPayer}
        panierLength={panier.length}
        modalChangerCaissier={modalChangerCaissier}
        setModalChangerCaissier={setModalChangerCaissier}
        caissiersList={caissiersList}
        handleChangerCaissier={(c: CaissierItem) => {
          setCaissierSelectionneId(c.id)
          setCaissierNom(c.nom)
          setRoleActif(c.role === 'superviseur' || c.role === 'admin' ? 'superviseur' : 'caissier')
          setModalChangerCaissier(false)
          return { ok: true }
        }}
        verrouillerCaisseManuellement={() => setVerrouille(true)}
        ouvrirConfigPin={() => setModalConfigPin(true)}
        seDeconnecterCompte={() => (window.location.href = '/')}
        initialToken={initialToken}
        modalHistorique={modalHistorique}
        setModalHistorique={setModalHistorique}
        historiqueVentes={historiqueVentes}
        onImprimerTicket={imprimerTicketThermique}
        onAnnulerVente={() => {}}
        onExporterCSV={() => {}}
        onExporterPDF={() => {}}
        modalImportBatch={modalImportBatch}
        setModalImportBatch={setModalImportBatch}
      />
    </>
  )
}
