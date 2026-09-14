'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { matcherProduitRecherche, scorePertinenceProduit } from '@/lib/recherche-senegal'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { useTranslation } from '@/i18n/context'
import { usePosShortcuts } from './hooks/usePosShortcuts'
import { useCaisseData } from './hooks/useCaisseData'
import { useCaissePanier } from './hooks/useCaissePanier'
import { usePosPrinting } from './hooks/usePosPrinting'
import { useCaisseCheckout } from './hooks/useCaisseCheckout'
import { usePosModalsState } from './hooks/usePosModalsState'
import { usePosAuthLock } from './hooks/usePosAuthLock'
import { usePosSyncNotifications } from './hooks/usePosSyncNotifications'
import { usePosFinances } from './hooks/usePosFinances'

import PosHeaderBar from './components/PosHeaderBar'
import PosTicketsAttenteBar from './components/PosTicketsAttenteBar'
import PosCatalogueSection from './components/PosCatalogueSection'
import PosCenterDock from './components/PosCenterDock'
import PosPanierSidebar from './components/PosPanierSidebar'
import { PosMobileTabs, PosMobileStickyBottom } from './components/PosMobileNavBars'
import PosLockScreen from './components/PosLockScreen'
import PosModalGestionPins from './components/PosModalGestionPins'
import PosModalsHost from './components/PosModalsHost'
import PosToast from './components/PosToast'
import { usePosWebOrdersAlert } from './hooks/usePosWebOrdersAlert'
import './caisse.css'

export default function CaisseClient({
  planActif: planActifProp,
  initialToken,
  userId: userIdProp,
  initialBoutiqueId,
}: {
  planActif?: string | null
  initialToken?: string | null
  userId?: string | null
  initialBoutiqueId?: string | null
}) {
  const { t, formatPrice } = useTranslation()
  const userId = userIdProp || (typeof window !== 'undefined' ? localStorage.getItem('nopalou_user_id') || 'anonymous' : 'anonymous')
  const isReallyOnline = useOnlineStatus()
  const modals = usePosModalsState()
  const [modalConfigObligatoire, setModalConfigObligatoire] = useState(false)

  // ── Données POS ──
  const {
    boutiques, boutiqueActiveId, activeBoutiqueObj, terminalPlan, loadingProduits,
    produits, setProduits, clientsCredits, setClientsCredits, caissiersList,
    caissierNom, setCaissierNom, caissierSelectionneId, setCaissierSelectionneId,
    roleActif, setRoleActif, session, setSession, historiqueVentes, setHistoriqueVentes,
    changerBoutiqueActive, chargerCaissiersEtSession, chargerClientsCredits,
  } = useCaisseData({
    initialToken, initialBoutiqueId, userId, isReallyOnline,
    onOpenConfigObligatoire: () => setModalConfigObligatoire(true),
  })

  // ── Sync Hors-Ligne & Toast ──
  const {
    offlineModeActive, toastMsg, showToast, syncingOffline,
    ventesHorsLigneCount, dettesHorsLigneCount, totalHorsLigneCount,
    declencherSyncOffline, rafraichirCompteurOffline,
  } = usePosSyncNotifications(boutiqueActiveId, userId, isReallyOnline)

  // ── Panier & Multi-Tickets ──
  const {
    panier, ticketsEnAttente, remisePourcentage, setRemisePourcentage,
    remiseMotif, setRemiseMotif, clientFidelite, setClientFidelite,
    cagnotteDeduite, setCagnotteDeduite, montantRecu, setMontantRecu,
    montantEspecesMixte, setMontantEspecesMixte, encaissementEnCours, setEncaissementEnCours,
    ajouterAuPanier, modifierQuantite, viderPanier, mettrePanierEnAttente,
    reprendreTicketEnAttente, sousTotalPanier, montantRemise, netAPayer,
  } = useCaissePanier({
    boutiqueActiveId, boutiqueActive: activeBoutiqueObj,
    demanderValidationSuperviseur: modals.demanderValidationSuperviseur,
  })

  // ── Lock & PIN ──
  const authLock = usePosAuthLock({
    caissiersList,
    pinSuperviseur: modals.pinSuperviseur,
    session,
    setCaissierNom,
    caissierSelectionneId,
    setCaissierSelectionneId,
    setRoleActif,
    onRequireSessionOpen: () => modals.setModalSessionOuverture(true),
  })

  // ── UI States & Filters ──
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [layoutColCentrale, setLayoutColCentrale] = useState(true)
  const [tabMobile, setTabMobile] = useState<'catalogue' | 'ticket'>('catalogue')
  const [vueCatalogue, setVueCatalogue] = useState<'mosaique' | 'liste'>('mosaique')
  const [recherche, setRecherche] = useState('')
  const [categorieFiltre, setCategorieFiltre] = useState('tous')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Modes Paiement & Carnet ──
  const [modePaiement, setModePaiement] = useState('especes')
  const [secondModeMixte, setSecondModeMixte] = useState('wave')
  const [clientCreditIdPOS, setClientCreditIdPOS] = useState('')
  const [creditDateEcheancePOS, setCreditDateEcheancePOS] = useState('')
  const [creditNotePOS, setCreditNotePOS] = useState('')

  // ── Impression ──
  const { genererImprimerEtiquetteCodeBarre, imprimerTicketThermique } = usePosPrinting({
    boutiqueActive: activeBoutiqueObj,
    formatTicketThermique: '80mm',
    caissierNom,
    setProduits,
  })

  // ── Finances & Taxes ──
  const finances = usePosFinances({
    activeBoutiqueObj,
    clientsCredits,
    clientCreditIdPOS,
    sousTotalPanier,
    netAPayer,
    modePaiement,
    montantRecu,
    montantEspecesMixte,
  })

  // ── Encaissement & Checkout ──
  const { derniereVente, enregistrerDocumentCaisse, encaisserVente } = useCaisseCheckout({
    boutiqueActiveId,
    boutiqueActive: activeBoutiqueObj,
    userId,
    caissierNom,
    caissierSelectionneId,
    session,
    setSession,
    isReallyOnline,
    offlineModeActive,
    rafraichirCompteurOffline,
    panier,
    netAPayer,
    modePaiement,
    montantRecu,
    montantEspecesMixte,
    secondModeMixte,
    resteAPayerMixte: finances.resteAPayerMixte,
    clientCreditIdPOS,
    creditDateEcheancePOS,
    creditNotePOS,
    clientFidelite,
    cagnotteDeduite,
    remisePourcentage,
    encaissementEnCours,
    setEncaissementEnCours,
    viderPanier,
    setModalSessionOuverture: modals.setModalSessionOuverture,
    setClientsCredits,
    chargerClientsCredits,
    setHistoriqueVentes,
    imprimerTicketThermique,
  })

  // ── Raccourcis Clavier POS ──
  usePosShortcuts({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onTriggerCheckout: () => {
      setTabMobile('ticket')
      if (panier.length > 0) encaisserVente()
    },
    onHoldTicket: mettrePanierEnAttente,
    onClearCartOrDismiss: () => {
      if (panier.length > 0) viderPanier()
    },
    enabled: !authLock.verrouille && !modals.modalSuperviseur && !modals.modalConfigPin,
  })

  // ── Mode Plein Écran POS (Masquer le layout global du site) ──
  useEffect(() => {
    document.body.classList.add('in-caisse-pos')
    return () => {
      document.body.classList.remove('in-caisse-pos')
    }
  }, [])

  // ── Écoute temps réel des nouvelles commandes Web (Carillon WebAudio + Notification) ──
  usePosWebOrdersAlert({
    boutiqueActiveId,
    isReallyOnline,
    initialToken,
    showToast,
    formatPrice,
  })

  // ── Filtrage Catalogue Produits ──
  const produitsFiltres = useMemo(() => {
    let result = produits.filter((p) => {
      const matchCat = categorieFiltre === 'tous' || p.categorie === categorieFiltre
      const matchSearch = !recherche || matcherProduitRecherche(p, recherche)
      return matchCat && matchSearch
    })
    if (recherche && recherche.trim()) {
      result.sort((a, b) => scorePertinenceProduit(b, recherche) - scorePertinenceProduit(a, recherche))
    }
    return result
  }, [produits, categorieFiltre, recherche])

  const totalArticlesPanier = useMemo(
    () => panier.reduce((sum, item) => sum + item.quantite, 0),
    [panier]
  )

  // ── Écran Verrouillé ──
  if (authLock.verrouille) {
    return (
      <PosLockScreen
        boutiques={boutiques}
        boutiqueActiveId={boutiqueActiveId}
        activeBoutiqueObj={activeBoutiqueObj}
        initialToken={initialToken}
        caissiersList={caissiersList}
        authLock={authLock}
        caissierSelectionneId={caissierSelectionneId}
        setCaissierSelectionneId={setCaissierSelectionneId}
        onOpenConfigPin={() => modals.setModalConfigPin(true)}
        onSeDeconnecterCompte={() => (window.location.href = '/')}
        modalesGestionPin={
          <PosModalGestionPins
            isOpen={modalConfigObligatoire}
            isObligatoire={true}
            boutiqueId={boutiqueActiveId}
            caissiersList={caissiersList}
            onClose={() => setModalConfigObligatoire(false)}
            onSuccess={() => chargerCaissiersEtSession(boutiqueActiveId)}
            onRefreshCaissiers={() => chargerCaissiersEtSession(boutiqueActiveId)}
          />
        }
      />
    )
  }

  return (
    <div
      className={`caisse-root ${isDarkMode ? 'pos-theme-dark' : 'pos-theme-light'}`}
      style={{
        background: 'var(--pos-bg)',
        color: 'var(--pos-text)',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PosToast toastMsg={toastMsg} />

      <PosHeaderBar
        initialToken={initialToken}
        boutiqueActiveId={boutiqueActiveId}
        boutiques={boutiques}
        activeBoutiqueObj={activeBoutiqueObj}
        roleActif={roleActif}
        caissierNom={caissierNom}
        session={session}
        offlineModeActive={offlineModeActive}
        ventesHorsLigneCount={ventesHorsLigneCount}
        dettesHorsLigneCount={dettesHorsLigneCount}
        totalHorsLigneCount={totalHorsLigneCount}
        syncingOffline={syncingOffline}
        isDarkMode={isDarkMode}
        layoutColCentrale={layoutColCentrale}
        clientsCreditsCount={clientsCredits.length}
        historiqueVentesCount={historiqueVentes.length}
        t={t as any}
        modals={modals}
        onQuitterVersDashboard={() => (window.location.href = `/boutique?manage=${boutiqueActiveId}`)}
        onDeclencherSyncOffline={declencherSyncOffline}
        onDemanderChangementBoutique={changerBoutiqueActive}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        onToggleLayoutColCentrale={() => setLayoutColCentrale((prev) => !prev)}
        onVerrouillerCaisseManuellement={() => authLock.setVerrouille(true)}
        onSeDeconnecterCompte={() => (window.location.href = '/')}
      />

      <PosTicketsAttenteBar tickets={ticketsEnAttente} onReprendre={reprendreTicketEnAttente} />

      {/* ── Navigation Onglets Mobile (Catalogue / Ticket) ── */}
      <PosMobileTabs
        tabMobile={tabMobile}
        setTabMobile={setTabMobile}
        produitsFiltresCount={produitsFiltres.length}
        totalArticlesPanier={totalArticlesPanier}
        netAPayer={netAPayer}
        formatPrice={formatPrice}
      />

      <div className={`caisse-main-layout ${layoutColCentrale ? 'has-3-cols' : 'has-2-cols'}`}>
        <PosCatalogueSection
          tabMobile={tabMobile}
          searchInputRef={searchInputRef as any}
          recherche={recherche}
          setRecherche={setRecherche}
          t={t as any}
          demarrerScannerCamera={() => modals.setModalScannerCamera(true)}
          setModalPairageSmartphone={modals.setModalPairageSmartphone}
          produits={produits}
          produitsFiltres={produitsFiltres}
          panier={panier}
          ajouterAuPanier={ajouterAuPanier}
          vueCatalogue={vueCatalogue}
          setVueCatalogue={setVueCatalogue}
          categorieFiltre={categorieFiltre}
          setCategorieFiltre={setCategorieFiltre}
          loadingProduits={loadingProduits}
          roleActif={roleActif}
          setModalImportBatch={modals.setModalImportBatch}
          genererImprimerEtiquetteCodeBarre={genererImprimerEtiquetteCodeBarre}
        />

        {layoutColCentrale && (
          <PosCenterDock
            layoutColCentrale={layoutColCentrale}
            onSearchOrAddBarcode={(code: string) => {
              const p = produits.find((x) => x.code_barre === code || x.id === code)
              if (p) ajouterAuPanier(p)
              else showToast(`Code "${code}" inconnu`, 'warning')
            }}
            ouvrirModalRemise={() => modals.setModalRemise(true)}
            remisePourcentage={remisePourcentage}
            setModalFidelite={modals.setModalFidelite}
            clientFidelite={clientFidelite}
            mettrePanierEnAttente={mettrePanierEnAttente}
            panierLength={panier.length}
            setModalCarnet={modals.setModalCarnet}
          />
        )}

        <PosPanierSidebar
          tabMobile={tabMobile}
          onBackToCatalogue={() => setTabMobile('catalogue')}
          panier={panier}
          session={session}
          produitsFiltresCount={produitsFiltres.length}
          onMettreEnAttente={mettrePanierEnAttente}
          onViderPanier={viderPanier}
          onOuvrirSession={() => modals.setModalSessionOuverture(true)}
          onModifierQuantite={modifierQuantite}
          onOuvrirRemise={() => modals.setModalRemise(true)}
          remisePourcentage={remisePourcentage}
          montantRemise={montantRemise}
          clientFidelite={clientFidelite}
          cagnotteDeduite={cagnotteDeduite}
          onOuvrirFidelite={() => modals.setModalFidelite(true)}
          modePaiement={modePaiement}
          onSelectModePaiement={setModePaiement}
          montantRecu={montantRecu}
          onSetMontantRecu={setMontantRecu}
          montantEspecesMixte={montantEspecesMixte}
          onSetMontantEspecesMixte={setMontantEspecesMixte}
          secondModeMixte={secondModeMixte}
          onSetSecondModeMixte={setSecondModeMixte}
          clientCreditIdPOS={clientCreditIdPOS}
          onSetClientCreditIdPOS={setClientCreditIdPOS}
          clientsCredits={clientsCredits}
          creditDateEcheancePOS={creditDateEcheancePOS}
          onSetCreditDateEcheancePOS={setCreditDateEcheancePOS}
          creditNotePOS={creditNotePOS}
          onSetCreditNotePOS={setCreditNotePOS}
          finances={finances}
          netAPayer={netAPayer}
          totalPanier={sousTotalPanier}
          encaissementEnCours={encaissementEnCours}
          onEnregistrerDocument={enregistrerDocumentCaisse}
          onEncaisser={encaisserVente}
          t={t as any}
        />
      </div>

      {/* ── Barre Flottante Ticket Sticky Mobile (quand catalogue actif et panier > 0) ── */}
      <PosMobileStickyBottom
        tabMobile={tabMobile}
        setTabMobile={setTabMobile}
        totalArticlesPanier={totalArticlesPanier}
        netAPayer={netAPayer}
        formatPrice={formatPrice}
      />

      <PosModalsHost
        session={session}
        setSession={setSession}
        caissierNom={caissierNom}
        setCaissierNom={setCaissierNom}
        roleActif={roleActif}
        setRoleActif={setRoleActif}
        caissiersList={caissiersList}
        setCaissierSelectionneId={setCaissierSelectionneId}
        setVerrouille={authLock.setVerrouille}
        initialToken={initialToken}
        boutiqueActiveId={boutiqueActiveId}
        activeBoutiqueObj={activeBoutiqueObj}
        boutiques={boutiques}
        planActifProp={planActifProp}
        terminalPlan={terminalPlan}
        regimeFiscal={finances.regimeFiscal}
        estExonereClient={finances.estExonereClient}
        panier={panier}
        sousTotalPanier={sousTotalPanier}
        netAPayer={netAPayer}
        remisePourcentage={remisePourcentage}
        setRemisePourcentage={setRemisePourcentage}
        remiseMotif={remiseMotif}
        setRemiseMotif={setRemiseMotif}
        clientFidelite={clientFidelite}
        setClientFidelite={setClientFidelite}
        cagnotteDeduite={cagnotteDeduite}
        setCagnotteDeduite={setCagnotteDeduite}
        produits={produits}
        historiqueVentes={historiqueVentes}
        derniereVente={derniereVente}
        formatPrice={formatPrice}
        showToast={showToast}
        imprimerTicketThermique={imprimerTicketThermique}
        chargerCaissiersEtSession={chargerCaissiersEtSession}
        modals={modals}
      />
    </div>
  )
}
