'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/i18n/context'
import { useSyncOffline } from '@/lib/sync-manager'
import { ajouterDetteHorsLigne } from '@/lib/db-offline'

import type { ClientCredit } from './carnet/types'
import { useCarnetClients } from './carnet/hooks/useCarnetClients'
import { useCarnetExports } from './carnet/hooks/useCarnetExports'
import { useCarnetScanners } from './carnet/hooks/useCarnetScanners'
import { useCarnetVoice } from './carnet/hooks/useCarnetVoice'
import { useCarnetImportBatch } from './carnet/hooks/useCarnetImportBatch'
import { useCarnetNavLifecycle } from './carnet/hooks/useCarnetNavLifecycle'

import CarnetHeaderBar from './carnet/components/CarnetHeaderBar'
import CarnetKpiCards from './carnet/components/CarnetKpiCards'
import CarnetDemandesAchatCredit from './carnet/components/CarnetDemandesAchatCredit'
import CarnetGuidePedagogique from './carnet/components/CarnetGuidePedagogique'
import CarnetVoiceActionCard from './carnet/components/CarnetVoiceActionCard'
import CarnetClientsList from './carnet/components/CarnetClientsList'
import CarnetClientDetails from './components/CarnetClientDetails'
import CarnetModalsHost from './carnet/components/CarnetModalsHost'

interface CarnetDettesProps {
  boutique: {
    id: string
    nom: string
    slug?: string | null
    telephone?: string | null
    whatsapp?: string | null
    currency?: string
  }
  planActif?: string | null
}

export default function CarnetDettes({ boutique, planActif }: CarnetDettesProps) {
  const { t, isRtl } = useTranslation() as { t: any; isRtl: boolean }

  // Sync Offline
  const {
    syncPending: syncingCarnet,
    totalEnAttente: totalOfflineCount,
    declencherSync: declencherSyncCarnet,
    rafraichirCompteur: rafraichirCompteurCarnet,
  } = useSyncOffline(boutique?.id || '', 'commercant')

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
  const [showModalTransaction, setShowModalTransaction] = useState(false)
  const [typeTransaction, setTypeTransaction] = useState<'vente_credit' | 'remboursement'>('vente_credit')
  const [showQrModalComptoir, setShowQrModalComptoir] = useState(false)
  const [showGuideCarnet, setShowGuideCarnet] = useState(false)
  const [relancantEcheances, setRelancantEcheances] = useState(false)

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

  // Ouvrir modals helpers
  const ouvrirModalTransaction = useCallback((type: 'vente_credit' | 'remboursement', client?: ClientCredit) => {
    if (client) {
      setClientSelectionne(client)
      chargerHistoriqueClient(client.id)
    } else if (clientSelectionne) {
      chargerHistoriqueClient(clientSelectionne.id)
    } else if (clients.length > 0) {
      setClientSelectionne(clients[0])
      chargerHistoriqueClient(clients[0].id)
    } else {
      setShowModalNouveauClient(true)
      return
    }
    setTypeTransaction(type)
    setShowModalTransaction(true)
  }, [chargerHistoriqueClient, clientSelectionne, clients])

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

  const creerNouveauClientDepuisVocal = () => {
    setShowModalNouveauClient(true)
  }

  // Validation transaction (en ligne ou hors-ligne IndexedDB)
  const handleValiderTransaction = useCallback(async (params: {
    client: ClientCredit
    type: 'vente_credit' | 'remboursement'
    montant: number
    modePaiement: string
    note: string
    produits: any[]
    dateEcheance: string | null
    relanceAutoWa: boolean
  }) => {
    const txIdempotency = `DEBT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${params.client.id}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotency_key: txIdempotency,
          type: params.type,
          montant: params.montant,
          mode_paiement: params.modePaiement,
          note: params.note,
          produits: params.produits,
          date_echeance: params.dateEcheance,
          relance_auto_whatsapp: params.relanceAutoWa,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setClientSelectionne((prev) => (prev ? { ...prev, solde: data.nouveauSolde } : null))
        await chargerDonnees()
        await chargerHistoriqueClient(params.client.id)
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de l’enregistrement de la transaction.')
      }
    } catch (e) {
      console.warn('[Carnet Dettes] Mode Hors-Ligne:', e)
      try {
        await ajouterDetteHorsLigne({
          id_temporaire: txIdempotency,
          boutique_id: boutique.id,
          user_id: 'commercant',
          client_id: params.client.id,
          type: params.type,
          montant: params.montant,
          mode_paiement: params.modePaiement,
          note: params.note,
          produits: params.produits,
          date_echeance: params.dateEcheance,
          relance_auto_whatsapp: params.relanceAutoWa,
          date: new Date().toISOString(),
        })
        rafraichirCompteurCarnet()
        const delta = params.type === 'vente_credit' ? params.montant : -params.montant
        const optSolde = Number(params.client.solde || 0) + delta
        setClientSelectionne((prev) => (prev ? { ...prev, solde: optSolde } : null))
        setClients((prev) => prev.map((c) => (c.id === params.client.id ? { ...c, solde: optSolde } : c)))
        alert('Hors-Ligne : Opération enregistrée localement sur votre appareil. Elle sera automatiquement synchronisée.')
      } catch (errDb) {
        console.error('Erreur enregistrement local carnet:', errDb)
        alert('Erreur critique de sauvegarde locale.')
      }
    }
  }, [boutique.id, chargerDonnees, chargerHistoriqueClient, rafraichirCompteurCarnet, setClients])

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
        gap: 18,
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
        onCreerNouveauClientVocal={creerNouveauClientDepuisVocal}
      />

      <CarnetGuidePedagogique
        isMobile={isMobile}
      />

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
    </div>
  )
}
