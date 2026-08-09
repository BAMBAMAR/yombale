'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import { exportToCSV, printPDFReport } from '@/lib/export'
import BatchImportModal from '@/app/boutique/BatchImportModal'
import { CATEGORIES } from '@/lib/categories'
import { getBoutiqueProduits, getBoutiquesMine, getPosHistorique, creerPosVente, declarerIncident, creerBoutiqueDocument } from '../actions'
import { Settings, Download, History, Book, Unlock, Lock, ShieldAlert, User, Shield, Search, ArrowLeft, Store, Camera, MessageCircle, Printer, AlignJustify, LayoutGrid } from 'lucide-react'
import {
  sauvegarderProduitsLocaux,
  obtenirProduitsLocaux,
  sauvegarderClientsLocaux,
  obtenirClientsLocaux,
  ajouterVenteHorsLigne,
  obtenirVentesHorsLigne,
  viderVentesHorsLigne
} from '@/lib/db-offline'

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

export default function CaisseClient({ planActif: planActifProp, initialToken }: { planActif?: string | null; initialToken?: string | null }) {
  const [terminalPlan, setTerminalPlan] = useState<string | null>('pro')

  // ── État Boutiques du Marchand & Synchronisation Catalogue ───────────────────
  const [boutiques, setBoutiques] = useState<{ id: string; nom: string; plan_actif?: string | null; regime_fiscal?: string; prix_tva_incluse?: boolean; timbre_fiscal_applicable?: boolean; tva_taux_defaut?: number; actif?: boolean; adresse?: string | null; telephone?: string | null }[]>([])
  const [boutiqueActiveId, setBoutiqueActiveId] = useState<string>('')
  const [loadingProduits, setLoadingProduits] = useState<boolean>(true)
  const [modalImportBatch, setModalImportBatch] = useState<boolean>(false)

  // ── État Rôles & Authentification PIN Sécurisée ──────────────────────────────
  const [verrouille, setVerrouille] = useState<boolean>(true)
  const [codePinSaisi, setCodePinSaisi] = useState<string>('')
  const [pinError, setPinError] = useState<string | null>(null)

  // --- ÉTAT OFFLINE & SYNC ---
  const [offlineModeActive, setOfflineModeActive] = useState<boolean>(false)
  const [syncingOffline, setSyncingOffline] = useState<boolean>(false)

  // ── Vérification dynamique de l'autorisation POS selon la boutique sélectionnée ──
  const activeBoutiqueObj = boutiques.find(b => b.id === boutiqueActiveId)
  const activePlan = (activeBoutiqueObj?.plan_actif !== undefined && activeBoutiqueObj?.plan_actif !== null)
    ? activeBoutiqueObj.plan_actif
    : (initialToken ? (terminalPlan || 'pro') : planActifProp)

  const estBoutiqueAutorisee = (activePlan === 'pro' || activePlan === 'business') || (loadingProduits && boutiques.length === 0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOfflineModeActive(!navigator.onLine)
      
      const goOnline = () => {
        setOfflineModeActive(false)
        declencherSyncOffline()
      }
      const goOffline = () => {
        setOfflineModeActive(true)
      }

      window.addEventListener('online', goOnline)
      window.addEventListener('offline', goOffline)

      if (navigator.onLine) {
        declencherSyncOffline()
      }

      return () => {
        window.removeEventListener('online', goOnline)
        window.removeEventListener('offline', goOffline)
      }
    }
  }, [boutiqueActiveId])

  async function declencherSyncOffline() {
    if (!boutiqueActiveId || syncingOffline || !navigator.onLine) return
    try {
      setSyncingOffline(true)
      const ventesQueue = await obtenirVentesHorsLigne()
      if (ventesQueue.length === 0) {
        setSyncingOffline(false)
        return
      }

      console.log(`[OFFLINE SYNC] Tentative de synchronisation de ${ventesQueue.length} vente(s)...`)
      let successCount = 0
      
      for (const vente of ventesQueue) {
        if (vente.boutique_id !== boutiqueActiveId) continue
        try {
          const res = await creerPosVente(vente.boutique_id, {
            items: vente.items,
            caissier: vente.caissier,
            modePaiement: vente.modePaiement,
            client_id: vente.client_id,
            total: vente.total
          })
          if (res.success) {
            successCount++
          }
        } catch (eErr) {
          console.error('Erreur synchro vente offline:', eErr)
        }
      }

      if (successCount > 0) {
        await viderVentesHorsLigne()
        const hist = await getPosHistorique(boutiqueActiveId)
        if (hist && hist.length > 0) {
          setHistoriqueVentes(hist)
        }
      }
    } catch (err) {
      console.error('Erreur synchronisation offline:', err)
    } finally {
      setSyncingOffline(false)
    }
  }
  
  // Rôle Actif de la Session ('caissier' ou 'superviseur')
  const [roleActif, setRoleActif] = useState<'caissier' | 'superviseur'>('caissier')

  // Codes PIN secrets (Stockés de façon masquée et sécurisée)
  const [pinCaissier, setPinCaissier] = useState<string>('1234')
  const [pinSuperviseur, setPinSuperviseur] = useState<string>('9999')
  const [modalConfigPin, setModalConfigPin] = useState<boolean>(false)

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
  const [conflitSessionMessage, setConflitSessionMessage] = useState<string | null>(null)
  const [menuOutilsOuvert, setMenuOutilsOuvert] = useState<boolean>(false)
  const [modalSessionOuverture, setModalSessionOuverture] = useState<boolean>(false)
  const [modalClotureZ, setModalClotureZ] = useState<boolean>(false)
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

  // Saisie Crédit lors de l'encaissement POS
  const [clientCreditIdPOS, setClientCreditIdPOS] = useState<string>('')
  const [creditDateEcheancePOS, setCreditDateEcheancePOS] = useState<string>('')
  const [creditNotePOS, setCreditNotePOS] = useState<string>('')

  // ── Scanner Caméra Smartphone & Format Ticket Thermique ESC/POS ─────────────
  const [modalScannerCamera, setModalScannerCamera] = useState<boolean>(false)
  const [modalPairageSmartphone, setModalPairageSmartphone] = useState<boolean>(false)
  const [sessionScannerId] = useState<string>(() => `SCAN-${Math.floor(100000 + Math.random() * 900000)}`)
  const [scannerCameraStatus, setScannerCameraStatus] = useState<string>('Initialisation...')
  const [formatTicketThermique, setFormatTicketThermique] = useState<'80mm' | '58mm'>('80mm')
  const html5QrcodeScannerRef = useRef<any>(null)

  // Polling automatique de la douchette smartphone distante sur PC Caisse
  useEffect(() => {
    if (!boutiqueActiveId || !sessionScannerId) return
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/boutiques/${boutiqueActiveId}/scanner-remote?sessionId=${sessionScannerId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.codes && Array.isArray(data.codes) && data.codes.length > 0) {
            data.codes.forEach((code: string) => {
              traiterCodeBarreCamera(code)
            })
          }
        }
      } catch (e) {}
    }, 1200)
    return () => clearInterval(timer)
  }, [boutiqueActiveId, sessionScannerId])

  function envoyerRelanceWhatsApp(c: any) {
    if (!c.telephone) return
    const numClean = c.telephone.replace(/\D/g, '')
    const phone = numClean.startsWith('221') ? numClean : `221${numClean}`
    const bqNom = boutiques.find(b => b.id === boutiqueActiveId)?.nom || 'Notre Boutique'
    const soldeText = c.solde > 0 ? `votre solde de dette est de ${fcfa(c.solde)}` : `votre solde d'avance est de ${fcfa(Math.abs(c.solde))}`
    const message = `Bonjour ${c.nom}, concernant votre carnet de crédit chez ${bqNom} : ${soldeText}. Merci de nous contacter pour le règlement !`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  async function demarrerScannerCamera() {
    setModalScannerCamera(true)
    setScannerCameraStatus('Initialisation du scanner EAN/Code-Barres…')

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')

        if (html5QrcodeScannerRef.current) {
          try {
            await html5QrcodeScannerRef.current.stop()
            html5QrcodeScannerRef.current.clear()
          } catch (e) {}
          html5QrcodeScannerRef.current = null
        }

        const scannerContainer = document.getElementById('nopalou-reader-scanner')
        if (!scannerContainer) return

        const scanner = new Html5Qrcode('nopalou-reader-scanner')
        html5QrcodeScannerRef.current = scanner

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 160 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        }

        const onScanSuccess = (decodedText: string) => {
          console.log('[EAN DECODED SUCCESS]', decodedText)
          traiterCodeBarreCamera(decodedText)
        }

        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerCameraStatus('📷 Caméra active ! Placez le code-barres (EAN-13, etc.) dans le cadre')
        } catch (errEnv) {
          console.warn('Bascule caméra arrière -> caméra standard...', errEnv)
          try {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {})
            setScannerCameraStatus('📷 Caméra active ! Placez le code-barres dans le cadre')
          } catch (errUser: any) {
            console.error('Erreur lancement caméra:', errUser)
            setScannerCameraStatus('❌ Impossible d’accéder à la caméra. Vérifiez les permissions de votre navigateur ou utilisez la Douchette Smartphone.')
          }
        }
      } catch (err: any) {
        console.error('Erreur module scanner:', err)
        setScannerCameraStatus('❌ Impossible d’initialiser le scanner. Utilisez la Douchette Smartphone.')
      }
    }, 300)
  }

  async function arreterScannerCamera() {
    if (html5QrcodeScannerRef.current) {
      try {
        await html5QrcodeScannerRef.current.stop()
        html5QrcodeScannerRef.current.clear()
      } catch (e) {}
      html5QrcodeScannerRef.current = null
    }
    setModalScannerCamera(false)
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
    const pFound = produits.find(p => p.code_barre === code || p.id === code)
    if (pFound) {
      ajouterAuPanier(pFound)
      alert(`✅ Produit scanné et ajouté : ${pFound.nom} (${fcfa(pFound.prix)})`)
      arreterScannerCamera()
    } else {
      setRecherche(code)
      setScannerCameraStatus(`Code scanné : ${code} (Recherche filtrée)`)
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
        } catch (e) {}
      }
    }
  }, [boutiqueActiveId])

  // ── Synchroniser la sauvegarde locale de l'historique des ventes ──────────────
  useEffect(() => {
    if (boutiqueActiveId && historiqueVentes.length > 0) {
      localStorage.setItem(`nopalou_pos_historique_${boutiqueActiveId}`, JSON.stringify(historiqueVentes))
    }
  }, [historiqueVentes, boutiqueActiveId])

  // ── Charger les boutiques du marchand et le catalogue réel de produits ───────
  useEffect(() => {
    async function chargerBoutiquesEtProduits() {
      try {
        setLoadingProduits(true)
        if (initialToken) {
          const res = await fetch(`/api/boutiques/caisse-terminal/${initialToken}`)
          if (res.ok) {
            const data = await res.json()
            if (data?.success && data?.boutique) {
              setBoutiques([data.boutique])
              setBoutiqueActiveId(data.boutique.id)
              setTerminalPlan(data.planActif || 'pro')
              if (data.caissiers) setCaissiersList(data.caissiers)
              await chargerProduitsBoutique(data.boutique.id)
              await chargerClientsCredits(data.boutique.id)
              setLoadingProduits(false)
              return
            }
          }
        }
        const mine = await getBoutiquesMine()
        const merchantBoutiques = mine || []
        if (merchantBoutiques.length > 0) {
          setBoutiques(merchantBoutiques)
          const bId = boutiqueActiveId || merchantBoutiques[0].id
          setBoutiqueActiveId(bId)
          await chargerProduitsBoutique(bId)
          await chargerClientsCredits(bId)
        } else {
          setBoutiques([])
          setLoadingProduits(false)
        }
      } catch (e) {
        console.error('Erreur chargement boutiques caisse:', e)
        setLoadingProduits(false)
      }
    }
    chargerBoutiquesEtProduits()
  }, [initialToken])

  async function chargerClientsCredits(bId: string) {
    if (!bId) return
    try {
      const res = await fetch(`/api/boutiques/${bId}/credits-clients`)
      if (res.ok) {
        const data = await res.json()
        if (data.clients) {
          setClientsCredits(data.clients)
          sauvegarderClientsLocaux(data.clients).catch(() => {})
        }
      } else {
        const cached = await obtenirClientsLocaux().catch(() => [])
        if (cached && cached.length > 0) setClientsCredits(cached)
      }
    } catch (e) {
      console.error('Erreur chargement carnet credits:', e)
      const cached = await obtenirClientsLocaux().catch(() => [])
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
          setCaissiersList(actifs);
          if (actifs.length > 0) {
            setCaissierSelectionneId(actifs[0].id);
            setCaissierNom(`${actifs[0].prenom} ${actifs[0].nom}`);
          }
        }
      }

      const resSession = await fetch(`/api/boutiques/${bId}/pos-sessions/active`);
      if (resSession.ok) {
        const data = await resSession.json();
        if (data.session) {
          const dbSession = data.session;
          const fmtSession: SessionCaisse = {
            id: dbSession.id,
            dateOuverture: new Date(dbSession.date_ouverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            fondDeCaisse: Number(dbSession.fond_caisse_initial || 0),
            caissierNom: dbSession.caissier_nom,
            statut: 'ouverte',
            ventes: {
              total: Number(dbSession.ventes_total || 0),
              especes: Number(dbSession.ventes_especes || 0),
              wave: Number(dbSession.ventes_wave || 0),
              orangeMoney: Number(dbSession.ventes_orange_money || 0),
              carte: Number(dbSession.ventes_carte || 0),
              mixte: 0,
              nbVentes: Number(dbSession.nb_ventes || 0)
            }
          };
          setSession(fmtSession);
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error('[chargerCaissiersEtSession err]', err);
    }
  }

  async function chargerProduitsBoutique(bId: string) {
    if (!bId) return
    setLoadingProduits(true)
    chargerCaissiersEtSession(bId)

    // 1. Restaurer immédiatement depuis LocalStorage si présent
    const localHist = localStorage.getItem(`nopalou_pos_historique_${bId}`)
    if (localHist) {
      try {
        const parsed = JSON.parse(localHist)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoriqueVentes(parsed)
        }
      } catch {}
    }

    const localProds = localStorage.getItem(`nopalou_pos_produits_${bId}`)
    if (localProds) {
      try {
        const parsedP = JSON.parse(localProds)
        if (Array.isArray(parsedP) && parsedP.length > 0) {
          setProduits(parsedP)
        }
      } catch {}
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
      if (produits && Array.isArray(produits)) {
        const prodsFormates: ProduitCaisse[] = produits.map((p: any) => ({
          id: p.id,
          nom: p.nom,
          prix: Number(p.prix),
          code_barre: p.code_barre || p.id.slice(0, 8),
          photo: p.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
          categorie: p.categorie || 'alimentation',
          stock: Number(p.stock_quantite ?? p.quantite_stock ?? 10),
        }))
        setProduits(prodsFormates)
        localStorage.setItem(`nopalou_pos_produits_${bId}`, JSON.stringify(prodsFormates))
        sauvegarderProduitsLocaux(prodsFormates).catch(() => {})
      } else {
        const cached = await obtenirProduitsLocaux().catch(() => [])
        if (cached && cached.length > 0) {
          setProduits(cached)
        } else if (!localProds) {
          setProduits([])
        }
      }
    } catch (e) {
      console.error('Erreur chargement produits caisse:', e)
      const cached = await obtenirProduitsLocaux().catch(() => [])
      if (cached && cached.length > 0) {
        setProduits(cached)
      } else if (!localProds) {
        setProduits([])
      }
    } finally {
      setLoadingProduits(false)
    }
  }

  function changerBoutiqueActive(newBId: string) {
    if (session) {
      alert("⚠️ Vous avez une session de caisse (Fonds de caisse) en cours sur cette boutique. Veuillez clôturer votre caisse (Clôture Z) avant de changer de boutique.");
      return;
    }
    setBoutiqueActiveId(newBId)
    chargerProduitsBoutique(newBId)
    viderPanier()
    setVerrouille(true)
    setSession(null)
    setConflitSessionMessage(null)
  }

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
    const p = produits.find(item => item.code_barre === code || item.id === code)
    if (p) {
      ajouterAuPanier(p)
    }
  }

  // ── Ouvrir la modale de modification des PINs (Réservé au Gérant) ─────────────
  function ouvrirConfigPin() {
    demanderValidationSuperviseur('Accès aux Paramètres de Modification des Codes PIN', () => {
      setModalConfigPin(true)
      setMsgConfigPin(null)
    })
  }

  function enregistrerNouveauxPins() {
    setMsgConfigPin(null)
    if (ancienPinSuperviseur !== pinSuperviseur) {
      setMsgConfigPin({ type: 'error', text: '⚠️ Code PIN Superviseur actuel incorrect.' })
      return
    }

    let aChange = false
    if (nouveauPinCaissier.trim().length === 4) {
      setPinCaissier(nouveauPinCaissier.trim())
      localStorage.setItem('nopalou_pin_caissier', nouveauPinCaissier.trim())
      aChange = true
    }

    if (nouveauPinSuperviseur.trim().length === 4) {
      setPinSuperviseur(nouveauPinSuperviseur.trim())
      localStorage.setItem('nopalou_pin_superviseur', nouveauPinSuperviseur.trim())
      aChange = true
    }

    if (aChange) {
      setMsgConfigPin({ type: 'success', text: '✅ Vos nouveaux codes PIN secrets ont été mis à jour avec succès !' })
      setAncienPinSuperviseur('')
      setNouveauPinCaissier('')
      setNouveauPinSuperviseur('')
      setTimeout(() => setModalConfigPin(false), 1500)
    } else {
      setMsgConfigPin({ type: 'error', text: 'Veuillez saisir un code PIN valide à 4 chiffres.' })
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
    const hasSuperviseurPin = caissiersList.some(c => (c.role === 'superviseur' || c.role === 'admin') && c.code_pin === pinSuperviseurSaisi);
    if (pinSuperviseurSaisi === pinSuperviseur || hasSuperviseurPin) {
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

  // ── Authentification et Déverrouillage Automatique par Rôle ──────────────────
  function deverrouillerPin(codeToTest?: string) {
    const codeSaisi = codeToTest !== undefined ? codeToTest : codePinSaisi
    if (!codeSaisi || codeSaisi.length < 4) return

    const caissier = caissiersList.find(c => c.id === caissierSelectionneId)
    const isValide = caissier 
      ? codeSaisi === caissier.code_pin 
      : (codeSaisi === pinCaissier || codeSaisi === pinSuperviseur);
      
    if (isValide) {
      const isSuper = caissier 
        ? (caissier.role === 'superviseur' || caissier.role === 'admin')
        : codeSaisi === pinSuperviseur;
        
      const realRole = isSuper ? 'superviseur' : 'caissier'
      setRoleActif(realRole)
      
      const realNom = caissier 
        ? `${caissier.prenom} ${caissier.nom}`
        : (codeSaisi === pinSuperviseur ? 'Gérant / Superviseur' : 'Caissier 1 (Bamba)');
        
      setCaissierNom(realNom)

      // Conserver la session déverrouillée dans le LocalStorage (persistance au rafraîchissement F5)
      if (typeof window !== 'undefined' && boutiqueActiveId) {
        localStorage.setItem(`nopalou_pos_unlocked_${boutiqueActiveId}`, JSON.stringify({
          unlocked: true,
          roleActif: realRole,
          caissierNom: realNom,
          caissierId: caissierSelectionneId,
          timestamp: Date.now()
        }))
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
      setPinError('❌ Code PIN incorrect. Veuillez vérifier votre saisie.')
      setCodePinSaisi('')
    }
  }

  // Auto-déverrouillage dès la saisie du 4ème chiffre sans cliquer sur aucun bouton
  useEffect(() => {
    if (verrouille && codePinSaisi.length === 4) {
      deverrouillerPin(codePinSaisi)
    }
  }, [codePinSaisi, verrouille])

  function verrouillerCaisseManuellement() {
    if (typeof window !== 'undefined' && boutiqueActiveId) {
      localStorage.removeItem(`nopalou_pos_unlocked_${boutiqueActiveId}`)
    }
    setVerrouille(true)
    setCodePinSaisi('')
    setPinError(null)
  }

  // ── Actions Multi-Tickets / File d'attente Client ───────────────────────────
  function mettrePanierEnAttente() {
    if (panier.length === 0) return
    const nouveauTicket: TicketEnAttente = {
      id: `T-${Date.now().toString().slice(-4)}`,
      clientLabel: `Client ${ticketsEnAttente.length + 1}`,
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
        setTicketsEnAttente(prev => [
          ...prev.filter(x => x.id !== ticketId),
          {
            id: `T-${Date.now().toString().slice(-4)}`,
            clientLabel: `Client ${ticketsEnAttente.length + 1}`,
            heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            panier: [...panier],
          }
        ])
      } else {
        setTicketsEnAttente(prev => prev.filter(x => x.id !== ticketId))
      }
      setPanier(t.panier)
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
          ventes: { total: 0, especes: 0, wave: 0, orangeMoney: 0, carte: 0, mixte: 0, nbVentes: 0 },
        });
      } else {
        throw new Error();
      }
    } catch {
      // Fallback local
      setSession({
        id: `SES-${Date.now().toString().slice(-6)}`,
        dateOuverture: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        fondDeCaisse: fond,
        caissierNom,
        statut: 'ouverte',
        ventes: { total: 0, especes: 0, wave: 0, orangeMoney: 0, carte: 0, mixte: 0, nbVentes: 0 },
      });
    }
    setModalSessionOuverture(false)
  }

  // AJOUT AU PANIER AVEC VÉRIFICATION DE SESSION ET CONTRÔLE STOCK
  function ajouterAuPanier(p: ProduitCaisse) {
    if (!session) {
      setModalSessionOuverture(true)
      return
    }

    const itemExist = panier.find(item => item.produit.id === p.id)
    const qteActuelle = itemExist ? itemExist.quantite : 0

    // Vérifier si la quantité dans le panier atteint ou dépasse le stock physique
    if (qteActuelle >= p.stock) {
      demanderValidationSuperviseur(`Autoriser Vente Hors-Stock (${p.nom} : Stock disponible ${p.stock})`, () => {
        setPanier(prev => {
          const index = prev.findIndex(item => item.produit.id === p.id)
          if (index >= 0) {
            const copi = [...prev]
            copi[index].quantite += 1
            return copi
          }
          return [...prev, { produit: p, quantite: 1, prixUnitaire: p.prix }]
        })
      })
      return
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
  
  const totalPanierCalculatedRaw = regimeFiscal === 'non_assujetti' || regimeFiscal === 'exonere' || estExonereClient
    ? sousTotalPanier
    : (prixTvaIncluse ? sousTotalPanier : totalHT + totalTVA)

  const totalPanier = Math.max(0, totalPanierCalculatedRaw - montantRemise)

  let timbreFiscal = 0
  if (timbreFiscalApplicable && modePaiement === 'especes') {
    timbreFiscal = Math.min(5000, Number((totalPanier * 0.01).toFixed(2)))
  }

  const netAPayer = totalPanier + timbreFiscal

  const especesMixteNum = Number(montantEspecesMixte) || 0
  const resteAPayerMixte = Math.max(0, netAPayer - especesMixteNum)

  const recu = Number(montantRecu) || netAPayer
  const monnaieARendre = Math.max(0, recu - netAPayer)

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

      alert(`${typeDocument.toUpperCase()} créé avec succès ! Réf : ${res.reference}`)
      viderPanier()
    } catch (err) {
      console.error(`Erreur création ${typeDocument}:`, err)
      alert(`Erreur lors de la création du ${typeDocument}`)
    }
  }

  async function encaisserVente() {
    if (netAPayer === 0) return
    if (!session) {
      setModalSessionOuverture(true)
      return
    }

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
        try {
          const resCredit = await fetch(`/api/boutiques/${boutiqueActiveId}/credits-clients/${clientCreditIdPOS}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'vente_credit',
              montant: netAPayer,
              produits: panier.map(i => ({ nom: i.produit.nom, quantite: i.quantite, prix: i.prixUnitaire })),
              date_echeance: creditDateEcheancePOS || null,
              note: creditNotePOS || 'Vente caisse POS à crédit',
              mode_paiement: 'credit',
            })
          })
          if (!resCredit.ok) {
            const dataErr = await resCredit.json()
            alert(dataErr.error || 'Erreur lors de l’enregistrement de la vente à crédit dans le carnet.')
            return
          }
          await chargerClientsCredits(boutiqueActiveId)
        } catch (e) {
          console.error('Erreur enregistrement vente crédit carnet:', e)
        }
      }
    }

    if (boutiqueActiveId) {
      const payloadVente = {
        items: panier.map(i => ({ id: i.produit.id, quantite: i.quantite, nom: i.produit.nom, prix: i.prixUnitaire })),
        caissier: caissierNom,
        modePaiement,
        client_id: clientCreditIdPOS || null,
        total: netAPayer,
      }

      if (!navigator.onLine || offlineModeActive) {
        try {
          const temporaryId = `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
          await ajouterVenteHorsLigne({
            id_temporaire: temporaryId,
            boutique_id: boutiqueActiveId,
            items: payloadVente.items,
            caissier: payloadVente.caissier,
            modePaiement: payloadVente.modePaiement,
            client_id: payloadVente.client_id,
            total: payloadVente.total,
            date: new Date().toISOString()
          })
          console.log('[OFFLINE] Vente sauvegardée localement dans IndexedDB.')
        } catch (eOff) {
          console.error('Erreur stockage local vente:', eOff)
        }
      } else {
        try {
          await creerPosVente(boutiqueActiveId, payloadVente)
        } catch (e) {
          console.error('Erreur mise à jour stock backend direct:', e)
          try {
            const temporaryId = `OFFLINE-ERR-${Date.now()}`
            await ajouterVenteHorsLigne({
              id_temporaire: temporaryId,
              boutique_id: boutiqueActiveId,
              items: payloadVente.items,
              caissier: payloadVente.caissier,
              modePaiement: payloadVente.modePaiement,
              client_id: payloadVente.client_id,
              total: payloadVente.total,
              date: new Date().toISOString()
            })
          } catch (eOff2) {}
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

      alert(`✅ Ticket ${venteId} annulé et remboursé avec succès ! Les stocks ont été réintégrés.`)
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
      v.statut === 'annulee' ? '❌ ANNULÉE' : '✅ VALIDÉE'
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

  // Produits filtrés
  const produitsFiltres = produits.filter(p => {
    const matchCat = categorieFiltre === 'tous' || p.categorie === categorieFiltre
    const matchSearch = !recherche || p.nom.toLowerCase().includes(recherche.toLowerCase()) || p.code_barre?.includes(recherche)
    return matchCat && matchSearch
  })

  // ── ÉCRAN DE VERROUILLAGE SI BOUTIQUE NON AUTORISÉE À LA CAISSE POS ──────
  if (!estBoutiqueAutorisee) {
    const boutiquesAutorisees = boutiques.filter(b => b.plan_actif === 'pro' || b.plan_actif === 'business')
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          maxWidth: 580,
          width: '100%',
          background: '#ffffff',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#fff7ed',
            border: '2px solid #ffedd5',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c75b00',
            marginBottom: 20
          }}>
            <Lock size={36} />
          </div>

          <div style={{
            display: 'inline-block',
            background: '#fff7ed',
            color: '#c75b00',
            fontWeight: 800,
            fontSize: 11,
            padding: '4px 12px',
            borderRadius: 20,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            🔒 Caisse POS Non Autorisée Pour Cette Boutique
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 12px' }}>
            La boutique &quot;{activeBoutiqueObj?.nom || 'Sélectionnée'}&quot; n&apos;a pas d&apos;Abonnement POS
          </h1>

          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
            L&apos;accès à la caisse enregistreuse tactile POS est réservé aux boutiques disposant d&apos;un abonnement <strong>Pro</strong> ou <strong>Business</strong> actif.
          </p>

          {/* Sélecteur de secours si le marchand possède au moins une boutique autorisée */}
          {boutiquesAutorisees.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 16, marginBottom: 24, textAlign: 'left' }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#166534', display: 'block', marginBottom: 6 }}>
                💡 Basculer vers une boutique autorisée :
              </label>
              <select
                value=""
                onChange={e => changerBoutiqueActive(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #86efac', background: '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                <option value="">-- Sélectionner une boutique avec caisse autorisée --</option>
                {boutiquesAutorisees.map(b => (
                  <option key={b.id} value={b.id}>
                    🟢 {b.nom} ({b.plan_actif?.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              href="/boutique/abonnement"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #c75b00 0%, #ea580c 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(199, 91, 0, 0.25)'
              }}
            >
              Activer l&apos;Abonnement Pro (5 000 FCFA/mois) →
            </Link>
            <Link
              href={boutiqueActiveId ? `/boutique?manage=${boutiqueActiveId}` : '/boutique'}
              style={{
                display: 'block',
                color: '#64748b',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                padding: '6px'
              }}
            >
              ← Retour au tableau de bord boutique
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── ÉCRAN DE VERROUILLAGE PIN SÉCURISÉ ─────────────────────────────────────
  if (verrouille) {
    return (
      <div style={{ background: '#f1f5f9', color: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: '#ffffff', border: '2px solid #C75B00', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 20px 40px rgba(199,91,0,0.15)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Caisse POS Nopalou</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>Entrez votre code PIN secret pour accéder à la caisse.</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6, textAlign: 'left' }}>IDENTIFICATION CAISSIER</label>
            <select
              value={caissierSelectionneId}
              onChange={e => {
                const cid = e.target.value;
                setCaissierSelectionneId(cid);
                const c = caissiersList.find(x => x.id === cid);
                if (c) setCaissierNom(`${c.prenom} ${c.nom}`);
              }}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 700 }}
            >
              {caissiersList.length > 0 ? (
                caissiersList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.role === 'superviseur' || c.role === 'admin' ? '👑' : '👤'} {c.prenom} {c.nom}
                  </option>
                ))
              ) : (
                <>
                  <option value="">👤 Caissier par défaut</option>
                  <option value="9999">👑 Gérant / Superviseur</option>
                </>
              )}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              value={codePinSaisi}
              onChange={e => setCodePinSaisi(e.target.value)}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #C75B00',
                background: '#f8fafc', color: '#0f172a', fontSize: 24, letterSpacing: '0.4em', textAlign: 'center', boxSizing: 'border-box',
              }}
            />
            {pinError && <p style={{ margin: '8px 0 0', color: '#dc2626', fontSize: 13, fontWeight: 700 }}>{pinError}</p>}
          </div>

          {/* Clavier Numérique PIN Pad Tactile avec Déclenchement Automatique */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
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
                  } else if (codePinSaisi.length < 4) {
                    const nextPin = codePinSaisi + val
                    setCodePinSaisi(nextPin)
                    setPinError(null)
                  }
                }}
                style={{
                  padding: '16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10,
                  color: '#0f172a', fontWeight: 800, fontSize: 18, cursor: 'pointer', userSelect: 'none',
                }}
              >
                {val}
              </button>
            ))}
          </div>
          <p style={{ margin: '0', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
            ⚡ Le déverrouillage s&apos;effectue automatiquement dès la saisie du 4ème chiffre.
          </p>
        </div>
      </div>
    )
  }



  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {conflitSessionMessage && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 460, textAlign: 'center', border: '2px solid #dc2626', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ margin: 0, fontSize: 18, color: '#dc2626', fontWeight: 900 }}>Conflit de Session POS</h2>
            <p style={{ marginTop: 12, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{conflitSessionMessage}</p>
            
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => {
                  setVerrouille(true);
                  setConflitSessionMessage(null);
                }}
                style={{ width: '100%', padding: '12px', background: '#475569', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
              >
                ↩ Changer de Caissier / Verrouiller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles Globaux Caisse POS (Plein Écran & Layout Standard 50/50) */}
      <style jsx global>{`
        @media screen {
          body header[role="banner"],
          body nav.navbar,
          body .navbar,
          body .mobile-nav,
          body .bottom-bars,
          body footer,
          body .site-footer {
            display: none !important;
          }

          .caisse-main-layout {
            display: grid !important;
            grid-template-columns: minmax(0, 1.1fr) minmax(460px, 1fr) !important;
            height: calc(100vh - 52px) !important;
            max-height: calc(100vh - 52px) !important;
            overflow: hidden !important;
          }

          @media (max-width: 1024px) {
            .caisse-main-layout {
              grid-template-columns: 1fr !important;
              height: auto !important;
              max-height: none !important;
              overflow-y: auto !important;
            }
          }

          .hover-bg-slate:hover {
            background-color: #f1f5f9 !important;
          }
          .ticket-print-container {
            display: none !important;
          }
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          header,
          footer,
          nav,
          .site-header,
          .site-footer,
          .navbar-icon-actions,
          .caisse-header,
          .caisse-main-layout,
          .btn-premium,
          button,
          input,
          select {
            display: none !important;
          }
          .ticket-print-container, .ticket-print-container * {
            visibility: visible !important;
          }
          .ticket-print-container {
            display: block !important;
            position: static !important;
            width: 80mm !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #000000 !important;
            background: #ffffff !important;
            padding: 10px !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* En-tête MOBILE-FIRST NOPALOU POS */}
      <header className="caisse-header no-print" style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border)',
        padding: '8px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        gap: 8,
        minHeight: 50,
        flexShrink: 0,
      }}>
        {/* Côté Gauche : Retour + POS badge + Boutique selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Bouton retour — icône seule sur mobile */}
          <Link
            href={boutiqueActiveId ? `/boutique?manage=${boutiqueActiveId}` : '/boutique'}
            className="btn-premium btn-premium-secondary caisse-btn-retour"
            style={{ padding: '5px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
          >
            <ArrowLeft size={13} />
            <span className="caisse-label-desktop">Boutique</span>
          </Link>
          {/* Badge Hors-Ligne (affiché uniquement si hors ligne) */}
          {offlineModeActive && (
            <div className="caisse-status-badge" style={{
              background: '#dc2626',
              color: '#fff',
              padding: '4px 7px',
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              flexShrink: 0,
              animation: 'pulse 1.5s infinite'
            }}>
              ⚠️ HORS-LIGNE
            </div>
          )}

          {/* Sélecteur de boutique — masqué sur très petit écran */}
          {boutiques.length > 0 && (
            <select
              value={boutiqueActiveId}
              onChange={e => changerBoutiqueActive(e.target.value)}
              className="caisse-boutique-select"
              style={{ padding: '4px 6px', borderRadius: 6, border: '1.5px solid var(--border)', background: '#ffffff', color: 'var(--text1)', fontWeight: 700, fontSize: 11, cursor: 'pointer', outline: 'none', maxWidth: 140, minWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {boutiques.map(b => {
                const isAuth = b.plan_actif === 'pro' || b.plan_actif === 'business';
                return (
                  <option key={b.id} value={b.id}>
                    {isAuth ? '🟢' : '🔒'} {b.nom}{!b.actif ? ' (Off)' : ''}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Côté Droit : Caissier + Outils + Session — groupé compact */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* Espace Caissier — compact */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '3px 7px 3px 8px',
            maxWidth: 130, flexShrink: 0
          }}>
            <span style={{ fontSize: 13 }}>{roleActif === 'superviseur' ? '👑' : '👤'}</span>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', maxWidth: 65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{caissierNom}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: session ? '#16a34a' : '#ef4444', lineHeight: 1.2 }}>
                {session ? '● Active' : '● Fermée'}
              </span>
            </div>
            <button
              onClick={verrouillerCaisseManuellement}
              title="Verrouiller la caisse"
              style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 5, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <Lock size={10} />
            </button>
          </div>

          {/* Menu Dropdown Outils */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOutilsOuvert(!menuOutilsOuvert)}
              className="btn-premium btn-premium-secondary"
              style={{ padding: '5px 8px', fontSize: 11, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
            >
              🔧<span className="caisse-label-desktop"> Outils</span> ▾
            </button>
            {menuOutilsOuvert && (
              <>
                {/* Overlay pour fermer en cliquant dehors */}
                <div
                  onClick={() => setMenuOutilsOuvert(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                />
                <div style={{
                  position: 'fixed',
                  top: 58,
                  right: 14,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 8,
                  zIndex: 9999,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 185,
                }}>
                  <div style={{ padding: '4px 12px 6px', borderBottom: '1px solid #f1f5f9', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outils caisse</span>
                  </div>
                  <button
                    onClick={() => { setModalImportBatch(true); setMenuOutilsOuvert(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', width: '100%', background: 'none', border: 'none', color: '#334155', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer', borderRadius: 8 }}
                  >
                    <Download size={14} /> Importer Lot
                  </button>
                  <button
                    onClick={() => { setModalHistorique(true); setMenuOutilsOuvert(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', width: '100%', background: 'none', border: 'none', color: '#334155', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer', borderRadius: 8 }}
                  >
                    <History size={14} /> Historique ({historiqueVentes.length})
                  </button>
                  <button
                    onClick={() => { setModalCarnet(true); setMenuOutilsOuvert(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', width: '100%', background: 'none', border: 'none', color: '#334155', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer', borderRadius: 8 }}
                  >
                    <Book size={14} /> Carnet ({clientsCredits.length})
                  </button>
                  <button
                    onClick={() => { ouvrirConfigPin(); setMenuOutilsOuvert(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', width: '100%', background: 'none', border: 'none', color: '#334155', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer', borderRadius: 8 }}
                  >
                    <Settings size={14} /> Config PINs
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bouton Session/Clôture */}
          {session ? (
            <button
              onClick={() => setModalClotureZ(true)}
              className="btn-premium btn-premium-danger"
              style={{ padding: '5px 9px', fontSize: 11, flexShrink: 0 }}
            >
              <Lock size={11} /> <span className="caisse-label-desktop">Clôture Z</span>
            </button>
          ) : (
            <button
              onClick={() => setModalSessionOuverture(true)}
              className="btn-premium btn-premium-success"
              style={{ padding: '5px 9px', fontSize: 11, flexShrink: 0 }}
            >
              <Unlock size={11} /> <span className="caisse-label-desktop">Session</span>
            </button>
          )}
        </div>
      </header>

      {/* Sélecteur d'Onglets Mobile (Visible <= 1024px) */}
      <div className="caisse-mobile-tabs no-print">
        <button
          type="button"
          onClick={() => setTabMobile('catalogue')}
          className={`caisse-mobile-tab-btn ${tabMobile === 'catalogue' ? 'active' : ''}`}
        >
          🛍️ Catalogue ({produitsFiltres.length})
        </button>
        <button
          type="button"
          onClick={() => setTabMobile('ticket')}
          className={`caisse-mobile-tab-btn ${tabMobile === 'ticket' ? 'active' : ''} ${panier.length > 0 ? 'has-items' : ''}`}
        >
          🛒 Ticket ({panier.reduce((sum, item) => sum + item.quantite, 0)}) • {fcfa(netAPayer)}
        </button>
      </div>

      {/* Main Grid Caisse */}
      <div className="caisse-main-layout">

        {/* Côté Gauche : Recherche & Catalogue Produits Réel avec Décrémentation Dynamique du Stock */}
        <div className={`caisse-catalogue-section ${tabMobile === 'catalogue' ? 'mobile-active' : 'mobile-hidden'}`} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', background: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>
          
          {/* File d'attente Multi-Clients (1, 2, 3 clients simultanés) */}
          {ticketsEnAttente.length > 0 && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>👥</span> Clients en file d&apos;attente ({ticketsEnAttente.length}) :
                </span>
                <span style={{ fontSize: 11, color: '#9a3412' }}>Cliquez pour reprendre un panier</span>
              </div>

              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {ticketsEnAttente.map(t => (
                  <button
                    key={t.id}
                    onClick={() => reprendreTicketEnAttente(t.id)}
                    style={{
                      background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px',
                      fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                    }}
                  >
                    <span>▶️</span> {t.clientLabel} ({t.panier.length} art. • {t.heure})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barre de Recherche Code-Barres & Nom + Scanner Caméra (Responsive Mobile 2 Lignes) */}
          <div className="caisse-search-row">
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Scannez à la douchette ou tapez le nom / code-barres…"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid #cbd5e1',
                  background: '#ffffff', color: '#0f172a', fontSize: 15, fontWeight: 600, boxSizing: 'border-box',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            <div className="caisse-search-row-btns">
              <button
                onClick={() => setVueCatalogue(prev => prev === 'mosaique' ? 'liste' : 'mosaique')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderRadius: 10,
                  background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
                title={`Affichage en ${vueCatalogue === 'mosaique' ? 'liste' : 'mosaïque'}`}
              >
                {vueCatalogue === 'mosaique' ? <AlignJustify size={16} /> : <LayoutGrid size={16} />}
              </button>

              <button
                onClick={demarrerScannerCamera}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderRadius: 10,
                  background: '#1e3a5f', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: 13,
                  cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(30,58,95,0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Camera size={18} />
                <span>📷 Scanner Caméra</span>
              </button>

              <button
                onClick={() => setModalPairageSmartphone(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderRadius: 10,
                  background: '#0284c7', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: 13,
                  cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(2,132,199,0.25)',
                  transition: 'all 0.15s ease',
                }}
                title="Connecter la caméra de votre smartphone comme douchette sans fil pour votre PC"
              >
                <span>📱 Douchette Smartphone</span>
              </button>
            </div>
          </div>

          {/* Filtre Catégories (Fluidité Tactile & Scroll Sans Coupure) */}
          <div className="nopalou-scroll-tabs caisse-categories-bar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'tous', label: '✨ Tous les articles' },
              ...CATEGORIES.filter(c => c.value !== 'mixte').map(c => {
                const cleanLabels: Record<string, string> = {
                  smartphones: '📱 Téléphonie',
                  informatique: '💻 Informatique',
                  'tv-electro': '📺 Électro',
                  mode: '👗 Mode',
                  maison: '🏠 Maison',
                  'auto-moto': '🚗 Auto-Moto',
                  jeux: '🎮 Jeux',
                  alimentation: '🍚 Alimentation',
                  beaute: '💄 Beauté',
                  sport: '⚽ Sport',
                  fournitures: '📚 Fournitures',
                  quincaillerie: '🧱 Quincaillerie',
                  'pieces-rechange': '⚙️ Rechanges',
                  services: '🛠 Services',
                  autre: '📦 Autre'
                };
                return {
                  id: c.value,
                  label: cleanLabels[c.value] || c.label
                };
              })
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setCategorieFiltre(c.id)}
                style={{
                  padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                  flexShrink: 0,
                  background: categorieFiltre === c.id ? '#C75B00' : '#ffffff',
                  color: categorieFiltre === c.id ? '#ffffff' : '#475569',
                  fontWeight: categorieFiltre === c.id ? 800 : 600, fontSize: 13, cursor: 'pointer',
                  border: categorieFiltre === c.id ? '1px solid #C75B00' : '1px solid #e2e8f0',
                  boxShadow: categorieFiltre === c.id ? '0 3px 8px rgba(199,91,0,0.25)' : 'none',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Grille des produits Réels avec Affichage Dynamique du Stock Restant */}
          {loadingProduits ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b', fontSize: 14 }}>
              Chargement du catalogue de la boutique…
            </div>
          ) : produitsFiltres.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>📦</div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Aucun produit dans le catalogue de cette boutique
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                Importez des articles modèles ou créez vos produits dans votre catalogue.
              </p>
              <button
                onClick={() => setModalImportBatch(true)}
                style={{ background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                + Importer des Produits Modèle (Batch Intake) →
              </button>
            </div>
          ) : (
            <div className="produits-grid" style={{ 
              display: vueCatalogue === 'mosaique' ? 'grid' : 'flex', 
              gridTemplateColumns: vueCatalogue === 'mosaique' ? 'repeat(auto-fill, minmax(130px, 1fr))' : undefined, 
              flexDirection: vueCatalogue === 'liste' ? 'column' : undefined,
              gap: 10 
            }}>
              {produitsFiltres.map(p => {
                // Déduire la quantité déjà placée dans le panier en direct
                const qteAuPanier = panier.find(i => i.produit.id === p.id)?.quantite || 0
                const stockRestant = Math.max(0, p.stock - qteAuPanier)
                const estHorsStock = stockRestant === 0

                return (
                  <div
                    key={p.id}
                    onClick={() => ajouterAuPanier(p)}
                    style={{
                      background: '#ffffff',
                      border: estHorsStock ? '1px solid #fecaca' : qteAuPanier > 0 ? '2px solid #C75B00' : '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: vueCatalogue === 'liste' ? 'row' : 'column',
                      alignItems: vueCatalogue === 'liste' ? 'center' : 'stretch',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                      minHeight: vueCatalogue === 'liste' ? 60 : 92,
                      position: 'relative',
                      boxShadow: qteAuPanier > 0 ? '0 4px 12px rgba(199, 91, 0, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                    }}
                  >
                    {qteAuPanier > 0 && (
                      <div style={{
                        position: 'absolute', top: -6, right: -6, background: '#C75B00', color: '#fff',
                        borderRadius: 10, width: 20, height: 20, fontSize: 11, fontWeight: 900,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(199,91,0,0.4)', zIndex: 2
                      }}>
                        {qteAuPanier}
                      </div>
                    )}

                    <div style={{ flex: vueCatalogue === 'liste' ? 1 : 'unset', minWidth: 0, paddingRight: vueCatalogue === 'liste' ? 10 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.nom}</p>
                        {vueCatalogue !== 'liste' && (
                          <button
                            onClick={e => genererImprimerEtiquetteCodeBarre(e, p)}
                            title="Générer / Imprimer étiquette code-barres EAN"
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '1px 4px', fontSize: 9, cursor: 'pointer', color: '#475569', fontWeight: 700, flexShrink: 0 }}
                          >
                            🏷️
                          </button>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>{p.code_barre ? `EAN ${p.code_barre}` : ''}</p>
                    </div>

                    <div style={{ marginTop: vueCatalogue === 'liste' ? 0 : 6, display: 'flex', flexDirection: vueCatalogue === 'liste' ? 'column' : 'row', justifyContent: vueCatalogue === 'liste' ? 'center' : 'space-between', alignItems: vueCatalogue === 'liste' ? 'flex-end' : 'center', gap: vueCatalogue === 'liste' ? 2 : 0, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#C75B00' }}>{fcfa(p.prix)}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {vueCatalogue === 'liste' && (
                          <button
                            onClick={e => genererImprimerEtiquetteCodeBarre(e, p)}
                            title="Générer / Imprimer étiquette code-barres EAN"
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '1px 4px', fontSize: 9, cursor: 'pointer', color: '#475569', fontWeight: 700, flexShrink: 0 }}
                          >
                            🏷️
                          </button>
                        )}
                        <span style={{
                          fontSize: 9,
                          background: estHorsStock ? '#fef2f2' : stockRestant <= 3 ? '#fff7ed' : '#f0fdf4',
                          color: estHorsStock ? '#991b1b' : stockRestant <= 3 ? '#c2410c' : '#166534',
                          border: estHorsStock ? '1px solid #fecaca' : stockRestant <= 3 ? '1px solid #fed7aa' : '1px solid #bbf7d0',
                          padding: '1px 5px', borderRadius: 4, fontWeight: 700
                        }}>
                          {estHorsStock ? 'Épuisé' : `Stk ${stockRestant}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Côté Droit : Ticket Panier & Encaissement POS */}
        <div className={`ticket-section ${tabMobile === 'ticket' ? 'mobile-active' : 'mobile-hidden'}`} style={{ background: '#ffffff', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Bouton retour au catalogue sur Mobile */}
          <button
            type="button"
            onClick={() => setTabMobile('catalogue')}
            className="caisse-back-to-catalogue-btn no-print"
          >
            ⬅️ Revenir au Catalogue produits ({produitsFiltres.length})
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>🛒 Ticket en cours</h2>

            <div style={{ display: 'flex', gap: 8 }}>
              {panier.length > 0 && (
                <button
                  onClick={mettrePanierEnAttente}
                  title="Mettre en attente le ticket pour servir le client suivant"
                  style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  ⏸️ En Attente
                </button>
              )}
              {panier.length > 0 && (
                <button onClick={viderPanier} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Vider
                </button>
              )}
            </div>
          </div>

          {/* Contenu Panier */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!session ? (
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: 16,
                padding: '28px 20px',
                textAlign: 'center',
                boxShadow: '0 10px 25px rgba(15,23,42,0.15)',
                margin: 'auto 0'
              }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: '#ffffff' }}>Session de Caisse Fermée</h3>
                <p style={{ margin: '0 0 18px', fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                  Déclarez votre fond de caisse initial pour ouvrir la session et commencer à encaisser vos clients.
                </p>
                <button
                  onClick={() => setModalSessionOuverture(true)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 22px',
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  🔓 Ouvrir la Session de Caisse →
                </button>
              </div>
            ) : panier.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🧾</span>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#475569' }}>Le ticket de caisse est vide</p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>Scannez un code-barres ou cliquez sur un article.</p>
              </div>
            ) : (
              panier.map(item => (
                <div key={item.produit.id} style={{ background: '#f8fafc', border: item.quantite > item.produit.stock ? '1px solid #fde047' : '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.produit.nom}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#C75B00', fontWeight: 800 }}>{fcfa(item.prixUnitaire)}</span>
                      {item.quantite > item.produit.stock && (
                        <span style={{ fontSize: 10, background: '#fef08a', color: '#854d0e', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                          👑 Dépassement de Stock Autorisé
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ffffff', padding: '2px 6px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                      <button onClick={() => modifierQuantite(item.produit.id, -1)} style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 800, cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center', color: '#0f172a' }}>{item.quantite}</span>
                      <button onClick={() => modifierQuantite(item.produit.id, 1)} style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 800, cursor: 'pointer' }}>+</button>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', minWidth: 60, textAlign: 'right' }}>{fcfa(item.prixUnitaire * item.quantite)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mode de Paiement */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>MODE DE RÈGLEMENT</label>
              {panier.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    demanderValidationSuperviseur('Application d’une Remise Client Exceptionnelle', () => {
                      const pourcent = prompt('Pourcentage de remise exceptionnel (ex: 5, 10, 15 %) :')
                      const val = Number(pourcent)
                      if (val > 0 && val <= 50) setRemisePourcentage(val)
                    })
                  }}
                  style={{ background: 'none', border: 'none', color: '#C75B00', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                >
                  🏷️ Remise Superviseur ({remisePourcentage}%)
                </button>
              )}
            </div>

            <div className="paiement-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { id: 'especes', label: '💵 Espèces' },
                { id: 'wave', label: '🌊 Wave' },
                { id: 'orange_money', label: '🍊 OM' },
                { id: 'carte', label: '💳 Carte' },
                { id: 'mixte', label: '🔀 Mixte (Partagé)' },
                { id: 'credit_client', label: '📝 Crédit Client' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setModePaiement(m.id as any)}
                  style={{
                    padding: '8px 4px', borderRadius: 8,
                    background: modePaiement === m.id ? '#C75B00' : '#f8fafc',
                    color: modePaiement === m.id ? '#fff' : '#334155',
                    fontWeight: modePaiement === m.id ? 800 : 600, fontSize: 11, cursor: 'pointer',
                    border: modePaiement === m.id ? '1px solid #C75B00' : '1px solid #cbd5e1',
                    boxShadow: modePaiement === m.id ? '0 2px 8px rgba(199,91,0,0.25)' : 'none',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Saisie Espèces Standard */}
            {modePaiement === 'especes' && totalPanier > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: 8, borderRadius: 8 }}>
                <input
                  type="number"
                  placeholder="Montant reçu (Espèces)..."
                  value={montantRecu}
                  onChange={e => setMontantRecu(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 13, fontWeight: 700 }}
                />
                <div style={{ fontSize: 12, textAlign: 'right' }}>
                  <span style={{ color: '#64748b', display: 'block' }}>Monnaie à rendre:</span>
                  <span style={{ fontWeight: 900, color: '#16a34a', fontSize: 14 }}>{fcfa(monnaieARendre)}</span>
                </div>
              </div>
            )}

            {/* Saisie Paiement Mixte Partagé */}
            {modePaiement === 'mixte' && totalPanier > 0 && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#c2410c' }}>🔀 Répartition Paiement Mixte</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9a3412', display: 'block', marginBottom: 2 }}>Montant Espèces (FCFA)</label>
                    <input
                      type="number"
                      placeholder="Ex: 5000"
                      value={montantEspecesMixte}
                      onChange={e => setMontantEspecesMixte(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9a3412', display: 'block', marginBottom: 2 }}>Second Mode</label>
                    <select
                      value={secondModeMixte}
                      onChange={e => setSecondModeMixte(e.target.value as any)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                    >
                      <option value="wave">🌊 Wave</option>
                      <option value="orange_money">🍊 Orange Money</option>
                      <option value="carte">💳 Carte Bancaire</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid #fed7aa', paddingTop: 6 }}>
                  <span style={{ color: '#9a3412' }}>Reste en {secondModeMixte.toUpperCase()} :</span>
                  <span style={{ fontWeight: 900, color: '#0284c7' }}>{fcfa(resteAPayerMixte)}</span>
                </div>
              </div>
            )}

            {/* Saisie Vente à Crédit / Carnet Client */}
            {modePaiement === 'credit_client' && totalPanier > 0 && (
              <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#9d174d' }}>📒 Client à débiter dans le carnet</span>
                  <button
                    type="button"
                    onClick={() => { setModalCarnet(true); setAfficherFormNouveauClient(true); }}
                    style={{ background: '#9d174d', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Nouveau Client
                  </button>
                </div>

                <select
                  value={clientCreditIdPOS}
                  onChange={e => setClientCreditIdPOS(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #f472b6', background: '#fff', fontSize: 13, fontWeight: 700, color: '#0f172a' }}
                >
                  <option value="">-- Choisir un client du carnet --</option>
                  {clientsCredits.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom} ({c.telephone}) — Solde: {c.solde > 0 ? `Dette: ${fcfa(c.solde)}` : c.solde < 0 ? `Avance: ${fcfa(Math.abs(c.solde))}` : '0 FCFA'}
                    </option>
                  ))}
                </select>

                {clientCreditIdPOS && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#9d174d', display: 'block', marginBottom: 2 }}>Promesse / Échéance</label>
                        <input
                          type="date"
                          value={creditDateEcheancePOS}
                          onChange={e => setCreditDateEcheancePOS(e.target.value)}
                          style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#9d174d', display: 'block', marginBottom: 2 }}>Note / Justification</label>
                        <input
                          type="text"
                          placeholder="Ex: Pris par son fils Papa Sow..."
                          value={creditNotePOS}
                          onChange={e => setCreditNotePOS(e.target.value)}
                          style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Récapitulatif Total & Taxes */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {regimeFiscal === 'reel' && !estExonereClient && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total HT</span>
                    <span>{fcfa(totalHT)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TVA ({tvaDefaut}%)</span>
                    <span>{fcfa(totalTVA)}</span>
                  </div>
                </>
              )}
              {regimeFiscal === 'non_assujetti' && (
                <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginBottom: 4 }}>
                  TVA non applicable - Art. 286 du CGI
                </div>
              )}
              {timbreFiscal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309' }}>
                  <span>Timbre Fiscal (1% cash)</span>
                  <span>{fcfa(timbreFiscal)}</span>
                </div>
              )}
              {remisePourcentage > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>Remise ({remisePourcentage}%)</span>
                  <span>-{fcfa(montantRemise)}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 13, color: '#475569', display: 'block', fontWeight: 600 }}>Net à payer</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#C75B00' }}>{fcfa(netAPayer)}</span>
            </div>

            {/* Actions Devis / Proforma / Encaisser */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => enregistrerDocumentCaisse('devis')}
                disabled={netAPayer === 0}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1',
                  background: '#ffffff', color: netAPayer > 0 ? '#475569' : '#94a3b8',
                  fontWeight: 700, fontSize: 12, cursor: netAPayer > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                📄 DEVIS
              </button>
              <button
                onClick={() => enregistrerDocumentCaisse('proforma')}
                disabled={netAPayer === 0}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1',
                  background: '#ffffff', color: netAPayer > 0 ? '#475569' : '#94a3b8',
                  fontWeight: 700, fontSize: 12, cursor: netAPayer > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                📄 PROFORMA
              </button>
            </div>

            <button
              onClick={encaisserVente}
              disabled={netAPayer === 0}
              style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: netAPayer > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#cbd5e1',
                color: netAPayer > 0 ? '#fff' : '#64748b',
                fontWeight: 900, fontSize: 16, cursor: netAPayer > 0 ? 'pointer' : 'not-allowed',
                boxShadow: netAPayer > 0 ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
              }}
            >
              ⚡ ENCAISSER ET TICKET (80mm) →
            </button>
          </div>
        </div>
      </div>

      {/* Barre Flottante Sticky Mobile (Catalogue mode) */}
      {tabMobile === 'catalogue' && panier.length > 0 && (
        <div className="caisse-sticky-bottom-bar no-print">
          <div className="caisse-sticky-bottom-info">
            <span className="caisse-sticky-count">🛒 {panier.reduce((sum, item) => sum + item.quantite, 0)} article{panier.reduce((sum, item) => sum + item.quantite, 0) > 1 ? 's' : ''}</span>
            <span className="caisse-sticky-total">{fcfa(netAPayer)}</span>
          </div>
          <button
            type="button"
            onClick={() => setTabMobile('ticket')}
            className="caisse-sticky-btn"
          >
            🛒 VOIR TICKET & ENCAISSER →
          </button>
        </div>
      )}

      {/* Ticket Impression Thermique 80mm */}
      {derniereVente && (
        <div className="ticket-print-container">
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' }}>
              {boutiqueActive ? boutiqueActive.nom : 'NOPALOU POS'}
            </h3>
            {boutiqueActive?.adresse && <p style={{ margin: '2px 0 0', fontSize: 10 }}>{boutiqueActive.adresse}</p>}
            {boutiqueActive?.telephone && <p style={{ margin: '2px 0 0', fontSize: 10 }}>Tél : {boutiqueActive.telephone}</p>}
            <p style={{ margin: '4px 0 0', fontSize: 10, borderTop: '1px dotted #000', paddingTop: 4 }}>
              Ticket N° {derniereVente.id}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 10 }}>Date : {derniereVente.date} à {derniereVente.heure}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10 }}>Caissier : {derniereVente.caissier}</p>
          </div>

          <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
            {derniereVente.ticket.map((i, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span>{i.quantite}x {i.produit.nom.slice(0, 18)}</span>
                <span style={{ fontWeight: 'bold' }}>{fcfa(i.prixUnitaire * i.quantite)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
            {derniereVente.remise > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>REMISE APPLIQUÉE :</span>
                <span>-{fcfa(derniereVente.remise)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 'bold' }}>
              <span>TOTAL NET :</span>
              <span>{fcfa(derniereVente.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>MODE RÈGLEMENT :</span>
              <span style={{ fontWeight: 'bold' }}>{derniereVente.mode}</span>
            </div>

            {derniereVente.detailMixte ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8 }}>
                  <span>- Espèces :</span>
                  <span>{fcfa(derniereVente.detailMixte.especes)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8 }}>
                  <span>- {derniereVente.detailMixte.autreMode} :</span>
                  <span>{fcfa(derniereVente.detailMixte.autreMontant)}</span>
                </div>
              </>
            ) : derniereVente.mode === 'ESPECES' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Montant Reçu :</span>
                  <span>{fcfa(derniereVente.recu)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Monnaie Rendue :</span>
                  <span>{fcfa(derniereVente.monnaie)}</span>
                </div>
              </>
            ) : null}
          </div>

          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10 }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Merci de votre confiance !</p>
            <p style={{ margin: '2px 0 0' }}>Nopalou POS • www.nopalou.sn</p>
          </div>
        </div>
      )}

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

      {/* Modale Paramètres des Codes PIN (Strictement Protégée par Mot de Passe Gérant) */}
      {modalConfigPin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: '2px solid #C75B00', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>👑 Modification Sécurisée des Codes PIN</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Espace restreint au Gérant / Superviseur de la boutique.</p>
              </div>
              <button onClick={() => setModalConfigPin(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {msgConfigPin && (
              <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 16, background: msgConfigPin.type === 'success' ? '#f0fdf4' : '#fef2f2', border: msgConfigPin.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca', color: msgConfigPin.type === 'success' ? '#166534' : '#991b1b' }}>
                {msgConfigPin.text}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#fff7ed', padding: 12, borderRadius: 10, border: '1px solid #fed7aa' }}>
                <label style={{ fontSize: 12, color: '#9a3412', display: 'block', fontWeight: 800, marginBottom: 4 }}>
                  1. Saisir le Code PIN Superviseur Actuel (Obligatoire)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••• (PIN Master Gérant)"
                  value={ancienPinSuperviseur}
                  onChange={e => setAncienPinSuperviseur(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #fed7aa', background: '#ffffff', color: '#0f172a', fontSize: 18, fontWeight: 700, letterSpacing: '0.3em', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', fontWeight: 700, marginBottom: 4 }}>
                  Nouveau Code PIN Caissier (4 chiffres secrets)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••• (ex: 1234)"
                  value={nouveauPinCaissier}
                  onChange={e => setNouveauPinCaissier(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 16, fontWeight: 700, letterSpacing: '0.2em', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', fontWeight: 700, marginBottom: 4 }}>
                  Nouveau Code PIN Superviseur Gérant (4 chiffres secrets)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="•••• (ex: 9999)"
                  value={nouveauPinSuperviseur}
                  onChange={e => setNouveauPinSuperviseur(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 16, fontWeight: 700, letterSpacing: '0.2em', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalConfigPin(false)} style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={enregistrerNouveauxPins} style={{ flex: 1, padding: '12px', background: '#C75B00', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                🔒 Valider et Masquer les PINs →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de Validation Superviseur */}
      {modalSuperviseur && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, border: '2px solid #ea580c', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👑</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#0f172a', fontWeight: 800 }}>Autorisation Superviseur Requis</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#c2410c', fontWeight: 600 }}>{superviseurTitre}</p>

            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinSuperviseurSaisi}
                onChange={e => setPinSuperviseurSaisi(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #ea580c', background: '#f8fafc', color: '#0f172a', fontSize: 20, textAlign: 'center', letterSpacing: '0.3em', boxSizing: 'border-box' }}
              />
              {superviseurError && <p style={{ margin: '6px 0 0', color: '#dc2626', fontSize: 12 }}>{superviseurError}</p>}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalSuperviseur(false)} style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={validerSuperviseurPin} style={{ flex: 1, padding: '10px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Historique des Opérations */}
      {modalHistorique && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 740, border: '1px solid #e2e8f0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>📜 Historique des Opérations & Incidents de Caisse</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Journal des encaissements, annulations et remboursements.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={formatTicketThermique}
                  onChange={e => setFormatTicketThermique(e.target.value as any)}
                  style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, background: '#ffffff', color: '#0f172a' }}
                >
                  <option value="80mm">🖨️ Format 80mm (Standard)</option>
                  <option value="58mm">🖨️ Format 58mm (Poche)</option>
                </select>
                <button
                  onClick={connecterImprimanteBluetooth}
                  style={{ background: btDeviceName ? '#f0fdf4' : '#f5f3ff', color: btDeviceName ? '#166534' : '#6d28d9', border: btDeviceName ? '1px solid #bbf7d0' : '1px solid #ddd6fe', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Connecter une imprimante thermique Bluetooth direct ESC/POS"
                >
                  📱 Bluetooth {btDeviceName ? `(${btDeviceName})` : ''}
                </button>
                <button
                  onClick={exporterHistoriqueCSV}
                  style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  📥 Excel (CSV)
                </button>
                <button
                  onClick={exporterHistoriquePDF}
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  📄 Imprimer PDF
                </button>
                <button onClick={() => setModalHistorique(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historiqueVentes.map(v => (
                <div key={v.id} style={{ background: '#f8fafc', border: v.statut === 'annulee' ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{v.id}</span>
                      <span style={{ fontSize: 11, background: v.statut === 'annulee' ? '#fef2f2' : '#eff6ff', color: v.statut === 'annulee' ? '#991b1b' : '#1d4ed8', border: v.statut === 'annulee' ? '1px solid #fecaca' : '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                        {v.statut === 'annulee' ? '❌ ANNULÉ / REMBOURSÉ' : v.modePaiement.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                      📅 {v.date} à {v.heure} • {v.caissier}
                    </p>
                    {v.motifAnnulation && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#dc2626', fontStyle: 'italic' }}>
                        Motif: {v.motifAnnulation}
                      </p>
                    )}
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#334155' }}>
                      Articles: {v.ticket.map(i => `${i.quantite}x ${i.produit.nom}`).join(', ')}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: v.statut === 'annulee' ? '#dc2626' : '#16a34a' }}>
                      {v.statut === 'annulee' ? `-${fcfa(v.total)}` : fcfa(v.total)}
                    </span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {v.statut !== 'annulee' && (
                        <button
                          onClick={() => annulerRembourserVente(v.id)}
                          style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          ❌ Annuler / Rembourser
                        </button>
                      )}
                      <button
                        onClick={() => imprimerTicketThermique(v)}
                        style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Printer size={12} /> Ticket Thermique
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modale Ouverture Session avec Fond de Caisse & PIN */}
      {modalSessionOuverture && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: '2px solid #16a34a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>🔑</span>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>Ouverture de Session POS</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Identifiez-vous et saisissez le fond de caisse initial.</p>
              </div>
            </div>

            <div style={{ marginBottom: 14, marginTop: 14 }}>
              <label style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 4, fontWeight: 700 }}>Caissier Connecté</label>
              <div style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>👤</span> {caissierNom}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 6, fontWeight: 700 }}>Fond de Caisse de Départ (en FCFA)</label>
              <input
                type="number"
                value={fondDeCaisseSaisi}
                onChange={e => setFondDeCaisseSaisi(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: '2px solid #16a34a', background: '#f0fdf4', color: '#166534', fontSize: 18, fontWeight: 800, boxSizing: 'border-box', textAlign: 'center' }}
              />

              {/* Présélections Rapides */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
                {['10000', '25000', '50000', '100000'].map(montant => (
                  <button
                    key={montant}
                    onClick={() => setFondDeCaisseSaisi(montant)}
                    style={{
                      padding: '6px 4px', fontSize: 11, fontWeight: 800, borderRadius: 6, border: '1px solid #cbd5e1',
                      background: fondDeCaisseSaisi === montant ? '#16a34a' : '#f8fafc',
                      color: fondDeCaisseSaisi === montant ? '#fff' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {new Intl.NumberFormat('fr-FR').format(Number(montant))} F
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalSessionOuverture(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={ouvrirSession} style={{ flex: 1.5, padding: '12px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                🚀 Démarrer la Session →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Clôture Z */}
      {modalClotureZ && session && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 800 }}>🔒 Clôture Z — Fin de Journée</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={exporterClotureCSV} title="Exporter Excel" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  📥 Excel
                </button>
                <button onClick={exporterCloturePDF} title="Imprimer Rapport PDF" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  📄 PDF
                </button>
              </div>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Session {session.id} • Caissier: {session.caissierNom}</p>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Fond de Caisse Départ:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{fcfa(session.fondDeCaisse)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ventes Espèces:</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>{fcfa(session.ventes.especes)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ventes Wave:</span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>{fcfa(session.ventes.wave)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ventes Orange Money:</span>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>{fcfa(session.ventes.orangeMoney)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: 8, fontWeight: 800, fontSize: 15 }}>
                <span>Total Théorique Espèces:</span>
                <span style={{ color: '#C75B00' }}>{fcfa(session.fondDeCaisse + session.ventes.especes)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4, fontWeight: 600 }}>Comptage Espèces Réel Tiroir-Caisse</label>
              <input
                type="number"
                placeholder={String(session.fondDeCaisse + session.ventes.especes)}
                value={especesComptees}
                onChange={e => setEspecesComptees(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 15, fontWeight: 700, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalClotureZ(false)} style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={async () => {
                  exporterCloturePDF()
                  const espComptees = Number(especesComptees) || 0
                  try {
                    await fetch(`/api/boutiques/${boutiqueActiveId}/pos-sessions/cloturer`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: session.id,
                        especesComptees: espComptees,
                        ventesEspeces: session.ventes.especes,
                        ventesWave: session.ventes.wave,
                        ventesOrangeMoney: session.ventes.orangeMoney,
                        ventesCarte: session.ventes.carte,
                        ventesTotal: session.ventes.total,
                        nbVentes: session.ventes.nbVentes
                      })
                    });
                  } catch (e) {
                    console.error('Erreur cloture backend:', e);
                  }
                  alert('Session de caisse fermée avec succès ! Rapport imprimé.')
                  setSession(null)
                  setEspecesComptees('')
                  setModalClotureZ(false)
                }}
                style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}
              >
                Clôturer la session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Scanner Code-Barres par Caméra Smartphone */}
      {modalScannerCamera && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={20} style={{ color: '#C75B00' }} /> Scanner Code-Barres (Caméra)
              </h3>
              <button onClick={arreterScannerCamera} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ position: 'relative', width: '100%', minHeight: 250, borderRadius: 14, overflow: 'hidden', background: '#000' }}>
              <div id="nopalou-reader-scanner" style={{ width: '100%', height: '100%' }} />
            </div>

            <p style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 700 }}>{scannerCameraStatus}</p>

            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <button onClick={demarrerScannerCamera} style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                🔄 Réessayer d&apos;activer la Caméra
              </button>
              <button onClick={() => { arreterScannerCamera(); setModalPairageSmartphone(true); }} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                📱 Passer en Douchette Smartphone Distante
              </button>
              <button onClick={arreterScannerCamera} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 10, padding: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Fermer le scanner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Pairage Douchette Smartphone (Scan Remote) */}
      {modalPairageSmartphone && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                📱 Douchette Smartphone Distante (WiFi)
              </h3>
              <button onClick={() => setModalPairageSmartphone(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
              Transformez votre téléphone portable en scanner sans fil pour votre ordinateur !
            </p>

            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 14, padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '.05em' }}>Code de Session Scanner</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#0284c7', fontFamily: 'monospace', letterSpacing: '0.15em' }}>{sessionScannerId}</span>
              
              <button
                onClick={() => {
                  const url = `${window.location.origin}/boutique/caisse?remoteSession=${sessionScannerId}&b=${boutiqueActiveId}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(`Lien Scanner Nopalou POS : ${url}`)}`, '_blank')
                }}
                style={{ background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <MessageCircle size={15} /> Envoyer le lien par WhatsApp sur le téléphone
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 4px rgba(34,197,94,0.2)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                Écoute active : Tout produit scanné sur le téléphone s'ajoute ici instantanément !
              </span>
            </div>

            <button onClick={() => setModalPairageSmartphone(false)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 10, padding: 12, fontWeight: 800, cursor: 'pointer' }}>
              Fermer la fenêtre
            </button>
          </div>
        </div>
      )}

      {/* Modale Carnet de Crédits Clients Avancé */}
      {modalCarnet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 860, border: '1px solid #e2e8f0', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            
            {/* En-tête Carnet */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff7f0', border: '1px solid #ffedd5', color: '#C75B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  📒
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, color: '#0f172a', fontWeight: 900 }}>Carnet de Crédits & Dettes Clients</h2>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Gestion complète des crédits de quartier, articles pris, remboursements et échéances.</p>
                </div>
              </div>
              <button onClick={() => { setModalCarnet(false); setClientCarnetSelectionne(null); }} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: 32, height: 32, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Statistiques Globales du Carnet */}
            {(() => {
              const detteTotale = clientsCredits.reduce((acc, c) => acc + (c.solde > 0 ? Number(c.solde) : 0), 0)
              const avanceTotale = clientsCredits.reduce((acc, c) => acc + (c.solde < 0 ? Math.abs(Number(c.solde)) : 0), 0)

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 12, borderRadius: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Total Dettes Clients</span>
                    <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 900, color: '#dc2626' }}>{fcfa(detteTotale)}</p>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '.05em' }}>Total Avances Reçues</span>
                    <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 900, color: '#16a34a' }}>{fcfa(avanceTotale)}</p>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em' }}>Clients du Carnet</span>
                    <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{clientsCredits.length} Clients</p>
                  </div>
                </div>
              )
            })()}

            {/* Barre de Recherche & Bouton Créer Client */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Rechercher un client par nom, téléphone ou quartier..."
                value={rechercheClientCarnet}
                onChange={e => setRechercheClientCarnet(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, background: '#f8fafc', outline: 'none' }}
              />
              <button
                onClick={() => setAfficherFormNouveauClient(!afficherFormNouveauClient)}
                style={{ background: afficherFormNouveauClient ? '#64748b' : '#C75B00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {afficherFormNouveauClient ? 'Fermer Formulaire' : '+ Nouveau Client'}
              </button>
            </div>

            {/* Formulaire d'ajout de Client */}
            {afficherFormNouveauClient && (
              <div style={{ background: '#fff7f0', border: '1px solid #ffedd5', borderRadius: 14, padding: 16, marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#C75B00' }}>👤 Créer une nouvelle fiche client carnet</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Nom complet *"
                    value={nouveauClientNom}
                    onChange={e => setNouveauClientNom(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Téléphone (ex: 77 000 00 00) *"
                    value={nouveauClientTel}
                    onChange={e => setNouveauClientTel(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <input
                    type="text"
                    placeholder="Adresse / Quartier (ex: Medina Rue 10)"
                    value={nouveauClientAdresse}
                    onChange={e => setNouveauClientAdresse(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <input
                    type="number"
                    placeholder="Plafond max (ex: 200000)"
                    value={nouveauClientPlafond}
                    onChange={e => setNouveauClientPlafond(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Note / Remarque (ex: Voisine d'en face, confiance 100%)"
                  value={nouveauClientNote}
                  onChange={e => setNouveauClientNote(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
                <button
                  onClick={async () => {
                    if (!nouveauClientNom.trim() || !nouveauClientTel.trim()) {
                      alert('Veuillez remplir au moins le nom et le téléphone.')
                      return
                    }
                    if (boutiqueActiveId) {
                      try {
                        const res = await fetch(`/api/boutiques/${boutiqueActiveId}/credits-clients`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            nom: nouveauClientNom,
                            telephone: nouveauClientTel,
                            adresse: nouveauClientAdresse,
                            plafond_max: nouveauClientPlafond,
                            note_client: nouveauClientNote,
                          })
                        })
                        if (res.ok) {
                          await chargerClientsCredits(boutiqueActiveId)
                          setNouveauClientNom('')
                          setNouveauClientTel('')
                          setNouveauClientAdresse('')
                          setNouveauClientNote('')
                          setAfficherFormNouveauClient(false)
                        } else {
                          const errData = await res.json()
                          alert(errData.error || 'Erreur lors de la création du client.')
                        }
                      } catch (e) {
                        console.error('Erreur ajout client credit:', e)
                      }
                    }
                  }}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 800, fontSize: 13, cursor: 'pointer', alignSelf: 'flex-start' }}
                >
                  ✓ Enregistrer le Client
                </button>
              </div>
            )}

            {/* Vue Principale : Liste ou Fiche Client */}
            {!clientCarnetSelectionne ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clientsCredits
                  .filter(c => {
                    if (!rechercheClientCarnet.trim()) return true
                    const q = rechercheClientCarnet.toLowerCase()
                    return (
                      c.nom.toLowerCase().includes(q) ||
                      c.telephone.includes(q) ||
                      (c.adresse && c.adresse.toLowerCase().includes(q))
                    )
                  })
                  .map(c => {
                    const ratioDette = Math.min(100, Math.max(0, (Number(c.solde) / Number(c.plafond_max)) * 100))

                    return (
                      <div key={c.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: '#0f172a' }}>{c.nom}</p>
                            {c.adresse && <span style={{ fontSize: 11, background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>📍 {c.adresse}</span>}
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                            📞 {c.telephone} • Plafond: {fcfa(c.plafond_max)}
                          </p>
                          {c.note_client && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Note: {c.note_client}</p>}

                          {/* Barre de ratio de dette par rapport au plafond */}
                          {c.solde > 0 && (
                            <div style={{ marginTop: 6, width: 180, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${ratioDette}%`, height: '100%', background: ratioDette > 85 ? '#dc2626' : '#f59e0b', borderRadius: 3 }} />
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>Solde du carnet</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: c.solde > 0 ? '#dc2626' : c.solde < 0 ? '#16a34a' : '#64748b' }}>
                              {c.solde > 0 ? `Dette: ${fcfa(c.solde)}` : c.solde < 0 ? `Avance: ${fcfa(Math.abs(c.solde))}` : '0 FCFA'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => envoyerRelanceWhatsApp(c)}
                              style={{ background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="Envoyer un rappel de solde automatique sur WhatsApp"
                            >
                              <MessageCircle size={14} /> WA Relance
                            </button>
                            <button
                              onClick={() => {
                                setClientCarnetSelectionne(c)
                                chargerHistoriqueClientSelectionne(c.id)
                              }}
                              style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                            >
                              📜 Fiche & Historique
                            </button>
                            <button
                              onClick={() => {
                                setClientCarnetSelectionne(c)
                                setTypeTransCarnet('remboursement')
                                setMontantTransCarnet('')
                                setNoteTransCarnet('')
                                setModalTransCarnet(true)
                              }}
                              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                            >
                              💵 Rembourser
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              /* Fiche & Historique Détaillé du Client */
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* En-tête Fiche Client */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <button onClick={() => setClientCarnetSelectionne(null)} style={{ background: 'none', border: 'none', color: '#1e3a5f', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: 0, marginBottom: 4 }}>
                      ← Retour à la liste des clients
                    </button>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{clientCarnetSelectionne.nom}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                      📞 {clientCarnetSelectionne.telephone} {clientCarnetSelectionne.adresse && `• 📍 ${clientCarnetSelectionne.adresse}`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Solde Actuel</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: clientCarnetSelectionne.solde > 0 ? '#dc2626' : clientCarnetSelectionne.solde < 0 ? '#16a34a' : '#64748b' }}>
                        {clientCarnetSelectionne.solde > 0 ? `Dette: ${fcfa(clientCarnetSelectionne.solde)}` : clientCarnetSelectionne.solde < 0 ? `Avance: ${fcfa(Math.abs(clientCarnetSelectionne.solde))}` : '0 FCFA'}
                      </span>
                    </div>

                    <button
                      onClick={() => envoyerRelanceWhatsApp(clientCarnetSelectionne)}
                      style={{ background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <MessageCircle size={15} /> WhatsApp Relance
                    </button>

                    <button
                      onClick={() => {
                        setTypeTransCarnet('remboursement')
                        setMontantTransCarnet('')
                        setNoteTransCarnet('')
                        setModalTransCarnet(true)
                      }}
                      style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      💵 Encaisser Remboursement
                    </button>
                    <button
                      onClick={() => {
                        setTypeTransCarnet('vente_credit')
                        setMontantTransCarnet('')
                        setNoteTransCarnet('')
                        setDateEcheanceTransCarnet('')
                        setProduitsTransCarnet('')
                        setModalTransCarnet(true)
                      }}
                      style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      + Nouveau Crédit Manuel
                    </button>
                  </div>
                </div>

                {/* Historique des Transactions */}
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#334155' }}>
                    📜 Historique des crédits, remboursements et articles pris
                  </h4>

                  {loadingHistoriqueClient ? (
                    <div style={{ padding: 30, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Chargement de l'historique…</div>
                  ) : historiqueClientSelectionne.length === 0 ? (
                    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 30, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                      Aucune transaction enregistrée pour le moment.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {historiqueClientSelectionne.map((t: any) => {
                        const isCredit = t.type === 'vente_credit'
                        const isRemb = t.type === 'remboursement'
                        let prodsList: any[] = []
                        try {
                          prodsList = typeof t.produits === 'string' ? JSON.parse(t.produits) : (t.produits || [])
                        } catch {}

                        return (
                          <div key={t.id} style={{ background: '#ffffff', border: isCredit ? '1px solid #fecaca' : isRemb ? '1px solid #bbf7d0' : '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
                                  background: isCredit ? '#fef2f2' : isRemb ? '#f0fdf4' : '#eff6ff',
                                  color: isCredit ? '#991b1b' : isRemb ? '#166534' : '#1d4ed8',
                                }}>
                                  {isCredit ? '🔴 VENTE À CRÉDIT' : isRemb ? '🟢 REMBOURSEMENT' : '🔵 DÉPÔT AVANCE'}
                                </span>
                                <span style={{ fontSize: 12, color: '#64748b' }}>
                                  {new Date(t.created_at).toLocaleDateString('fr-FR')} à {new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <span style={{ fontSize: 16, fontWeight: 900, color: isCredit ? '#dc2626' : '#16a34a' }}>
                                {isCredit ? `+ ${fcfa(t.montant)}` : `- ${fcfa(t.montant)}`}
                              </span>
                            </div>

                            {/* Mode de règlement & Justification / Note */}
                            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#475569', flexWrap: 'wrap' }}>
                              {t.mode_paiement && <span>Mode: <strong>{t.mode_paiement.toUpperCase()}</strong></span>}
                              {t.date_echeance && (
                                <span style={{ color: '#c2410c', fontWeight: 700 }}>
                                  📅 Promesse d'échéance: {new Date(t.date_echeance).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                              {t.note && <span style={{ fontStyle: 'italic', color: '#64748b' }}>Note: &quot;{t.note}&quot;</span>}
                            </div>

                            {/* Détail des produits pris */}
                            {prodsList && prodsList.length > 0 && (
                              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', border: '1px solid #f1f5f9', marginTop: 4 }}>
                                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 800, color: '#334155' }}>🛒 Articles & Produits pris :</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {prodsList.map((prod: any, pIdx: number) => (
                                    <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569' }}>
                                      <span>• {prod.quantite}x {prod.nom}</span>
                                      <span style={{ fontWeight: 700 }}>{fcfa((prod.prix || 0) * (prod.quantite || 1))}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modale d'enregistrement de Transaction Carnet (Remboursement / Crédit Manuel) */}
      {modalTransCarnet && clientCarnetSelectionne && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a', fontWeight: 900 }}>
                {typeTransCarnet === 'remboursement' ? '💵 Encaisser un Remboursement' : '📝 Enregistrer un Crédit'}
              </h3>
              <button onClick={() => setModalTransCarnet(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>Client: <strong>{clientCarnetSelectionne.nom}</strong> ({clientCarnetSelectionne.telephone})</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Montant (FCFA) *</label>
                <input
                  type="number"
                  placeholder="Ex: 10000"
                  value={montantTransCarnet}
                  onChange={e => setMontantTransCarnet(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 800, boxSizing: 'border-box' }}
                />
              </div>

              {typeTransCarnet === 'remboursement' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Mode de Paiement Reçu</label>
                  <select
                    value={modePaiementTransCarnet}
                    onChange={e => setModePaiementTransCarnet(e.target.value)}
                    style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  >
                    <option value="especes">💵 Espèces Cash</option>
                    <option value="wave">🌊 Wave Senegal</option>
                    <option value="orange_money">🍊 Orange Money</option>
                  </select>
                </div>
              )}

              {typeTransCarnet === 'vente_credit' && (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Produits / Articles pris</label>
                    <input
                      type="text"
                      placeholder="Ex: 2x Sac de riz 25kg, 3L Huile..."
                      value={produitsTransCarnet}
                      onChange={e => setProduitsTransCarnet(e.target.value)}
                      style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Date d'échéance / Promesse de paiement</label>
                    <input
                      type="date"
                      value={dateEcheanceTransCarnet}
                      onChange={e => setDateEcheanceTransCarnet(e.target.value)}
                      style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Note / Remarque / Justification</label>
                <input
                  type="text"
                  placeholder="Ex: Remboursement partiel par sa femme, etc."
                  value={noteTransCarnet}
                  onChange={e => setNoteTransCarnet(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => setModalTransCarnet(false)} style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    const num = Number(montantTransCarnet)
                    if (!num || num <= 0) {
                      alert('Veuillez saisir un montant valide.')
                      return
                    }
                    if (boutiqueActiveId && clientCarnetSelectionne) {
                      try {
                        const prodsArr = typeTransCarnet === 'vente_credit' && produitsTransCarnet.trim()
                          ? [{ nom: produitsTransCarnet.trim(), quantite: 1, prix: num }]
                          : []

                        const res = await fetch(`/api/boutiques/${boutiqueActiveId}/credits-clients/${clientCarnetSelectionne.id}/transaction`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: typeTransCarnet,
                            montant: num,
                            mode_paiement: modePaiementTransCarnet,
                            note: noteTransCarnet || null,
                            date_echeance: dateEcheanceTransCarnet || null,
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
                      }
                    }
                  }}
                  style={{ flex: 1, padding: '10px', background: typeTransCarnet === 'remboursement' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 900, cursor: 'pointer' }}
                >
                  ✓ Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
