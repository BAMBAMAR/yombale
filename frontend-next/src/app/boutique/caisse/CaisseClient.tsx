'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { matcherProduitRecherche, scorePertinenceProduit } from '@/lib/recherche-senegal'
import CarnetDettes from '../CarnetDettes'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import { exportToCSV, printPDFReport } from '@/lib/export'
import BatchImportModal from '@/app/boutique/BatchImportModal'
import { CATEGORIES } from '@/lib/categories'
import { getBoutiqueProduits, getBoutiquesMine, getPosHistorique, creerPosVente, declarerIncident, creerBoutiqueDocument } from '../actions'
import { Settings, Download, History, Book, Unlock, Lock, ShieldAlert, User, Shield, Search, ArrowLeft, Store, Camera, MessageCircle, Printer, AlignJustify, LayoutGrid, BarChart3, Sun, Moon, Columns3, ChevronDown, LogOut, KeyRound, Banknote } from 'lucide-react'
import {
  sauvegarderProduitsLocaux,
  obtenirProduitsLocaux,
  sauvegarderClientsLocaux,
  obtenirClientsLocaux,
  ajouterVenteHorsLigne,
  ajouterDetteHorsLigne,
} from '@/lib/db-offline'
import { useSyncOffline } from '@/lib/sync-manager'
import { useTranslation } from '@/i18n/context'
import { CONFIG_SCANNER_EAN_PRO, jouerBipEtVibrer, toggleTorcheCamera } from '@/lib/scanner-helper'
import PosFastTender from './components/PosFastTender'
import PosNumpad from './components/PosNumpad'
import PosRemiseModal from './components/PosRemiseModal'
import PosBlindCloseModal from './components/PosBlindCloseModal'
import PosFideliteModal, { ClientFidelite } from './components/PosFideliteModal'
import PosSessionModal from './components/PosSessionModal'
import PosScannerModal from './components/PosScannerModal'
import PosHistoriqueModal from './components/PosHistoriqueModal'
import PosVoiceInput from './components/PosVoiceInput'
import { usePosShortcuts } from './hooks/usePosShortcuts'
import PosChangerCaissierModal, { CaissierItem } from './components/PosChangerCaissierModal'
import PosPairageModal from './components/PosPairageModal'
import PosTicketsAttenteBar from './components/PosTicketsAttenteBar'
import PosModalGestionPins from './components/PosModalGestionPins'
import PosSuperviseurPinModal from './components/PosSuperviseurPinModal'
import PosTiroirCaisseModal from './components/PosTiroirCaisseModal'
import PosPanierSidebar from './components/PosPanierSidebar'
import PosNonAutoriseScreen from './components/PosNonAutoriseScreen'
import PosBilanRapportXModal from './components/PosBilanRapportXModal'
import PosTransactionCarnetModal from './components/PosTransactionCarnetModal'
import PosEditClientCarnetModal from './components/PosEditClientCarnetModal'
import PosTicketPrintView from './components/PosTicketPrintView'
import PosHeaderBar from './components/PosHeaderBar'
import './caisse.css'

interface ProduitCaisse {
  id: string
  nom: string
  prix: number
  code_barre?: string
  photo?: string
  categorie?: string
  stock: number
}

interface LignePanier {
  produit: ProduitCaisse
  quantite: number
  prixUnitaire: number
}

interface SessionCaisse {
  id: string
  dateOuverture: string
  fondDeCaisse: number
  caissierNom: string
  statut: 'ouverte' | 'fermee'
  ventes: {
    total: number
    especes: number
    wave: number
    orangeMoney: number
    carte: number
    mixte: number
    nbVentes: number
  }
}

interface VenteHistorique {
  id: string
  date: string
  heure: string
  caissier: string
  modePaiement: string
  total: number
  statut: 'validee' | 'annulee'
  motifAnnulation?: string
  detailPaiementMixte?: { especes: number; autreMode: string; autreMontant: number }
  ticket: LignePanier[]
}

interface TicketEnAttente {
  id: string
  clientLabel: string
  heure: string
  panier: LignePanier[]
}

export default function CaisseClient({ planActif: planActifProp, initialToken, userId: userIdProp, initialBoutiqueId }: { planActif?: string | null; initialToken?: string | null; userId?: string | null; initialBoutiqueId?: string | null }) {
  const { t, isRtl, formatPrice, formatNumber } = useTranslation()
  // Récupère le userId depuis la prop serveur, avec fallback sur localStorage pour mode terminal
  const userId = userIdProp || (typeof window !== 'undefined' ? localStorage.getItem('nopalou_user_id') || 'anonymous' : 'anonymous')
  // Hook de connectivité fiable (ping /api/ping au lieu de navigator.onLine)
  const isReallyOnline = useOnlineStatus()
  const [terminalPlan, setTerminalPlan] = useState<string | null>('pro')

  // ── État Boutiques du Marchand & Synchronisation Catalogue ───────────────────
  const [boutiques, setBoutiques] = useState<{
    id: string;
    nom: string;
    plan_actif?: string | null;
    is_trial?: boolean;
    regime_fiscal?: string;
    prix_tva_incluse?: boolean;
    timbre_fiscal_applicable?: boolean;
    tva_taux_defaut?: number;
    actif?: boolean;
    adresse?: string | null;
    telephone?: string | null;
    message_bas_ticket?: string | null;
    logo?: string | null;
    pos_remise_max_caissier?: number;
    pos_remise_seuil_auto_montant?: number;
    pos_remise_seuil_auto_pct?: number;
    pos_remise_motifs?: Array<{ id: string; nom: string; pct: number }>;
  }[]>([])
  const [boutiqueActiveId, setBoutiqueActiveId] = useState<string>('')
  const [loadingProduits, setLoadingProduits] = useState<boolean>(true)
  const [modalImportBatch, setModalImportBatch] = useState<boolean>(false)

  // ── État Rôles & Authentification PIN Sécurisée ──────────────────────────────
  const [verrouille, setVerrouille] = useState<boolean>(true)
  const [codePinSaisi, setCodePinSaisi] = useState<string>('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [encaissementEnCours, setEncaissementEnCours] = useState<boolean>(false)

  // --- ÉTAT OFFLINE & SYNC (géré par useSyncOffline centralisé) ---
  const [offlineModeActive, setOfflineModeActive] = useState<boolean>(false)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warning' } | null>(null)

  // Hook centralisé : verrou par boutique, retry backoff, ACK avant suppression (Ventes + Dettes)
  const {
    syncPending: syncingOffline,
    ventesEnAttente: ventesHorsLigneCount,
    dettesEnAttente: dettesHorsLigneCount,
    totalEnAttente: totalHorsLigneCount,
    declencherSync: declencherSyncOffline,
    rafraichirCompteur: rafraichirCompteurOffline,
  } = useSyncOffline(boutiqueActiveId, userId || 'anonymous')

  function showToast(text: string, type: 'success' | 'warning' = 'success') {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 4000)
  }

  // ── Vérification dynamique de l'autorisation POS selon la boutique sélectionnée ──
  const activeBoutiqueObj = boutiques.find(b => b.id === boutiqueActiveId)
  const activePlan = (activeBoutiqueObj?.plan_actif !== undefined && activeBoutiqueObj?.plan_actif !== null)
    ? activeBoutiqueObj.plan_actif
    : (initialToken ? (terminalPlan || 'pro') : planActifProp)

  // La Caisse POS est accessible à toutes les boutiques du commerçant
  const estBoutiqueAutorisee = true

  // Synchroniser l'état offline avec le hook de connectivité réelle (ping /api/ping)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const newOffline = !isReallyOnline
    setOfflineModeActive(prev => {
      if (prev !== newOffline) {
        if (newOffline) {
          console.warn('[Diagnostic Caisse] Mode caisse locale ACTIVÉ (ping échoué).')
          showToast('Vous êtes hors-ligne. Mode caisse locale activé.', 'warning')
        } else {
          showToast('Connexion internet rétablie ! Synchronisation en cours...', 'success')
          // Déclencher la sync via le SyncManager centralisé (avec verrou + retry + ACK)
          declencherSyncOffline().then((result) => {
            if (result.synced > 0) {
              showToast(`${result.synced} vente(s) synchronisée(s)`, 'success')
              getPosHistorique(boutiqueActiveId).then((hist) => {
                if (hist && hist.length > 0) setHistoriqueVentes(hist)
              }).catch(() => {})
            }
            if (result.failed > 0) {
              showToast(`${result.failed} vente(s) non synchronisée(s). Réessai automatique.`, 'warning')
            }
          }).catch(() => {})
        }
      }
      return newOffline
    })
  }, [isReallyOnline, boutiqueActiveId])
  
  // Rôle Actif de la Session ('caissier' ou 'superviseur')
  const [roleActif, setRoleActif] = useState<'caissier' | 'superviseur'>('caissier')

  // Codes PIN secrets & Configuration Obligatoire
  const [pinCaissier, setPinCaissier] = useState<string>('1234')
  const [pinSuperviseur, setPinSuperviseur] = useState<string>('9999')
  const [modalConfigPin, setModalConfigPin] = useState<boolean>(false)
  const [modalConfigObligatoire, setModalConfigObligatoire] = useState<boolean>(false)
  const [pinObligatoireSuperviseur, setPinObligatoireSuperviseur] = useState<string>('')
  const [pinObligatoireCaissier, setPinObligatoireCaissier] = useState<string>('')
  const [erreurConfigObligatoire, setErreurConfigObligatoire] = useState<string | null>(null)
  const [savingConfigObligatoire, setSavingConfigObligatoire] = useState<boolean>(false)

  // Gestion Équipe & Modification PINs Avancée
  const [ongletConfigPin, setOngletConfigPin] = useState<'liste' | 'ajouter'>('liste')
  const [editPinsState, setEditPinsState] = useState<{ [caissierId: string]: string }>({})
  const [showPinState, setShowPinState] = useState<{ [caissierId: string]: boolean }>({})
  const [savingPinId, setSavingPinId] = useState<string | null>(null)
  const [nouveauCaissierNom, setNouveauCaissierNom] = useState<string>('')
  const [nouveauCaissierPrenom, setNouveauCaissierPrenom] = useState<string>('')
  const [nouveauCaissierRole, setNouveauCaissierRole] = useState<'caissier' | 'superviseur'>('caissier')
  const [nouveauCaissierPin, setNouveauCaissierPin] = useState<string>('')
  const [addingCaissierState, setAddingCaissierState] = useState<boolean>(false)

  // Formulaire de modification des PINs (Masqué type=password)
  const [ancienPinSuperviseur, setAncienPinSuperviseur] = useState<string>('')
  const [nouveauPinCaissier, setNouveauPinCaissier] = useState<string>('')
  const [nouveauPinSuperviseur, setNouveauPinSuperviseur] = useState<string>('')
  const [msgConfigPin, setMsgConfigPin] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── État Session & Caissier ──────────────────────────────────────────────────
  const [caissierNom, setCaissierNom] = useState<string>('Caissier 1 (Bamba)')
  const [session, setSession] = useState<SessionCaisse | null>(null)
  const [caissiersList, setCaissiersList] = useState<any[]>([])
  const [caissierSelectionneId, setCaissierSelectionneId] = useState<string>('')
  const [profilChoisiPourPin, setProfilChoisiPourPin] = useState<any | null>(null)
  const [conflitSessionMessage, setConflitSessionMessage] = useState<string | null>(null)
  const [menuOutilsOuvert, setMenuOutilsOuvert] = useState<boolean>(false)
  const [modalChangerCaissier, setModalChangerCaissier] = useState<boolean>(false)
  const [modalSessionOuverture, setModalSessionOuverture] = useState<boolean>(false)
  const [modalClotureZ, setModalClotureZ] = useState<boolean>(false)
  const [modalTiroirCaisse, setModalTiroirCaisse] = useState<boolean>(false)
  const [modalBilanSession, setModalBilanSession] = useState<boolean>(false)
  const [modalHistorique, setModalHistorique] = useState<boolean>(false)
  const [fondDeCaisseSaisi, setFondDeCaisseSaisi] = useState<string>('50000')
  const [especesComptees, setEspecesComptees] = useState<string>('')

  // ── Multi-Tickets (File d'attente 1, 2, 3 clients simultanés) ───────────────
  const [ticketsEnAttente, setTicketsEnAttente] = useState<TicketEnAttente[]>([])

  // ── Validation Superviseur Modal ───────────────────────────────────────────
  const [modalSuperviseur, setModalSuperviseur] = useState<boolean>(false)
  const [pinSuperviseurSaisi, setPinSuperviseurSaisi] = useState<string>('')
  const [superviseurAction, setSuperviseurAction] = useState<(() => void) | null>(null)
  const [superviseurTitre, setSuperviseurTitre] = useState<string>('')
  const [superviseurError, setSuperviseurError] = useState<string | null>(null)

  // ── État Catalogue & Panier & Paiement Mixte & Navigation Mobile ─────────────
  const [tabMobile, setTabMobile] = useState<'catalogue' | 'ticket'>('catalogue')
  const [vueCatalogue, setVueCatalogue] = useState<'mosaique' | 'liste'>('mosaique')
  const [recherche, setRecherche] = useState<string>('')
  const [categorieFiltre, setCategorieFiltre] = useState<string>('tous')
  const [panier, setPanier] = useState<LignePanier[]>([])
  const [remisePourcentage, setRemisePourcentage] = useState<number>(0)
  const [remiseMotif, setRemiseMotif] = useState<string>('')
  const [modalRemise, setModalRemise] = useState<boolean>(false)
  const [showNumpad, setShowNumpad] = useState<boolean>(false)
  const [modalFidelite, setModalFidelite] = useState<boolean>(false)
  const [clientFidelite, setClientFidelite] = useState<ClientFidelite | null>(null)
  const [cagnotteDeduite, setCagnotteDeduite] = useState<number>(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Persistance Locale & Anti-Perte Panier Caisse POS ─────────────────────────
  const cartLoadedRef = useRef<string | null>(null)

  // 1. Restauration automatique du panier sauvegardé à l'ouverture de la boutique
  useEffect(() => {
    if (!boutiqueActiveId || typeof window === 'undefined') return
    if (cartLoadedRef.current === boutiqueActiveId) return
    cartLoadedRef.current = boutiqueActiveId
    try {
      const saved = localStorage.getItem(`nopalou_pos_cart_${boutiqueActiveId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPanier(parsed)
          console.log(`[POS CAISSE] Panier en cours restauré automatiquement (${parsed.length} articles)`)
        }
      }
    } catch (e) {
      console.warn('[POS CAISSE] Erreur restauration panier local:', e)
    }
  }, [boutiqueActiveId])

  // 2. Synchronisation temps réel du panier dans localStorage
  useEffect(() => {
    if (!boutiqueActiveId || typeof window === 'undefined') return
    // Ne synchroniser que si le panier initial pour cette boutique a déjà été chargé
    if (cartLoadedRef.current !== boutiqueActiveId) return
    try {
      if (panier.length > 0) {
        localStorage.setItem(`nopalou_pos_cart_${boutiqueActiveId}`, JSON.stringify(panier))
      } else {
        localStorage.removeItem(`nopalou_pos_cart_${boutiqueActiveId}`)
      }
    } catch (e) { console.warn('[Nopalou:CaisseClient:L293]', e); }
  }, [panier, boutiqueActiveId])

  // 3. Avertissement si l'utilisateur tente de quitter l'onglet alors qu'une vente est en cours
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (panier.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [panier])

  // ── Mode Nuit & Disposition 3 Colonnes ────────────────────────────────────────
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [layoutColCentrale, setLayoutColCentrale] = useState<boolean>(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('nopalou_pos_theme')
      if (savedTheme === 'dark') {
        setIsDarkMode(true)
      }
      const savedLayout = localStorage.getItem('nopalou_pos_3col')
      if (savedLayout === 'false') {
        setLayoutColCentrale(false)
      }
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('nopalou_pos_theme', next ? 'dark' : 'light')
      }
      return next
    })
  }

  const toggleLayoutColCentrale = () => {
    setLayoutColCentrale(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('nopalou_pos_3col', next ? 'true' : 'false')
      }
      return next
    })
  }

  const [modePaiement, setModePaiement] = useState<'especes' | 'wave' | 'orange_money' | 'carte' | 'credit_client' | 'mixte'>('especes')
  const [montantRecu, setMontantRecu] = useState<string>('')
  const [montantEspecesMixte, setMontantEspecesMixte] = useState<string>('')
  const [secondModeMixte, setSecondModeMixte] = useState<'wave' | 'orange_money' | 'carte'>('wave')

  const [derniereVente, setDerniereVente] = useState<{
    id: string
    date: string
    heure: string
    total: number
    remise: number
    recu: number
    monnaie: number
    ticket: LignePanier[]
    mode: string
    caissier: string
    detailMixte?: { especes: number; autreMode: string; autreMontant: number }
  } | null>(null)
  
  // Toggle de la classe pos-active sur le document.body pour masquer entièrement l'en-tête global du site
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('pos-active')
      return () => {
        document.body.classList.remove('pos-active')
      }
    }
  }, [])

  // ── Carnet de Crédit & Dettes Clients Avancé ─────────────────────────────────
  const [clientsCredits, setClientsCredits] = useState<{ id: string; nom: string; prenom?: string; telephone: string; adresse?: string | null; solde: number; plafond_max: number; note_client?: string | null; created_at?: string; exonere_tva?: boolean }[]>([])
  const [modalCarnet, setModalCarnet] = useState<boolean>(false)
  const [rechercheClientCarnet, setRechercheClientCarnet] = useState<string>('')
  
  // Nouveau client form
  const [nouveauClientNom, setNouveauClientNom] = useState<string>('')
  const [nouveauClientTel, setNouveauClientTel] = useState<string>('')
  const [nouveauClientAdresse, setNouveauClientAdresse] = useState<string>('')
  const [nouveauClientPlafond, setNouveauClientPlafond] = useState<string>('200000')
  const [nouveauClientNote, setNouveauClientNote] = useState<string>('')
  const [afficherFormNouveauClient, setAfficherFormNouveauClient] = useState<boolean>(false)

  // Client sélectionné & historique détaillé
  const [clientCarnetSelectionne, setClientCarnetSelectionne] = useState<any | null>(null)
  const [historiqueClientSelectionne, setHistoriqueClientSelectionne] = useState<any[]>([])
  const [loadingHistoriqueClient, setLoadingHistoriqueClient] = useState<boolean>(false)

  // Transaction manuelle dans le carnet (Remboursement / Crédit direct)
  const [modalTransCarnet, setModalTransCarnet] = useState<boolean>(false)
  const [typeTransCarnet, setTypeTransCarnet] = useState<'remboursement' | 'vente_credit' | 'depot_avance'>('remboursement')
  const [montantTransCarnet, setMontantTransCarnet] = useState<string>('')
  const [modePaiementTransCarnet, setModePaiementTransCarnet] = useState<string>('especes')
  const [noteTransCarnet, setNoteTransCarnet] = useState<string>('')
  const [dateEcheanceTransCarnet, setDateEcheanceTransCarnet] = useState<string>('')
  const [produitsTransCarnet, setProduitsTransCarnet] = useState<string>('')
  const [modeSaisieCarnet, setModeSaisieCarnet] = useState<'catalogue' | 'manuel'>('catalogue')
  const [panierCarnet, setPanierCarnet] = useState<Record<string, number>>({})
  const [rechercheProdCarnet, setRechercheProdCarnet] = useState<string>('')
  const [relanceAutoWaCarnet, setRelanceAutoWaCarnet] = useState<boolean>(true)
  const [submittingCarnetTrans, setSubmittingCarnetTrans] = useState<boolean>(false)

  // Édition Profil Client dans le Carnet POS (déléguée au composant dédié)
  const [modalEditClientCarnet, setModalEditClientCarnet] = useState<boolean>(false)
  const [clientCarnetAEditer, setClientCarnetAEditer] = useState<any>(null)

  const ouvrirModalEditClientCarnet = (c: any) => {
    setClientCarnetAEditer(c)
    setModalEditClientCarnet(true)
  }

  const ouvrirModalTransCarnet = (type: 'vente_credit' | 'remboursement') => {
    setTypeTransCarnet(type)
    setMontantTransCarnet('')
    setNoteTransCarnet('')
    setDateEcheanceTransCarnet('')
    setProduitsTransCarnet('')
    setPanierCarnet({})
    setRechercheProdCarnet('')
    setRelanceAutoWaCarnet(true)
    setModeSaisieCarnet(type === 'vente_credit' ? 'catalogue' : 'manuel')
    setModalTransCarnet(true)
  }

  // Saisie Crédit lors de l'encaissement POS
  const [clientCreditIdPOS, setClientCreditIdPOS] = useState<string>('')
  const [creditDateEcheancePOS, setCreditDateEcheancePOS] = useState<string>('')
  const [creditNotePOS, setCreditNotePOS] = useState<string>('')

  // ── Scanner Caméra Smartphone & Format Ticket Thermique ESC/POS ─────────────
  const [modalScannerCamera, setModalScannerCamera] = useState<boolean>(false)
  const [modalPairageSmartphone, setModalPairageSmartphone] = useState<boolean>(false)
  const [sessionScannerId] = useState<string>(() => `SCAN-${Math.floor(100000 + Math.random() * 900000)}`)
  const [scannerCameraStatus, setScannerCameraStatus] = useState<string>('Prêt pour le scan continu...')
  const [formatTicketThermique, setFormatTicketThermique] = useState<'80mm' | '58mm'>('80mm')
  const [scannerTorcheActive, setScannerTorcheActive] = useState<boolean>(false)
  const [scannerDernierItem, setScannerDernierItem] = useState<{ nom: string; prix: number } | null>(null)
  const [scannerFlashActif, setScannerFlashActif] = useState<boolean>(false)
  const dernierCodeScanneRef = useRef<string>('')
  const dernierTempsScanRef = useRef<number>(0)
  const html5QrcodeScannerRef = useRef<any>(null)

  // Polling automatique de la douchette smartphone distante sur PC Caisse
  useEffect(() => {
    if (!boutiqueActiveId || !sessionScannerId) return
    const timer = setInterval(async () => {
      if (typeof window !== 'undefined' && !isReallyOnline) return
      try {
        const res = await fetch(`/api/boutiques/${boutiqueActiveId}/scanner-remote?sessionId=${sessionScannerId}`).catch(() => null)
        if (res && res.ok) {
          const data = await res.json().catch(() => null)
          if (data && data.codes && Array.isArray(data.codes) && data.codes.length > 0) {
            data.codes.forEach((code: string) => {
              traiterCodeBarreCamera(code)
            })
          }
        }
      } catch (e) { console.warn('[Nopalou:CaisseClient:L472]', e); }
    }, 1200)
    return () => clearInterval(timer)
  }, [boutiqueActiveId, sessionScannerId])

  async function envoyerRelanceWhatsApp(c: any) {
    if (!c || !boutiqueActiveId) return
    try {
      const res = await fetch(`/api/boutiques/${boutiqueActiveId}/credits-clients/${c.id}/relance-whatsapp`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.lienWhatsapp) {
          window.open(data.lienWhatsapp, '_blank')
        } else {
          alert('Relance WhatsApp envoyée !')
        }
        await chargerClientsCredits(boutiqueActiveId)
      } else {
        const numClean = (c.telephone || '').replace(/\D/g, '')
        const phone = numClean.startsWith('221') ? numClean : `221${numClean}`
        const bqNom = boutiques.find(b => b.id === boutiqueActiveId)?.nom || 'Notre Boutique'
        const soldeText = c.solde > 0 ? `votre solde de dette est de ${fcfa(c.solde)}` : `votre solde d'avance est de ${fcfa(Math.abs(c.solde))}`
        const message = `Bonjour ${c.nom}, concernant votre carnet de crédit chez ${bqNom} : ${soldeText}. Merci de nous contacter pour le règlement !`
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
      }
    } catch (e) {
      console.error('Erreur relance whatsapp:', e)
    }
  }

  async function demarrerScannerCamera() {
    setModalScannerCamera(true)
    setScannerCameraStatus('Mode Rafale Continu actif. Présentez les articles…')
    setScannerDernierItem(null)
    setScannerTorcheActive(false)
    dernierCodeScanneRef.current = ''
    dernierTempsScanRef.current = 0

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')

        if (html5QrcodeScannerRef.current) {
          try {
            await html5QrcodeScannerRef.current.stop()
            html5QrcodeScannerRef.current.clear()
          } catch (e) { console.warn('[Nopalou:CaisseClient:L520]', e); }
          html5QrcodeScannerRef.current = null
        }

        const scannerContainer = document.getElementById('nopalou-reader-scanner')
        if (!scannerContainer) return

        const scanner = new Html5Qrcode('nopalou-reader-scanner')
        html5QrcodeScannerRef.current = scanner

        const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })

        const onScanSuccess = (decodedText: string) => {
          traiterCodeBarreCamera(decodedText)
        }

        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
        } catch (errEnv) {
          try {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {})
          } catch (errUser: any) {
            console.error('Erreur lancement caméra:', errUser)
            setScannerCameraStatus('Impossible d’accéder à la caméra. Vérifiez les permissions de votre navigateur.')
          }
        }
      } catch (err: any) {
        console.error('Erreur module scanner:', err)
        setScannerCameraStatus('Impossible d’initialiser le scanner.')
      }
    }, 250)
  }

  async function arreterScannerCamera() {
    if (html5QrcodeScannerRef.current) {
      try {
        await html5QrcodeScannerRef.current.stop()
        html5QrcodeScannerRef.current.clear()
      } catch (e) { console.warn('[Nopalou:CaisseClient:L558]', e); }
      html5QrcodeScannerRef.current = null
    }
    setModalScannerCamera(false)
    setScannerTorcheActive(false)
  }

  const [btDeviceName, setBtDeviceName] = useState<string | null>(null)
  const [btCharacteristic, setBtCharacteristic] = useState<any>(null)

  async function connecterImprimanteBluetooth() {
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      alert("L'API WebBluetooth Direct est supportée sur Chrome et Edge (Android et PC Windows). Pour les imprimantes système, le mode Web/USB standard reste actif.")
      return
    }
    try {
      const device: any = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '00001101-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455'
        ]
      })

      const server = await device.gatt.connect()
      const services = await server.getPrimaryServices()
      let characteristic = null

      for (const service of services) {
        const characteristics = await service.getCharacteristics()
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            characteristic = c
            break
          }
        }
        if (characteristic) break
      }

      if (!characteristic) {
        alert("Imprimante Bluetooth détectée mais canal d'écriture binaire ESC/POS non trouvé.")
        return
      }

      setBtDeviceName(device.name || 'Imprimante POS Bluetooth')
      setBtCharacteristic(characteristic)
      alert(`Imprimante Bluetooth "${device.name || 'POS'}" connectée avec succès ! Les tickets s'imprimeront en 1-clic direct.`)
    } catch (err: any) {
      console.error('[BLUETOOTH PRINT ERR]', err)
      if (err.name !== 'NotFoundError') {
        alert(`Information Bluetooth : ${err.message || err}`)
      }
    }
  }

  function traiterCodeBarreCamera(code: string) {
    const codeClean = (code || '').trim()
    if (!codeClean) return
    const now = Date.now()

    // Anti-rebond intelligent : 1.2s de délai si même code, 0ms si code différent
    if (dernierCodeScanneRef.current === codeClean && (now - dernierTempsScanRef.current < 1200)) {
      return
    }
    dernierCodeScanneRef.current = codeClean
    dernierTempsScanRef.current = now

    const pFound = produits.find(p => p.code_barre === codeClean || p.id === codeClean)
    if (pFound) {
      ajouterAuPanier(pFound)
      jouerBipEtVibrer('succes')
      setScannerDernierItem({ nom: pFound.nom, prix: pFound.prix })
      setScannerFlashActif(true)
      setTimeout(() => setScannerFlashActif(false), 450)
      setScannerCameraStatus(`+1 ${pFound.nom} (${fcfa(pFound.prix)})`)
      // La caméra reste ouverte pour scanner les articles suivants en continu !
    } else {
      jouerBipEtVibrer('alerte')
      setScannerCameraStatus(`Code inconnu : "${codeClean}"`)
      setRecherche(codeClean)
    }
  }

  async function imprimerTicketThermique(vente: any) {
    if (!vente) return

    // Si une imprimante Bluetooth direct est connectée via WebBluetooth
    if (btCharacteristic) {
      try {
        const encoder = new TextEncoder()
        const bqNom = boutiques.find(b => b.id === boutiqueActiveId)?.nom || 'NOPALOU BOUTIQUE'
        const dateStr = vente.date || new Date().toLocaleDateString('fr-FR')
        const items = vente.ticket || vente.items || []
        
        let text = `\x1B\x40` // Init ESC/POS
        text += `\x1B\x61\x01\x1D\x21\x11${bqNom}\n\x1D\x21\x00`
        text += `Ticket #${vente.id} - ${dateStr}\n`
        text += `Caissier: ${vente.caissier || caissierNom}\n`
        text += `--------------------------------\n\x1B\x61\x00`
        
        items.forEach((i: any) => {
          const nom = (i.produit?.nom || i.nom || 'Article').substring(0, 16)
          const qte = `${i.quantite || 1}x`
          const tot = fcfa((i.prixUnitaire || i.prix || 0) * (i.quantite || 1))
          text += `${qte} ${nom.padEnd(16)} ${tot.padStart(8)}\n`
        });
        
        text += `--------------------------------\n\x1B\x61\x02\x1B\x45\x01`
        text += `TOTAL NET : ${fcfa(vente.total)}\n\x1B\x45\x00\x1B\x61\x01`
        text += `Mode: ${(vente.modePaiement || vente.mode || 'ESPECES').toUpperCase()}\n`
        text += `--------------------------------\nMERCI DE VOTRE VISITE !\nNopalou POS - Caisse\n\n\n\n\x1D\x56\x41\x00`

        const bytes = encoder.encode(text)
        const chunkSize = 512
        for (let i = 0; i < bytes.length; i += chunkSize) {
          await btCharacteristic.writeValue(bytes.slice(i, i + chunkSize))
        }
        return
      } catch (err: any) {
        console.error('[BT PRINT EXEC ERR]', err)
        alert("Impression Bluetooth directe interrompue. Ouverture du module d'impression web standard.")
      }
    }

    // Impression Web Standard
    const windowPrint = window.open('', '_blank', 'width=400,height=600')
    if (!windowPrint) {
      window.print()
      return
    }
    const widthMm = formatTicketThermique === '58mm' ? '58mm' : '80mm'
    const bqNom = boutiques.find(b => b.id === boutiqueActiveId)?.nom || 'NOPALOU BOUTIQUE'
    const itemsHtml = (vente.ticket || vente.items || []).map((i: any) => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 4px 0; text-align: left;">${i.quantite || 1}x ${i.produit?.nom || i.nom}</td>
        <td style="padding: 4px 0; text-align: right; font-weight: bold;">${fcfa((i.prixUnitaire || i.prix || 0) * (i.quantite || 1))}</td>
      </tr>
    `).join('')

    windowPrint.document.write(`
      <html>
        <head>
          <title>Ticket de Caisse ESC/POS</title>
          <style>
            @page { size: ${widthMm} auto; margin: 0; }
            body { width: ${widthMm}; margin: 0 auto; padding: 6px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 14px; text-transform: uppercase;">${bqNom}</div>
          <div class="center" style="font-size: 10px; margin-top: 2px;">Ticket #${vente.id} • ${vente.date || new Date().toLocaleDateString('fr-FR')}</div>
          <div class="center" style="font-size: 10px;">Caissier: ${vente.caissier || caissierNom}</div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left;">Article</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between;" class="bold">
            <span>TOTAL NET :</span>
            <span>${fcfa(vente.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px;">
            <span>Mode Règlement:</span>
            <span>${(vente.modePaiement || vente.mode || 'ESPECES').toUpperCase()}</span>
          </div>
          <div class="divider"></div>
          <div class="center bold" style="margin-top: 8px;">MERCI DE VOTRE VISITE !</div>
          <div class="center" style="font-size: 9px; margin-top: 2px;">Logiciel de Caisse Nopalou POS</div>
        </body>
      </html>
    `)
    windowPrint.document.close()
    windowPrint.focus()
    setTimeout(() => {
      windowPrint.print()
      windowPrint.close()
    }, 250)
  }

  function genererImprimerEtiquetteCodeBarre(e: React.MouseEvent, p: ProduitCaisse) {
    e.stopPropagation()
    let cb = p.code_barre
    if (!cb || cb === 'N/A') {
      const prefixe = "200"
      const corps = Math.floor(100000000 + Math.random() * 900000000).toString()
      const base12 = prefixe + corps
      let somme = 0
      for (let i = 0; i < 12; i++) {
        const val = parseInt(base12[i], 10)
        somme += (i % 2 === 0) ? val : val * 3
      }
      const check = (10 - (somme % 10)) % 10
      cb = base12 + check

      setProduits(prev => prev.map(item => item.id === p.id ? { ...item, code_barre: cb } : item))
    }

    const windowPrint = window.open('', '_blank', 'width=400,height=300')
    if (!windowPrint) return

    const bqNom = boutiques.find(b => b.id === boutiqueActiveId)?.nom || 'NOPALOU BOUTIQUE'

    windowPrint.document.write(`
      <html>
        <head>
          <title>Étiquette Code-Barres EAN - ${p.nom}</title>
          <style>
            @page { size: 50mm 30mm; margin: 0; }
            body { width: 50mm; height: 30mm; margin: 0 auto; padding: 4px; font-family: Arial, sans-serif; text-align: center; box-sizing: border-box; }
            .store { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #475569; }
            .nom { font-size: 10px; font-weight: bold; margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .prix { font-size: 12px; font-weight: 900; color: #000; margin-bottom: 2px; }
            .code-text { font-size: 10px; font-weight: bold; font-family: monospace; letter-spacing: 2px; margin-top: 4px; border-top: 1px dashed #000; padding-top: 2px; }
          </style>
        </head>
        <body>
          <div class="store">${bqNom}</div>
          <div class="nom">${p.nom}</div>
          <div class="prix">${fcfa(p.prix)}</div>
          <div class="code-text">║▌║█║▌│║▌║▌█ <br/>${cb}</div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 300);
          </script>
        </body>
      </html>
    `)
    windowPrint.document.close()
  }

  // ── Historique des opérations & Incidents ────────────────────────────────────
  const [historiqueVentes, setHistoriqueVentes] = useState<VenteHistorique[]>([])

  // ── Produits Réels de la Boutique ────────────────────────────────────────────
  const [produits, setProduits] = useState<ProduitCaisse[]>([])

  // P1.11 : Écouteur Matériel Global pour Douchettes Codes-Barres (USB / Bluetooth HID)
  // Les douchettes laser envoient une séquence ultra-rapide (<80ms entre frappes) terminée par Enter
  useEffect(() => {
    let barcodeBuffer = ''
    let lastKeyTime = 0

    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now()
      const diff = now - lastKeyTime
      lastKeyTime = now

      // Si l'intervalle entre frappes dépasse 80ms, c'est une saisie manuelle humaine
      if (diff > 80 && barcodeBuffer.length > 0) {
        barcodeBuffer = ''
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          e.preventDefault()
          e.stopPropagation()
          traiterCodeBarreCamera(barcodeBuffer)
          barcodeBuffer = ''
        }
        return
      }

      // Enregistrer uniquement les caractères imprimables
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBuffer += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [produits])

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  // ── Initialisation des PINs & Restauration Session depuis LocalStorage ────────
  useEffect(() => {
    const savedCaissier = localStorage.getItem('nopalou_pin_caissier')
    if (savedCaissier) setPinCaissier(savedCaissier)

    const savedSuperviseur = localStorage.getItem('nopalou_pin_superviseur')
    if (savedSuperviseur) setPinSuperviseur(savedSuperviseur)
  }, [])

  // Restauration de l'authentification lors des rafraîchissements F5
  useEffect(() => {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      const savedUnlocked = localStorage.getItem(`nopalou_pos_unlocked_${boutiqueActiveId}`)
      if (savedUnlocked) {
        try {
          const parsed = JSON.parse(savedUnlocked)
          if (parsed.unlocked) {
            setVerrouille(false)
            if (parsed.roleActif) setRoleActif(parsed.roleActif)
            if (parsed.caissierNom) setCaissierNom(parsed.caissierNom)
            if (parsed.caissierId) setCaissierSelectionneId(parsed.caissierId)
          }
        } catch (e) { console.warn('[Nopalou:CaisseClient:L832]', e); }
      }
    }
  }, [boutiqueActiveId])

  // ── Synchroniser la sauvegarde locale de l'historique des ventes ──────────────
  useEffect(() => {
    if (boutiqueActiveId && historiqueVentes.length > 0) {
      localStorage.setItem(`nopalou_pos_historique_${boutiqueActiveId}`, JSON.stringify(historiqueVentes))
    }
  }, [historiqueVentes, boutiqueActiveId])

  // ── Restauration automatique du Panier et de la File d'attente lors d'un rafraîchissement F5 ──
  useEffect(() => {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      try {
        const savedPanier = localStorage.getItem(`nopalou_pos_panier_${boutiqueActiveId}`)
        if (savedPanier) {
          const parsedPanier = JSON.parse(savedPanier)
          if (Array.isArray(parsedPanier) && parsedPanier.length > 0) {
            setPanier(parsedPanier)
          }
        }
      } catch (e) { console.warn('[Nopalou:CaisseClient:L855]', e); }

      try {
        const savedTickets = localStorage.getItem(`nopalou_pos_tickets_attente_${boutiqueActiveId}`)
        if (savedTickets) {
          const parsedTickets = JSON.parse(savedTickets)
          if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
            setTicketsEnAttente(parsedTickets)
          }
        }
      } catch (e) { console.warn('[Nopalou:CaisseClient:L865]', e); }
    }
  }, [boutiqueActiveId])

  // ── Persistance automatique du Panier en cours ──
  useEffect(() => {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      if (panier.length > 0) {
        localStorage.setItem(`nopalou_pos_panier_${boutiqueActiveId}`, JSON.stringify(panier))
      } else {
        localStorage.removeItem(`nopalou_pos_panier_${boutiqueActiveId}`)
      }
    }
  }, [panier, boutiqueActiveId])

  // ── Persistance automatique de la File d'attente ──
  useEffect(() => {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      if (ticketsEnAttente.length > 0) {
        localStorage.setItem(`nopalou_pos_tickets_attente_${boutiqueActiveId}`, JSON.stringify(ticketsEnAttente))
      } else {
        localStorage.removeItem(`nopalou_pos_tickets_attente_${boutiqueActiveId}`)
      }
    }
  }, [ticketsEnAttente, boutiqueActiveId])

  // ── Persistance et restauration de la session de caisse POS ─────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      if (session) {
        localStorage.setItem(`nopalou_pos_session_${boutiqueActiveId}`, JSON.stringify(session))
      } else {
        localStorage.removeItem(`nopalou_pos_session_${boutiqueActiveId}`)
      }
    }
  }, [session, boutiqueActiveId])

  useEffect(() => {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      const savedSession = localStorage.getItem(`nopalou_pos_session_${boutiqueActiveId}`)
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession)
          if (parsed && parsed.statut === 'ouverte') {
            setSession(parsed)
          }
        } catch (e) { console.warn('[Nopalou:CaisseClient:L911]', e); }
      }
    }
  }, [boutiqueActiveId])

  // ── Charger les boutiques du marchand et le catalogue réel de produits ───────
  useEffect(() => {
    async function chargerBoutiquesEtProduits() {
      try {
        setLoadingProduits(true)
        if (initialToken) {
          const res = await fetch(`/api/boutiques/caisse-terminal/${initialToken}`)
          const data = await res.json().catch(() => ({}))
          if (data?.boutique) {
            const bqObj = {
              ...data.boutique,
              plan_actif: data.planActif || data.boutique?.plan_actif || 'pro'
            }
            setBoutiques([bqObj])
            setBoutiqueActiveId(bqObj.id)
            if (data.planActif) setTerminalPlan(data.planActif)

            if (typeof window !== 'undefined') {
              localStorage.setItem('nopalou_pos_active_boutique_id', bqObj.id)
              localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify([bqObj]))
            }

            if (data.caissiers && Array.isArray(data.caissiers) && data.caissiers.length > 0) {
              const actifs = data.caissiers.filter((c: any) => c.actif !== false)
              if (actifs.length > 0) {
                setCaissiersList(actifs)
                const defCaissier = actifs.find((c: any) => c.role === 'caissier') || actifs[0]
                setCaissierSelectionneId(defCaissier.id)
                setCaissierNom(`${defCaissier.prenom || ''} ${defCaissier.nom || ''}`.trim() || defCaissier.nom)
                const isSuper = defCaissier.role === 'superviseur' || defCaissier.role === 'admin'
                setRoleActif(isSuper ? 'superviseur' : 'caissier')
                if (verifierSiConfigObligatoire(actifs, bqObj.id)) {
                  setModalConfigObligatoire(true)
                }
              }
            }

            if (data.produits && Array.isArray(data.produits)) {
              const prodsFormates = data.produits.map((p: any) => ({
                ...p,
                id: p.id,
                nom: p.nom,
                prix: Number(p.prix),
                code_barre: p.code_barre || p.id.slice(0, 8),
                photo: p.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
                categorie: p.categorie || 'alimentation',
                stock: isNaN(Number(p.stock_quantite ?? p.stock)) ? 10 : Number(p.stock_quantite ?? p.stock),
              }))
              setProduits(prodsFormates)
              if (typeof window !== 'undefined') {
                localStorage.setItem(`nopalou_pos_produits_${bqObj.id}`, JSON.stringify(prodsFormates))
              }
            }

            await chargerCaissiersEtSession(bqObj.id)
            await chargerProduitsBoutique(bqObj.id)
            await chargerClientsCredits(bqObj.id)
            await chargerReglesRemises(bqObj.id)
            setLoadingProduits(false)
            return
          }
        }
        let merchantBoutiques: any[] = []
        try {
          const mine = await getBoutiquesMine()
          merchantBoutiques = mine || []
        } catch (e) {
          console.warn("Réseau indisponible, tentative de lecture du cache...", e)
        }

        if (merchantBoutiques.length > 0) {
          setBoutiques(merchantBoutiques)
          if (typeof window !== 'undefined') {
            localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify(merchantBoutiques))
          }
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
          const queryBId = urlParams?.get('b') || urlParams?.get('boutique') || urlParams?.get('manage') || urlParams?.get('id') || initialBoutiqueId
          const savedBId = typeof window !== 'undefined' ? localStorage.getItem('nopalou_pos_active_boutique_id') : null
          const targetBId = queryBId || savedBId
          const validTarget = merchantBoutiques.find(b => b.id === targetBId || b.slug === targetBId || b.nom?.toLowerCase() === targetBId?.toLowerCase())
          const bId = validTarget ? validTarget.id : (boutiqueActiveId || merchantBoutiques[0].id)
          setBoutiqueActiveId(bId)
          if (typeof window !== 'undefined') {
            localStorage.setItem('nopalou_pos_active_boutique_id', bId)
          }
          await chargerCaissiersEtSession(bId)
          await chargerProduitsBoutique(bId)
          await chargerClientsCredits(bId)
          await chargerReglesRemises(bId)
        } else {
          // Fallback hors-ligne : restaurer depuis le cache local si la requête réseau a échoué
          const cachedStr = typeof window !== 'undefined' ? localStorage.getItem('nopalou_pos_user_boutiques') : null
          if (cachedStr) {
            try {
              const cachedBoutiques = JSON.parse(cachedStr)
              if (cachedBoutiques && cachedBoutiques.length > 0) {
                setBoutiques(cachedBoutiques)
                const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
                const queryBId = urlParams?.get('b') || urlParams?.get('boutique') || urlParams?.get('manage') || urlParams?.get('id') || initialBoutiqueId
                const savedBId = typeof window !== 'undefined' ? localStorage.getItem('nopalou_pos_active_boutique_id') : null
                const targetBId = queryBId || savedBId
                const validTarget = cachedBoutiques.find((b: any) => b.id === targetBId || b.slug === targetBId || b.nom?.toLowerCase() === targetBId?.toLowerCase())
                const bId = validTarget ? validTarget.id : (boutiqueActiveId || cachedBoutiques[0].id)
                setBoutiqueActiveId(bId)
                await chargerCaissiersEtSession(bId)
                await chargerProduitsBoutique(bId)
                await chargerClientsCredits(bId)
                await chargerReglesRemises(bId)
                return
              }
            } catch (eCache) { console.warn('[Nopalou:CaisseClient:L1026]', eCache); }
          }
          setBoutiques([])
          setLoadingProduits(false)
        }
      } catch (e) {
        console.error('Erreur chargement boutiques caisse:', e)
        setLoadingProduits(false)
      }
    }
    chargerBoutiquesEtProduits()
  }, [initialToken, initialBoutiqueId])

  async function chargerReglesRemises(bId: string) {
    if (!bId) return
    try {
      const res = await fetch(`/api/boutiques/${bId}/pos-regles-remises`)
      if (res.ok) {
        const data = await res.json()
        if (data.regles) {
          setBoutiques(prev => prev.map(b => b.id === bId ? { ...b, ...data.regles } : b))
        }
      }
    } catch (e) {
      console.warn('[chargerReglesRemises warn]', e)
    }
  }

  async function chargerClientsCredits(bId: string) {
    if (!bId) return
    try {
      const res = await fetch(`/api/boutiques/${bId}/credits-clients`)
      if (res.ok) {
        const data = await res.json()
        if (data.clients) {
          setClientsCredits(data.clients)
          sauvegarderClientsLocaux(data.clients, bId, userId).catch(() => {})
        }
      } else {
        const cached = await obtenirClientsLocaux(bId, userId).catch(() => [])
        if (cached && cached.length > 0) setClientsCredits(cached)
      }
    } catch (e) {
      console.error('Erreur chargement carnet credits:', e)
      const cached = await obtenirClientsLocaux(bId, userId).catch(() => [])
      if (cached && cached.length > 0) setClientsCredits(cached)
    }
  }

  async function chargerHistoriqueClientSelectionne(clientId: string) {
    if (!boutiqueActiveId || !clientId) return
    try {
      setLoadingHistoriqueClient(true)
      const res = await fetch(`/api/boutiques/${boutiqueActiveId}/credits-clients/${clientId}/historique`)
      if (res.ok) {
        const data = await res.json()
        setHistoriqueClientSelectionne(data.historique || [])
      }
    } catch (e) {
      console.error('Erreur chargement historique client:', e)
    } finally {
      setLoadingHistoriqueClient(false)
    }
  }

  async function chargerCaissiersEtSession(bId: string) {
    try {
      const resCaissiers = await fetch(`/api/boutiques/${bId}/caissiers`);
      if (resCaissiers.ok) {
        const data = await resCaissiers.json();
        if (data.caissiers && Array.isArray(data.caissiers)) {
          const actifs = data.caissiers.filter((c: any) => c.actif !== false);
          if (actifs.length > 0) {
            setCaissiersList(actifs);
            // Sélection par défaut : privilégier le premier caissier standard (role 'caissier')
            // afin d'éviter d'attribuer le rôle superviseur par défaut !
            setCaissierSelectionneId(prev => {
              if (prev && actifs.some((c: any) => c.id === prev)) return prev;
              const defCaissier = actifs.find((c: any) => c.role === 'caissier') || actifs[0];
              return defCaissier.id;
            });
            setCaissierNom(prev => {
              if (prev && prev !== 'Caissier 1 (Bamba)') return prev;
              const defCaissier = actifs.find((c: any) => c.role === 'caissier') || actifs[0];
              return `${defCaissier.prenom || ''} ${defCaissier.nom || ''}`.trim() || defCaissier.nom;
            });
            if (verifierSiConfigObligatoire(actifs, bId)) {
              setModalConfigObligatoire(true);
            }
          }
        }
      }

      const resSession = await fetch(`/api/boutiques/${bId}/pos-sessions/active`);
      if (resSession.ok) {
        const data = await resSession.json();
        if (data.session) {
          const dbSession = data.session;
          const dbTotal = Number(dbSession.ventes_total || 0);
          const dbNb = Number(dbSession.nb_ventes || 0);
          const dbEspeces = Number(dbSession.ventes_especes || 0);
          const dbWave = Number(dbSession.ventes_wave || 0);
          const dbOM = Number(dbSession.ventes_orange_money || 0);
          const dbCarte = Number(dbSession.ventes_carte || 0);

          setSession(prev => {
            const localTotal = prev?.ventes?.total || 0;
            const localNb = prev?.ventes?.nbVentes || 0;
            const localEspeces = prev?.ventes?.especes || 0;
            const localWave = prev?.ventes?.wave || 0;
            const localOM = prev?.ventes?.orangeMoney || 0;
            const localCarte = prev?.ventes?.carte || 0;
            const localMixte = prev?.ventes?.mixte || 0;

            return {
              id: dbSession.id,
              dateOuverture: prev?.dateOuverture || (dbSession.date_ouverture ? new Date(dbSession.date_ouverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })),
              fondDeCaisse: Number(dbSession.fond_caisse_initial || prev?.fondDeCaisse || 0),
              caissierNom: dbSession.caissier_nom || caissierNom,
              statut: 'ouverte',
              ventes: {
                total: Math.max(dbTotal, localTotal),
                especes: Math.max(dbEspeces, localEspeces),
                wave: Math.max(dbWave, localWave),
                orangeMoney: Math.max(dbOM, localOM),
                carte: Math.max(dbCarte, localCarte),
                mixte: localMixte,
                nbVentes: Math.max(dbNb, localNb)
              }
            };
          });
        }
      }
    } catch (err) {
      console.error('[chargerCaissiersEtSession err]', err);
    }
  }

  async function chargerProduitsBoutique(bId: string) {
    if (!bId) return
    setLoadingProduits(true)

    // 1. Restaurer immédiatement depuis LocalStorage si présent
    const localHist = localStorage.getItem(`nopalou_pos_historique_${bId}`)
    if (localHist) {
      try {
        const parsed = JSON.parse(localHist)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoriqueVentes(parsed)
        }
      } catch (err) { console.warn('[Nopalou:CaisseClient:L1176]', err); }
    }

    const localProds = localStorage.getItem(`nopalou_pos_produits_${bId}`)
    if (localProds) {
      try {
        const parsedP = JSON.parse(localProds)
        if (Array.isArray(parsedP) && parsedP.length > 0) {
          setProduits(parsedP)
        }
      } catch (err) { console.warn('[Nopalou:CaisseClient:L1186]', err); }
    }

    // 2. Charger depuis l'API backend via Action Serveur
    getPosHistorique(bId)
      .then(dataHist => {
        if (dataHist && dataHist.length > 0) {
          setHistoriqueVentes(dataHist)
          localStorage.setItem(`nopalou_pos_historique_${bId}`, JSON.stringify(dataHist))
        }
      })
      .catch(() => {})

    // 3. Charger le catalogue produits
    try {
      const produits = await getBoutiqueProduits(bId)
      if (produits && Array.isArray(produits) && produits.length > 0) {
        const prodsFormates: ProduitCaisse[] = produits.map((p: any) => {
        let stockVal = Number(p.stock ?? p.quantite_stock ?? p.stock_quantite);
        if (isNaN(stockVal)) stockVal = 10;
        
        return {
          ...p,
          id: p.id,
          nom: p.nom,
          prix: Number(p.prix),
          code_barre: p.code_barre || p.id.slice(0, 8),
          photo: p.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
          categorie: p.categorie || 'alimentation',
          stock: stockVal,
        };
      })
        setProduits(prodsFormates)
        localStorage.setItem(`nopalou_pos_produits_${bId}`, JSON.stringify(prodsFormates))
        sauvegarderProduitsLocaux(prodsFormates, bId, userId).catch(() => {})
      } else if (produits && Array.isArray(produits) && produits.length === 0) {
        // Le Server Action a retourné [] — deux cas possibles :
        // A) On est en ligne et la boutique est vraiment vide
        // B) On est hors-ligne et le Server Action a échoué silencieusement (retourne [] par défaut)
        const isActuallyOnline = isReallyOnline
        if (isActuallyOnline) {
          // En ligne et la boutique renvoie une liste vide : vérifier d'abord si on avait des produits en cache
          const cachedExistants = await obtenirProduitsLocaux(bId, userId).catch(() => [])
          if (!cachedExistants || cachedExistants.length === 0) {
            setProduits([])
            localStorage.setItem(`nopalou_pos_produits_${bId}`, JSON.stringify([]))
            sauvegarderProduitsLocaux([], bId, userId).catch(() => {})
          } else {
            // Si on avait un cache valide, le conserver plutôt que de tout effacer
            setProduits(cachedExistants)
          }
        } else {
          // En cas d'échec réseau ou réponse vide hors-ligne, restaurer le cache local scopé par bId
          console.warn('[Diagnostic Caisse] Échec de la récupération réseau des produits ou réponse vide hors-ligne. Bascule sur le cache IndexedDB.')
          const cached = await obtenirProduitsLocaux(bId, userId).catch(() => [])
          if (cached && cached.length > 0) {
            setProduits(cached)
          } else if (localProds) {
            try {
              const parsedP = JSON.parse(localProds)
              if (Array.isArray(parsedP) && parsedP.length > 0) {
                setProduits(parsedP)
              }
            } catch (err) { console.warn('[Nopalou:CaisseClient:L1249]', err); }
          }
        }
      } else {
        // En cas d'échec réseau ou réponse vide hors-ligne, restaurer le cache local scopé par bId
        console.warn('[Diagnostic Caisse] Échec de la récupération réseau des produits. Bascule sur le cache IndexedDB.')
        const cached = await obtenirProduitsLocaux(bId, userId).catch(() => [])
        if (cached && cached.length > 0) {
          setProduits(cached)
        } else if (localProds) {
          try {
            const parsedP = JSON.parse(localProds)
            if (Array.isArray(parsedP) && parsedP.length > 0) {
              setProduits(parsedP)
            }
          } catch (err) { console.warn('[Nopalou:CaisseClient:L1264]', err); }
        }
      }
    } catch (e) {
      console.error('[Diagnostic Caisse] Erreur réseau lors du chargement des produits:', e)
      console.info('[Diagnostic Caisse] Bascule d\'urgence sur les caches locaux.')
      const cached = await obtenirProduitsLocaux(bId, userId).catch(() => [])
      if (cached && cached.length > 0) {
        setProduits(cached)
      } else if (localProds) {
        try {
          const parsedP = JSON.parse(localProds)
          if (Array.isArray(parsedP) && parsedP.length > 0) {
            setProduits(parsedP)
          }
        } catch (err) { console.warn('[Nopalou:CaisseClient:L1279]', err); }
      }
    } finally {
      setLoadingProduits(false)
    }
  }

  async function changerBoutiqueActive(newBId: string) {
    if (session) {
      alert("Vous avez une session de caisse (Fonds de caisse) en cours sur cette boutique. Veuillez clôturer votre caisse (Clôture Z) avant de changer de boutique.");
      return;
    }
    setBoutiqueActiveId(newBId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('nopalou_pos_active_boutique_id', newBId)
      const url = new URL(window.location.href)
      url.searchParams.set('b', newBId)
      window.history.replaceState({}, '', url.toString())
    }
    viderPanier()
    setVerrouille(true)
    setSession(null)
    setConflitSessionMessage(null)
    await chargerCaissiersEtSession(newBId)
    await chargerProduitsBoutique(newBId)
    await chargerClientsCredits(newBId)
    await chargerReglesRemises(newBId)
  }

  function demanderChangementBoutique(newBId: string) {
    if (newBId === boutiqueActiveId) return;
    if (session) {
      alert("Vous avez une session de caisse (Fonds de caisse) en cours sur cette boutique. Veuillez clôturer votre caisse (Clôture Z) avant de changer de boutique.");
      return;
    }
    if (roleActif === 'superviseur') {
      changerBoutiqueActive(newBId);
    } else {
      demanderValidationSuperviseur('Autorisation Changement de Boutique POS', () => {
        changerBoutiqueActive(newBId);
      });
    }
  }

  function quitterVersDashboard(e?: React.SyntheticEvent) {
    if (roleActif !== 'superviseur') {
      if (e) e.preventDefault();
      demanderValidationSuperviseur('Quitter le Point de Vente', () => {
        window.location.href = boutiqueActiveId ? `/boutique?manage=${boutiqueActiveId}` : '/boutique';
      });
    }
  }

  // ── Auto-Verrouillage de la Caisse par Inactivité (5 minutes) ───────────────
  useEffect(() => {
    if (typeof window === 'undefined' || verrouille) return;
    let timer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        console.info('[POS Inactivité] Verrouillage automatique après 5 minutes sans interaction.');
        verrouillerCaisseManuellement();
      }, 5 * 60 * 1000); // 5 minutes
    };

    resetInactivityTimer();

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetInactivityTimer, { passive: true }));

    return () => {
      clearTimeout(timer);
      events.forEach(ev => window.removeEventListener(ev, resetInactivityTimer));
    };
  }, [verrouille, boutiqueActiveId]);

  // ── Listener Douchette Code-barres USB/Bluetooth ────────────────────────────
  const bufferScan = useRef<string>('')
  const dernierTempsScan = useRef<number>(Date.now())

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (verrouille || modalSuperviseur || modalConfigPin) return
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return
      }

      const maintenant = Date.now()
      if (maintenant - dernierTempsScan.current > 100) {
        bufferScan.current = ''
      }
      dernierTempsScan.current = maintenant

      if (e.key === 'Enter') {
        if (bufferScan.current.length > 3) {
          const codeScanne = bufferScan.current
          bufferScan.current = ''
          ajouterParCodeBarre(codeScanne)
        }
      } else if (e.key.length === 1) {
        bufferScan.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [produits, verrouille, modalSuperviseur, modalConfigPin])

  function ajouterParCodeBarre(code: string) {
    if (!code || !code.trim()) return
    const clean = code.trim().toLowerCase()
    const p = produits.find(item =>
      (item.code_barre && item.code_barre.toLowerCase() === clean) ||
      (item.id && item.id.toLowerCase() === clean) ||
      (item.nom && item.nom.toLowerCase().includes(clean))
    )
    if (p) {
      ajouterAuPanier(p)
      showToast(`${p.nom} ajouté`, 'success')
    } else {
      showToast(`Produit introuvable pour "${code}"`, 'warning')
    }
  }

  // ── Constantes & Fonctions de Vérification de Sécurité PIN ────────────────
  const CODES_PIN_TRIVIAUX = ['1234', '0000', '9999', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '1212'];

  function verifierSiConfigObligatoire(caissiers: any[], bId?: string): boolean {
    if (!caissiers || caissiers.length === 0) return false;
    const aCodeTrivial = caissiers.some(c => c.actif !== false && (!c.code_pin || CODES_PIN_TRIVIAUX.includes(String(c.code_pin).trim())));
    const hasSuperviseur = caissiers.some(c => (c.role === 'superviseur' || c.role === 'admin') && c.code_pin && !CODES_PIN_TRIVIAUX.includes(String(c.code_pin).trim()));
    return aCodeTrivial || !hasSuperviseur;
  }

  // ── Soumission de la Configuration Initiale Obligatoire des PINs ───────────
  async function soumettreConfigObligatoire() {
    setErreurConfigObligatoire(null);
    const supPin = pinObligatoireSuperviseur.trim();
    const caiPin = pinObligatoireCaissier.trim();

    if (!supPin || supPin.length < 4 || !caiPin || caiPin.length < 4) {
      setErreurConfigObligatoire('Chaque code PIN doit comporter entre 4 et 6 chiffres.');
      return;
    }
    if (CODES_PIN_TRIVIAUX.includes(supPin)) {
      setErreurConfigObligatoire('Le code Superviseur est trop simple (évitez 0000, 1234, 9999...). Choisissez un code secret.');
      return;
    }
    if (CODES_PIN_TRIVIAUX.includes(caiPin)) {
      setErreurConfigObligatoire('Le code Caissier est trop simple (évitez 1234, 0000, 9999...). Choisissez un code secret.');
      return;
    }
    if (supPin === caiPin) {
      setErreurConfigObligatoire('Le code Superviseur et le code Caissier doivent être différents pour séparer les pouvoirs.');
      return;
    }

    setSavingConfigObligatoire(true);
    try {
      const bId = boutiqueActiveId || (boutiques[0]?.id);
      const supObj = caissiersList.find(c => c.role === 'superviseur' || c.role === 'admin') || caissiersList[0];
      const caiObj = caissiersList.find(c => c.role === 'caissier' && c.id !== supObj?.id) || caissiersList[1] || caissiersList[0];
      const tokenAuth = initialToken || bId;

      if (supObj) {
        await fetch(`/api/boutiques/${bId}/caissiers/${supObj.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code_pin: supPin, terminal_token: tokenAuth })
        });
      }

      if (caiObj && caiObj.id !== supObj?.id) {
        await fetch(`/api/boutiques/${bId}/caissiers/${caiObj.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code_pin: caiPin, terminal_token: tokenAuth })
        });
      }

      // Recharger la liste des caissiers à jour
      const resCaissiers = await fetch(`/api/boutiques/${bId}/caissiers`);
      if (resCaissiers.ok) {
        const d = await resCaissiers.json();
        if (d.caissiers) {
          const actifs = d.caissiers.filter((c: any) => c.actif !== false);
          setCaissiersList(actifs);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`nopalou_offline_caissiers_${bId}`, JSON.stringify(actifs));
          }
        }
      }

      setPinSuperviseur(supPin);
      setPinCaissier(caiPin);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`nopalou_pin_configured_${bId}`, 'true');
        localStorage.setItem('nopalou_pin_superviseur', supPin);
        localStorage.setItem('nopalou_pin_caissier', caiPin);
      }

      setModalConfigObligatoire(false);
      showToast('Configuration de sécurité réussie ! La caisse est prête.', 'success');
    } catch (err: any) {
      setErreurConfigObligatoire('Erreur lors de l\'enregistrement. Vérifiez votre connexion.');
    } finally {
      setSavingConfigObligatoire(false);
    }
  }

  // ── Ouvrir la modale de gestion d'équipe et des PINs (Réservé au Gérant) ─────
  function ouvrirConfigPin() {
    demanderValidationSuperviseur('Accès au Centre de Gestion d\'Équipe et Codes PIN', () => {
      setModalConfigPin(true)
      setMsgConfigPin(null)
      setOngletConfigPin('liste')
    })
  }

  // ── Modification directe du code PIN d'un caissier (depuis le POS) ─────────
  async function modifierPinCaissier(caissierId: string) {
    const nouveauCode = editPinsState[caissierId]?.trim();
    if (!nouveauCode || nouveauCode.length < 4) {
      showToast('Le code PIN doit comporter au moins 4 chiffres.', 'warning');
      return;
    }
    if (CODES_PIN_TRIVIAUX.includes(nouveauCode)) {
      showToast('Ce code PIN est trop simple ou interdit (1234, 0000, 9999...).', 'warning');
      return;
    }
    setSavingPinId(caissierId);
    try {
      const bId = boutiqueActiveId || (boutiques[0]?.id);
      const res = await fetch(`/api/boutiques/${bId}/caissiers/${caissierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_pin: nouveauCode,
          superviseur_pin: pinSuperviseurSaisi,
          terminal_token: initialToken || bId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur modification PIN');

      // Mettre à jour l'état local et cache
      const updatedList = caissiersList.map(c => c.id === caissierId ? { ...c, code_pin: nouveauCode } : c);
      setCaissiersList(updatedList);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`nopalou_offline_caissiers_${bId}`, JSON.stringify(updatedList));
      }
      setEditPinsState(prev => {
        const copy = { ...prev };
        delete copy[caissierId];
        return copy;
      });
      showToast('Code PIN mis à jour avec succès !', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur modification PIN', 'warning');
    } finally {
      setSavingPinId(null);
    }
  }

  // ── Ajout d'un Nouveau Caissier depuis le POS ──────────────────────────────
  async function ajouterNouveauCaissier() {
    if (!nouveauCaissierNom.trim() || !nouveauCaissierPin.trim()) {
      showToast('Nom et Code PIN requis', 'warning');
      return;
    }
    if (nouveauCaissierPin.length < 4) {
      showToast('Le code PIN doit comporter au moins 4 chiffres', 'warning');
      return;
    }
    if (CODES_PIN_TRIVIAUX.includes(nouveauCaissierPin.trim())) {
      showToast('Code PIN trop simple ou interdit (1234, 0000, etc.)', 'warning');
      return;
    }
    setAddingCaissierState(true);
    try {
      const bId = boutiqueActiveId || (boutiques[0]?.id);
      const res = await fetch(`/api/boutiques/${bId}/caissiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nouveauCaissierNom.trim(),
          prenom: nouveauCaissierPrenom.trim(),
          code_pin: nouveauCaissierPin.trim(),
          role: nouveauCaissierRole,
          superviseur_pin: pinSuperviseurSaisi,
          terminal_token: initialToken || bId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création caissier');

      const updated = [...caissiersList, data.caissier];
      setCaissiersList(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`nopalou_offline_caissiers_${bId}`, JSON.stringify(updated));
      }
      setNouveauCaissierNom('');
      setNouveauCaissierPrenom('');
      setNouveauCaissierPin('');
      setOngletConfigPin('liste');
      showToast('Nouveau membre ajouté avec succès !', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur création caissier', 'warning');
    } finally {
      setAddingCaissierState(false);
    }
  }

  // ── Activer / Désactiver un Caissier depuis le POS ─────────────────────────
  async function toggleActifCaissier(caissierId: string, actifActuel: boolean) {
    try {
      const bId = boutiqueActiveId || (boutiques[0]?.id);
      const res = await fetch(`/api/boutiques/${bId}/caissiers/${caissierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actif: !actifActuel,
          superviseur_pin: pinSuperviseurSaisi,
          terminal_token: initialToken || bId
        })
      });
      if (res.ok) {
        const updated = caissiersList.map(c => c.id === caissierId ? { ...c, actif: !actifActuel } : c);
        setCaissiersList(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nopalou_offline_caissiers_${bId}`, JSON.stringify(updated));
        }
        showToast(actifActuel ? 'Caissier désactivé' : 'Caissier réactivé', 'success');
      }
    } catch (err) {
      showToast('Erreur modification statut', 'warning');
    }
  }

  // ── Validation par Superviseur / Gérant ────────────────────────────────────
  function demanderValidationSuperviseur(titreAction: string, actionValidee: () => void) {
    setSuperviseurTitre(titreAction)
    setSuperviseurAction(() => actionValidee)
    setPinSuperviseurSaisi('')
    setSuperviseurError(null)
    setModalSuperviseur(true)
  }

  function validerSuperviseurPin() {
    const superviseurs = caissiersList.filter(c => c.role === 'superviseur' || c.role === 'admin');
    const hasSuperviseurPin = superviseurs.some(c => c.code_pin && c.code_pin === pinSuperviseurSaisi);
    
    // Si des superviseurs sont configurés en base/liste, seul leur code PIN exact est accepté
    const isValide = superviseurs.length > 0
      ? hasSuperviseurPin
      : (pinSuperviseurSaisi === pinSuperviseur);

    if (isValide) {
      setModalSuperviseur(false)
      if (superviseurAction) superviseurAction()
    } else {
      setSuperviseurError('Code PIN Superviseur incorrect.')
    }
  }

  // Auto-validation du code PIN Superviseur dès 4 chiffres polis
  useEffect(() => {
    if (modalSuperviseur && pinSuperviseurSaisi.length === 4) {
      validerSuperviseurPin()
    }
  }, [pinSuperviseurSaisi, modalSuperviseur])

  // ── Autorisation Remise Sécurisée & Motifs Métiers (Standard Auchan) ────────
  function ouvrirModalRemise() {
    setModalRemise(true)
  }

  // ── Authentification et Déverrouillage Automatique par Rôle ──────────────────
  function deverrouillerPin(codeToTest?: string) {
    const codeSaisi = codeToTest !== undefined ? codeToTest : codePinSaisi
    if (!codeSaisi || codeSaisi.length < 4) return

    const caissierSelectionne = caissiersList.find(c => c.id === caissierSelectionneId);
    let isValide = false;
    let caissier: any = null;

    if (caissiersList.length > 0) {
      // 1. PRIORITÉ ABSOLUE : Si l'utilisateur a sélectionné un profil caissier à l'écran
      if (caissierSelectionne && caissierSelectionne.code_pin && caissierSelectionne.code_pin === codeSaisi) {
        caissier = caissierSelectionne;
        isValide = true;
      } else {
        // 2. Recherche parmi tous les caissiers actifs ayant ce code PIN
        const matches = caissiersList.filter(c => c.actif !== false && c.code_pin && c.code_pin === codeSaisi);
        if (matches.length === 1) {
          caissier = matches[0];
          isValide = true;
        } else if (matches.length > 1) {
          // Si plusieurs personnes partagent le même PIN (ex: caissier et superviseur avec le même code) :
          // Si l'un correspond au profil sélectionné, on le respecte
          const matchSel = matches.find(c => c.id === caissierSelectionneId);
          if (matchSel) {
            caissier = matchSel;
          } else {
            // Principe de moindre privilège : toujours retenir le caissier standard plutôt que superviseur
            const matchSimple = matches.find(c => c.role !== 'superviseur' && c.role !== 'admin');
            caissier = matchSimple || matches[0];
          }
          isValide = true;
        }
      }
    } else {
      // Fallback local uniquement si la liste des caissiers n'a pas encore été synchronisée
      if (codeSaisi === pinCaissier) {
        isValide = true;
        caissier = { role: 'caissier', prenom: 'Caissier', nom: 'Principal' };
      } else if (codeSaisi === pinSuperviseur) {
        isValide = true;
        caissier = { role: 'superviseur', prenom: 'Gérant', nom: 'Superviseur' };
      }
    }
      
    if (isValide) {
      if (caissier) setCaissierSelectionneId(caissier.id);
      
      const isSuper = caissier 
        ? (caissier.role === 'superviseur' || caissier.role === 'admin')
        : (codeSaisi === pinSuperviseur && pinCaissier !== pinSuperviseur);
        
      const realRole: 'caissier' | 'superviseur' = isSuper ? 'superviseur' : 'caissier';
      setRoleActif(realRole);
      
      const realNom = caissier 
        ? `${caissier.prenom || ''} ${caissier.nom || ''}`.trim() || caissier.nom || 'Caissier'
        : (isSuper ? 'Gérant / Superviseur' : 'Caissier Principal');
        
      setCaissierNom(realNom);

      // Conserver la session déverrouillée dans le LocalStorage (persistance au rafraîchissement F5)
      if (typeof window !== 'undefined' && boutiqueActiveId) {
        localStorage.setItem(`nopalou_pos_unlocked_${boutiqueActiveId}`, JSON.stringify({
          unlocked: true,
          roleActif: realRole,
          caissierNom: realNom,
          caissierId: caissier ? caissier.id : caissierSelectionneId,
          timestamp: Date.now()
        }));
      }
      
      // GESTION DU CONFLIT DE SESSION
      if (session && session.caissierNom !== realNom && !isSuper) {
        setConflitSessionMessage(`Une session de caisse est déjà ouverte pour un autre caissier (${session.caissierNom}). Veuillez lui demander de clôturer sa session.`);
      } else {
        setConflitSessionMessage(null);
      }

      setVerrouille(false)
      setCodePinSaisi('')
      setPinError(null)

      // Réduire & fermer automatiquement le clavier virtuel tactile mobile
      if (typeof document !== 'undefined') {
        (document.activeElement as HTMLElement)?.blur()
      }

      if (!session && (!conflitSessionMessage || isSuper)) {
        setModalSessionOuverture(true)
      }
    } else {
      setPinError('Code PIN incorrect. Veuillez vérifier votre saisie.')
      setCodePinSaisi('')
    }
  }

  // Auto-déverrouillage dès la saisie du 4ème chiffre sans cliquer sur aucun bouton
  useEffect(() => {
    if (verrouille && codePinSaisi.length === 4) {
      deverrouillerPin(codePinSaisi)
    }
  }, [codePinSaisi, verrouille])

  function handleChangerCaissier(caissier: CaissierItem, pin: string) {
    if (!pin || pin.length < 4) {
      return { ok: false, error: 'Code PIN requis (4 à 6 chiffres)' }
    }
    const isSuperRole = caissier.role === 'superviseur' || caissier.role === 'admin'
    let isValide = false
    if (caissier.code_pin) {
      isValide = caissier.code_pin === pin
    } else {
      isValide = isSuperRole ? (pin === pinSuperviseur) : (pin === pinCaissier || pin === pinSuperviseur)
    }

    if (isValide) {
      const realNom = `${caissier.prenom || ''} ${caissier.nom || ''}`.trim() || caissier.nom || 'Caissier'
      const realRole: 'caissier' | 'superviseur' = isSuperRole ? 'superviseur' : 'caissier'

      setCaissierSelectionneId(caissier.id)
      setCaissierNom(realNom)
      setRoleActif(realRole)

      if (typeof window !== 'undefined' && boutiqueActiveId) {
        localStorage.setItem(`nopalou_pos_unlocked_${boutiqueActiveId}`, JSON.stringify({
          unlocked: true,
          roleActif: realRole,
          caissierNom: realNom,
          caissierId: caissier.id,
          timestamp: Date.now()
        }))
      }

      if (session && session.caissierNom !== realNom && !isSuperRole) {
        setConflitSessionMessage(`Une session de caisse est active sous ${session.caissierNom}. Clôturez-la avant d'encaisser sous votre nom.`)
      } else {
        setConflitSessionMessage(null)
      }

      showToast(`Connecté : ${realNom} (${isSuperRole ? 'Superviseur' : 'Caissier'})`, 'success')
      return { ok: true }
    } else {
      return { ok: false, error: 'Code PIN incorrect pour ce caissier' }
    }
  }

  function verrouillerCaisseManuellement() {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      localStorage.removeItem(`nopalou_pos_unlocked_${boutiqueActiveId}`)
    }
    setVerrouille(true)
    setProfilChoisiPourPin(null)
    setCodePinSaisi('')
    setPinError(null)
  }

  async function seDeconnecterCompte() {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Voulez-vous vous déconnecter de votre compte Nopalou et quitter la caisse ?\n(Votre session sera fermée et vous serez redirigé vers la page de connexion)')
      if (!ok) return

      try {
        await fetch('/api/auth/deconnexion', { method: 'POST' }).catch(() => {})
      } catch (e) { console.warn('[Nopalou:CaisseClient:L1822]', e); }

      if (boutiqueActiveId) {
        localStorage.removeItem(`nopalou_pos_unlocked_${boutiqueActiveId}`)
      }
      localStorage.removeItem('nopalou_pos_active_boutique_id')
      localStorage.removeItem('nopalou_pos_user_boutiques')
      
      window.location.href = '/connexion'
    }
  }

  // ── Helper pour générer un label client unique et séquentiel ──────────────────
  function genererLabelClientUnique(tickets: TicketEnAttente[]): string {
    let maxNum = 0
    for (const t of tickets) {
      const match = t.clientLabel.match(/\d+/)
      if (match) {
        const num = parseInt(match[0], 10)
        if (num > maxNum) maxNum = num
      }
    }
    return `Client ${maxNum + 1}`
  }

  // ── Actions Multi-Tickets / File d'attente Client ───────────────────────────
  function mettrePanierEnAttente() {
    if (panier.length === 0) return
    const uniqueId = `T-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    const nouveauLabel = genererLabelClientUnique(ticketsEnAttente)
    const nouveauTicket: TicketEnAttente = {
      id: uniqueId,
      clientLabel: nouveauLabel,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      panier: [...panier],
    }
    setTicketsEnAttente(prev => [...prev, nouveauTicket])
    viderPanier()
  }

  function reprendreTicketEnAttente(ticketId: string) {
    const t = ticketsEnAttente.find(x => x.id === ticketId)
    if (t) {
      if (panier.length > 0) {
        const ticketsRestants = ticketsEnAttente.filter(x => x.id !== ticketId)
        const uniqueId = `T-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
        const nouveauLabel = genererLabelClientUnique(ticketsRestants)
        const ticketPanierActuel: TicketEnAttente = {
          id: uniqueId,
          clientLabel: nouveauLabel,
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          panier: [...panier],
        }
        setTicketsEnAttente([...ticketsRestants, ticketPanierActuel])
      } else {
        setTicketsEnAttente(prev => prev.filter(x => x.id !== ticketId))
      }
      setPanier(t.panier)
      setTabMobile('ticket')
    }
  }

  // ── Actions Caisse & Vente POS (CONTRÔLE STRICT DU STOCK DISPONIBLE !) ───────
  async function ouvrirSession() {
    const fond = Number(fondDeCaisseSaisi) || 0
    try {
      const res = await fetch(`/api/boutiques/${boutiqueActiveId}/pos-sessions/ouvrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caissierNom,
          caissierId: caissierSelectionneId || null,
          fondDeCaisse: fond
        })
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession({
          id: data.session.id,
          dateOuverture: new Date(data.session.date_ouverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          fondDeCaisse: fond,
          caissierNom,
          statut: 'ouverte',
          ventes: {
            total: 0,
            especes: 0,
            wave: 0,
            orangeMoney: 0,
            carte: 0,
            mixte: 0,
            nbVentes: 0
          }
        });
        setModalSessionOuverture(false);
      } else {
        alert(data.error || 'Erreur lors de l’ouverture de la session.');
      }
    } catch (e) {
      console.error('Erreur ouverture session:', e);
      setSession({
        id: `SESS-LOCALE-${Date.now()}`,
        dateOuverture: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        fondDeCaisse: fond,
        caissierNom,
        statut: 'ouverte',
        ventes: {
          total: 0,
          especes: 0,
          wave: 0,
          orangeMoney: 0,
          carte: 0,
          mixte: 0,
          nbVentes: 0
        }
      });
      setModalSessionOuverture(false);
    }
  }

  // AJOUT AU PANIER AVEC VÉRIFICATION DE SESSION ET CONTRÔLE STOCK
  function ajouterAuPanier(p: ProduitCaisse) {
    if (typeof p.stock === 'number' && !isNaN(p.stock)) {
      const itemExistant = panier.find(i => i.produit.id === p.id)
      const qteActuelle = itemExistant ? itemExistant.quantite : 0
      if (qteActuelle >= p.stock) {
        demanderValidationSuperviseur(`Autoriser Vente Hors-Stock (${p.nom} : Stock disponible ${p.stock})`, () => {
          setPanier(prev => {
            const ex = prev.find(i => i.produit.id === p.id)
            if (ex) {
              return prev.map(i => i.produit.id === p.id ? { ...i, quantite: i.quantite + 1 } : i)
            }
            return [...prev, { produit: p, quantite: 1, prixUnitaire: p.prix }]
          })
        })
        return
      }
    }

    setPanier(prev => {
      const index = prev.findIndex(item => item.produit.id === p.id)
      if (index >= 0) {
        const copi = [...prev]
        copi[index].quantite += 1
        return copi
      }
      return [...prev, { produit: p, quantite: 1, prixUnitaire: p.prix }]
    })
  }

  // MODIFICATION QUANTITÉ AVEC VÉRIFICATION DU STOCK MAXIMAL
  function modifierQuantite(id: string, delta: number) {
    const itemTarget = panier.find(i => i.produit.id === id)
    if (!itemTarget) return

    if (delta > 0 && itemTarget.quantite >= itemTarget.produit.stock) {
      demanderValidationSuperviseur(`Autoriser Augmentation Hors-Stock (${itemTarget.produit.nom} : Max Stock ${itemTarget.produit.stock})`, () => {
        setPanier(prev => prev.map(item => {
          if (item.produit.id === id) {
            return { ...item, quantite: item.quantite + delta }
          }
          return item
        }))
      })
      return
    }

    setPanier(prev => prev.map(item => {
      if (item.produit.id === id) {
        const nouvelleQte = item.quantite + delta
        return nouvelleQte > 0 ? { ...item, quantite: nouvelleQte } : null
      }
      return item
    }).filter(Boolean) as LignePanier[])
  }

  function viderPanier() {
    setPanier([])
    setMontantRecu('')
    setMontantEspecesMixte('')
    setRemisePourcentage(0)
    setClientFidelite(null)
    setCagnotteDeduite(0)
    setEncaissementEnCours(false)
  }

  const boutiqueActive = boutiques.find(b => b.id === boutiqueActiveId)
  const regimeFiscal = boutiqueActive?.regime_fiscal || 'reel'
  const prixTvaIncluse = boutiqueActive?.prix_tva_incluse !== false
  const tvaDefaut = Number(boutiqueActive?.tva_taux_defaut ?? 18.00)
  const timbreFiscalApplicable = boutiqueActive?.timbre_fiscal_applicable || false

  const clientSelectionne = clientsCredits.find(c => c.id === clientCreditIdPOS)
  const estExonereClient = clientSelectionne?.exonere_tva || false

  let totalHT = 0
  let totalTVA = 0

  const panierCalcule = panier.map(item => {
    const itemTvaTaux = tvaDefaut
    let ht = 0
    let tva = 0
    let ttc = 0

    if (regimeFiscal === 'non_assujetti' || regimeFiscal === 'exonere' || estExonereClient) {
      ttc = item.prixUnitaire
      ht = item.prixUnitaire
      tva = 0
    } else {
      if (prixTvaIncluse) {
        ttc = item.prixUnitaire
        ht = ttc / (1 + (itemTvaTaux / 100))
        tva = ttc - ht
      } else {
        ht = item.prixUnitaire
        tva = ht * (itemTvaTaux / 100)
        ttc = ht + tva
      }
    }

    totalHT += ht * item.quantite
    totalTVA += tva * item.quantite

    return {
      ...item,
      prixHT: ht,
      prixTTC: ttc,
      tvaMontant: tva * item.quantite
    }
  })

  const sousTotalPanier = panier.reduce((acc, item) => acc + (item.prixUnitaire * item.quantite), 0)
  const montantRemise = Math.round((sousTotalPanier * remisePourcentage) / 100)

  // ── MOTEUR DE REMISE AUTOMATIQUE PAR SEUIL DE PANIER (STANDARD AUCHAN) ──
  useEffect(() => {
    const seuilMontant = Number(boutiqueActive?.pos_remise_seuil_auto_montant || 0)
    const seuilPct = Number(boutiqueActive?.pos_remise_seuil_auto_pct || 0)

    if (seuilMontant > 0 && seuilPct > 0 && sousTotalPanier >= seuilMontant) {
      if (remisePourcentage < seuilPct && (!remiseMotif || remiseMotif.includes('Auto'))) {
        setRemisePourcentage(seuilPct)
        setRemiseMotif(`Remise Seuil Panier Auto (≥ ${fcfa(seuilMontant)})`)
      }
    } else if (seuilMontant > 0 && sousTotalPanier < seuilMontant && remiseMotif.includes('Auto')) {
      setRemisePourcentage(0)
      setRemiseMotif('')
    }
  }, [sousTotalPanier, boutiqueActive?.pos_remise_seuil_auto_montant, boutiqueActive?.pos_remise_seuil_auto_pct])
  
  const totalPanierCalculatedRaw = regimeFiscal === 'non_assujetti' || regimeFiscal === 'exonere' || estExonereClient
    ? sousTotalPanier
    : (prixTvaIncluse ? sousTotalPanier : totalHT + totalTVA)

  const totalPanier = Math.max(0, totalPanierCalculatedRaw - montantRemise)

  let timbreFiscal = 0
  if (timbreFiscalApplicable && modePaiement === 'especes') {
    timbreFiscal = Math.min(5000, Number((totalPanier * 0.01).toFixed(2)))
  }

  const netAPayer = Math.max(0, totalPanier + timbreFiscal - cagnotteDeduite)

  const especesMixteNum = Number(montantEspecesMixte) || 0
  const resteAPayerMixte = Math.max(0, netAPayer - especesMixteNum)

  const recu = Number(montantRecu) || netAPayer
  const monnaieARendre = Math.max(0, recu - netAPayer)

  // ── Raccourcis Clavier Physiques F2 / F4 / F8 / Échap ────────────────────────
  usePosShortcuts({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onTriggerCheckout: () => {
      setTabMobile('ticket')
      if (panier.length > 0) encaisserVente()
    },
    onHoldTicket: mettrePanierEnAttente,
    onClearCartOrDismiss: () => {
      if (modalRemise) { setModalRemise(false); return }
      if (modalFidelite) { setModalFidelite(false); return }
      if (showNumpad) { setShowNumpad(false); return }
      if (modalClotureZ) { setModalClotureZ(false); return }
      if (modalSessionOuverture) { setModalSessionOuverture(false); return }
      if (modalBilanSession) { setModalBilanSession(false); return }
      if (modalHistorique) { setModalHistorique(false); return }
      if (modalCarnet) { setModalCarnet(false); return }
      if (panier.length > 0) viderPanier()
    },
    enabled: !verrouille && !modalSuperviseur && !modalConfigPin,
  })

  async function enregistrerDocumentCaisse(typeDocument: 'devis' | 'proforma') {
    if (netAPayer === 0) return
    if (!session) {
      setModalSessionOuverture(true)
      return
    }

    try {
      const res = await creerBoutiqueDocument(boutiqueActiveId, {
        type: typeDocument,
        client_id: clientCreditIdPOS || null,
        caissier_id: caissierSelectionneId || null,
        statut: 'brouillon',
        items: panier.map(i => ({ id: i.produit.id, quantite: i.quantite, nom: i.produit.nom, prix: i.prixUnitaire })),
        mode_paiement: modePaiement,
        date_echeance: creditDateEcheancePOS || null,
        notes: `${typeDocument.toUpperCase()} créé depuis la caisse POS`
      })

      if (res.error) {
        alert(res.error)
        return
      }

      if (res.id) {
        window.open(`/api/boutiques/${boutiqueActiveId}/documents/${res.id}/pdf`, '_blank')
      }
      alert(`${typeDocument.toUpperCase()} créé avec succès ! Réf : ${res.reference || res.id}`)
      viderPanier()
    } catch (err) {
      console.error(`Erreur création ${typeDocument}:`, err)
      alert(`Erreur lors de la création du ${typeDocument}`)
    }
  }

  async function encaisserVente() {
    if (netAPayer === 0 || encaissementEnCours) return
    if (!session) {
      setModalSessionOuverture(true)
      return
    }

    setEncaissementEnCours(true)

    try {
      const ticketId = `TICK-${Math.floor(10000 + Math.random() * 90000)}`
      const dateStr = new Date().toLocaleDateString('fr-FR')
      const heureStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

      const nouvelleVenteHist: VenteHistorique = {
        id: ticketId,
        date: dateStr,
        heure: heureStr,
        caissier: caissierNom,
        modePaiement,
        total: netAPayer,
        statut: 'validee',
        detailPaiementMixte: modePaiement === 'mixte' ? {
          especes: especesMixteNum,
          autreMode: secondModeMixte.toUpperCase(),
          autreMontant: resteAPayerMixte,
        } : undefined,
        ticket: [...panier],
      }

      setHistoriqueVentes(prev => [nouvelleVenteHist, ...prev])

      if (modePaiement === 'credit_client') {
        if (!clientCreditIdPOS) {
          alert('Veuillez sélectionner un client dans le carnet pour valider la vente à crédit.')
          return
        }
        if (boutiqueActiveId) {
          const debtIdempotency = `DEBT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
          const payloadCredit = {
            idempotency_key: debtIdempotency,
            type: 'vente_credit' as const,
            montant: netAPayer,
            produits: panier.map(i => ({ nom: i.produit.nom, quantite: i.quantite, prix: i.prixUnitaire })),
            date_echeance: creditDateEcheancePOS || null,
            note: creditNotePOS || 'Vente caisse POS à crédit',
            mode_paiement: 'credit',
            relance_auto_whatsapp: true,
          }

          if (!isReallyOnline || offlineModeActive) {
            try {
              await ajouterDetteHorsLigne({
                id_temporaire: debtIdempotency,
                boutique_id: boutiqueActiveId,
                user_id: userId,
                client_id: clientCreditIdPOS,
                type: 'vente_credit',
                montant: netAPayer,
                mode_paiement: 'credit',
                note: creditNotePOS || 'Vente caisse POS à crédit',
                produits: payloadCredit.produits,
                date_echeance: creditDateEcheancePOS || null,
                relance_auto_whatsapp: true,
                date: new Date().toISOString(),
              })
              rafraichirCompteurOffline()
              // Mise à jour optimiste du solde client local
              setClientsCredits(prev => prev.map(c => c.id === clientCreditIdPOS ? { ...c, solde: Number(c.solde || 0) + netAPayer } : c))
            } catch (eOffDebt) {
              console.error('[Caisse POS] Erreur sauvegarde dette offline:', eOffDebt)
            }
          } else {
            try {
              const resCredit = await fetch(`/api/boutiques/${boutiqueActiveId}/credits-clients/${clientCreditIdPOS}/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadCredit)
              })
              if (!resCredit.ok) {
                const dataErr = await resCredit.json().catch(() => ({}))
                alert(dataErr.error || 'Erreur lors de l’enregistrement de la vente à crédit dans le carnet.')
                return
              }
              await chargerClientsCredits(boutiqueActiveId)
            } catch (e) {
              console.error('Erreur réseau vente crédit carnet, bascule secours offline:', e)
              try {
                await ajouterDetteHorsLigne({
                  id_temporaire: debtIdempotency,
                  boutique_id: boutiqueActiveId,
                  user_id: userId,
                  client_id: clientCreditIdPOS,
                  type: 'vente_credit',
                  montant: netAPayer,
                  mode_paiement: 'credit',
                  note: creditNotePOS || 'Vente caisse POS à crédit',
                  produits: payloadCredit.produits,
                  date_echeance: creditDateEcheancePOS || null,
                  relance_auto_whatsapp: true,
                  date: new Date().toISOString(),
                })
                rafraichirCompteurOffline()
                setClientsCredits(prev => prev.map(c => c.id === clientCreditIdPOS ? { ...c, solde: Number(c.solde || 0) + netAPayer } : c))
              } catch (eOffDebt2) { console.warn('[Nopalou:CaisseClient:L2248]', eOffDebt2); }
            }
          }
        }
      }

      if (boutiqueActiveId) {
        const uniquePosRef = `POS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        const payloadVente = {
          idempotency_key: uniquePosRef,
          items: panier.map(i => ({ id: i.produit.id, quantite: i.quantite, nom: i.produit.nom, prix: i.prixUnitaire })),
          caissier: caissierNom,
          caissier_id: caissierSelectionneId || null,
          session_id: session?.id || null,
          modePaiement,
          client_id: clientCreditIdPOS || null,
          fidelite_client_id: clientFidelite?.id || null,
          deduction_cagnotte_fcfa: cagnotteDeduite || 0,
          remise_pourcentage: remisePourcentage || 0,
          total: netAPayer,
          especes_mixte: modePaiement === 'mixte' ? especesMixteNum : undefined,
          second_mode_mixte: modePaiement === 'mixte' ? secondModeMixte : undefined,
          montant_mixte2: modePaiement === 'mixte' ? resteAPayerMixte : undefined,
        }

        if (!isReallyOnline || offlineModeActive) {
          try {
            const temporaryId = payloadVente.idempotency_key
            await ajouterVenteHorsLigne({
              id_temporaire: temporaryId,
              boutique_id: boutiqueActiveId,
              user_id: userId,
              session_id: session?.id || null,
              caissier_id: caissierSelectionneId || null,
              items: payloadVente.items,
              caissier: payloadVente.caissier,
              modePaiement: payloadVente.modePaiement,
              client_id: payloadVente.client_id,
              total: payloadVente.total,
              date: new Date().toISOString()
            })
            rafraichirCompteurOffline()
          } catch (eOff) {
            console.error('[Caisse POS] Erreur stockage local vente:', eOff)
          }
        } else {
          try {
            const result = await creerPosVente(boutiqueActiveId, payloadVente)
            if (!result.success) {
              throw new Error(result.error || 'Impossible d\'enregistrer la vente')
            }
          } catch (e) {
            console.error('[Caisse POS] Échec direct serveur, bascule secours sur IndexedDB local:', e)
            try {
              const temporaryId = payloadVente.idempotency_key
              await ajouterVenteHorsLigne({
                id_temporaire: temporaryId,
                boutique_id: boutiqueActiveId,
                user_id: userId,
                session_id: session?.id || null,
                caissier_id: caissierSelectionneId || null,
                items: payloadVente.items,
                caissier: payloadVente.caissier,
                modePaiement: payloadVente.modePaiement,
                client_id: payloadVente.client_id,
                total: payloadVente.total,
                date: new Date().toISOString()
              })
              rafraichirCompteurOffline()
            } catch (eOff2) { console.warn('[Nopalou:CaisseClient:L2317]', eOff2); }
          }
        }
      }

      setSession(prev => {
        if (!prev) return null
        const stats = { ...prev.ventes }
        stats.total += netAPayer
        stats.nbVentes += 1
        if (modePaiement === 'especes') stats.especes += netAPayer
        if (modePaiement === 'wave') stats.wave += netAPayer
        if (modePaiement === 'orange_money') stats.orangeMoney += netAPayer
        if (modePaiement === 'carte') stats.carte += netAPayer
        if (modePaiement === 'mixte') {
          stats.especes += especesMixteNum
          if (secondModeMixte === 'wave') stats.wave += resteAPayerMixte
          if (secondModeMixte === 'orange_money') stats.orangeMoney += resteAPayerMixte
          if (secondModeMixte === 'carte') stats.carte += resteAPayerMixte
          stats.mixte += netAPayer
        }
        return { ...prev, ventes: stats }
      })

      // Décrémenter le stock localement après encaissement, persister dans LocalStorage et recharger depuis le backend
      setProduits(prev => {
        const updated = prev.map(p => {
          const itemPanier = panier.find(i => i.produit.id === p.id)
          if (itemPanier) {
            return { ...p, stock: Math.max(0, p.stock - itemPanier.quantite) }
          }
          return p
        })
        if (boutiqueActiveId) {
          localStorage.setItem(`nopalou_pos_produits_${boutiqueActiveId}`, JSON.stringify(updated))
          sauvegarderProduitsLocaux(updated, boutiqueActiveId, userId).catch(() => {})
        }
        return updated
      })

      if (boutiqueActiveId) {
        setTimeout(() => {
          chargerProduitsBoutique(boutiqueActiveId)
        }, 500)
      }

      const venteImprimee = {
        id: ticketId,
        date: dateStr,
        heure: heureStr,
        total: totalPanier,
        remise: montantRemise,
        remiseMotif: remiseMotif || '',
        recu,
        monnaie: monnaieARendre,
        ticket: [...panier],
        mode: modePaiement.toUpperCase(),
        caissier: caissierNom,
        detailMixte: modePaiement === 'mixte' ? {
          especes: especesMixteNum,
          autreMode: secondModeMixte.toUpperCase(),
          autreMontant: resteAPayerMixte,
        } : undefined,
      }

      setDerniereVente(venteImprimee)

      setTimeout(() => {
        window.print()
      }, 300)

      viderPanier()
    } finally {
      setEncaissementEnCours(false)
    }
  }

  // Incident de caisse : Annulation / Remboursement d'une vente par le Superviseur
  function annulerRembourserVente(venteId: string) {
    const targetVente = historiqueVentes.find(v => v.id === venteId)
    if (!targetVente || targetVente.statut === 'annulee') return

    demanderValidationSuperviseur(`Annulation et Remboursement du Ticket ${venteId}`, () => {
      const motif = prompt(`Motif de l'annulation pour le ticket ${venteId} :`, 'Erreur de frappe / Produit retourné') || 'Annulation caisse'

      setProduits(prev => prev.map(p => {
        const itemVente = targetVente.ticket.find(i => i.produit.id === p.id)
        if (itemVente) {
          return { ...p, stock: p.stock + itemVente.quantite }
        }
        return p
      }))

      setHistoriqueVentes(prev => prev.map(v => v.id === venteId ? { ...v, statut: 'annulee', motifAnnulation: motif } : v))

      if (boutiqueActiveId) {
        declarerIncident(boutiqueActiveId, {
          ticketId: targetVente.id,
          type: 'annulation',
          items: targetVente.ticket.map(i => ({ id: i.produit.id, quantite: i.quantite })),
        }).catch(() => {})
      }

      setSession(prev => {
        if (!prev) return null
        const stats = { ...prev.ventes }
        stats.total = Math.max(0, stats.total - targetVente.total)
        stats.nbVentes = Math.max(0, stats.nbVentes - 1)
        if (targetVente.modePaiement === 'especes') stats.especes = Math.max(0, stats.especes - targetVente.total)
        if (targetVente.modePaiement === 'wave') stats.wave = Math.max(0, stats.wave - targetVente.total)
        if (targetVente.modePaiement === 'orange_money') stats.orangeMoney = Math.max(0, stats.orangeMoney - targetVente.total)
        if (targetVente.modePaiement === 'carte') stats.carte = Math.max(0, stats.carte - targetVente.total)
        return { ...prev, ventes: stats }
      })

      alert(`Ticket ${venteId} annulé et remboursé avec succès ! Les stocks ont été réintégrés.`)
    })
  }

  // ── Fonctions d'Exportation Excel & PDF ────────────────────────────────────
  function exporterHistoriqueCSV() {
    const headers = ['ID Ticket', 'Date', 'Heure', 'Caissier', 'Mode Paiement', 'Total (FCFA)', 'Statut']
    const rows = historiqueVentes.map(v => [
      v.id,
      v.date,
      v.heure,
      v.caissier,
      v.modePaiement.toUpperCase(),
      v.total,
      v.statut === 'annulee' ? 'ANNULÉE' : 'VALIDÉE'
    ])
    exportToCSV(`historique_ventes_caisse_${boutiqueActiveId || 'pos'}`, headers, rows)
  }

  function exporterHistoriquePDF() {
    const headers = ['ID Ticket', 'Date & Heure', 'Caissier', 'Mode Paiement', 'Total (FCFA)', 'Statut']
    const rows = historiqueVentes.map(v => [
      v.id,
      `${v.date} ${v.heure}`,
      v.caissier,
      v.modePaiement.toUpperCase(),
      `${v.total.toLocaleString('fr-FR')} FCFA`,
      v.statut === 'annulee' ? 'ANNULÉE' : 'VALIDÉE'
    ])
    const totalCA = historiqueVentes.filter(v => v.statut !== 'annulee').reduce((s, v) => s + v.total, 0)
    const summaryHtml = `
      <div class="summary">
        <h3 style="margin:0 0 6px; color:#1e293b;">Résumé du Journal de Caisse</h3>
        <p style="margin:0; font-size:14px; font-weight:bold; color:#16a34a;">Chiffre d'Affaires Encaissé : ${totalCA.toLocaleString('fr-FR')} FCFA (${historiqueVentes.length} tickets)</p>
      </div>
    `
    printPDFReport('Journal & Historique des Ventes POS', `Boutique ${boutiqueActiveId || 'Nopalou'}`, headers, rows, summaryHtml)
  }

  function exporterClotureCSV() {
    if (!session) return
    const headers = ['Session ID', 'Date Ouverture', 'Caissier', 'Fond Initial', 'Ventes Espèces', 'Wave', 'Orange Money', 'Carte', 'Total Ventes']
    const rows = [[
      session.id,
      session.dateOuverture,
      session.caissierNom,
      session.fondDeCaisse,
      session.ventes.especes,
      session.ventes.wave,
      session.ventes.orangeMoney,
      session.ventes.carte,
      session.ventes.total
    ]]
    exportToCSV(`cloture_session_${session.id}`, headers, rows)
  }

  function exporterCloturePDF() {
    if (!session) return
    const totalEspecesFinal = session.fondDeCaisse + session.ventes.especes
    const headers = ['Rubrique', 'Détail / Montant (FCFA)']
    const rows = [
      ['Caissier connecté', session.caissierNom],
      ['Heure d\'Ouverture', session.dateOuverture],
      ['Fond de Caisse Initial', `${session.fondDeCaisse.toLocaleString('fr-FR')} FCFA`],
      ['Encaissements Espèces', `${session.ventes.especes.toLocaleString('fr-FR')} FCFA`],
      ['Encaissements Wave', `${session.ventes.wave.toLocaleString('fr-FR')} FCFA`],
      ['Encaissements Orange Money', `${session.ventes.orangeMoney.toLocaleString('fr-FR')} FCFA`],
      ['Encaissements Carte Bancaire', `${session.ventes.carte.toLocaleString('fr-FR')} FCFA`],
      ['Nombre Total de Ventes', `${session.ventes.nbVentes} vente(s)`],
      ['Total Chiffre d\'Affaires Session', `${session.ventes.total.toLocaleString('fr-FR')} FCFA`],
      ['TOTAL ESPÈCES À RETROUVER DANS LE TIROIR', `${totalEspecesFinal.toLocaleString('fr-FR')} FCFA`]
    ]
    printPDFReport(`Rapport de Clôture Z — Session ${session.id}`, `Boutique ${boutiqueActiveId || 'Nopalou'}`, headers, rows)
  }

  // Produits filtrés avec recherche phonétique Wolof et synonymes locaux
  const produitsFiltres = useMemo(() => {
    let result = produits.filter(p => {
      const matchCat = categorieFiltre === 'tous' || p.categorie === categorieFiltre
      const matchSearch = !recherche || matcherProduitRecherche(p, recherche)
      return matchCat && matchSearch
    })
    if (recherche && recherche.trim()) {
      result.sort((a, b) => scorePertinenceProduit(b, recherche) - scorePertinenceProduit(a, recherche))
    }
    return result
  }, [produits, categorieFiltre, recherche])

  // ── ÉCRAN DE VERROUILLAGE SI BOUTIQUE NON AUTORISÉE À LA CAISSE POS ──────
  if (!estBoutiqueAutorisee) {
    return (
      <PosNonAutoriseScreen
        boutiques={boutiques}
        activeBoutiqueNom={activeBoutiqueObj?.nom}
        boutiqueActiveId={boutiqueActiveId}
        initialToken={initialToken}
        onChangerBoutique={changerBoutiqueActive}
      />
    )
  }

  // ── Modales de Gestion des PINs & Configuration (Disponibles Verrouillé ou Déverrouillé) ──
  function renderModalesGestionPin() {
    return (
      <>
        {/* Modale Configuration Obligatoire */}
        <PosModalGestionPins
          isOpen={modalConfigObligatoire}
          isObligatoire={true}
          boutiqueId={boutiqueActiveId}
          caissiersList={caissiersList}
          onClose={() => setModalConfigObligatoire(false)}
          onSuccess={() => {
            setModalConfigObligatoire(false)
            if (boutiqueActiveId) chargerCaissiersEtSession(boutiqueActiveId)
          }}
          onRefreshCaissiers={() => {
            if (boutiqueActiveId) chargerCaissiersEtSession(boutiqueActiveId)
          }}
        />

        {/* Modale Gestion Équipe / Modification des PINs */}
        <PosModalGestionPins
          isOpen={modalConfigPin}
          isObligatoire={false}
          boutiqueId={boutiqueActiveId}
          caissiersList={caissiersList}
          onClose={() => setModalConfigPin(false)}
          onSuccess={() => {
            setModalConfigPin(false)
            if (boutiqueActiveId) chargerCaissiersEtSession(boutiqueActiveId)
          }}
          onRefreshCaissiers={() => {
            if (boutiqueActiveId) chargerCaissiersEtSession(boutiqueActiveId)
          }}
        />

        {/* Modale Dédiée Validation Superviseur */}
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
      </>
    )
  }

    // ── ÉCRAN DE VERROUILLAGE PIN SÉCURISÉ & SÉLECTION CAISSIER ─────────────────
  if (verrouille) {
    const bqName = boutiques.find(b => b.id === boutiqueActiveId)?.nom || (boutiques[0]?.nom) || ''
    const caissiersActifs = caissiersList.filter((c: any) => c.actif !== false)

    // S'il y a plus d'un caissier et que l'utilisateur n'a pas encore cliqué sur un profil :
    const vueChoixCaissier = caissiersActifs.length > 1 && !profilChoisiPourPin
    const cibleCaissier = profilChoisiPourPin || (caissiersActifs.length === 1 ? caissiersActifs[0] : (caissierSelectionneId ? caissiersActifs.find(c => c.id === caissierSelectionneId) : caissiersActifs[0]))

    return (
      <div style={{ background: 'var(--pos-bg)', color: 'var(--pos-text)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif', position: 'relative' }}>
        <div style={{
          background: 'var(--pos-surface, #ffffff)',
          border: '2px solid var(--pos-primary, #ea580c)',
          borderRadius: 24,
          padding: '28px 24px',
          width: '100%',
          maxWidth: vueChoixCaissier ? 480 : 400,
          textAlign: 'center',
          boxShadow: 'var(--pos-shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          transition: 'max-width 0.2s ease',
          boxSizing: 'border-box'
        }}>
          {/* Logo Boutique */}
          {activeBoutiqueObj?.logo ? (
            <img
              src={activeBoutiqueObj.logo}
              alt={bqName}
              style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', margin: '0 auto 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'block' }}
            />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 24, fontWeight: 900, boxShadow: '0 4px 12px rgba(199,91,0,0.3)' }}>
              {bqName ? bqName.charAt(0).toUpperCase() : ''}
            </div>
          )}
          <h2 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 900, color: 'var(--pos-navy, #0f172a)' }}>
            Caisse POS {bqName ? `· ${bqName}` : 'Nopalou'}
          </h2>

          {/* Bannière Mode */}
          {initialToken ? (
            <div style={{
              margin: '0 0 14px',
              padding: '7px 12px',
              borderRadius: 10,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              fontSize: 12,
              color: '#1e40af',
              lineHeight: 1.35,
              textAlign: 'center'
            }}>
              <strong>Terminal Dédié Magasin (Mode Autonome)</strong><br />
              <span style={{ fontSize: 11, color: '#3b82f6' }}>
                Aucun compte connecté sur cet appareil. Vos paramètres et finances sont 100% isolés et protégés.
              </span>
            </div>
          ) : (
            <div style={{
              margin: '0 0 14px',
              padding: '7px 12px',
              borderRadius: 10,
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              fontSize: 12,
              color: '#9a3412',
              lineHeight: 1.35,
              textAlign: 'center'
            }}>
              <strong>Session Gérant Connectée</strong><br />
              <span style={{ fontSize: 11, color: '#c2410c' }}>
                Pour une tablette partagée avec vos caissiers, utilisez le <strong>Lien Terminal Dédié</strong> sans session gérant.
              </span>
            </div>
          )}

          {/* VUE 1 : GRILLE DE SÉLECTION « QUI ENCAISSE ? » (Quand > 1 caissier) */}
          {vueChoixCaissier ? (
            <div>
              <h3 style={{ margin: '12px 0 4px', fontSize: 17, fontWeight: 900, color: 'var(--pos-navy, #0f172a)' }}>
                Qui encaisse aujourd&apos;hui ?
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--pos-text2, #64748b)' }}>
                Sélectionnez votre profil pour accéder à la caisse :
              </p>

              {/* Grille Tactile des Profils Caissiers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: 16,
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {caissiersActifs.map((c: any) => {
                  const isSuper = c.role === 'superviseur' || c.role === 'admin'
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCaissierSelectionneId(c.id)
                        setProfilChoisiPourPin(c)
                        setCodePinSaisi('')
                        setPinError(null)
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '16px 10px',
                        borderRadius: 16,
                        border: isSuper ? '2px solid #fed7aa' : '2px solid #bfdbfe',
                        background: isSuper ? '#fffaf5' : '#f8faff',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box',
                        width: '100%'
                      }}
                    >
                      {/* Avatar rond */}
                      <div style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: isSuper
                          ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                          : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        fontWeight: 900,
                        marginBottom: 8,
                        boxShadow: isSuper ? '0 4px 10px rgba(234, 88, 12, 0.25)' : '0 4px 10px rgba(37, 99, 235, 0.25)',
                      }}>
                        {isSuper ? <Shield size={24} /> : (c.prenom ? c.prenom.charAt(0).toUpperCase() : (c.nom ? c.nom.charAt(0).toUpperCase() : ''))}
                      </div>

                      {/* Nom du caissier */}
                      <span style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: 'var(--pos-navy, #0f172a)',
                        marginBottom: 4,
                        textAlign: 'center',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {c.prenom ? `${c.prenom} ${c.nom || ''}`.trim() : c.nom}
                      </span>

                      {/* Badge rôle */}
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: isSuper ? '#fff7ed' : '#eff6ff',
                        color: isSuper ? '#c2410c' : '#1d4ed8',
                        border: isSuper ? '1px solid #fed7aa' : '1px solid #bfdbfe'
                      }}>
                        {isSuper ? 'Superviseur' : 'Caissier'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Bouton d'accès gestion d'équipe pour le Gérant */}
              <button
                type="button"
                onClick={ouvrirConfigPin}
                style={{
                  marginTop: 4, background: 'none', border: 'none', color: 'var(--pos-primary, #ea580c)',
                  fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8
                }}
              >
                <KeyRound size={14} />
                <span>Gérant : Gérer l&apos;équipe & modifier les codes PIN</span>
              </button>
            </div>
          ) : (
            /* VUE 2 : SAISIE DU CODE PIN POUR LE CAISSIER CHOISI */
            <div>
              {/* Bouton retour choix profils si plusieurs caissiers */}
              {caissiersActifs.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setProfilChoisiPourPin(null)
                      setCodePinSaisi('')
                      setPinError(null)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '5px 10px',
                      color: '#334155',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>Choisir un autre profil</span>
                  </button>
                </div>
              )}

              {/* Profil Actif en cours de déverrouillage */}
              {cibleCaissier && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 14,
                  background: cibleCaissier.role === 'superviseur' ? '#fff7ed' : '#eff6ff',
                  border: cibleCaissier.role === 'superviseur' ? '1.5px solid #fed7aa' : '1.5px solid #bfdbfe',
                  marginBottom: 14,
                  textAlign: 'left'
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: cibleCaissier.role === 'superviseur'
                      ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                      : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 900,
                    flexShrink: 0
                  }}>
                    {cibleCaissier.role === 'superviseur' ? <Shield size={18} /> : (cibleCaissier.prenom ? cibleCaissier.prenom.charAt(0).toUpperCase() : '')}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--pos-navy, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cibleCaissier.prenom ? `${cibleCaissier.prenom} ${cibleCaissier.nom || ''}`.trim() : cibleCaissier.nom}
                    </div>
                    <div style={{ fontSize: 11, color: cibleCaissier.role === 'superviseur' ? '#c2410c' : '#1d4ed8', fontWeight: 700 }}>
                      {cibleCaissier.role === 'superviseur' ? 'Gérant / Superviseur' : 'Caissier'} · Tapez votre code PIN
                    </div>
                  </div>
                </div>
              )}

              {/* Pastilles Visuelles de Chiffres PIN (Feedback Tactile) */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
                {[0, 1, 2, 3].map(i => {
                  const isFilled = codePinSaisi.length > i;
                  return (
                    <div
                      key={i}
                      style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: isFilled ? 'var(--pos-primary, #ea580c)' : 'var(--pos-surface2, #f1f5f9)',
                        border: isFilled ? '2px solid var(--pos-primary, #ea580c)' : '2px solid var(--pos-border, #cbd5e1)',
                        transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  );
                })}
              </div>

              {pinError && <p style={{ margin: '0 0 12px', color: 'var(--pos-danger, #dc2626)', fontSize: 13, fontWeight: 700 }}>{pinError}</p>}

              {/* Clavier Numérique PIN Pad Tactile */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      if (val === 'C') {
                        setCodePinSaisi('')
                        setPinError(null)
                      } else if (val === '⌫') {
                        setCodePinSaisi(prev => prev.slice(0, -1))
                        setPinError(null)
                      } else if (codePinSaisi.length < 6) {
                        const nextPin = codePinSaisi + val
                        setCodePinSaisi(nextPin)
                        setPinError(null)
                      }
                    }}
                    style={{
                      padding: '16px', background: 'var(--pos-surface2, #f8fafc)', border: '1.5px solid var(--pos-border, #cbd5e1)', borderRadius: 10,
                      color: 'var(--pos-navy, #0f172a)', fontWeight: 800, fontSize: 18, cursor: 'pointer', userSelect: 'none',
                      transition: 'background 0.1s',
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Bouton d'accès gestion d'équipe pour le Gérant */}
              <button
                type="button"
                onClick={ouvrirConfigPin}
                style={{
                  marginTop: 6, background: 'none', border: 'none', color: 'var(--pos-primary, #ea580c)',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 8px', borderRadius: 8
                }}
              >
                <span></span>
                <span>Gérant : Gérer l&apos;équipe & codes PIN</span>
              </button>
            </div>
          )}

          {/* Actions de sortie et lien terminal (communes au bas de la carte) */}
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--pos-border, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {!initialToken && (
              <button
                type="button"
                onClick={() => {
                  const activeB = boutiques.find(b => b.id === boutiqueActiveId) || boutiques[0];
                  const tok = (activeB as any)?.caisse_token || boutiqueActiveId;
                  if (tok && typeof window !== 'undefined') {
                    const terminalUrl = `${window.location.origin}/boutique/caisse?token=${tok}`;
                    navigator.clipboard.writeText(terminalUrl);
                    alert(`Lien Terminal Dédié copié !\n\nOuvrez ce lien sur la tablette ou l'ordinateur de vos caissiers pour qu'ils travaillent sans avoir accès à votre compte :\n${terminalUrl}`);
                  }
                }}
                style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8, transition: 'all 0.15s ease'
                }}
              >
                <span></span>
                <span>Copier le Lien Terminal Caissier (Pour tablette)</span>
              </button>
            )}

            <button
              type="button"
              onClick={seDeconnecterCompte}
              style={{
                background: 'none', border: 'none', color: '#dc2626',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6
              }}
            >
              <LogOut size={13} />
              <span>Déconnexion du compte Nopalou (Quitter)</span>
            </button>
          </div>
        </div>

        {/* Injection des modales actives (Configuration Obligatoire, Équipe & Superviseur) */}
        {renderModalesGestionPin()}
      </div>
    )
  }



  async function handleValiderTransCarnet() {
    const totalPanierCatalogueCarnet = Object.entries(panierCarnet).reduce((sum, [pId, qte]) => {
      const p = produits.find(item => item.id === pId)
      const prix = p ? Number(p.prix || 0) : 0
      return sum + (prix * qte)
    }, 0)

    const num = (typeTransCarnet === 'vente_credit' && modeSaisieCarnet === 'catalogue') 
      ? totalPanierCatalogueCarnet 
      : (Number(montantTransCarnet) || 0)

    if (!num || num <= 0) {
      alert('Veuillez ajouter au moins un produit du catalogue ou saisir un montant valide.')
      return
    }
    if (boutiqueActiveId && clientCarnetSelectionne) {
      setSubmittingCarnetTrans(true)
      try {
        let prodsArr: any[] = []
        if (typeTransCarnet === 'vente_credit' && modeSaisieCarnet === 'catalogue') {
          prodsArr = Object.entries(panierCarnet).map(([pId, qte]) => {
            const p = produits.find(item => item.id === pId)
            return {
              id: pId,
              nom: p?.nom || 'Article catalogue',
              quantite: qte,
              prix: Number(p?.prix || 0),
            }
          })
        } else {
          const nomDefaut = typeTransCarnet === 'remboursement' ? 'Remboursement client' : 'Vente directe'
          prodsArr = [{ nom: produitsTransCarnet.trim() || nomDefaut, quantite: 1, prix: num }]
        }

        const noteCalcul = (typeTransCarnet === 'vente_credit' && modeSaisieCarnet === 'catalogue')
          ? `Achat catalogue (${prodsArr.length} article(s))`
          : (noteTransCarnet.trim() || (typeTransCarnet === 'remboursement' ? 'Remboursement client' : 'Vente directe'))

        const res = await fetch(`/api/boutiques/${boutiqueActiveId}/credits-clients/${clientCarnetSelectionne.id}/transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: typeTransCarnet,
            montant: num,
            mode_paiement: modePaiementTransCarnet,
            note: noteCalcul,
            date_echeance: dateEcheanceTransCarnet || null,
            relance_auto_whatsapp: relanceAutoWaCarnet,
            produits: prodsArr,
          })
        })

        if (res.ok) {
          const dataTrans = await res.json()
          setClientCarnetSelectionne((prev: any) => prev ? { ...prev, solde: dataTrans.nouveauSolde } : null)
          await chargerClientsCredits(boutiqueActiveId)
          await chargerHistoriqueClientSelectionne(clientCarnetSelectionne.id)
          setModalTransCarnet(false)
        } else {
          const errData = await res.json()
          alert(errData.error || 'Erreur lors de l’enregistrement.')
        }
      } catch (e) {
        console.error('Erreur transaction carnet:', e)
      } finally {
        setSubmittingCarnetTrans(false)
      }
    }
  }

  return (
    <div className={`caisse-root ${isDarkMode ? 'pos-theme-dark' : 'pos-theme-light'}`} style={{ background: 'var(--pos-bg)', color: 'var(--pos-text)', minHeight: '100vh', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Toast Notification (Offline/Online) */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 10000,
          background: toastMsg.type === 'warning' ? '#fef3c7' : '#dcfce7',
          color: toastMsg.type === 'warning' ? '#92400e' : '#166534',
          border: `1px solid ${toastMsg.type === 'warning' ? '#fcd34d' : '#bbf7d0'}`,
          padding: '12px 20px', borderRadius: 24, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 14,
          animation: 'slideUp 0.3s ease-out'
        }}>
          {toastMsg.type === 'warning' ? '' : ''}
          {toastMsg.text}
        </div>
      )}

      {/* En-tête Caisse POS Pro (Composant Extrait & Modulaire) */}
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
        menuOutilsOuvert={menuOutilsOuvert}
        clientsCreditsCount={clientsCredits.length}
        historiqueVentesCount={historiqueVentes.length}
        t={t as any}
        onQuitterVersDashboard={quitterVersDashboard}
        onDemanderValidationSuperviseur={demanderValidationSuperviseur}
        onDeclencherSyncOffline={declencherSyncOffline}
        onDemanderChangementBoutique={demanderChangementBoutique}
        onOpenModalChangerCaissier={() => setModalChangerCaissier(true)}
        onToggleDarkMode={toggleDarkMode}
        onToggleLayoutColCentrale={toggleLayoutColCentrale}
        onToggleMenuOutils={() => setMenuOutilsOuvert(!menuOutilsOuvert)}
        onOpenModalTiroirCaisse={() => setModalTiroirCaisse(true)}
        onOpenModalClotureZ={() => setModalClotureZ(true)}
        onOpenModalSessionOuverture={() => setModalSessionOuverture(true)}
        onOpenModalBilanSession={() => {
          setModalBilanSession(true)
          if (boutiqueActiveId) {
            fetch(`/api/boutiques/${boutiqueActiveId}/pos-sessions/rapport-x/log`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ caissierNom, totalVentes: session?.ventes?.total || 0, nbVentes: session?.ventes?.nbVentes || 0 }),
            }).catch(() => {})
          }
        }}
        onOpenModalImportBatch={() => setModalImportBatch(true)}
        onOpenConfigPin={ouvrirConfigPin}
        onOpenModalHistorique={() => setModalHistorique(true)}
        onOpenModalCarnet={() => setModalCarnet(true)}
        onVerrouillerCaisseManuellement={verrouillerCaisseManuellement}
        onSeDeconnecterCompte={seDeconnecterCompte}
      />

      {/* Sélecteur d'Onglets Mobile (Visible <= 1024px) */}
      <div className="caisse-mobile-tabs no-print">
        <button
          type="button"
          onClick={() => setTabMobile('catalogue')}
          className={`caisse-mobile-tab-btn ${tabMobile === 'catalogue' ? 'active' : ''}`}
        >
          Catalogue ({produitsFiltres.length})
        </button>
        <button
          type="button"
          onClick={() => setTabMobile('ticket')}
          className={`caisse-mobile-tab-btn ${tabMobile === 'ticket' ? 'active' : ''} ${panier.length > 0 ? 'has-items' : ''}`}
        >
          Ticket ({panier.reduce((sum, item) => sum + item.quantite, 0)}) • {fcfa(netAPayer)}
          {ticketsEnAttente.length > 0 && (
            <span style={{ marginLeft: 6, background: '#c2410c', color: '#fff', padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
              {ticketsEnAttente.length} en attente
            </span>
          )}
        </button>
      </div>

      {/* File d'attente Multi-Clients (1, 2, 3 clients simultanés) — Visibilité Universelle Mobile & Desktop */}
      <PosTicketsAttenteBar tickets={ticketsEnAttente} onReprendre={reprendreTicketEnAttente} />

      {/* Main Grid Caisse (2 Colonnes ou 3 Colonnes avec Pupitre Tactile Pro) */}
      <div className={`caisse-main-layout ${layoutColCentrale ? 'has-3-cols' : 'has-2-cols'}`}>

        {/* Côté Gauche : Recherche & Catalogue Produits Réel avec Décrémentation Dynamique du Stock */}
        <div className={`caisse-catalogue-section ${tabMobile === 'catalogue' ? 'mobile-active' : 'mobile-hidden'}`} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', background: 'var(--pos-surface2)', borderRight: '1px solid var(--pos-border)' }}>
          


          {/* Barre de Recherche Code-Barres & Nom + Scanner Caméra (Responsive Mobile 2 Lignes) */}
          {/* Barre de Recherche Code-Barres & Nom + Scanner Caméra (Agrandie & Épurée) */}
          <div className="caisse-search-row" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--pos-text3)' }}>
                <Search size={18} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('caisse.searchPlaceholder')}
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{
                  width: '100%', padding: '13px 16px 13px 42px', borderRadius: 12, border: '1.5px solid var(--pos-border)',
                  background: 'var(--pos-surface)', color: 'var(--pos-text)', fontSize: 14.5, fontWeight: 600, boxSizing: 'border-box',
                  boxShadow: 'var(--pos-shadow)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--pos-primary)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--pos-border)'; }}
              />
              {recherche && (
                <button
                  type="button"
                  onClick={() => setRecherche('')}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'var(--pos-surface2)', border: 'none', borderRadius: '50%',
                    width: 22, height: 22, color: 'var(--pos-text2)', fontSize: 12, fontWeight: 800,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="caisse-search-row-btns" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={demarrerScannerCamera}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0 14px', height: 46, borderRadius: 12,
                  background: '#0284c7', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: 13,
                  cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(2,132,199,0.3)',
                  transition: 'all 0.15s ease', flexShrink: 0
                }}
                title="Scanner avec la caméra"
              >
                <Camera size={18} />
                <span>Scanner</span>
              </button>

              <button
                type="button"
                onClick={() => setModalPairageSmartphone(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0 14px', height: 46, borderRadius: 12,
                  background: 'var(--pos-surface)', color: 'var(--pos-text)', border: '1.5px solid var(--pos-border)', fontWeight: 800, fontSize: 13,
                  cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: 'var(--pos-shadow)',
                  transition: 'all 0.15s ease', flexShrink: 0
                }}
                title="Connecter la caméra de votre smartphone comme douchette sans fil"
              >
                <span>Douchette</span>
              </button>

              <PosVoiceInput
                produits={produits}
                onAjouterProduit={(p, q) => {
                  for (let i = 0; i < q; i++) {
                    ajouterAuPanier(p as any)
                  }
                }}
                onAjoutRapideLibre={(nom, montant, qte) => {
                  const itemLibre: ProduitCaisse = {
                    id: `vocal-${Date.now()}`,
                    nom: nom || 'Article Comptoir',
                    prix: montant,
                    stock: 9999,
                    categorie: 'divers'
                  }
                  for (let i = 0; i < qte; i++) {
                    ajouterAuPanier(itemLibre)
                  }
                }}
              />
            </div>
          </div>

          {/* Filtre Catégories (Fluidité Tactile & Scroll Sans Coupure) et Toggle Vue */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 6 }}>
            {/* Bouton de bascule d'affichage */}
            <button
              onClick={() => setVueCatalogue(prev => prev === 'mosaique' ? 'liste' : 'mosaique')}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                width: 44, height: 40, borderRadius: 10,
                background: 'var(--pos-surface)', color: 'var(--pos-text)', border: '1.5px solid var(--pos-border)', 
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: 'var(--pos-shadow)'
              }}
              title={`Passer en vue ${vueCatalogue === 'mosaique' ? 'liste' : 'mosaïque'}`}
            >
              {vueCatalogue === 'mosaique' ? <AlignJustify size={18} /> : <LayoutGrid size={18} />}
            </button>

            {/* Barre déroulante des catégories */}
            <div className="nopalou-scroll-tabs caisse-categories-bar" style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              {[
                { id: 'tous', label: t('caisse.allArticles') },
              ...CATEGORIES.filter(c => c.value !== 'mixte').map(c => {
                const catKey = `caisse.cat_${c.value.replace(/-/g, '_')}` as any;
                const translated = t(catKey);
                return {
                  id: c.value,
                  label: (translated && translated !== catKey) ? translated : c.label
                };
              })
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setCategorieFiltre(c.id)}
                style={{
                  padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                  flexShrink: 0,
                  background: categorieFiltre === c.id ? 'var(--pos-primary)' : 'var(--pos-surface)',
                  color: categorieFiltre === c.id ? '#ffffff' : 'var(--pos-text)',
                  fontWeight: categorieFiltre === c.id ? 800 : 600, fontSize: 13, cursor: 'pointer',
                  border: categorieFiltre === c.id ? '1px solid var(--pos-primary)' : '1px solid var(--pos-border)',
                  boxShadow: categorieFiltre === c.id ? '0 3px 8px rgba(249,115,22,0.35)' : 'none',
                }}
              >
                {c.label}
              </button>
            ))}
            </div>
          </div>

          {/* Grille des produits Réels avec Affichage Dynamique du Stock Restant */}
          {loadingProduits ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--pos-text3)', fontSize: 14 }}>
              Chargement du catalogue de la boutique…
            </div>
          ) : produitsFiltres.length === 0 ? (
            <div style={{ background: 'var(--pos-surface)', border: '1px dashed var(--pos-border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}></div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: 'var(--pos-text)' }}>
                Aucun produit dans le catalogue de cette boutique
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--pos-text2)' }}>
                Importez des articles modèles ou créez vos produits dans votre catalogue.
              </p>
              {roleActif === 'superviseur' && (
                <button
                  onClick={() => setModalImportBatch(true)}
                  style={{ background: 'var(--pos-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  + Importer des Produits Modèle (Batch Intake) →
                </button>
              )}
            </div>
          ) : (
            <div className="produits-grid" style={{ 
              display: vueCatalogue === 'mosaique' ? 'grid' : 'flex', 
              gridTemplateColumns: vueCatalogue === 'mosaique' ? 'repeat(auto-fill, minmax(140px, 1fr))' : undefined, 
              flexDirection: vueCatalogue === 'liste' ? 'column' : undefined,
              gap: 10 
            }}>
              {produitsFiltres.map(p => {
                // Déduire la quantité déjà placée dans le panier en direct
                const qteAuPanier = panier.find(i => i.produit.id === p.id)?.quantite || 0
                const isStockValide = typeof p.stock === 'number' && !isNaN(p.stock)
                const stockRestant = isStockValide ? Math.max(0, p.stock - qteAuPanier) : null
                const estHorsStock = isStockValide && stockRestant === 0

                return (
                  <div
                    key={p.id}
                    onClick={() => ajouterAuPanier(p)}
                    className={[
                      'pos-produit-card',
                      qteAuPanier > 0 ? 'pos-produit-card--in-cart' : '',
                      estHorsStock ? 'pos-produit-card--epuise' : ''
                    ].filter(Boolean).join(' ')}
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: vueCatalogue === 'liste' ? 'row' : 'column',
                      alignItems: vueCatalogue === 'liste' ? 'center' : 'stretch',
                      justifyContent: 'space-between',
                      minHeight: vueCatalogue === 'liste' ? 60 : 96,
                    }}
                  >
                    {qteAuPanier > 0 && (
                      <div className="pos-qte-badge" style={{
                        position: 'absolute', top: -6, right: -6, background: 'var(--pos-primary)', color: '#fff',
                        borderRadius: 10, width: 22, height: 22, fontSize: 11, fontWeight: 900,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(249,115,22,0.4)', zIndex: 2
                      }}>
                        {qteAuPanier}
                      </div>
                    )}

                    <div style={{ flex: vueCatalogue === 'liste' ? 1 : 'unset', minWidth: 0, paddingRight: vueCatalogue === 'liste' ? 10 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 800, color: 'var(--pos-text)', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.nom}</p>
                        {vueCatalogue !== 'liste' && (
                          <button
                            onClick={e => genererImprimerEtiquetteCodeBarre(e, p)}
                            title="Générer / Imprimer étiquette code-barres EAN"
                            style={{ background: 'var(--pos-surface2)', border: '1px solid var(--pos-border)', borderRadius: 4, padding: '1px 4px', fontSize: 9, cursor: 'pointer', color: 'var(--pos-text2)', fontWeight: 700, flexShrink: 0 }}
                          >
                            
                          </button>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 9, color: 'var(--pos-text3)', fontFamily: 'monospace' }}>{p.code_barre ? `EAN ${p.code_barre}` : ''}</p>
                    </div>

                    <div style={{ marginTop: vueCatalogue === 'liste' ? 0 : 6, display: 'flex', flexDirection: vueCatalogue === 'liste' ? 'column' : 'row', justifyContent: vueCatalogue === 'liste' ? 'center' : 'space-between', alignItems: vueCatalogue === 'liste' ? 'flex-end' : 'center', gap: vueCatalogue === 'liste' ? 2 : 0, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--pos-primary)' }}>{fcfa(p.prix)}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {vueCatalogue === 'liste' && (
                          <button
                            onClick={e => genererImprimerEtiquetteCodeBarre(e, p)}
                            title="Générer / Imprimer étiquette code-barres EAN"
                            style={{ background: 'var(--pos-surface2)', border: '1px solid var(--pos-border)', borderRadius: 4, padding: '1px 4px', fontSize: 9, cursor: 'pointer', color: 'var(--pos-text2)', fontWeight: 700, flexShrink: 0 }}
                          >
                            
                          </button>
                        )}
                        {isStockValide && (
                          <span style={{
                            fontSize: 9,
                            background: estHorsStock ? 'rgba(239, 68, 68, 0.2)' : (stockRestant ?? 999) <= 3 ? 'rgba(249, 115, 22, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: estHorsStock ? '#f87171' : (stockRestant ?? 999) <= 3 ? '#fb923c' : '#4ade80',
                            border: estHorsStock ? '1px solid rgba(239, 68, 68, 0.4)' : (stockRestant ?? 999) <= 3 ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
                            padding: '1px 5px', borderRadius: 4, fontWeight: 700
                          }}>
                            {estHorsStock ? 'Épuisé' : `Stk ${stockRestant}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Colonne Centrale : Pupitre Tactile Numpad Pro & Quick Actions (Mode 3 Colonnes Desktop/Tablette) */}
        {layoutColCentrale && (
          <div
            className="caisse-center-dock no-print"
            style={{
              padding: '12px 10px',
              background: 'var(--pos-surface)',
              borderRight: '1px solid var(--pos-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              overflowY: 'auto',
              boxSizing: 'border-box',
              minWidth: 260,
              maxWidth: 300,
            }}
          >
            {/* Pavé Numérique Pro Docké */}
            <PosNumpad
              isDocked={true}
              onSearchOrAddBarcode={(code) => {
                ajouterParCodeBarre(code)
              }}
            />

            {/* Raccourcis et Actions Métier Rapides */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--pos-text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Raccourcis Opérations
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  onClick={ouvrirModalRemise}
                  style={{
                    padding: '9px 6px', borderRadius: 8, border: '1px solid var(--pos-border)',
                    background: remisePourcentage > 0 ? 'var(--pos-primary-bg)' : 'var(--pos-surface2)',
                    color: remisePourcentage > 0 ? 'var(--pos-primary)' : 'var(--pos-text)',
                    fontWeight: 800, fontSize: 11.5,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    boxShadow: 'var(--pos-shadow)'
                  }}
                  title="Appliquer une remise commerciale (Superviseur)"
                >
                  <span></span> Remise
                </button>

                <button
                  type="button"
                  onClick={() => setModalFidelite(true)}
                  style={{
                    padding: '9px 6px', borderRadius: 8, border: '1px solid var(--pos-border)',
                    background: clientFidelite ? 'var(--pos-primary-bg)' : 'var(--pos-surface2)',
                    color: clientFidelite ? 'var(--pos-primary)' : 'var(--pos-text)',
                    fontWeight: 800, fontSize: 11.5,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    boxShadow: 'var(--pos-shadow)'
                  }}
                  title="Identifier un client fidélité par numéro WhatsApp"
                >
                  <span></span> Fidélité
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  onClick={mettrePanierEnAttente}
                  disabled={panier.length === 0}
                  style={{
                    padding: '9px 6px', borderRadius: 8, border: '1px solid var(--pos-border)',
                    background: 'var(--pos-surface2)', color: 'var(--pos-text)', fontWeight: 800, fontSize: 11.5,
                    cursor: panier.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: panier.length === 0 ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    boxShadow: 'var(--pos-shadow)'
                  }}
                  title="Mettre le panier en attente pour servir le client suivant (F8)"
                >
                  <span></span> Attente (F8)
                </button>

                <button
                  type="button"
                  onClick={() => setModalCarnet(true)}
                  style={{
                    padding: '9px 6px', borderRadius: 8, border: '1px solid var(--pos-border)',
                    background: 'var(--pos-surface2)', color: 'var(--pos-text)', fontWeight: 800, fontSize: 11.5,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    boxShadow: 'var(--pos-shadow)'
                  }}
                  title="Ouvrir le carnet de dettes et crédits clients"
                >
                  <span>📖</span> Dettes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Côté Droit : Ticket Panier & Encaissement POS */}
        <PosPanierSidebar
          tabMobile={tabMobile}
          onBackToCatalogue={() => setTabMobile('catalogue')}
          panier={panier}
          session={session}
          produitsFiltresCount={produitsFiltres.length}
          onMettreEnAttente={mettrePanierEnAttente}
          onViderPanier={viderPanier}
          onOuvrirSession={() => setModalSessionOuverture(true)}
          onModifierQuantite={modifierQuantite}
          onOuvrirRemise={() => setModalRemise(true)}
          remisePourcentage={remisePourcentage}
          montantRemise={montantRemise}
          clientFidelite={clientFidelite}
          cagnotteDeduite={cagnotteDeduite}
          onOuvrirFidelite={() => setModalFidelite(true)}
          modePaiement={modePaiement}
          onSelectModePaiement={(mode: any) => setModePaiement(mode)}
          montantRecu={montantRecu}
          onSetMontantRecu={setMontantRecu}
          monnaieARendre={monnaieARendre}
          montantEspecesMixte={montantEspecesMixte}
          onSetMontantEspecesMixte={setMontantEspecesMixte}
          secondModeMixte={secondModeMixte}
          onSetSecondModeMixte={(mode: any) => setSecondModeMixte(mode)}
          resteAPayerMixte={resteAPayerMixte}
          clientCreditIdPOS={clientCreditIdPOS}
          onSetClientCreditIdPOS={setClientCreditIdPOS}
          clientsCredits={clientsCredits}
          creditDateEcheancePOS={creditDateEcheancePOS}
          onSetCreditDateEcheancePOS={setCreditDateEcheancePOS}
          creditNotePOS={creditNotePOS}
          onSetCreditNotePOS={setCreditNotePOS}
          regimeFiscal={regimeFiscal}
          estExonereClient={estExonereClient}
          totalHT={totalHT}
          totalTVA={totalTVA}
          tvaDefaut={tvaDefaut}
          timbreFiscal={timbreFiscal}
          netAPayer={netAPayer}
          totalPanier={totalPanier}
          encaissementEnCours={encaissementEnCours}
          onEnregistrerDocument={enregistrerDocumentCaisse}
          onEncaisser={encaisserVente}
          t={t as any}
        />
      </div>

      {/* MODALE ÉDITION CLIENT CARNET POS (Composant Extrait & Modulaire) */}
      <PosEditClientCarnetModal
        isOpen={modalEditClientCarnet && Boolean(clientCarnetAEditer)}
        onClose={() => setModalEditClientCarnet(false)}
        client={clientCarnetAEditer}
        boutiqueId={boutiqueActiveId}
        onSuccess={() => {
          if (boutiqueActiveId) chargerClientsCredits(boutiqueActiveId)
        }}
      />

      {/* Barre Flottante Sticky Mobile (Catalogue mode) */}
      {tabMobile === 'catalogue' && panier.length > 0 && (
        <div className="caisse-sticky-bottom-bar no-print">
          <div className="caisse-sticky-bottom-info">
            <span className="caisse-sticky-count">{panier.reduce((sum, item) => sum + item.quantite, 0)} article{panier.reduce((sum, item) => sum + item.quantite, 0) > 1 ? 's' : ''}</span>
            <span className="caisse-sticky-total">{fcfa(netAPayer)}</span>
          </div>
          <button
            type="button"
            onClick={() => setTabMobile('ticket')}
            className="caisse-sticky-btn"
          >
            VOIR TICKET & ENCAISSER →
          </button>
        </div>
      )}

      {/* Ticket Impression Thermique 80mm (Composant Extrait & Modulaire) */}
      <PosTicketPrintView
        vente={derniereVente as any}
        boutiqueNom={boutiqueActive?.nom}
        boutiqueAdresse={boutiqueActive?.adresse}
        boutiqueTelephone={boutiqueActive?.telephone}
        boutiqueLogo={activeBoutiqueObj?.logo}
        messageBasTicket={activeBoutiqueObj?.message_bas_ticket}
        regimeFiscal={regimeFiscal}
        estExonereClient={estExonereClient}
        clientFidelite={clientFidelite}
      />

      {/* Modal d'importation par lot pour la caisse */}
      {modalImportBatch && (
        <BatchImportModal
          boutiqueId={boutiqueActiveId}
          onClose={() => setModalImportBatch(false)}
          onSuccess={() => {
            setModalImportBatch(false)
            chargerProduitsBoutique(boutiqueActiveId)
          }}
        />
      )}

      {/* ── Modales de Gestion des PINs & Configuration ── */}
      {renderModalesGestionPin()}

      {/* Modale Historique des Opérations */}
      {modalHistorique && (
        <PosHistoriqueModal
          historiqueVentes={historiqueVentes}
          formatTicketThermique={formatTicketThermique}
          onChangeFormatTicket={(f) => setFormatTicketThermique(f)}
          btDeviceName={btDeviceName}
          onConnecterBluetooth={connecterImprimanteBluetooth}
          onExporterCSV={exporterHistoriqueCSV}
          onExporterPDF={exporterHistoriquePDF}
          onAnnulerRembourserVente={annulerRembourserVente}
          onImprimerTicket={imprimerTicketThermique}
          onClose={() => setModalHistorique(false)}
          formatPrice={formatPrice}
        />
      )}

      {/* Modale Ouverture Session avec Fond de Caisse & PIN */}
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

      {/* Modale Clôture Z à l'Aveugle */}
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
                })
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

      {/* Modale Gestion Tiroir-Caisse & Mouvements d'espèces */}
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

      {/* Modale Remise Commerciale & Motifs Métiers (Standard Auchan) */}
      {modalRemise && (
        <PosRemiseModal
          sousTotal={sousTotalPanier}
          remiseActuelle={remisePourcentage}
          motifActuel={remiseMotif}
          plafondCaissierPct={Number(boutiqueActive?.pos_remise_max_caissier ?? 10)}
          motifsBoutique={boutiqueActive?.pos_remise_motifs}
          isSuperviseur={roleActif === 'superviseur'}
          onApplyRemise={(pct, motif) => {
            setRemisePourcentage(pct)
            setRemiseMotif(motif || '')
          }}
          onRequestSupervisor={(titre, onValide) => demanderValidationSuperviseur(titre, onValide)}
          onClose={() => setModalRemise(false)}
        />
      )}

      {/* Modale Fidélité & Cagnotte Client WhatsApp */}
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

      {/* Modale Scanner Code-Barres par Caméra Smartphone */}
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
              } catch (e) { console.warn('[Nopalou:CaisseClient:L4598]', e); }
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

      {/* Modale Pairage Douchette Smartphone (Scan Remote) */}
      {modalPairageSmartphone && (
        <PosPairageModal
          sessionScannerId={sessionScannerId}
          boutiqueActiveId={boutiqueActiveId}
          onClose={() => setModalPairageSmartphone(false)}
        />
      )}

      {/* Modale Carnet de Crédits Clients Avancé (Reproduit à l'identique de la boutique) */}
      {modalCarnet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{
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
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
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
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
            <CarnetDettes
              boutique={{
                id: boutiqueActiveId || '',
                nom: boutiques.find(b => b.id === boutiqueActiveId)?.nom || 'Boutique',
                slug: ''
              }}
              planActif={planActifProp || terminalPlan}
            />
          </div>
        </div>
      )}

      {/* Modale d'enregistrement de Transaction Carnet (Catalogue Direct & Remboursement) */}
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
      <PosBilanRapportXModal
        isOpen={modalBilanSession}
        onClose={() => setModalBilanSession(false)}
        caissierNom={caissierNom}
        roleActif={roleActif}
        boutiqueNom={activeBoutiqueObj?.nom}
        session={session}
        netAPayer={netAPayer}
        panierLength={panier.length}
        fcfa={fcfa}
      />
      {/* Modale Dédiée : Changer de Caissier & Verrouillage */}
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
        onOuvrirConfigEquipe={roleActif === 'superviseur' ? () => {
          setModalChangerCaissier(false)
          ouvrirConfigPin()
        } : undefined}
        onDeconnexion={seDeconnecterCompte}
        isTerminalMode={Boolean(initialToken)}
      />
    </div>
  )
}
