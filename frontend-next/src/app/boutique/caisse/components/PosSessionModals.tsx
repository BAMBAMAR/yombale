'use client'

import React from 'react'
import PosSessionModal from './PosSessionModal'
import PosBlindCloseModal from './PosBlindCloseModal'
import PosTiroirCaisseModal from './PosTiroirCaisseModal'
import PosBilanRapportXModal from './PosBilanRapportXModal'
import PosChangerCaissierModal from './PosChangerCaissierModal'
import PosHistoriqueModal from './PosHistoriqueModal'
import PosTicketPrintView from './PosTicketPrintView'

export interface PosSessionModalsProps {
  modalSessionOuverture: boolean
  setModalSessionOuverture: (v: boolean) => void
  caissierNom: string
  fondDeCaisseSaisi: string
  setFondDeCaisseSaisi: (v: string) => void
  ouvrirSession: () => void
  formatPrice: (p: number) => string
  modalClotureZ: boolean
  setModalClotureZ: (v: boolean) => void
  session: any
  boutiqueActiveId: string
  exporterCloturePDF: () => void
  setSession: (s: any) => void
  setEspecesComptees: (v: string) => void
  modalTiroirCaisse: boolean
  setModalTiroirCaisse: (v: boolean) => void
  showToast: (text: string, type?: 'success' | 'warning') => void
  modalBilanSession: boolean
  setModalBilanSession: (v: boolean) => void
  roleActif: 'caissier' | 'superviseur'
  boutiqueActiveObj: any
  netAPayer: number
  panierLength: number
  fcfa: (n: number) => string
  modalChangerCaissier: boolean
  setModalChangerCaissier: (v: boolean) => void
  caissiersList: any[]
  handleChangerCaissier: (c: any) => void
  verrouillerCaisseManuellement: () => void
  ouvrirConfigPin: () => void
  seDeconnecterCompte: () => void
  initialToken?: string | null
  modalHistorique: boolean
  setModalHistorique: (v: boolean) => void
  historiqueVentes: any[]
  onImprimerTicket: (vente: any) => void
  onAnnulerVente: (vente: any) => void
  onExporterCSV: () => void
  onExporterPDF: () => void
  ticketPourImpression?: any
  onFermerTicketPrint?: () => void
}

export default function PosSessionModals(props: PosSessionModalsProps) {
  const {
    modalSessionOuverture,
    setModalSessionOuverture,
    caissierNom,
    fondDeCaisseSaisi,
    setFondDeCaisseSaisi,
    ouvrirSession,
    formatPrice,
    modalClotureZ,
    setModalClotureZ,
    session,
    boutiqueActiveId,
    exporterCloturePDF,
    setSession,
    setEspecesComptees,
    modalTiroirCaisse,
    setModalTiroirCaisse,
    showToast,
    modalBilanSession,
    setModalBilanSession,
    roleActif,
    boutiqueActiveObj,
    netAPayer,
    panierLength,
    fcfa,
    modalChangerCaissier,
    setModalChangerCaissier,
    caissiersList,
    handleChangerCaissier,
    verrouillerCaisseManuellement,
    ouvrirConfigPin,
    seDeconnecterCompte,
    initialToken,
    modalHistorique,
    setModalHistorique,
    historiqueVentes,
    onImprimerTicket,
    onAnnulerVente,
    onExporterCSV,
    onExporterPDF,
    ticketPourImpression,
    onFermerTicketPrint,
  } = props

  return (
    <>
      {modalHistorique && (
        <PosHistoriqueModal
          isOpen={modalHistorique}
          onClose={() => setModalHistorique(false)}
          historiqueVentes={historiqueVentes}
          roleActif={roleActif}
          onImprimerTicket={onImprimerTicket}
          onAnnulerVente={onAnnulerVente}
          onExporterCSV={onExporterCSV}
          onExporterPDF={onExporterPDF}
          fcfa={fcfa}
        />
      )}

      {ticketPourImpression && onFermerTicketPrint && (
        <PosTicketPrintView
          ticket={ticketPourImpression}
          boutique={boutiqueActiveObj}
          onClose={onFermerTicketPrint}
          fcfa={fcfa}
        />
      )}

      {modalSessionOuverture && (
        <PosSessionModal
          caissierNom={caissierNom}
          fondDeCaisseSaisi={fondDeCaisseSaisi}
          onChangeFondDeCaisse={setFondDeCaisseSaisi}
          onDemarrerSession={ouvrirSession}
          onClose={() => setModalSessionOuverture(false)}
          formatPrice={formatPrice}
        />
      )}

      {modalClotureZ && session && (
        <PosBlindCloseModal
          sessionId={session.id}
          caissierNom={session.caissierNom}
          onClose={() => setModalClotureZ(false)}
          onValiderCloture={async (especesCompteesVal, detailBillets) => {
            exporterCloturePDF()
            try {
              await fetch(`/api/boutiques/${boutiqueActiveId}/pos-sessions/cloturer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: session.id,
                  especesComptees: especesCompteesVal,
                  detailBillets,
                  ventesEspeces: session.ventes.especes,
                  ventesWave: session.ventes.wave,
                  ventesOrangeMoney: session.ventes.orangeMoney,
                  ventesCarte: session.ventes.carte,
                  ventesTotal: session.ventes.total,
                  nbVentes: session.ventes.nbVentes,
                  caissierNom: session.caissierNom,
                }),
              })
            } catch (e) {
              console.error('Erreur cloture backend:', e)
            }
            alert('Session de caisse fermée avec succès ! Rapport Z imprimé.')
            setSession(null)
            setEspecesComptees('')
            setModalClotureZ(false)
          }}
        />
      )}

      {modalTiroirCaisse && session && (
        <PosTiroirCaisseModal
          isOpen={modalTiroirCaisse}
          sessionId={session.id}
          boutiqueId={boutiqueActiveId}
          caissierNom={session.caissierNom || caissierNom}
          fondInitial={session.fondDeCaisse}
          ventesEspeces={session.ventes.especes}
          onClose={() => setModalTiroirCaisse(false)}
          onMouvementEnregistre={() => {
            showToast('Mouvement de caisse enregistré !', 'success')
          }}
        />
      )}

      <PosBilanRapportXModal
        isOpen={modalBilanSession}
        onClose={() => setModalBilanSession(false)}
        caissierNom={caissierNom}
        roleActif={roleActif}
        boutiqueNom={boutiqueActiveObj?.nom}
        session={session}
        netAPayer={netAPayer}
        panierLength={panierLength}
        fcfa={fcfa}
      />

      <PosChangerCaissierModal
        isOpen={modalChangerCaissier}
        onClose={() => setModalChangerCaissier(false)}
        caissierActuelNom={caissierNom}
        roleActif={roleActif}
        caissiersList={caissiersList}
        onValiderChangement={handleChangerCaissier}
        onVerrouillerTerminal={() => {
          setModalChangerCaissier(false)
          verrouillerCaisseManuellement()
        }}
        onOuvrirConfigEquipe={
          roleActif === 'superviseur'
            ? () => {
                setModalChangerCaissier(false)
                ouvrirConfigPin()
              }
            : undefined
        }
        onDeconnexion={seDeconnecterCompte}
        isTerminalMode={Boolean(initialToken)}
      />
    </>
  )
}
