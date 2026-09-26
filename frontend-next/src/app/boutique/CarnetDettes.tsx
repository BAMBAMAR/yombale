'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/i18n/context'
import { useSyncOffline } from '@/lib/sync-manager'

import type { ClientCredit } from './carnet/types'
import { useCarnetClients } from './carnet/hooks/useCarnetClients'
import { useCarnetExports } from './carnet/hooks/useCarnetExports'
import { useCarnetScanners } from './carnet/hooks/useCarnetScanners'
import { useCarnetVoice } from './carnet/hooks/useCarnetVoice'
import { useCarnetImportBatch } from './carnet/hooks/useCarnetImportBatch'
import { useCarnetNavLifecycle } from './carnet/hooks/useCarnetNavLifecycle'
import { useCarnetTransactions } from './carnet/hooks/useCarnetTransactions'

import CarnetHeaderBar from './carnet/components/CarnetHeaderBar'
import CarnetKpiCards from './carnet/components/CarnetKpiCards'
import CarnetDemandesAchatCredit from './carnet/components/CarnetDemandesAchatCredit'
import CarnetGuidePedagogique from './carnet/components/CarnetGuidePedagogique'
import CarnetVoiceActionCard from './carnet/components/CarnetVoiceActionCard'
import CarnetClientsList from './carnet/components/CarnetClientsList'
import CarnetClientDetails from './components/CarnetClientDetails'
import CarnetModalsHost from './carnet/components/CarnetModalsHost'
import CarnetQuickActionSheet from './carnet/components/CarnetQuickActionSheet'

interface CarnetDettesProps {
  boutique: {
    id: string
    nom: string
    slug?: string | null
    telephone?: string | null
    whatsapp?: string | null
    currency?: string
    utilisateur_id?: string
    user_id?: string
  }
  planActif?: string | null
  userId?: string
}

export default function CarnetDettes({ boutique, planActif, userId }: CarnetDettesProps) {
  const { t, isRtl } = useTranslation() as { t: any; isRtl: boolean }

  const effectiveUserId = userId || boutique?.utilisateur_id || boutique?.user_id || 'commercant'

  // Sync Offline
  const {
    syncPending: syncingCarnet,
    totalEnAttente: totalOfflineCount,
    declencherSync: declencherSyncCarnet,
    rafraichirCompteur: rafraichirCompteurCarnet,
  } = useSyncOffline(boutique?.id || '', effectiveUserId)

  // Données & Clients
  const {
    clients,
    setClients,
    produits,
    loading,
    recherche,
    setRecherche,
    filtreStatus,
    setFiltreStatus,
    clientSelectionne,
    setClientSelectionne,
    historique,
    loadingHist,
    commandesCreditEnAttente,
    clientsFiltres,
    chargerDonnees,
    chargerHistoriqueClient,
    ouvrirFicheClient,
    handleCreerClient,
    handleEnregistrerEditClient,
    handleChangerStatutClient,
    handleSupprimerClient,
    handleRelancerWhatsApp,
    handleRelancerEcheances,
    handleApprouverCommandeCredit,
    handleRefuserCommandeCredit,
  } = useCarnetClients({ boutique })

  // Exports
  const { handleExportCSV, handleExportPDF, handleExportReleveClientPDF } = useCarnetExports({
    boutique,
    clients,
  })

  // Import par lot
  const {
    showModalImportClients,
    setShowModalImportClients,
    clientsAImporter,
    importingClients,
    importClientsError,
    importClientsSuccess,
    telechargerModeleClientsCSV,
    handleClientFileUpload,
    validerImportClients,
  } = useCarnetImportBatch({ boutiqueId: boutique.id, onImportSuccess: chargerDonnees })

  // Modales & Navigation State
  const [menuOuvertClientId, setMenuOuvertClientId] = useState<string | null>(null)
  const [showMenuOptionsDettes, setShowMenuOptionsDettes] = useState(false)
  const [showModalNouveauClient, setShowModalNouveauClient] = useState(false)
  const [showModalEditClient, setShowModalEditClient] = useState(false)
  const [clientAEditer, setClientAEditer] = useState<ClientCredit | null>(null)
  const [showQrModalComptoir, setShowQrModalComptoir] = useState(false)
  const [relancantEcheances, setRelancantEcheances] = useState(false)
  const [showQuickSheet, setShowQuickSheet] = useState(false)

  // Transactions & Idempotence
  const {
    showModalTransaction,
    setShowModalTransaction,
    typeTransaction,
    setTypeTransaction,
    ouvrirModalTransaction,
    handleValiderTransaction,
  } = useCarnetTransactions({
    boutique,
    userId: effectiveUserId,
    clients,
    setClients,
    clientSelectionne,
    setClientSelectionne,
    chargerDonnees,
    chargerHistoriqueClient,
    setShowModalNouveauClient,
    rafraichirCompteurCarnet,
  })

  // Cycle de vie navigation & raccourcis
  const { isMobile } = useCarnetNavLifecycle({
    clientSelectionne,
    setClientSelectionne,
    setMenuOuvertClientId,
    setShowMenuOptionsDettes,
    setShowModalNouveauClient,
    setShowModalEditClient,
    setShowModalTransaction,
    setShowQrModalComptoir,
  })

  // Écoute des commandes de navigation globale (Bottom Nav & FAB)
  useEffect(() => {
    const handleOpenQuickSheet = () => setShowQuickSheet(true)
    const handleContextualFilter = (e: any) => {
      if (e.detail === 'tous' || e.detail === 'retard' || e.detail === 'credits') {
        setFiltreStatus(e.detail)
      }
    }

    window.addEventListener('nopalou:carnet:open_sheet', handleOpenQuickSheet)
    window.addEventListener('nopalou:carnet:filter', handleContextualFilter)
    return () => {
      window.removeEventListener('nopalou:carnet:open_sheet', handleOpenQuickSheet)
      window.removeEventListener('nopalou:carnet:filter', handleContextualFilter)
    }
  }, [setFiltreStatus])

  // Synchronisation filtre actif vers Bottom Nav
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nopalou:carnet:active_filter', { detail: filtreStatus }))
    }
  }, [filtreStatus])

  const ouvrirModalEditClient = useCallback((c: ClientCredit) => {
    setClientAEditer(c)
    setShowModalEditClient(true)
  }, [])

  // Scanners
  const {
    modalScannerEanCredit,
    modalScannerNomCredit,
    scannerEanStatusCredit,
    statusScannerNomCredit,
    ocrLoadingCredit,
    ocrDetectionsCredit,
    imageFligeeCreditNom,
    scanContinuCredit,
    setScanContinuCredit,
    videoNomCreditRef,
    arreterScannerEanCredit,
    demarrerScannerEanCredit,
    arreterScannerNomCredit,
    demarrerScannerNomCredit,
    capturerNomOCRCredit,
  } = useCarnetScanners({
    produits,
    onAddProduitToPanier: () => ouvrirModalTransaction('vente_credit'),
    onAddCustomArticle: () => ouvrirModalTransaction('vente_credit'),
  })

  // Assistant Vocal
  const {
    voiceActionPending,
    setVoiceActionPending,
    voiceActionLoading,
    isListeningVoice,
    voiceFeedback,
    validerActionVocaleDirecte,
    modifierDepuisVocal,
    demarrerEcouteVocaleCarnet,
  } = useCarnetVoice({
    boutique,
    clients,
    chargerDonnees,
    chargerHistoriqueClient,
    setClientSelectionne,
    ouvrirFicheClient,
    onOpenModalTransactionFromVoice: (action) => {
      ouvrirModalTransaction(action.type === 'remboursement' ? 'remboursement' : 'vente_credit', action.client)
    },
  })

  const handleRelancerEcheancesWrapper = async () => {
    setRelancantEcheances(true)
    try {
      await handleRelancerEcheances()
    } finally {
      setRelancantEcheances(false)
    }
  }

  // Métriques KPI
  const nbClientsDebiteurs = clients.filter((c) => Number(c.solde) > 0).length
  const totalDettesAEncaisser = clients.reduce((sum, c) => (Number(c.solde) > 0 ? sum + Number(c.solde) : sum), 0)
  const totalAvancesClients = clients.reduce((sum, c) => (Number(c.solde) < 0 ? sum + Math.abs(Number(c.solde)) : sum), 0)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        direction: isRtl ? 'rtl' : 'ltr',
        paddingBottom: 40,
        position: 'relative',
      }}
    >
      <CarnetHeaderBar
        isMobile={isMobile}
        clientsCount={clients.length}
        nbClientsDebiteurs={nbClientsDebiteurs}
        totalDettesAEncaisser={totalDettesAEncaisser}
        totalOfflineCount={totalOfflineCount}
        syncingCarnet={syncingCarnet}
        isListeningVoice={isListeningVoice}
        showMenuOptionsDettes={showMenuOptionsDettes}
        relancantEcheances={relancantEcheances}
        t={t}
        onDeclencherSync={declencherSyncCarnet}
        onOuvrirModalTransaction={() => ouvrirModalTransaction('vente_credit')}
        onOuvrirModalNouveauClient={() => setShowModalNouveauClient(true)}
        onToggleEcouteVocale={demarrerEcouteVocaleCarnet}
        onToggleMenuOptions={() => setShowMenuOptionsDettes((prev) => !prev)}
        onOuvrirQrModal={() => setShowQrModalComptoir(true)}
        onOuvrirImportClients={() => setShowModalImportClients(true)}
        onRelancerEcheances={handleRelancerEcheancesWrapper}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
      />

      <CarnetKpiCards
        isMobile={isMobile}
        totalDettesAEncaisser={totalDettesAEncaisser}
        totalAvancesClients={totalAvancesClients}
        nbClientsDebiteurs={nbClientsDebiteurs}
        totalClients={clients.length}
        t={t}
      />

      <CarnetDemandesAchatCredit
        commandesCreditEnAttente={commandesCreditEnAttente}
        t={t}
        onApprouver={handleApprouverCommandeCredit}
        onRefuser={handleRefuserCommandeCredit}
      />

      <CarnetVoiceActionCard
        isMobile={isMobile}
        isListeningVoice={isListeningVoice}
        voiceFeedback={voiceFeedback}
        voiceActionPending={voiceActionPending}
        setVoiceActionPending={setVoiceActionPending}
        voiceActionLoading={voiceActionLoading}
        clients={clients}
        onStopListening={demarrerEcouteVocaleCarnet}
        onValiderActionVocale={validerActionVocaleDirecte}
        onModifierDepuisVocal={modifierDepuisVocal}
        onCreerNouveauClientVocal={() => setShowModalNouveauClient(true)}
      />

      {!isMobile && <CarnetGuidePedagogique isMobile={isMobile} />}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : clientSelectionne ? 'minmax(0, 1.15fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
          gap: 16,
          alignItems: 'start',
          width: '100%',
          minWidth: 0,
        }}
      >
        {(!isMobile || !clientSelectionne) && (
          <CarnetClientsList
            isMobile={isMobile}
            clients={clients}
            clientsFiltres={clientsFiltres}
            clientSelectionne={clientSelectionne}
            loading={loading}
            recherche={recherche}
            setRecherche={setRecherche}
            filtreStatus={filtreStatus}
            setFiltreStatus={setFiltreStatus}
            menuOuvertClientId={menuOuvertClientId}
            setMenuOuvertClientId={setMenuOuvertClientId}
            isListeningVoice={isListeningVoice}
            voiceFeedback={voiceFeedback}
            nbClientsDebiteurs={nbClientsDebiteurs}
            t={t}
            onDemarrerEcouteVocale={demarrerEcouteVocaleCarnet}
            onOuvrirModalNouveauClient={() => setShowModalNouveauClient(true)}
            onOuvrirFicheClient={ouvrirFicheClient}
            onOuvrirModalEditClient={ouvrirModalEditClient}
            onOuvrirModalTransaction={ouvrirModalTransaction}
            onRelancerWhatsApp={handleRelancerWhatsApp}
            onChangerStatutClient={handleChangerStatutClient}
            onSupprimerClient={handleSupprimerClient}
          />
        )}

        {clientSelectionne && (
          <CarnetClientDetails
            client={clientSelectionne}
            historique={historique}
            loadingHist={loadingHist}
            isMobile={isMobile}
            onClose={() => setClientSelectionne(null)}
            onEditClient={ouvrirModalEditClient}
            onOpenTransaction={ouvrirModalTransaction}
            onExportRelevePDF={() => handleExportReleveClientPDF(clientSelectionne, historique)}
            onRelanceWhatsApp={handleRelancerWhatsApp}
          />
        )}
      </div>

      <CarnetModalsHost
        boutique={boutique}
        isMobile={isMobile}
        showModalNouveauClient={showModalNouveauClient}
        setShowModalNouveauClient={setShowModalNouveauClient}
        onCreerClient={handleCreerClient}
        showModalEditClient={showModalEditClient}
        setShowModalEditClient={setShowModalEditClient}
        clientAEditer={clientAEditer}
        onEnregistrerEditClient={handleEnregistrerEditClient}
        showModalTransaction={showModalTransaction}
        setShowModalTransaction={setShowModalTransaction}
        clientSelectionne={clientSelectionne}
        clients={clients}
        onSelectClient={(c) => {
          setClientSelectionne(c)
          chargerHistoriqueClient(c.id)
        }}
        typeTransaction={typeTransaction}
        produits={produits}
        onValiderTransaction={handleValiderTransaction}
        demarrerScannerEanCredit={demarrerScannerEanCredit}
        demarrerScannerNomCredit={demarrerScannerNomCredit}
        ocrDetectionsCredit={ocrDetectionsCredit}
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
        showQrModalComptoir={showQrModalComptoir}
        setShowQrModalComptoir={setShowQrModalComptoir}
        showModalImportClients={showModalImportClients}
        setShowModalImportClients={setShowModalImportClients}
        importClientsError={importClientsError}
        importClientsSuccess={importClientsSuccess}
        clientsAImporter={clientsAImporter}
        importingClients={importingClients}
        telechargerModeleClientsCSV={telechargerModeleClientsCSV}
        handleClientFileUpload={handleClientFileUpload}
        validerImportClients={validerImportClients}
      />

      <CarnetQuickActionSheet
        isOpen={showQuickSheet}
        onClose={() => setShowQuickSheet(false)}
        onNouvelleDette={() => ouvrirModalTransaction('vente_credit')}
        onEncaisserRemboursement={() => ouvrirModalTransaction('remboursement')}
        onNouveauClient={() => setShowModalNouveauClient(true)}
        onEcouteVocale={demarrerEcouteVocaleCarnet}
        onRelancerEcheances={handleRelancerEcheancesWrapper}
        onExportCSV={handleExportCSV}
        boutiqueNom={boutique.nom}
      />
    </div>
  )
}
