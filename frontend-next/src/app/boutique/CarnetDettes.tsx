'use client'

import { useState, useEffect, useRef } from 'react'
import { fcfa, fmtDate, fmtDateHeure, formatNomPropre, formatPhone } from '@/lib/format'
import { exportToCSV, printPDFReport } from '@/lib/export'
import QrCodeShareModal from '@/components/QrCodeShareModal'
import { CONFIG_SCANNER_EAN_PRO, capturerZoneViseurExacte, jouerBipEtVibrer } from '@/lib/scanner-helper'
import { useTranslation } from '@/i18n/context'

interface ClientCredit {
  id: string
  boutique_id: string
  nom: string
  telephone: string
  adresse?: string | null
  solde: number
  plafond_max: number
  statut?: 'actif' | 'bloque' | 'archive'
  note_client?: string | null
  created_at?: string
  historique?: TransactionCredit[]
}

interface TransactionCredit {
  id: string
  client_id: string
  boutique_id: string
  type: 'vente_credit' | 'remboursement' | 'depot_avance'
  montant: number
  mode_paiement: string
  note?: string | null
  produits?: any[]
  date_echeance?: string | null
  relance_auto_whatsapp?: boolean
  derniere_relance_whatsapp?: string | null
  created_at: string
}

interface ProduitBoutique {
  id: string
  nom: string
  prix: number | null
  prix_promo?: number | null
  images?: string[] | null
  photo_url?: string | null
  image_url?: string | null
  stock_quantite?: number | null
  quantite_stock?: number | null
}

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
  const { t, isRtl } = useTranslation()
  // États principaux
  const [clients, setClients] = useState<ClientCredit[]>([])
  const [produits, setProduits] = useState<ProduitBoutique[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreStatus, setFiltreStatus] = useState<'tous' | 'retard' | 'credits'>('tous')
  
  // Client sélectionné & Historique
  const [clientSelectionne, setClientSelectionne] = useState<ClientCredit | null>(null)
  const [historique, setHistorique] = useState<TransactionCredit[]>([])
  const [loadingHist, setLoadingHist] = useState(false)

  // Modales & Menus contextuels
  const [menuOuvertClientId, setMenuOuvertClientId] = useState<string | null>(null)
  const [showModalNouveauClient, setShowModalNouveauClient] = useState(false)
  const [showModalEditClient, setShowModalEditClient] = useState(false)
  const [showModalTransaction, setShowModalTransaction] = useState(false)
  const [typeTransaction, setTypeTransaction] = useState<'vente_credit' | 'remboursement'>('vente_credit')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.npl-dropdown')) {
        setMenuOuvertClientId(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOuvertClientId(null)
        setShowModalNouveauClient(false)
        setShowModalEditClient(false)
        setShowModalTransaction(false)
        setShowQrModalComptoir(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Formulaire Client (Création)
  const [nomClient, setNomClient] = useState('')
  const [telClient, setTelClient] = useState('')
  const [adresseClient, setAdresseClient] = useState('')
  const [plafondClient, setPlafondClient] = useState('200000')
  const [noteClient, setNoteClient] = useState('')

  // Formulaire Client (Édition / Modification)
  const [clientAEditer, setClientAEditer] = useState<ClientCredit | null>(null)
  const [editNom, setEditNom] = useState('')
  const [editTel, setEditTel] = useState('')
  const [editAdresse, setEditAdresse] = useState('')
  const [editPlafond, setEditPlafond] = useState('200000')
  const [editNote, setEditNote] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Formulaire Transaction & Sélecteur Catalogue
  const [modeSaisie, setModeSaisie] = useState<'catalogue' | 'manuel'>('catalogue')
  const [panierProduits, setPanierProduits] = useState<Record<string, number>>({}) // produitId -> qte
  const [itemsCustomPanier, setItemsCustomPanier] = useState<Array<{ id: string; nom: string; prix: number; quantite: number }>>([])
  const [commandesCreditEnAttente, setCommandesCreditEnAttente] = useState<any[]>([])
  const [showQrModalComptoir, setShowQrModalComptoir] = useState(false)
  const [libelleCustomInput, setLibelleCustomInput] = useState('')
  const [prixCustomInput, setPrixCustomInput] = useState('')
  const [qteCustomInput, setQteCustomInput] = useState(1)
  const [rechercheProduitModal, setRechercheProduitModal] = useState('')
  const [categorieProduitModal, setCategorieProduitModal] = useState('tous')
  const [montantManuel, setMontantManuel] = useState('')
  const [descriptionManuelle, setDescriptionManuelle] = useState('')
  const [modePaiement, setModePaiement] = useState('especes')
  const [dateEcheance, setDateEcheance] = useState('')
  const [relanceAutoWa, setRelanceAutoWa] = useState(true)
  const [submittingTrans, setSubmittingTrans] = useState(false)

  // Scanner EAN Crédit
  const [modalScannerEanCredit, setModalScannerEanCredit] = useState(false)
  const [scannerEanStatusCredit, setScannerEanStatusCredit] = useState('Initialisation du scanner…')
  const [scanContinuCredit, setScanContinuCredit] = useState(true)
  const html5ScannerCreditRef = useRef<any>(null)

  // Scanner Nom OCR Crédit
  const [modalScannerNomCredit, setModalScannerNomCredit] = useState(false)
  const [statusScannerNomCredit, setStatusScannerNomCredit] = useState('')
  const [ocrLoadingCredit, setOcrLoadingCredit] = useState(false)
  const [ocrDetectionsCredit, setOcrDetectionsCredit] = useState<string[]>([])
  const [imageFligeeCreditNom, setImageFligeeCreditNom] = useState<string | null>(null)
  const dernierScanCreditRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })
  const videoNomCreditRef = useRef<HTMLVideoElement | null>(null)
  const streamNomCreditRef = useRef<MediaStream | null>(null)

  const demarrerScannerEanCredit = async () => {
    setModalScannerEanCredit(true)
    setScannerEanStatusCredit('📷 Scanner EAN prêt (Mode Continu)…')
    dernierScanCreditRef.current = { code: '', time: 0 }
    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerCreditRef.current) {
          try {
            await html5ScannerCreditRef.current.stop()
            html5ScannerCreditRef.current.clear()
          } catch (e) {}
          html5ScannerCreditRef.current = null
        }
        const container = document.getElementById('carnet-ean-scanner-reader')
        if (!container) return
        const scanner = new Html5Qrcode('carnet-ean-scanner-reader')
        html5ScannerCreditRef.current = scanner
        const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })
        const onScanSuccess = (decodedText: string) => {
          handleEanDetecteCredit(decodedText)
        }
        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatusCredit('📷 Caméra active ! Placez le code-barres dans le cadre.')
        } catch (errEnv) {
          try {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
            setScannerEanStatusCredit('📷 Caméra active ! Placez le code-barres dans le cadre.')
          } catch (errUser) {
            setScannerEanStatusCredit('❌ Impossible d’accéder à la caméra.')
          }
        }
      } catch (err) {
        setScannerEanStatusCredit('❌ Impossible d’accéder à la caméra.')
      }
    }, 200)
  }

  const arreterScannerEanCredit = () => {
    if (html5ScannerCreditRef.current) {
      try {
        html5ScannerCreditRef.current.stop()
        html5ScannerCreditRef.current.clear()
      } catch (e) {}
      html5ScannerCreditRef.current = null
    }
    setModalScannerEanCredit(false)
  }

  const handleEanDetecteCredit = (barcodeStr: string) => {
    const code = barcodeStr.trim().toLowerCase()
    const now = Date.now()

    if (scanContinuCredit && dernierScanCreditRef.current.code === code && (now - dernierScanCreditRef.current.time < 1200)) {
      return
    }
    dernierScanCreditRef.current = { code, time: now }

    const prodTrouve = produits.find(
      (p: any) =>
        p.barcode?.trim().toLowerCase() === code ||
        p.sku?.trim().toLowerCase() === code ||
        p.id?.trim().toLowerCase() === code ||
        p.code_barre?.trim().toLowerCase() === code
    )
    if (prodTrouve) {
      setPanierProduits(prev => ({ ...prev, [prodTrouve.id]: (prev[prodTrouve.id] || 0) + 1 }))
      jouerBipEtVibrer('succes')
      setScannerEanStatusCredit(`✅ +1 "${prodTrouve.nom}"`)
      if (!scanContinuCredit) {
        setTimeout(() => arreterScannerEanCredit(), 600)
      }
    } else {
      jouerBipEtVibrer('alerte')
      setScannerEanStatusCredit(`⚠️ Code "${barcodeStr}" non répertorié.`)
      if (confirm(`Le code-barres "${barcodeStr}" n'existe pas dans le catalogue. L'ajouter en article libre ?`)) {
        setLibelleCustomInput(`Article EAN-${barcodeStr}`)
        setModeSaisie('manuel')
        arreterScannerEanCredit()
      }
    }
  }

  const demarrerScannerNomCredit = async () => {
    setModalScannerNomCredit(true)
    setOcrDetectionsCredit([])
    setImageFligeeCreditNom(null)
    setStatusScannerNomCredit('📷 Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamNomCreditRef.current = stream
      if (videoNomCreditRef.current) {
        videoNomCreditRef.current.srcObject = stream
        await videoNomCreditRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNomCredit('❌ Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerNomCredit = () => {
    setImageFligeeCreditNom(null)
    if (streamNomCreditRef.current) {
      streamNomCreditRef.current.getTracks().forEach(t => t.stop())
      streamNomCreditRef.current = null
    }
    setModalScannerNomCredit(false)
  }

  const capturerNomOCRCredit = async () => {
    if (!videoNomCreditRef.current) return
    setOcrLoadingCredit(true)
    setStatusScannerNomCredit('🔍 Analyse OCR en cours…')
    const imageBase64 = capturerZoneViseurExacte(videoNomCreditRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.90,
      boxHeightRatio: 0.70
    })
    if (!imageBase64) {
      setOcrLoadingCredit(false)
      setStatusScannerNomCredit('❌ Échec de la capture.')
      return
    }

    // Freeze frame
    setImageFligeeCreditNom(imageBase64)

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoadingCredit(false)
      if (data.ok && data.nom) {
        setLibelleCustomInput(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetectionsCredit(data.detections)
        }
        jouerBipEtVibrer('succes')
        setStatusScannerNomCredit(`✅ Nom capturé : "${data.nom}"`)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerNomCredit(`⚠️ ${data.error || 'Aucun nom lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoadingCredit(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerNomCredit('❌ Erreur de lecture OCR. Réessayez.')
    }
  }

  // Détection réactive de la largeur d'écran (Mobile < 768px)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    const handleCarnetUpdate = () => chargerDonnees()
    window.addEventListener('carnet_updated', handleCarnetUpdate)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('carnet_updated', handleCarnetUpdate)
    }
  }, [boutique.id])

  // Charger les données (clients + catalogue)
  const chargerDonnees = async () => {
    setLoading(true)
    try {
      // 1. Clients du carnet
      const resClients = await fetch(`/api/boutiques/${boutique.id}/credits-clients`)
      if (resClients.ok) {
        const dataC = await resClients.json()
        if (dataC.clients) setClients(dataC.clients)
      }

      // 2. Produits pour le sélecteur catalogue
      const resProds = await fetch(`/api/boutiques/${boutique.id}/produits`)
      if (resProds.ok) {
        const dataP = await resProds.json()
        const prodsList = dataP.produits || dataP.data || (Array.isArray(dataP) ? dataP : [])
        setProduits(prodsList)
      }

      // 3. Commandes à crédit en attente d'approbation
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''
        const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('auth_token') || '') : ''
        const resCmd = await fetch(`${backendUrl}/api/comptabilite/${boutique.id}/commandes`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (resCmd.ok) {
          const dataCmd = await resCmd.json()
          const listCmd = Array.isArray(dataCmd) ? dataCmd : (dataCmd.commandes || [])
          const enAttenteCredit = listCmd.filter((c: any) => c.statut === 'en_attente' && (c.methode_paiement === 'credit' || c.note?.toLowerCase().includes('crédit')))
          setCommandesCreditEnAttente(enAttenteCredit)
        }
      } catch (eCmd) {}
    } catch (err) {
      console.error('Erreur chargement carnet:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (boutique.id) {
      chargerDonnees()
    }
  }, [boutique.id])

  // Charger l'historique d'un client
  const chargerHistoriqueClient = async (clientId: string) => {
    setLoadingHist(true)
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientId}/historique`)
      if (res.ok) {
        const data = await res.json()
        setHistorique(data.historique || [])
      }
    } catch (e) {
      console.error('Erreur chargement historique client:', e)
    } finally {
      setLoadingHist(false)
    }
  }

  const ouvrirFicheClient = (c: ClientCredit) => {
    setClientSelectionne(c)
    chargerHistoriqueClient(c.id)
  }

  const ouvrirModalEditClient = (c: ClientCredit) => {
    setClientAEditer(c)
    setEditNom(c.nom || '')
    setEditTel(c.telephone || '')
    setEditAdresse(c.adresse || '')
    setEditPlafond(String(c.plafond_max || 200000))
    setEditNote(c.note_client || '')
    setShowModalEditClient(true)
  }

  const ouvrirModalTransaction = (type: 'vente_credit' | 'remboursement', client?: ClientCredit) => {
    if (client) {
      setClientSelectionne(client)
      chargerHistoriqueClient(client.id)
    } else if (!clientSelectionne && clients.length > 0) {
      setClientSelectionne(clients[0])
    }
    setTypeTransaction(type)
    setMontantManuel('')
    setDescriptionManuelle('')
    setPanierProduits({})
    setDateEcheance('')
    setModeSaisie(type === 'vente_credit' ? 'catalogue' : 'manuel')
    setShowModalTransaction(true)
  }

  // Calculs KPI généraux
  const totalDettesAEncaisser = clients.reduce((acc, c) => acc + (Number(c.solde) > 0 ? Number(c.solde) : 0), 0)
  const totalAvancesClients = clients.reduce((acc, c) => acc + (Number(c.solde) < 0 ? Math.abs(Number(c.solde)) : 0), 0)
  const nbClientsDebiteurs = clients.filter(c => Number(c.solde) > 0).length

  // Calcul du montant total du panier catalogue et saisie libre dans la modale
  const totalPanierCatalogue = Object.entries(panierProduits).reduce((sum, [pId, qte]) => {
    const p = produits.find(item => item.id === pId)
    const prix = p ? Number(p.prix_promo || p.prix || 0) : 0
    return sum + (prix * qte)
  }, 0)

  const totalPanierCustom = itemsCustomPanier.reduce((sum, item) => sum + (item.prix * item.quantite), 0)

  const totalTransactionCourante = typeTransaction === 'vente_credit' 
    ? (totalPanierCatalogue + totalPanierCustom) 
    : (Number(montantManuel) || 0)

  // Gestion Création Client
  const handleCreerClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomClient.trim() || !telClient.trim()) {
      alert('Le nom et le téléphone sont obligatoires.')
      return
    }

    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nomClient.trim(),
          telephone: telClient.trim(),
          adresse: adresseClient.trim() || null,
          plafond_max: Number(plafondClient || 200000),
          note_client: noteClient.trim() || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setNomClient('')
        setTelClient('')
        setAdresseClient('')
        setNoteClient('')
        setShowModalNouveauClient(false)
        await chargerDonnees()
        if (data.client) {
          ouvrirFicheClient(data.client)
        }
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de la création du profil client.')
      }
    } catch (err) {
      console.error('Erreur création client carnet:', err)
    }
  }

  // Gestion Édition / Modification Client
  const handleEnregistrerEditClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientAEditer) return
    if (!editNom.trim() || !editTel.trim()) {
      alert('Le nom et le téléphone sont obligatoires.')
      return
    }

    setSubmittingEdit(true)
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientAEditer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: editNom.trim(),
          telephone: editTel.trim(),
          adresse: editAdresse.trim() || null,
          plafond_max: Number(editPlafond || 200000),
          note_client: editNote.trim() || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setShowModalEditClient(false)
        await chargerDonnees()
        if (data.client) {
          if (clientSelectionne?.id === data.client.id) {
            setClientSelectionne(data.client)
          }
        }
        alert('Profil client mis à jour avec succès !')
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de la modification du client.')
      }
    } catch (err) {
      console.error('Erreur modification client carnet:', err)
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Soumettre une Transaction (Vente à crédit / Remboursement)
  const handleValiderTransaction = async () => {
    if (!clientSelectionne) {
      alert('Veuillez d’abord choisir un client du carnet.')
      return
    }

    const montantFinal = totalTransactionCourante
    if (!montantFinal || montantFinal <= 0) {
      alert('Veuillez ajouter au moins un produit ou saisir un montant valide.')
      return
    }

    let produitsListe: any[] = []
    if (typeTransaction === 'vente_credit') {
      const itemsCatalogue = Object.entries(panierProduits).filter(([_, qte]) => qte > 0).map(([pId, qte]) => {
        const p = produits.find(item => item.id === pId)
        return {
          id: pId,
          nom: p?.nom || 'Article catalogue',
          quantite: qte,
          prix: Number(p?.prix_promo || p?.prix || 0),
        }
      })
      const itemsCustom = itemsCustomPanier.map(item => ({
        id: item.id,
        nom: item.nom,
        quantite: item.quantite,
        prix: item.prix,
      }))
      produitsListe = [...itemsCatalogue, ...itemsCustom]
    } else {
      const nomParDefaut = 'Remboursement'
      produitsListe = [{ nom: descriptionManuelle.trim() || nomParDefaut, quantite: 1, prix: montantFinal }]
    }

    setSubmittingTrans(true)
    try {
      const noteFinal = typeTransaction === 'vente_credit'
        ? `Vente à crédit (${produitsListe.length} article(s))`
        : (descriptionManuelle.trim() || 'Remboursement client')

      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientSelectionne.id}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: typeTransaction,
          montant: montantFinal,
          mode_paiement: modePaiement,
          note: noteFinal,
          produits: produitsListe,
          date_echeance: dateEcheance || null,
          relance_auto_whatsapp: relanceAutoWa,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setShowModalTransaction(false)
        setPanierProduits({})
        setItemsCustomPanier([])
        setLibelleCustomInput('')
        setPrixCustomInput('')
        setQteCustomInput(1)
        setMontantManuel('')
        setDescriptionManuelle('')
        setDateEcheance('')
        
        const nouveauSolde = data.nouveauSolde
        setClientSelectionne(prev => prev ? { ...prev, solde: nouveauSolde } : null)
        await chargerDonnees()
        await chargerHistoriqueClient(clientSelectionne.id)
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de l’enregistrement de la transaction.')
      }
    } catch (e) {
      console.error('Erreur transaction carnet:', e)
    } finally {
      setSubmittingTrans(false)
    }
  }

  // Déclencher Relance WhatsApp 1-Clic
  const handleRelancerWhatsApp = async (c: ClientCredit) => {
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${c.id}/relance-whatsapp`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.lienWhatsapp) {
          window.open(data.lienWhatsapp, '_blank')
        } else {
          alert('Relance WhatsApp envoyée !')
        }
      } else {
        const err = await res.json()
        alert(err.error || 'Impossible d’envoyer la relance.')
      }
    } catch (e) {
      console.error('Erreur relance whatsapp:', e)
    }
  }

  // Blacklister ou Réactiver un client du carnet
  const handleChangerStatutClient = async (c: ClientCredit, nouveauStatut: 'actif' | 'bloque' | 'archive') => {
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${c.id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut }),
      })
      if (res.ok) {
        await chargerDonnees()
        if (clientSelectionne?.id === c.id) {
          setClientSelectionne(prev => prev ? { ...prev, statut: nouveauStatut } : null)
        }
        alert(nouveauStatut === 'bloque' ? `⛔ Le client ${c.nom} a été blacklisté.` : `🟢 Le client ${c.nom} a été réactivé.`)
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors du changement de statut du client.')
      }
    } catch (e) {
      console.error('Erreur changement statut client:', e)
      alert('Impossible de joindre le serveur.')
    }
  }

  // Supprimer définitivement un client du carnet
  const handleSupprimerClient = async (c: ClientCredit) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le client "${c.nom}" du carnet ?\nCette action est irréversible.`)) {
      return
    }
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${c.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        if (clientSelectionne?.id === c.id) {
          setClientSelectionne(null)
        }
        await chargerDonnees()
        alert(`🗑️ Client "${c.nom}" supprimé avec succès du carnet.`)
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de la suppression du client.')
      }
    } catch (e) {
      console.error('Erreur suppression client:', e)
      alert('Impossible de joindre le serveur.')
    }
  }

  // Filtrage des clients
  const clientsFiltres = clients.filter(c => {
    const textMatch = !recherche.trim() || 
      c.nom.toLowerCase().includes(recherche.toLowerCase()) || 
      c.telephone.includes(recherche) ||
      (c.adresse && c.adresse.toLowerCase().includes(recherche.toLowerCase()))
    
    if (!textMatch) return false

    if (filtreStatus === 'retard') {
      return Number(c.solde) > 0
    }
    if (filtreStatus === 'credits') {
      return Number(c.solde) < 0
    }
    return true
  })

  // Charger l'historique complet pour tous les clients du carnet avant export
  const obtenirClientsAvecHistorique = async (): Promise<ClientCredit[]> => {
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients?include_historique=true`)
      if (res.ok) {
        const data = await res.json()
        if (data.clients && Array.isArray(data.clients)) {
          return data.clients
        }
      }
    } catch (err) {
      console.error('Erreur chargement clients avec historique pour export:', err)
    }
    return clients
  }

  // Fonctions d'exportation du carnet avec l'historique détaillé de chaque client
  const handleExportCSV = async () => {
    if (clients.length === 0) {
      alert('Aucun client enregistré dans le carnet.')
      return
    }

    const clientsComplets = await obtenirClientsAvecHistorique()
    const headers = [
      'Nom du client',
      'Téléphone',
      'Adresse / Quartier',
      'Statut Client',
      'Solde Actuel (FCFA)',
      'Date & Heure Opération',
      'Type Opération',
      'Mode Paiement',
      'Détails / Produits / Notes',
      'Montant Opération (FCFA)'
    ]

    const rows: (string | number)[][] = []

    clientsComplets.forEach(c => {
      const statutClient = c.solde > 0 ? 'Dette à encaisser' : c.solde < 0 ? 'Avance client' : 'Solde nul (Réglé)'
      const listHist = c.historique || []

      if (listHist.length > 0) {
        listHist.forEach(h => {
          const typeOp = h.type === 'vente_credit' ? 'Vente à crédit' : h.type === 'remboursement' ? 'Remboursement' : 'Dépôt / Avance'
          const details = h.note || (h.produits && h.produits.length > 0 ? h.produits.map((p: any) => `${p.nom} x${p.qte || 1}`).join(', ') : '—')
          rows.push([
            c.nom,
            c.telephone,
            c.adresse || '—',
            statutClient,
            c.solde,
            fmtDateHeure(h.created_at),
            typeOp,
            h.mode_paiement || 'Espèces',
            details,
            h.montant
          ])
        })
      } else {
        rows.push([
          c.nom,
          c.telephone,
          c.adresse || '—',
          statutClient,
          c.solde,
          '—',
          'Aucune transaction enregistrée',
          '—',
          '—',
          0
        ])
      }
    })

    exportToCSV(`Carnet_Dettes_Detaille_${(boutique.nom || 'Boutique').replace(/\s+/g, '_')}`, headers, rows)
  }

  const handleExportPDF = async () => {
    if (clients.length === 0) {
      alert('Aucun client enregistré dans le carnet.')
      return
    }

    const clientsComplets = await obtenirClientsAvecHistorique()

    const summaryHtml = `
      <div style="margin-bottom:20px; padding:16px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; font-size:13px; color:#0f172a;">
        <p style="margin:0 0 6px; font-size:15px; font-weight:bold; color:#15803d;">📊 Synthèse Globale du Carnet — ${boutique.nom}</p>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-top:8px;">
          <div><strong>Total Créances à Encaisser :</strong> <span style="color:#dc2626; font-weight:bold;">${fcfa(totalDettesAEncaisser)}</span></div>
          <div><strong>Total Avances Clients :</strong> <span style="color:#16a34a; font-weight:bold;">${fcfa(totalAvancesClients)}</span></div>
          <div><strong>Nombre de Clients Débiteurs :</strong> <span>${nbClientsDebiteurs} client(s)</span></div>
        </div>
      </div>
    `

    const clientsSectionsHtml = clientsComplets.map(c => {
      const listHist = c.historique || []
      const soldeColor = c.solde > 0 ? '#dc2626' : c.solde < 0 ? '#16a34a' : '#475569'
      const soldeBadge = c.solde > 0 ? 'Dette client' : c.solde < 0 ? 'Avance client' : 'Solde nul'

      const histRowsHtml = listHist.length > 0
        ? listHist.map(h => {
            const typeLabel = h.type === 'vente_credit' ? 'Vente à crédit' : h.type === 'remboursement' ? 'Remboursement' : 'Dépôt / Avance'
            const detailsStr = h.note || (h.produits && h.produits.length > 0 ? h.produits.map((p: any) => `${p.nom} x${p.qte || 1}`).join(', ') : '—')
            return `
              <tr>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px;">${fmtDateHeure(h.created_at)}</td>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px; font-weight:bold;">${typeLabel}</td>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px;">${h.mode_paiement || 'Espèces'}</td>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px;">${detailsStr}</td>
                <td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:11.5px; text-align:right; font-weight:bold;">${fcfa(h.montant)}</td>
              </tr>
            `
          }).join('')
        : `
          <tr>
            <td colspan="5" style="padding:10px; border:1px solid #e2e8f0; font-size:12px; text-align:center; color:#64748b; font-style:italic;">
              Aucune transaction enregistrée dans l'historique
            </td>
          </tr>
        `

      return `
        <div class="client-section">
          <div class="client-header">
            <div>
              <span style="font-size:15px; font-weight:bold; color:#0f172a;">👤 ${c.nom}</span>
              <span style="margin-left:12px; font-size:12.5px; color:#475569;">📱 ${c.telephone}</span>
              ${c.adresse ? `<span style="margin-left:12px; font-size:12px; color:#64748b;">📍 ${c.adresse}</span>` : ''}
            </div>
            <div>
              <span style="font-size:12px; padding:3px 8px; border-radius:12px; background:#f1f5f9; color:#334155; font-weight:600; margin-right:8px;">${soldeBadge}</span>
              <span style="font-size:14px; font-weight:bold; color:${soldeColor};">Solde : ${fcfa(c.solde)}</span>
            </div>
          </div>
          
          <table style="width:100%; border-collapse:collapse; margin-top:8px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:left;">Date & Heure</th>
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:left;">Type Opération</th>
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:left;">Mode Paiement</th>
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:left;">Détails / Description</th>
                <th style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px; text-align:right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${histRowsHtml}
            </tbody>
          </table>
        </div>
      `
    }).join('')

    printPDFReport(
      `Carnet de Dettes & Crédits (Détaillé) — ${boutique.nom}`,
      `Rapport complet des comptes et historiques clients`,
      [],
      [],
      summaryHtml,
      clientsSectionsHtml
    )
  }

  const handleExportReleveClientPDF = () => {
    if (!clientSelectionne) return
    const headers = ['Date & Heure', 'Type Opération', 'Mode Paiement', 'Détails / Description', 'Montant (FCFA)']
    const rows = historique.map(h => [
      fmtDateHeure(h.created_at),
      h.type === 'vente_credit' ? 'Vente à crédit' : h.type === 'remboursement' ? 'Remboursement' : 'Dépôt / Avance',
      h.mode_paiement || 'Espèces',
      h.note || (h.produits && h.produits.length > 0 ? h.produits.map((p: any) => `${p.nom} x${p.qte || 1}`).join(', ') : '—'),
      fcfa(h.montant)
    ])
    const summaryHtml = `
      <div style="margin-bottom:20px; padding:14px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; color:#0f172a;">
        <p style="margin:0 0 6px;"><strong>Client :</strong> ${clientSelectionne.nom}</p>
        <p style="margin:0 0 6px;"><strong>Téléphone WhatsApp :</strong> ${clientSelectionne.telephone}</p>
        <p style="margin:0 0 6px;"><strong>Adresse :</strong> ${clientSelectionne.adresse || '—'}</p>
        <p style="margin:0;"><strong>Solde Actuel :</strong> <span style="color:${clientSelectionne.solde > 0 ? '#dc2626' : '#16a34a'}; font-weight:bold; font-size:15px;">${fcfa(clientSelectionne.solde)}</span></p>
      </div>
    `
    printPDFReport(
      `Relevé de Compte Client — ${clientSelectionne.nom}`,
      `Boutique ${boutique.nom} · Récapitulatif des opérations`,
      headers,
      rows,
      summaryHtml
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* En-tête Synthétique Harmonisé (Couleurs Claires du Site) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: isMobile ? '16px 16px' : '22px 24px',
        color: '#0f172a',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 14
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #FFF3E8 0%, #FED7AA 100%)',
                border: '1px solid #FDBA74',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0
              }}>
                📒
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 21, fontWeight: 800, color: 'var(--navy, #1C2B4A)', letterSpacing: '-0.02em' }}>
                  Carnet de dettes &amp; Crédits
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text2, #6B7280)', fontWeight: 600 }}>
                  {clients.length} client{clients.length > 1 ? 's' : ''} · {nbClientsDebiteurs} endetté{nbClientsDebiteurs > 1 ? 's' : ''} ({fcfa(totalDettesAEncaisser)})
                </p>
              </div>
            </div>
          </div>

          {/* Barre d'outils responsive fluide (Hiérarchie visuelle Stripe / Square) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: isMobile ? '100%' : 'auto',
            minWidth: 0
          }}>
            {/* Ligne 1 : Boutons d'Action Principaux (Grandes cibles tactiles 44px, texte complet) */}
            <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
              <button
                onClick={() => ouvrirModalTransaction('vente_credit')}
                className="npl-btn npl-btn-primary"
                style={{
                  flex: isMobile ? 1.2 : 'initial',
                  minHeight: 44,
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 3px 10px rgba(199, 91, 0, 0.25)',
                  cursor: 'pointer'
                }}
              >
                <span>⚡</span>
                <span>+ Vente crédit</span>
              </button>

              <button
                onClick={() => setShowModalNouveauClient(true)}
                className="npl-btn npl-btn-secondary"
                style={{
                  flex: isMobile ? 1 : 'initial',
                  minHeight: 44,
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  background: 'var(--navy, #1C2B4A)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>👤</span>
                <span>+ Client</span>
              </button>
            </div>

            {/* Ligne 2 : Actions secondaires et Utilitaires */}
            <div style={{
              display: 'flex',
              gap: 6,
              width: '100%',
            }}>
              <button
                onClick={() => setShowQrModalComptoir(true)}
                className="npl-btn npl-btn-secondary"
                title="QR Code Client"
                style={{ flex: 1, minHeight: 38, padding: '6px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', cursor: 'pointer' }}
              >
                <span>📱</span>
                <span style={{ whiteSpace: 'nowrap' }}>QR Client</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="npl-btn npl-btn-secondary"
                title={t('common.exportCsv')}
                style={{ flex: 1, minHeight: 38, padding: '6px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', cursor: 'pointer' }}
              >
                <span>📥</span>
                <span style={{ whiteSpace: 'nowrap' }}>CSV</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="npl-btn npl-btn-secondary"
                title={t('common.exportPdf')}
                style={{ flex: 1, minHeight: 38, padding: '6px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', cursor: 'pointer' }}
              >
                <span>🖨️</span>
                <span style={{ whiteSpace: 'nowrap' }}>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cartes KPI Épurées */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(130px, 1fr))' : 'repeat(3, 1fr)',
          gap: isMobile ? 8 : 12,
          width: '100%'
        }}>
          {/* KPI 1 : Total Dettes */}
          <div className="npl-card-subtle" style={{
            borderLeft: '3px solid #dc2626',
            padding: isMobile ? '10px 12px' : '14px 16px',
            background: '#ffffff',
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <div className="npl-badge npl-badge-danger" style={{ marginBottom: 6, fontSize: isMobile ? 10 : 11, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span className="npl-badge-dot" />
              <span>{t('shop.totalOwed').toUpperCase()}</span>
            </div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#dc2626', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fcfa(totalDettesAEncaisser)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nbClientsDebiteurs} {t('shop.debtorsCount')}
            </div>
          </div>

          {/* KPI 2 : Total Avances */}
          <div className="npl-card-subtle" style={{
            borderLeft: '3px solid #16a34a',
            padding: isMobile ? '10px 12px' : '14px 16px',
            background: '#ffffff',
            minWidth: 0,
            overflow: 'hidden'
          }}>
            <div className="npl-badge npl-badge-success" style={{ marginBottom: 6, fontSize: isMobile ? 10 : 11, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span className="npl-badge-dot" />
              <span>{t('shop.advancesCount').toUpperCase()}</span>
            </div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#16a34a', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fcfa(totalAvancesClients)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('shop.advancesCount')}
            </div>
          </div>

          {/* KPI 3 : Clients Registre (affiché sur desktop) */}
          {!isMobile && (
            <div className="npl-card-subtle" style={{
              borderLeft: '3px solid var(--navy)',
              padding: '14px 16px',
              background: '#ffffff',
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <div className="npl-badge npl-badge-neutral" style={{ marginBottom: 6, fontSize: 11 }}>
                <span className="npl-badge-dot" />
                <span>{t('shop.debts').toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', fontVariantNumeric: 'tabular-nums' }}>
                {clients.length} {t('shop.clientLabel')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                {t('shop.debtBookTitle')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Demandes d'Achat à Crédit Reçues depuis le Web / QR Code */}
      {commandesCreditEnAttente.length > 0 && (
        <div style={{ background: '#f0f9ff', border: '1.5px solid #0284c7', borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>💳</span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0369a1' }}>
                {t('shop.onlineCreditPurchasesTitle')} ({commandesCreditEnAttente.length})
              </h3>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: 12 }}>
              {t('shop.statusPending')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {commandesCreditEnAttente.map((cmd: any) => (
              <div key={cmd.id} style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>
                    👤 {cmd.client_nom} <span style={{ color: '#0284c7', fontWeight: 600, fontSize: 12 }}>({cmd.client_telephone})</span>
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569' }}>
                    📦 {cmd.nom_produit} × {cmd.quantite} — <strong style={{ color: '#dc2626' }}>{fcfa(cmd.montant_total)}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/approuver-commande`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            commande_id: cmd.id,
                            client_nom: cmd.client_nom,
                            client_telephone: cmd.client_telephone,
                            montant: cmd.montant_total,
                            nom_produit: cmd.nom_produit,
                            quantite: cmd.quantite,
                            reference: cmd.reference,
                          }),
                        })
                        const data = await res.json()
                        if (!res.ok) {
                          alert(data.error || 'Erreur approbation')
                          return
                        }
                        setCommandesCreditEnAttente((prev: any[]) => prev.filter((c: any) => c.id !== cmd.id))
                        if (data.client) {
                          setClients((prev: ClientCredit[]) => {
                            const exists = prev.some(c => c.id === data.client.id)
                            if (exists) {
                              return prev.map(c => c.id === data.client.id ? { ...c, solde: data.client.solde } : c)
                            }
                            return [data.client, ...prev]
                          })
                        }
                        await chargerDonnees()
                        window.dispatchEvent(new Event('carnet_updated'))
                        const cleanTel = cmd.client_telephone.replace(/\D/g, '')
                        const msgWa = encodeURIComponent(`Bonjour ${cmd.client_nom}, votre demande d'achat à crédit de ${fcfa(cmd.montant_total)} (${cmd.nom_produit}) a été approuvée par la boutique et enregistrée dans votre Carnet !`)
                        if (confirm(`✅ Demande d'achat à crédit de ${cmd.client_nom} approuvée et enregistrée dans son Carnet client avec succès !\n\nSouhaitez-vous lui envoyer le message de confirmation sur WhatsApp ?`)) {
                          window.open(`https://wa.me/${cleanTel}?text=${msgWa}`, '_blank')
                        }
                      } catch (e) {
                        alert('Erreur lors du traitement.')
                      }
                    }}
                    style={{ padding: '8px 14px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    ✅ {t('common.confirm')}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Souhaitez-vous vraiment rejeter la demande d'achat à crédit de ${cmd.client_nom} (${fcfa(cmd.montant_total)}) ?`)) return
                      try {
                        const res = await fetch(`/api/comptabilite/${boutique.id}/commandes/${cmd.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ statut: 'annulee' }),
                        })
                        if (res.ok) {
                          setCommandesCreditEnAttente((prev: any[]) => prev.filter((c: any) => c.id !== cmd.id))
                          await chargerDonnees()
                        } else {
                          alert('Erreur lors du rejet de la demande.')
                        }
                      } catch (e) {
                        alert('Erreur lors du traitement.')
                      }
                    }}
                    style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    ❌ {t('shop.cancelOrder')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barre de Recherche & Filtres */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flex: '1 1 200px', minWidth: 0, width: '100%', position: 'relative' }}>
          <input
            type="text"
            placeholder={`🔍 ${t('common.search')}...`}
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              background: '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              minHeight: 42
            }}
          />
        </div>

        <div className="horizontal-scroll-fade" style={{ display: 'flex', gap: 6, overflowX: 'auto', maxWidth: '100%', paddingBottom: 2, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {[
            { id: 'tous', label: `${t('common.all')} (${clients.length})` },
            { id: 'retard', label: `🔴 ${t('shop.filterDebtors')} (${nbClientsDebiteurs})` },
            { id: 'credits', label: `🟢 ${t('shop.filterAdvances')}` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltreStatus(f.id as any)}
              style={{
                padding: '7px 12px',
                borderRadius: 20,
                border: filtreStatus === f.id ? '2px solid var(--navy)' : '1px solid var(--border)',
                background: filtreStatus === f.id ? 'var(--navy)' : 'var(--card)',
                color: filtreStatus === f.id ? '#ffffff' : 'var(--text2)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 34,
                flexShrink: 0
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Master/Detail Réactif pour Mobile & Desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: (isMobile || !clientSelectionne) ? '1fr' : '1.05fr 1fr',
        gap: 16
      }}>
        
        {/* LISTE DES CLIENTS : Cachée sur mobile si un client est sélectionné */}
        {(!isMobile || !clientSelectionne) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 14 }}>{t('common.loading')}</div>
            ) : clientsFiltres.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                background: '#ffffff',
                borderRadius: 16,
                border: '2px dashed #cbd5e1',
                color: '#64748b'
              }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📒</span>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{t('shop.noCustomersFound')}</p>
                <p style={{ margin: '4px 0 14px', fontSize: 12.5, color: '#94a3b8' }}>
                  {t('shop.addFirstCustomerPrompt')}
                </p>
                <button
                  onClick={() => setShowModalNouveauClient(true)}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 16px',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  {t('shop.createCustomerShortBtn')}
                </button>
              </div>
            ) : (
              clientsFiltres.map(c => {
                const soldeNum = Number(c.solde)
                const estDebiteur = soldeNum > 0
                const estAvance = soldeNum < 0
                const estActif = clientSelectionne?.id === c.id
                const isMenuOpen = menuOuvertClientId === c.id

                return (
                  <div
                    key={c.id}
                    className="npl-card"
                    style={{
                      borderColor: estActif ? 'var(--navy)' : undefined,
                      boxShadow: estActif ? '0 0 0 1px var(--navy), var(--shadow2)' : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      padding: 14
                    }}
                  >
                    {/* En-tête de la Carte Client */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>
                            {formatNomPropre(c.nom)}
                          </span>
                          {c.statut === 'bloque' && (
                            <span className="npl-badge npl-badge-danger">
                              <span className="npl-badge-dot" />
                              <span>{t('shop.blacklistedBadge')}</span>
                            </span>
                          )}
                          {c.adresse && (
                            <span className="npl-badge npl-badge-neutral" style={{ fontSize: 11 }}>
                              📍 {c.adresse}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 3 }}>
                          📞 {formatPhone(c.telephone)} {c.plafond_max > 0 ? `• ${t('shop.creditLimitPrefix')}: ${fcfa(c.plafond_max)}` : ''}
                        </div>
                        {c.note_client && (
                          <div style={{ fontSize: 11.5, color: 'var(--text3)', fontStyle: 'italic', marginTop: 2 }}>
                            {t('common.notes')}: {c.note_client}
                          </div>
                        )}
                      </div>

                      {/* Montant & Statut */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: estDebiteur ? '#dc2626' : estAvance ? '#16a34a' : 'var(--text2)',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {estDebiteur ? `+ ${fcfa(soldeNum)}` : estAvance ? `- ${fcfa(Math.abs(soldeNum))}` : '0 FCFA'}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          {estDebiteur ? (
                            <span className="npl-badge npl-badge-danger">
                              <span className="npl-badge-dot" />
                              <span>{t('shop.owesShopBadge')}</span>
                            </span>
                          ) : estAvance ? (
                            <span className="npl-badge npl-badge-success">
                              <span className="npl-badge-dot" />
                              <span>{t('shop.advanceBadge')}</span>
                            </span>
                          ) : (
                            <span className="npl-badge npl-badge-neutral">
                              <span className="npl-badge-dot" />
                              <span>{t('shop.zeroBalanceBadge')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barre d'Actions Épurée : 1 CTA Principal + WhatsApp + Menu ⋯ */}
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      paddingTop: 10,
                      borderTop: '1px solid var(--border)',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      flexWrap: 'wrap'
                    }}>
                      {/* CTA Principal selon la situation financière */}
                      {estDebiteur ? (
                        <button
                          onClick={() => ouvrirModalTransaction('remboursement', c)}
                          className="npl-btn npl-btn-success npl-btn-sm"
                          style={{ flex: isMobile ? '1 1 auto' : 'none' }}
                        >
                          <span>💵</span>
                          <span>{t('shop.collectRepayBtn')}</span>
                        </button>
                      ) : estAvance ? (
                        <button
                          onClick={() => ouvrirModalTransaction('vente_credit', c)}
                          className="npl-btn npl-btn-accent npl-btn-sm"
                          style={{ flex: isMobile ? '1 1 auto' : 'none' }}
                        >
                          <span>⚡</span>
                          <span>{t('shop.deductOnPurchaseBtn')}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => ouvrirModalTransaction('vente_credit', c)}
                          className="npl-btn npl-btn-primary npl-btn-sm"
                          style={{ flex: isMobile ? '1 1 auto' : 'none' }}
                        >
                          <span>⚡</span>
                          <span>{t('shop.giveCreditBtn')}</span>
                        </button>
                      )}

                      {/* Bouton Relance WhatsApp Rapide */}
                      <button
                        onClick={() => handleRelancerWhatsApp(c)}
                        className="npl-btn npl-btn-secondary npl-btn-sm"
                        title="WhatsApp"
                      >
                        <span style={{ color: '#25D366' }}>📱</span>
                        <span>{t('shop.remindWhatsappBtn')}</span>
                      </button>

                      {/* Menu Contextuel d'Actions Secondaires ⋯ */}
                      <div className="npl-dropdown">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOuvertClientId(isMenuOpen ? null : c.id)
                          }}
                          className="npl-btn npl-btn-secondary npl-btn-sm npl-btn-icon"
                          title={t('shop.moreActionsBtn')}
                          aria-label={t('shop.moreActionsBtn')}
                          aria-haspopup="true"
                          aria-expanded={isMenuOpen}
                        >
                          <span style={{ fontSize: 16, lineHeight: 1 }}>⋯</span>
                        </button>

                        {isMenuOpen && (
                          <div className="npl-dropdown-menu" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuOuvertClientId(null)
                                ouvrirFicheClient(c)
                              }}
                              className="npl-dropdown-item"
                            >
                              <span>📜</span>
                              <span>{t('shop.viewCustomerFileMenu')}</span>
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuOuvertClientId(null)
                                ouvrirModalEditClient(c)
                              }}
                              className="npl-dropdown-item"
                            >
                              <span>✏️</span>
                              <span>{t('shop.editProfileLimitMenu')}</span>
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuOuvertClientId(null)
                                ouvrirModalTransaction('vente_credit', c)
                              }}
                              className="npl-dropdown-item"
                            >
                              <span>⚡</span>
                              <span>{t('shop.grantCreditAction')}</span>
                            </button>

                            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                            {c.statut === 'bloque' ? (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOuvertClientId(null)
                                  handleChangerStatutClient(c, 'actif')
                                }}
                                className="npl-dropdown-item"
                              >
                                <span>🟢</span>
                                <span>{t('shop.reactivateCustomerMenu')}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOuvertClientId(null)
                                  handleChangerStatutClient(c, 'bloque')
                                }}
                                className="npl-dropdown-item danger"
                              >
                                <span>⛔</span>
                                <span>{t('shop.blacklistCustomerMenu')}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuOuvertClientId(null)
                                handleSupprimerClient(c)
                              }}
                              className="npl-dropdown-item danger"
                            >
                              <span>🗑️</span>
                              <span>{t('shop.deleteCustomerMenu')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* FICHE DÉTAILLÉE DU CLIENT SÉLECTIONNÉ */}
        {clientSelectionne && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: isMobile ? '16px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 4px 16px rgba(15,23,42,0.06)'
          }}>
            {/* Bouton Retour Liste sur Mobile */}
            {isMobile && (
              <button
                onClick={() => setClientSelectionne(null)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                  minHeight: 38
                }}
              >
                {t('shop.backToCustomerListBtn')}
              </button>
            )}

            {/* En-tête Fiche Client */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{clientSelectionne.nom}</h2>
                  <button
                    onClick={() => ouvrirModalEditClient(clientSelectionne)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ {t('common.edit')}
                  </button>
                  {!isMobile && (
                    <button
                      onClick={() => setClientSelectionne(null)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  📞 {clientSelectionne.telephone} {clientSelectionne.adresse ? `• 📍 ${clientSelectionne.adresse}` : ''}
                </p>
                {clientSelectionne.note_client && (
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
                    {t('common.notes')}: {clientSelectionne.note_client}
                  </p>
                )}
              </div>

              <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('shop.currentBalanceLabel')}</span>
                <div style={{
                  fontSize: 19,
                  fontWeight: 900,
                  color: Number(clientSelectionne.solde) > 0 ? '#dc2626' : Number(clientSelectionne.solde) < 0 ? '#16a34a' : '#0f172a'
                }}>
                  {fcfa(clientSelectionne.solde)}
                </div>
              </div>
            </div>

            {/* Actions Rapides */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => ouvrirModalTransaction('vente_credit')}
                style={{
                  flex: 1,
                  minWidth: 120,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  minHeight: 42
                }}
              >
                + {t('shop.transactionCreditSale')}
              </button>

              <button
                onClick={() => ouvrirModalTransaction('remboursement')}
                style={{
                  flex: 1,
                  minWidth: 120,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  minHeight: 42
                }}
              >
                💸 {t('shop.transactionRepayment')}
              </button>

              <button
                onClick={handleExportReleveClientPDF}
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  minHeight: 42
                }}
                title={t('shop.printPdfStatementBtn')}
              >
                {t('shop.printPdfStatementBtn')}
              </button>

              {Number(clientSelectionne.solde) > 0 && (
                <button
                  onClick={() => handleRelancerWhatsApp(clientSelectionne)}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    minWidth: isMobile ? 120 : 'auto',
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    minHeight: 42
                  }}
                >
                  📱 {t('shop.remindWhatsappBtn')}
                </button>
              )}
            </div>

            {/* Historique des opérations */}
            <div>
              <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                {t('shop.operationsHistoryTitle')}
              </h3>

              {loadingHist ? (
                <div style={{ fontSize: 13, color: '#64748b' }}>{t('common.loading')}</div>
              ) : historique.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                  {t('shop.noTransactionsForCustomer')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                  {historique.map(h => {
                    const estVente = h.type === 'vente_credit'
                    const dateEch = h.date_echeance ? new Date(h.date_echeance) : null
                    const estEnRetard = dateEch && dateEch < new Date() && estVente

                    return (
                      <div
                        key={h.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 6,
                              background: estVente ? '#fef2f2' : '#f0fdf4',
                              color: estVente ? '#991b1b' : '#166534',
                              border: estVente ? '1px solid #fecaca' : '1px solid #bbf7d0'
                            }}>
                              {estVente ? `🔴 ${t('shop.transactionCreditSale')}` : `🟢 ${t('shop.transactionRepayment')}`}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#64748b' }}>
                              {fmtDateHeure(h.created_at)}
                            </span>
                          </div>

                          {h.note && (
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginTop: 3 }}>
                              {h.note}
                            </div>
                          )}

                          {Array.isArray(h.produits) && h.produits.length > 0 && (
                            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {h.produits.map((item: any, idx: number) => (
                                <span key={idx} style={{ fontSize: 10, background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: 4 }}>
                                  {item.nom} (x{item.quantite})
                                </span>
                              ))}
                            </div>
                          )}

                          {h.date_echeance && (
                            <div style={{ fontSize: 11, marginTop: 4, color: estEnRetard ? '#dc2626' : '#0284c7', fontWeight: 700 }}>
                              📅 {t('shop.dueDateLabel')} : {fmtDate(h.date_echeance)} {estEnRetard ? ` (🔴 ${t('shop.overdueBadge')})` : ''}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: estVente ? '#dc2626' : '#16a34a'
                          }}>
                            {estVente ? `+ ${fcfa(h.montant)}` : `- ${fcfa(h.montant)}`}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                            {h.mode_paiement || 'Espèces'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* MODALE 1 : NOUVEAU CLIENT CARNET */}
      {showModalNouveauClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 480,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: isMobile ? 18 : 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
                {t('shop.createCustomerModalTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setShowModalNouveauClient(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#0f172a',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={t('common.close')}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerClient} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerFullNameLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('shop.customerFullNamePlaceholder')}
                  value={nomClient}
                  onChange={e => setNomClient(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerPhoneLabel')}</label>
                <input
                  type="tel"
                  required
                  placeholder={t('shop.customerPhonePlaceholder')}
                  value={telClient}
                  onChange={e => setTelClient(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerAddressLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('shop.customerAddressPlaceholder')}
                    value={adresseClient}
                    onChange={e => setAdresseClient(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerCreditLimitLabel')}</label>
                  <input
                    type="number"
                    placeholder={t('shop.customerCreditLimitPlaceholder')}
                    value={plafondClient}
                    onChange={e => setPlafondClient(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerNotesLabel')}</label>
                <input
                  type="text"
                  placeholder={t('shop.customerNotesPlaceholder')}
                  value={noteClient}
                  onChange={e => setNoteClient(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 6,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  minHeight: 44
                }}
              >
                {t('shop.saveCustomerBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : MODIFIER UN CLIENT */}
      {showModalEditClient && clientAEditer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 480,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: isMobile ? 18 : 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
                {t('shop.editCustomerModalTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setShowModalEditClient(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#0f172a',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={t('common.close')}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnregistrerEditClient} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerFullNameLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('shop.customerFullNamePlaceholder')}
                  value={editNom}
                  onChange={e => setEditNom(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerPhoneLabel')}</label>
                <input
                  type="tel"
                  required
                  placeholder={t('shop.customerPhonePlaceholder')}
                  value={editTel}
                  onChange={e => setEditTel(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerAddressLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('shop.customerAddressPlaceholder')}
                    value={editAdresse}
                    onChange={e => setEditAdresse(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerCreditLimitLabel')}</label>
                  <input
                    type="number"
                    placeholder={t('shop.customerCreditLimitPlaceholder')}
                    value={editPlafond}
                    onChange={e => setEditPlafond(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>{t('shop.customerNotesLabel')}</label>
                <input
                  type="text"
                  placeholder={t('shop.customerNotesPlaceholder')}
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingEdit}
                style={{
                  marginTop: 6,
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  minHeight: 44,
                  opacity: submittingEdit ? 0.7 : 1
                }}
              >
                {submittingEdit ? t('shop.savingProgress') : t('shop.saveChangesBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 3 : TRANSACTION (CREDIT / REMBOURSEMENT) */}
      {showModalTransaction && clientSelectionne && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 640,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: isMobile ? 16 : 22,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: isMobile ? 15.5 : 18, fontWeight: 900, color: '#0f172a' }}>
                  {typeTransaction === 'vente_credit' ? t('shop.newCreditSaleModalTitle') : t('shop.collectRepaymentModalTitle')}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  {t('shop.clientLabel')} : <strong>{clientSelectionne.nom}</strong> ({clientSelectionne.telephone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalTransaction(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#0f172a',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={t('common.close')}
              >
                ✕
              </button>
            </div>

            {typeTransaction === 'vente_credit' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 12, flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => setModeSaisie('catalogue')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: modeSaisie === 'catalogue' ? '#ffffff' : 'transparent',
                      fontWeight: modeSaisie === 'catalogue' ? 800 : 600,
                      color: modeSaisie === 'catalogue' ? '#0f172a' : '#64748b',
                      fontSize: 12.5,
                      cursor: 'pointer',
                      boxShadow: modeSaisie === 'catalogue' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    {t('shop.catalogModeTab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeSaisie('manuel')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: modeSaisie === 'manuel' ? '#ffffff' : 'transparent',
                      fontWeight: modeSaisie === 'manuel' ? 800 : 600,
                      color: modeSaisie === 'manuel' ? '#0f172a' : '#64748b',
                      fontSize: 12.5,
                      cursor: 'pointer',
                      boxShadow: modeSaisie === 'manuel' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    {t('shop.manualModeTab')}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={demarrerScannerEanCredit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t('shop.scanEanBtn')}
                </button>
              </div>
            )}

            {/* Mode Catalogue */}
            {typeTransaction === 'vente_credit' && modeSaisie === 'catalogue' && (() => {
              const categoriesModal = Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
              const qModal = rechercheProduitModal.trim().toLowerCase()
              const produitsFiltresModal = produits.filter((p: any) => {
                const matchCat = categorieProduitModal === 'tous' || p.categorie === categorieProduitModal
                const matchText = !qModal ||
                  p.nom?.toLowerCase().includes(qModal) ||
                  p.categorie?.toLowerCase().includes(qModal) ||
                  p.barcode?.toLowerCase().includes(qModal) ||
                  p.sku?.toLowerCase().includes(qModal)
                return matchCat && matchText
              })

              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: 0 }}>
                      {t('shop.clickArticlesPrompt')}
                    </label>
                    {Object.keys(panierProduits).some(k => panierProduits[k] > 0) && (
                      <button
                        type="button"
                        onClick={() => setPanierProduits({})}
                        style={{ fontSize: 11, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}
                      >
                        {t('shop.emptyCartBtn')}
                      </button>
                    )}
                  </div>

                  {/* Champ de recherche rapide + Filtres catégories */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={rechercheProduitModal}
                        onChange={e => setRechercheProduitModal(e.target.value)}
                        placeholder={t('shop.searchProductPrompt')}
                        style={{
                          width: '100%',
                          padding: '8px 30px 8px 12px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: 13,
                          fontWeight: 600,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      {rechercheProduitModal && (
                        <button
                          type="button"
                          onClick={() => setRechercheProduitModal('')}
                          style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: 14
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {categoriesModal.length > 0 && (
                      <div className="horizontal-scroll-fade" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                        <button
                          type="button"
                          onClick={() => setCategorieProduitModal('tous')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            background: categorieProduitModal === 'tous' ? '#0284c7' : '#f1f5f9',
                            color: categorieProduitModal === 'tous' ? '#ffffff' : '#475569'
                          }}
                        >
                          {t('common.all')} ({produits.length})
                        </button>
                        {categoriesModal.map(cat => {
                          const count = produits.filter((p: any) => p.categorie === cat).length
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategorieProduitModal(cat)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                background: categorieProduitModal === cat ? '#0284c7' : '#f1f5f9',
                                color: categorieProduitModal === cat ? '#ffffff' : '#475569'
                              }}
                            >
                              {cat} ({count})
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 8,
                    maxHeight: 240,
                    overflowY: 'auto',
                    padding: 2
                  }}>
                    {produitsFiltresModal.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: '#94a3b8', textAlign: 'center', padding: 20 }}>
                        {produits.length === 0
                          ? t('shop.noProductsInCatalog')
                          : t('shop.noProductsMatchSearch')}
                      </div>
                    ) : (
                      produitsFiltresModal.map((p: any) => {
                        const qte = panierProduits[p.id] || 0
                        const prixAff = Number(p.prix_promo || p.prix || 0)

                        return (
                          <div
                            key={p.id}
                            style={{
                              background: qte > 0 ? '#f0f9ff' : '#f8fafc',
                              border: qte > 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                              borderRadius: 10,
                              padding: '8px 6px',
                              textAlign: 'center',
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div
                              onClick={() => setPanierProduits(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                              style={{ cursor: 'pointer' }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.nom}>
                                {p.nom}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 900, marginTop: 2 }}>
                                {fcfa(prixAff)}
                              </div>
                            </div>

                            {qte > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6, paddingTop: 4, borderTop: '1px dashed #bae6fd' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPanierProduits(prev => {
                                      const copy = { ...prev }
                                      if (copy[p.id] > 1) {
                                        copy[p.id] -= 1
                                      } else {
                                        delete copy[p.id]
                                      }
                                      return copy
                                    })
                                  }}
                                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="-"
                                >
                                  -
                                </button>

                                <span style={{ fontSize: 12, fontWeight: 900, color: '#0369a1', minWidth: 16, textAlign: 'center' }}>
                                  {qte}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPanierProduits(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))
                                  }}
                                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#e0f2fe', color: '#0284c7', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="+"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPanierProduits(prev => ({ ...prev, [p.id]: 1 }))}
                                style={{ marginTop: 4, padding: '3px 6px', fontSize: 10.5, fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, color: '#475569', cursor: 'pointer' }}
                              >
                                ➕ {t('common.add')}
                              </button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Résumé clair du panier sélectionné (Catalogue + Saisie Libre) */}
                  {(Object.keys(panierProduits).some(k => panierProduits[k] > 0) || itemsCustomPanier.length > 0) && (
                    <div style={{ marginTop: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0369a1' }}>
                          🛒 {t('shop.articlesInSale')} ({Object.values(panierProduits).reduce((a, b) => a + b, 0) + itemsCustomPanier.reduce((a, b) => a + b.quantite, 0)}) :
                        </span>
                        <button
                          type="button"
                          onClick={() => { setPanierProduits({}); setItemsCustomPanier([]) }}
                          style={{ fontSize: 11, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 800 }}
                        >
                          {t('shop.emptyAllCartBtn')}
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
                        {/* 1. Produits Catalogue */}
                        {Object.entries(panierProduits).filter(([_, qte]) => qte > 0).map(([pId, qte]) => {
                          const prodObj = produits.find((p: any) => p.id === pId)
                          if (!prodObj) return null
                          const unitPrice = Number(prodObj.prix_promo || prodObj.prix || 0)
                          const subtotal = unitPrice * qte

                          return (
                            <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '4px 8px', borderRadius: 6, border: '1px solid #e0f2fe', fontSize: 12 }}>
                              <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                {prodObj.nom}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#0284c7', fontWeight: 800 }}>
                                  {qte} × {fcfa(unitPrice)} = {fcfa(subtotal)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPanierProduits(prev => {
                                    const copy = { ...prev }
                                    delete copy[pId]
                                    return copy
                                  })}
                                  style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, width: 18, height: 18, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title={t('shop.deleteItemTitle')}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )
                        })}

                        {/* 2. Articles Hors Catalogue / Saisie libre */}
                        {itemsCustomPanier.map((item, idx) => {
                          const subtotal = item.prix * item.quantite
                          return (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '4px 8px', borderRadius: 6, border: '1px dashed #0284c7', fontSize: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                                <span style={{ fontSize: 9.5, background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '1px 4px', borderRadius: 4 }}>{t('shop.freeItemBadge')}</span>
                                <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                  {item.nom}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#0284c7', fontWeight: 800 }}>
                                  {item.quantite} × {fcfa(item.prix)} = {fcfa(subtotal)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setItemsCustomPanier(prev => prev.filter((_, i) => i !== idx))}
                                  style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, width: 18, height: 18, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title={t('shop.deleteItemTitle')}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Mode Saisie Libre (Vente à crédit) */}
            {typeTransaction === 'vente_credit' && modeSaisie === 'manuel' && (
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', margin: 0 }}>
                    {t('shop.addCustomArticlePrompt')}
                  </label>
                  <button
                    type="button"
                    onClick={demarrerScannerNomCredit}
                    style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {t('shop.scanNameOcrBtn')}
                  </button>
                </div>
                
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    {t('shop.articleDesignationLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('shop.articleDesignationPlaceholder')}
                    value={libelleCustomInput}
                    onChange={e => setLibelleCustomInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, boxSizing: 'border-box' }}
                  />
                </div>

                {ocrDetectionsCredit.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>{t('shop.ocrDetectionsLabel')}</span>
                    {ocrDetectionsCredit.map((txt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLibelleCustomInput(txt)}
                        style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {txt}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      {t('shop.unitPriceLabel')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder={t('shop.unitPricePlaceholder')}
                      value={prixCustomInput}
                      onChange={e => setPrixCustomInput(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      {t('shop.quantityLabel')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={qteCustomInput}
                      onChange={e => setQteCustomInput(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!libelleCustomInput.trim()) {
                      alert('Veuillez saisir le nom / la désignation de l\'article.')
                      return
                    }
                    if (!prixCustomInput || Number(prixCustomInput) <= 0) {
                      alert('Veuillez saisir un prix unitaire valide.')
                      return
                    }
                    const newItem = {
                      id: 'custom_' + Date.now(),
                      nom: libelleCustomInput.trim(),
                      prix: Number(prixCustomInput),
                      quantite: Number(qteCustomInput || 1)
                    }
                    setItemsCustomPanier(prev => [...prev, newItem])
                    setLibelleCustomInput('')
                    setPrixCustomInput('')
                    setQteCustomInput(1)
                  }}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    alignSelf: 'flex-end',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {t('shop.addArticleToCartBtn')}
                </button>
              </div>
            )}

            {/* Mode Remboursement */}
            {typeTransaction === 'remboursement' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    {t('shop.repaymentAmountLabel')}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={t('shop.repaymentAmountPlaceholder')}
                    value={montantManuel}
                    onChange={e => setMontantManuel(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, fontWeight: 800, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    {t('shop.paymentNoteLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('shop.paymentNotePlaceholder')}
                    value={descriptionManuelle}
                    onChange={e => setDescriptionManuelle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {/* Échéance & Relance WA */}
            {typeTransaction === 'vente_credit' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      {t('shop.dueDatePrompt')}
                    </label>
                    <input
                      type="date"
                      value={dateEcheance}
                      onChange={e => setDateEcheance(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      {t('shop.paymentModePrompt')}
                    </label>
                    <select
                      value={modePaiement}
                      onChange={e => setModePaiement(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
                    >
                      <option value="especes">{t('shop.cashCreditOption')}</option>
                      <option value="wave">🌊 Wave</option>
                      <option value="orange_money">🍊 Orange Money</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="relanceWaCheck"
                    checked={relanceAutoWa}
                    onChange={e => setRelanceAutoWa(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="relanceWaCheck" style={{ fontSize: 11.5, color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}>
                    {t('shop.autoWaReminderCheckbox')}
                  </label>
                </div>
              </div>
            )}

            {/* Total et Bouton de Validation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>{t('shop.totalTransactionLabel')}</span>
                <div style={{ fontSize: 19, fontWeight: 900, color: typeTransaction === 'vente_credit' ? '#dc2626' : '#16a34a' }}>
                  {fcfa(totalTransactionCourante)}
                </div>
              </div>

              <button
                disabled={submittingTrans}
                onClick={handleValiderTransaction}
                style={{
                  background: typeTransaction === 'vente_credit' ? '#dc2626' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontWeight: 900,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  opacity: submittingTrans ? 0.6 : 1,
                  minHeight: 44
                }}
              >
                {submittingTrans ? t('shop.savingProgress') : typeTransaction === 'vente_credit' ? t('shop.validateCreditSaleBtn') : t('shop.validateRepaymentBtn')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal QR Code Scan Client Comptoir */}
      <QrCodeShareModal
        isOpen={showQrModalComptoir}
        onClose={() => setShowQrModalComptoir(false)}
        url={typeof window !== 'undefined' ? `${window.location.origin}/boutiques/${boutique.slug || boutique.id}?mode=credit` : `https://nopalou.com/boutiques/${boutique.slug || boutique.id}?mode=credit`}
        boutiqueNom={boutique.nom}
        title="📱 QR Code Client en Boutique / Comptoir"
      />

      {/* Modal Scanner EAN Caméra Crédit */}
      {modalScannerEanCredit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{t('shop.scanBarcodeModalTitle')}</h4>
              <button type="button" onClick={arreterScannerEanCredit} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerEanStatusCredit}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <div id="carnet-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#475569' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700 }}>
                <input type="checkbox" checked={scanContinuCredit} onChange={e => setScanContinuCredit(e.target.checked)} />
                {t('shop.continuousScanCheckbox')}
              </label>
              <button type="button" onClick={arreterScannerEanCredit} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 800, cursor: 'pointer' }}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scanner Nom OCR Crédit */}
      {modalScannerNomCredit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{t('shop.scanProductNameModalTitle')}</h4>
              <button type="button" onClick={arreterScannerNomCredit} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerNomCredit}</p>
            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              {imageFligeeCreditNom ? (
                <img src={imageFligeeCreditNom} alt="Capture" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0f172a' }} />
              ) : (
                <>
                  <video ref={videoNomCreditRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '15%', left: '5%', width: '90%', height: '70%', border: '2px dashed #38bdf8', borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                      {t('shop.centerNamePrompt')}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={ocrLoadingCredit}
                onClick={capturerNomOCRCredit}
                style={{ flex: 1, padding: '11px', background: ocrLoadingCredit ? '#94a3b8' : '#0284c7', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: ocrLoadingCredit ? 'not-allowed' : 'pointer' }}
              >
                {ocrLoadingCredit ? t('shop.savingProgress') : (imageFligeeCreditNom ? '🔄 Reprendre la photo' : t('shop.captureAndExtractNameBtn'))}
              </button>
              {imageFligeeCreditNom && (
                <button
                  type="button"
                  onClick={arreterScannerNomCredit}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  ✅ Valider
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
