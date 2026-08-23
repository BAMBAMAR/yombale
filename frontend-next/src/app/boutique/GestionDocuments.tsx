'use client'

import { useEffect, useState, useRef } from 'react'
import { getBoutiqueDocuments, creerBoutiqueDocument, modifierBoutiqueDocument, supprimerBoutiqueDocument, getBoutiqueProduits } from './actions'
import { fcfa } from '@/lib/format'
import SearchableClientSelect from '@/components/SearchableClientSelect'
import { capturerEtOptimiserImageOCR, jouerBipScan } from '@/lib/ocr-helper'
import { useTranslation } from '@/i18n/context'
import { useScrollNudge } from '@/hooks/useScrollNudge'

interface LigneDocument {
  produitId: string
  nom: string
  quantite: number
  prix: number
  barcode?: string
  sku?: string
  stock?: number
}

export default function GestionDocuments({ boutiqueId }: { boutiqueId: string }) {
  const { t, isRtl } = useTranslation()
  const { scrollRef: docFilterRef, scrollToCenter: scrollDocToCenter } = useScrollNudge()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [typeFiltre, setTypeFiltre] = useState<string>('tous')
  const [clients, setClients] = useState<any[]>([])
  const [produits, setProduits] = useState<any[]>([])

  // Modal State Document
  const [modalOuvert, setModalOuvert] = useState<boolean>(false)
  const [typeDoc, setTypeDoc] = useState<'facture' | 'devis' | 'proforma'>('facture')
  const [clientIdSelected, setClientIdSelected] = useState<string>('')
  const [statutDoc, setStatutDoc] = useState<'brouillon' | 'valide' | 'paye'>('brouillon')
  const [noteDoc, setNoteDoc] = useState<string>('')
  const [lignesSelectionnees, setLignesSelectionnees] = useState<LigneDocument[]>([])

  // Modes d'ajout d'articles dans la modal
  const [modeAjout, setModeAjout] = useState<'catalogue' | 'libre' | 'scan'>('catalogue')
  const [rechercheProduitModal, setRechercheProduitModal] = useState<string>('')
  const [categorieProduitModal, setCategorieProduitModal] = useState<string>('tous')

  // Champs de saisie libre
  const [libelleLibreInput, setLibelleLibreInput] = useState<string>('')
  const [prixLibreInput, setPrixLibreInput] = useState<string>('')
  const [qteLibreInput, setQteLibreInput] = useState<number>(1)
  const [ocrDetections, setOcrDetections] = useState<string[]>([])

  // Scanner EAN / Code-barres
  const [modalScannerEan, setModalScannerEan] = useState<boolean>(false)
  const [scannerEanStatus, setScannerEanStatus] = useState<string>('Initialisation du scanner EAN…')
  const [scanContinu, setScanContinu] = useState<boolean>(true)
  const html5ScannerRef = useRef<any>(null)

  // Scanner Nom OCR
  const [modalScannerNom, setModalScannerNom] = useState<boolean>(false)
  const [statusScannerNom, setStatusScannerNom] = useState<string>('')
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)
  const videoNomRef = useRef<HTMLVideoElement | null>(null)
  const streamNomRef = useRef<MediaStream | null>(null)

  // Actions states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [documentEnEdition, setDocumentEnEdition] = useState<any | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Search & Status Filter liste
  const [rechercheDoc, setRechercheDoc] = useState<string>('')
  const [statutFiltreDoc, setStatutFiltreDoc] = useState<string>('tous')

  const afficherToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const chargerDonnees = async () => {
    const cacheKeyDocs = `nopalou_offline_docs_${boutiqueId}`
    const cacheKeyClients = `nopalou_offline_clients_${boutiqueId}`
    const cacheKeyProds = `nopalou_offline_prods_${boutiqueId}`

    const cDocs = localStorage.getItem(cacheKeyDocs)
    if (cDocs) { try { setDocuments(JSON.parse(cDocs)) } catch(e) {} }
    const cClients = localStorage.getItem(cacheKeyClients)
    if (cClients) { try { setClients(JSON.parse(cClients)) } catch(e) {} }
    const cProds = localStorage.getItem(cacheKeyProds)
    if (cProds) { try { setProduits(JSON.parse(cProds)) } catch(e) {} }

    if (!cDocs) setLoading(true)

    try {
      const docs = await getBoutiqueDocuments(boutiqueId)
      setDocuments(docs)
      localStorage.setItem(cacheKeyDocs, JSON.stringify(docs))

      // Charger clients
      const resClients = await fetch(`/api/boutiques/${boutiqueId}/credits-clients`)
      if (resClients.ok) {
        const dClients = await resClients.json()
        setClients(dClients.clients || [])
        localStorage.setItem(cacheKeyClients, JSON.stringify(dClients.clients || []))
      }

      // Charger catalogue
      const prods = await getBoutiqueProduits(boutiqueId)
      setProduits(prods || [])
      localStorage.setItem(cacheKeyProds, JSON.stringify(prods || []))
    } catch (err) {
      console.error('Erreur chargement documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [boutiqueId])

  // ── Gestion Ajout Articles Catalogue ─────────────────────────────────────
  const handleAjouterProduitCatalogue = (prod: any, delta = 1) => {
    setLignesSelectionnees(prev => {
      const existantIdx = prev.findIndex(l => l.produitId === prod.id)
      const prixUnitaire = Number(prod.prix_promo || prod.prix || 0)

      if (existantIdx >= 0) {
        const copy = [...prev]
        const nouvelleQte = copy[existantIdx].quantite + delta
        if (nouvelleQte <= 0) {
          return copy.filter((_, i) => i !== existantIdx)
        }
        copy[existantIdx] = {
          ...copy[existantIdx],
          quantite: nouvelleQte
        }
        return copy
      } else if (delta > 0) {
        return [
          ...prev,
          {
            produitId: prod.id,
            nom: prod.nom,
            quantite: delta,
            prix: prixUnitaire,
            barcode: prod.barcode,
            sku: prod.sku,
            stock: prod.stock_quantite ?? prod.quantite_stock
          }
        ]
      }
      return prev
    })
    jouerBipScan('succes')
    afficherToast(`✅ ${prod.nom} ajouté`)
  }

  const handleDiminuerProduitCatalogue = (prodId: string) => {
    setLignesSelectionnees(prev => {
      const idx = prev.findIndex(l => l.produitId === prodId)
      if (idx < 0) return prev
      const copy = [...prev]
      if (copy[idx].quantite > 1) {
        copy[idx] = { ...copy[idx], quantite: copy[idx].quantite - 1 }
        return copy
      } else {
        return copy.filter((_, i) => i !== idx)
      }
    })
  }

  // ── Gestion Ajout Article Libre ──────────────────────────────────────────
  const handleAjouterLigneLibre = () => {
    const libelle = libelleLibreInput.trim()
    const prix = Number(prixLibreInput)
    const qte = Number(qteLibreInput) || 1

    if (!libelle) {
      alert('Veuillez saisir le nom ou la désignation de l’article / prestation.')
      return
    }
    if (isNaN(prix) || prix < 0) {
      alert('Veuillez renseigner un prix unitaire valide.')
      return
    }

    setLignesSelectionnees(prev => [
      ...prev,
      {
        produitId: 'custom',
        nom: libelle,
        quantite: qte,
        prix: prix
      }
    ])

    jouerBipScan('succes')
    afficherToast(`✅ Article libre "${libelle}" ajouté`)
    setLibelleLibreInput('')
    setPrixLibreInput('')
    setQteLibreInput(1)
  }

  // ── Gestion Modification / Suppression des Lignes ─────────────────────────
  const handleModifierLigne = (index: number, champ: keyof LigneDocument, valeur: any) => {
    setLignesSelectionnees(prev => prev.map((l, i) => {
      if (i === index) {
        return { ...l, [champ]: valeur }
      }
      return l
    }))
  }

  const handleSupprimerLigne = (index: number) => {
    setLignesSelectionnees(prev => prev.filter((_, i) => i !== index))
  }

  const handleViderPanier = () => {
    if (lignesSelectionnees.length === 0) return
    if (confirm('Voulez-vous vraiment vider tous les articles du document ?')) {
      setLignesSelectionnees([])
    }
  }

  // ── Scanner EAN Caméra (Html5Qrcode) ─────────────────────────────────────
  const demarrerScannerEan = async () => {
    setModalScannerEan(true)
    setScannerEanStatus('📷 Initialisation de la caméra pour le scan EAN…')

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerRef.current) {
          try {
            await html5ScannerRef.current.stop()
            html5ScannerRef.current.clear()
          } catch (e) {}
          html5ScannerRef.current = null
        }

        const container = document.getElementById('doc-ean-scanner-reader')
        if (!container) return

        const scanner = new Html5Qrcode('doc-ean-scanner-reader')
        html5ScannerRef.current = scanner

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 160 },
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
          handleEanDetecte(decodedText)
        }

        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatus('📷 Caméra active ! Placez le code-barres (EAN) dans le cadre.')
        } catch (errEnv) {
          await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
          setScannerEanStatus('📷 Caméra active ! Placez le code-barres dans le cadre.')
        }
      } catch (err) {
        setScannerEanStatus('❌ Impossible d’accéder à la caméra.')
      }
    }, 200)
  }

  const arreterScannerEan = () => {
    if (html5ScannerRef.current) {
      try {
        html5ScannerRef.current.stop()
        html5ScannerRef.current.clear()
      } catch (e) {}
      html5ScannerRef.current = null
    }
    setModalScannerEan(false)
  }

  const handleEanDetecte = (barcodeStr: string) => {
    const code = barcodeStr.trim().toLowerCase()
    const prodTrouve = produits.find(
      (p: any) =>
        p.barcode?.trim().toLowerCase() === code ||
        p.sku?.trim().toLowerCase() === code ||
        p.id?.trim().toLowerCase() === code
    )

    if (prodTrouve) {
      handleAjouterProduitCatalogue(prodTrouve, 1)
      setScannerEanStatus(`✅ Produit trouvé : "${prodTrouve.nom}" (${fcfa(prodTrouve.prix_promo || prodTrouve.prix)})`)
      if (!scanContinu) {
        setTimeout(() => arreterScannerEan(), 800)
      }
    } else {
      jouerBipScan('alerte')
      setScannerEanStatus(`⚠️ Code "${barcodeStr}" inconnu dans le catalogue.`)
      // Proposer d'ajouter en libre
      if (confirm(`Le code-barres "${barcodeStr}" n'existe pas dans votre catalogue. Voulez-vous l'ajouter comme article libre ?`)) {
        setLibelleLibreInput(`Article EAN-${barcodeStr}`)
        setModeAjout('libre')
        arreterScannerEan()
      }
    }
  }

  // ── Scanner Nom OCR Caméra ────────────────────────────────────────────────
  const demarrerScannerNom = async () => {
    setModalScannerNom(true)
    setOcrDetections([])
    setStatusScannerNom('📷 Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamNomRef.current = stream
      if (videoNomRef.current) {
        videoNomRef.current.srcObject = stream
        await videoNomRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNom('❌ Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerNom = () => {
    if (streamNomRef.current) {
      streamNomRef.current.getTracks().forEach(t => t.stop())
      streamNomRef.current = null
    }
    setModalScannerNom(false)
  }

  const capturerNomOCR = async () => {
    if (!videoNomRef.current) return
    setOcrLoading(true)
    setStatusScannerNom('🔍 Optimisation de l’image & lecture OCR…')

    const imageBase64 = capturerEtOptimiserImageOCR(videoNomRef.current, {
      cropRatioWidth: 0.85,
      cropRatioHeight: 0.60,
      rehausserContraste: true
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setStatusScannerNom('❌ Échec de la capture d’image.')
      return
    }

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoading(false)

      if (data.ok && data.nom) {
        setLibelleLibreInput(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetections(data.detections)
        }
        jouerBipScan('succes')
        setStatusScannerNom(`✅ Nom capturé : "${data.nom}"`)
        setTimeout(() => arreterScannerNom(), 1000)
      } else {
        jouerBipScan('alerte')
        setStatusScannerNom(`⚠️ ${data.error || 'Aucun nom lisible détecté. Réessayez avec un meilleur éclairage.'}`)
      }
    } catch (err) {
      setOcrLoading(false)
      jouerBipScan('alerte')
      setStatusScannerNom('❌ Erreur de lecture OCR. Réessayez.')
    }
  }

  // ── Soumission du document ────────────────────────────────────────────────
  const handleSoumettreDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lignesSelectionnees.length === 0) {
      alert('Veuillez ajouter au moins un produit ou article au document.')
      return
    }

    try {
      setIsSubmitting(true)
      const itemsFormates = lignesSelectionnees.map(l => {
        const prodObj = produits.find(p => p.id === l.produitId)
        const nomFinal = l.nom?.trim() || (prodObj ? prodObj.nom : 'Article / Prestation')
        return {
          id: (l.produitId && l.produitId !== 'custom') ? l.produitId : null,
          nom: nomFinal,
          quantite: Number(l.quantite || 1),
          prix: Number(l.prix || 0)
        }
      })

      const payload = {
        type: typeDoc,
        client_id: clientIdSelected || null,
        statut: statutDoc,
        notes: noteDoc,
        items: itemsFormates
      }

      if (documentEnEdition) {
        const res = await modifierBoutiqueDocument(boutiqueId, documentEnEdition.id, payload)
        if (res.error) {
          alert(res.error)
        } else {
          alert(`Document ${documentEnEdition.reference} modifié avec succès !`)
          setModalOuvert(false)
          resetForm()
          chargerDonnees()
        }
      } else {
        const res = await creerBoutiqueDocument(boutiqueId, payload)
        if (res.error) {
          alert(res.error)
        } else {
          alert(`Document ${res.reference} créé avec succès !`)
          setModalOuvert(false)
          resetForm()
          chargerDonnees()
        }
      }
    } catch (err) {
      console.error('Erreur soumission document:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTypeDoc('facture')
    setClientIdSelected('')
    setStatutDoc('brouillon')
    setNoteDoc('')
    setLignesSelectionnees([])
    setModeAjout('catalogue')
    setRechercheProduitModal('')
    setCategorieProduitModal('tous')
    setLibelleLibreInput('')
    setPrixLibreInput('')
    setQteLibreInput(1)
    setOcrDetections([])
  }

  const handleOuvrirEdition = (doc: any) => {
    setDocumentEnEdition(doc)
    setTypeDoc(doc.type)
    setClientIdSelected(doc.client_id || '')
    setStatutDoc(doc.statut)
    setNoteDoc(doc.notes || '')
    
    const parsedItems = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items
    const lines: LigneDocument[] = (parsedItems || []).map((item: any) => {
      let pId = item.id || item.produit_id || item.produitId || ''
      let prodObj = produits.find(p => p.id === pId)
      if (!prodObj && item.nom && produits.length > 0) {
        prodObj = produits.find(p => p.nom?.toLowerCase() === item.nom?.toLowerCase())
        if (prodObj) pId = prodObj.id; else pId = 'custom'
      } else if (!prodObj) {
        pId = 'custom'
      }
      const unitPrice = Number(item.prix_unitaire ?? item.prix ?? item.prix_unitaire_ht ?? 0)
      return {
        produitId: pId,
        nom: item.nom || item.description || (prodObj ? prodObj.nom : 'Article'),
        quantite: Number(item.quantite || 1),
        prix: unitPrice,
        barcode: prodObj?.barcode,
        sku: prodObj?.sku,
        stock: prodObj?.stock_quantite ?? prodObj?.quantite_stock
      }
    })
    setLignesSelectionnees(lines)
    setModalOuvert(true)
  }

  const handleConvertirEnFacture = async (docId: string, ref: string) => {
    if (!confirm(`Voulez-vous vraiment convertir le devis/proforma ${ref} en Facture de vente ?`)) return
    try {
      const res = await modifierBoutiqueDocument(boutiqueId, docId, { type: 'facture', statut: 'valide' })
      if (res.error) {
        alert(res.error)
      } else {
        alert('Document converti en Facture avec succès !')
        chargerDonnees()
      }
    } catch (err) {
      console.error('Erreur conversion document:', err)
    }
  }

  const handleSupprimerDocument = async (docId: string, ref: string) => {
    if (!confirm(`${t('shop.deleteDocConfirm')} (${ref})`)) return
    try {
      const res = await supprimerBoutiqueDocument(boutiqueId, docId)
      if (res.error) {
        alert(res.error)
      } else {
        alert(t('shop.docDeletedSuccess'))
        chargerDonnees()
      }
    } catch (err) {
      console.error('Erreur suppression document:', err)
    }
  }

  // Filtrage du catalogue dans la modale
  const categoriesCatalogue = Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
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

  // Calcul des totaux en direct pour le panier mixte
  const totalArticles = lignesSelectionnees.reduce((acc, l) => acc + (Number(l.quantite) || 0), 0)
  const totalTTC = lignesSelectionnees.reduce((acc, l) => acc + ((Number(l.quantite) || 0) * (Number(l.prix) || 0)), 0)

  // Filtrage liste documents
  const qDoc = rechercheDoc.trim().toLowerCase()
  const documentsFiltrés = documents.filter(d => {
    const matchType = typeFiltre === 'tous' || d.type === typeFiltre
    const matchStatut = statutFiltreDoc === 'tous' || d.statut === statutFiltreDoc
    const matchSearch = !qDoc ||
      d.reference?.toLowerCase().includes(qDoc) ||
      d.client_nom?.toLowerCase().includes(qDoc) ||
      d.client_ninea?.toLowerCase().includes(qDoc)
    return matchType && matchStatut && matchSearch
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
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
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Barre d'outils et filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
          <input
            type="text"
            value={rechercheDoc}
            onChange={e => setRechercheDoc(e.target.value)}
            placeholder={`🔍 ${t('common.search')}...`}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 200, flex: 1, outline: 'none' }}
          />
          <div ref={docFilterRef} className="nopalou-scroll-tabs horizontal-scroll-fade" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'tous', label: `📁 ${t('shop.filterDocAll')}` },
              { key: 'facture', label: `🧾 ${t('shop.filterDocInvoices')}` },
              { key: 'devis', label: `📝 ${t('shop.filterDocQuotes')}` },
              { key: 'proforma', label: `📋 ${t('shop.filterDocProformas')}` },
            ].map(item => (
              <button
                key={item.key}
                onClick={(e) => {
                  setTypeFiltre(item.key)
                  scrollDocToCenter(e.currentTarget)
                }}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb',
                  background: typeFiltre === item.key ? '#1e3a5f' : '#ffffff',
                  color: typeFiltre === item.key ? '#ffffff' : '#475569',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <select
            value={statutFiltreDoc}
            onChange={e => setStatutFiltreDoc(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', outline: 'none' }}
          >
            <option value="tous">{t('common.all')}</option>
            <option value="brouillon">⏳ {t('shop.statusDraft')}</option>
            <option value="valide">✅ {t('shop.statusValidated')}</option>
            <option value="paye">💵 {t('shop.statusPaid')}</option>
            <option value="envoye">📩 {t('shop.statusShipped')}</option>
          </select>
        </div>
        <button
          onClick={() => { setDocumentEnEdition(null); resetForm(); setModalOuvert(true); }}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          ➕ {t('shop.newDocumentBtn')}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>{t('common.loading')}</p>
      ) : documentsFiltrés.length === 0 ? (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
          📂 {t('common.noData')}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{t('shop.orderReference')}</th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{t('shop.documentType')}</th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{t('shop.documentClient')}</th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{t('shop.subtotalHt')}</th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{t('shop.vatAmount')}</th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{t('shop.totalTtc')}</th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{t('shop.orderStatus')}</th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {documentsFiltrés.map((doc: any) => {
                const client = clients.find(c => c.id === doc.client_id)
                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 12, fontWeight: 700, color: '#1e3a5f' }}>{doc.reference}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '3px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: doc.type === 'facture' ? '#e0f2fe' : doc.type === 'devis' ? '#fef3c7' : '#ecfdf5',
                        color: doc.type === 'facture' ? '#0369a1' : doc.type === 'devis' ? '#b45309' : '#047857'
                      }}>
                        {doc.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{client ? client.nom : t('shop.anonymousWalkInClient')}</td>
                    <td style={{ padding: 12 }}>{fcfa(doc.total_ht)}</td>
                    <td style={{ padding: 12 }}>{fcfa(doc.total_tva)}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{fcfa(doc.total_ttc)}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '3px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: doc.statut === 'paye' ? '#d1fae5' : doc.statut === 'valide' ? '#e0e7ff' : '#f3f4f6',
                        color: doc.statut === 'paye' ? '#065f46' : doc.statut === 'valide' ? '#3730a3' : '#374151'
                      }}>
                        {doc.statut.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'pdf') window.open(`/api/boutiques/${boutiqueId}/documents/${doc.id}/pdf`, '_blank');
                          else if (val === 'edit') handleOuvrirEdition(doc);
                          else if (val === 'convert') handleConvertirEnFacture(doc.id, doc.reference);
                          else if (val === 'delete') handleSupprimerDocument(doc.id, doc.reference);
                          e.target.value = '';
                        }}
                        defaultValue=""
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#0f172a',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="" disabled>{t('shop.docActionsDropdown')}</option>
                        <option value="pdf">{t('shop.actionDownloadPdf')}</option>
                        <option value="edit">{t('shop.actionEditDoc')}</option>
                        {(doc.type === 'devis' || doc.type === 'proforma') && (
                          <option value="convert">{t('shop.actionConvertToInvoice')}</option>
                        )}
                        <option value="delete">{t('shop.actionDeleteDoc')}</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation / Edition Document Modal */}
      {modalOuvert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 780, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>
                  {documentEnEdition ? `✏️ ${t('shop.editDocumentModalTitle')} ${documentEnEdition.reference}` : t('shop.newDocumentModalTitle')}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  {t('shop.docModalSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOuvert(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 16, fontWeight: 800, color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSoumettreDocument} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Type, Statut et Client */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>{t('shop.documentType')} *</label>
                  <select value={typeDoc} onChange={e => setTypeDoc(e.target.value as any)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, background: '#fff' }}>
                    <option value="facture">{t('shop.invoiceSaleOption')}</option>
                    <option value="devis">{t('shop.quoteOption')}</option>
                    <option value="proforma">{t('shop.proformaOption')}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>{t('shop.initialStatusLabel')}</label>
                  <select value={statutDoc} onChange={e => setStatutDoc(e.target.value as any)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, background: '#fff' }}>
                    <option value="brouillon">{t('shop.statusDraftOption')}</option>
                    <option value="valide">{t('shop.statusValidatedOption')}</option>
                    {typeDoc === 'facture' && <option value="paye">{t('shop.statusPaidOption')}</option>}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>{t('shop.associatedClientLabel')}</label>
                  <SearchableClientSelect
                    clients={clients}
                    value={clientIdSelected}
                    onChange={(cId) => setClientIdSelected(cId)}
                    placeholder={t('shop.anonymousWalkInClient')}
                  />
                </div>
              </div>

              {/* ── Onglets de Sélection d'Articles ────────────────────────── */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
                    <button
                      type="button"
                      onClick={() => setModeAjout('catalogue')}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: modeAjout === 'catalogue' ? '#ffffff' : 'transparent',
                        fontWeight: modeAjout === 'catalogue' ? 800 : 600,
                        color: modeAjout === 'catalogue' ? '#0f172a' : '#64748b',
                        fontSize: 12.5,
                        cursor: 'pointer',
                        boxShadow: modeAjout === 'catalogue' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      {t('shop.catalogCountTab')} ({produits.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModeAjout('libre')}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: modeAjout === 'libre' ? '#ffffff' : 'transparent',
                        fontWeight: modeAjout === 'libre' ? 800 : 600,
                        color: modeAjout === 'libre' ? '#0f172a' : '#64748b',
                        fontSize: 12.5,
                        cursor: 'pointer',
                        boxShadow: modeAjout === 'libre' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      {t('shop.manualServiceTab')}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={demarrerScannerEan}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 12px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(2,132,199,0.25)'
                    }}
                  >
                    {t('shop.scanEanBarcodeBtn')}
                  </button>
                </div>

                {/* 1. Onglet Catalogue & Recherche */}
                {modeAjout === 'catalogue' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Recherche instantanée */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={rechercheProduitModal}
                        onChange={e => setRechercheProduitModal(e.target.value)}
                        placeholder={t('shop.catalogSearchPlaceholder')}
                        style={{
                          width: '100%',
                          padding: '9px 36px 9px 12px',
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
                            right: 10,
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

                    {/* Filtres par Catégorie */}
                    {categoriesCatalogue.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                        <button
                          type="button"
                          onClick={() => setCategorieProduitModal('tous')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 11.5,
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
                        {categoriesCatalogue.map(cat => {
                          const count = produits.filter((p: any) => p.categorie === cat).length
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategorieProduitModal(cat)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 12,
                                fontSize: 11.5,
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

                    {/* Grille de Produits */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: 8,
                      maxHeight: 220,
                      overflowY: 'auto',
                      padding: 2
                    }}>
                      {produitsFiltresModal.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: '#94a3b8', textAlign: 'center', padding: '24px 10px' }}>
                          {produits.length === 0
                            ? t('shop.noProductsInDocCatalog')
                            : t('shop.noProductsMatchSearch')}
                        </div>
                      ) : (
                        produitsFiltresModal.map((p: any) => {
                          const ligneExistante = lignesSelectionnees.find(l => l.produitId === p.id)
                          const qte = ligneExistante ? ligneExistante.quantite : 0
                          const prixAff = Number(p.prix_promo || p.prix || 0)
                          const stock = p.stock_quantite ?? p.quantite_stock

                          return (
                            <div
                              key={p.id}
                              style={{
                                background: qte > 0 ? '#f0f9ff' : '#f8fafc',
                                border: qte > 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                                borderRadius: 10,
                                padding: '8px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease-in-out'
                              }}
                            >
                              <div
                                onClick={() => handleAjouterProduitCatalogue(p, 1)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.nom}>
                                  {p.nom}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                                  <span style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 900 }}>
                                    {fcfa(prixAff)}
                                  </span>
                                  {stock !== undefined && stock !== null && (
                                    <span style={{ fontSize: 9.5, fontWeight: 700, color: stock > 0 ? '#10b981' : '#ef4444' }}>
                                      {stock > 0 ? `${stock} ${t('shop.inStockLabel')}` : t('shop.outOfStockBadge')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {qte > 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, paddingTop: 4, borderTop: '1px dashed #bae6fd' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDiminuerProduitCatalogue(p.id)
                                    }}
                                    style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Diminuer"
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
                                      handleAjouterProduitCatalogue(p, 1)
                                    }}
                                    style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#e0f2fe', color: '#0284c7', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Augmenter"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAjouterProduitCatalogue(p, 1)}
                                  style={{ marginTop: 6, padding: '3px 6px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, color: '#475569', cursor: 'pointer' }}
                                >
                                  {t('shop.addDocLineBtn')}
                                </button>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Onglet Saisie Libre / Prestation */}
                {modeAjout === 'libre' && (
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', margin: 0 }}>
                        {t('shop.customArticlePrompt')}
                      </label>
                      <button
                        type="button"
                        onClick={demarrerScannerNom}
                        style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {t('shop.scanNameOcrBtnAlt')}
                      </button>
                    </div>

                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                        {t('shop.designationLabel')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('shop.designationPlaceholder')}
                        value={libelleLibreInput}
                        onChange={e => setLibelleLibreInput(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Suggestions OCR ou fréquentes */}
                    {ocrDetections.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>{t('shop.ocrDetectionsLabel')}</span>
                        {ocrDetections.map((txt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setLibelleLibreInput(txt)}
                            style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            {txt}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8' }}>{t('shop.suggestionsPrefix')}</span>
                      {[t('shop.serviceSuggestion'), t('shop.laborSuggestion'), t('shop.deliverySuggestion'), t('shop.customItemSuggestion')].map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLibelleLibreInput(sug)}
                          style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                          {t('shop.unitPriceDocLabel')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Ex: 15000"
                          value={prixLibreInput}
                          onChange={e => setPrixLibreInput(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                          {t('shop.quantityDocLabel')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={qteLibreInput}
                          onChange={e => setQteLibreInput(Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAjouterLigneLibre}
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          padding: '9px 14px',
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {t('shop.addDocLineBtn')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Panier Mixte / Articles Ajoutés au Document ────────────── */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    {t('shop.articlesInDocCart')} ({totalArticles} {t('shop.articlesTotalCount')} • {t('shop.totalTtc')}: {fcfa(totalTTC)})
                  </span>
                  {lignesSelectionnees.length > 0 && (
                    <button
                      type="button"
                      onClick={handleViderPanier}
                      style={{ fontSize: 11, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 800 }}
                    >
                      {t('shop.emptyCartBtn')}
                    </button>
                  )}
                </div>

                {lignesSelectionnees.length === 0 ? (
                  <div style={{ padding: '24px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>
                    {t('shop.emptyDocCartMsg')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {lignesSelectionnees.map((ligne, idx) => {
                      const estLibre = ligne.produitId === 'custom' || !produits.some(p => p.id === ligne.produitId)
                      const subtotal = (Number(ligne.quantite) || 0) * (Number(ligne.prix) || 0)

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#ffffff',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: estLibre ? '1px dashed #0284c7' : '1px solid #e2e8f0',
                            gap: 10,
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', overflow: 'hidden' }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: estLibre ? '#e0f2fe' : '#f0fdf4',
                              color: estLibre ? '#0369a1' : '#16a34a',
                              whiteSpace: 'nowrap'
                            }}>
                              {estLibre ? t('shop.freeItemTag') : t('shop.catalogItemTag')}
                            </span>
                            
                            {estLibre ? (
                              <input
                                type="text"
                                value={ligne.nom}
                                onChange={e => handleModifierLigne(idx, 'nom', e.target.value)}
                                style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 700 }}
                              />
                            ) : (
                              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ligne.nom}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('common.price')} :</label>
                              <input
                                type="number"
                                min="0"
                                value={ligne.prix}
                                onChange={e => handleModifierLigne(idx, 'prix', Number(e.target.value))}
                                style={{ width: 80, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, textAlign: 'right' }}
                              />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('shop.quantityLabel')} :</label>
                              <input
                                type="number"
                                min="1"
                                value={ligne.quantite}
                                onChange={e => handleModifierLigne(idx, 'quantite', Number(e.target.value))}
                                style={{ width: 55, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, textAlign: 'center' }}
                              />
                            </div>

                            <span style={{ minWidth: 85, textAlign: 'right', fontWeight: 900, color: '#0284c7', fontSize: 13 }}>
                              {fcfa(subtotal)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleSupprimerLigne(idx)}
                              style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Supprimer cette ligne"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notes et Conditions */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>{t('shop.notesTermsDocLabel')}</label>
                <textarea
                  value={noteDoc}
                  onChange={e => setNoteDoc(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, resize: 'vertical', boxSizing: 'border-box' }}
                  rows={2}
                  placeholder={t('shop.notesTermsDocPlaceholder')}
                />
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                  {t('shop.totalTtcColon')} <span style={{ color: '#0284c7' }}>{fcfa(totalTTC)}</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setModalOuvert(false)}
                    style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || lignesSelectionnees.length === 0}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 8,
                      background: lignesSelectionnees.length === 0 ? '#94a3b8' : '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      cursor: lignesSelectionnees.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: 13
                    }}
                  >
                    {isSubmitting ? t('shop.savingDocInProgress') : documentEnEdition ? t('shop.saveDocChangesBtn') : `${t('shop.createDocumentBtnTotal')} (${fcfa(totalTTC)})`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Scanner EAN Caméra ────────────────────────────────────── */}
      {modalScannerEan && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{t('shop.scanBarcodeModalTitle')}</h4>
              <button type="button" onClick={arreterScannerEan} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{scannerEanStatus}</p>

            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <div id="doc-ean-scanner-reader" style={{ width: '100%', height: '100%' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#475569' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={scanContinu}
                  onChange={e => setScanContinu(e.target.checked)}
                />
                {t('shop.scanContinuousDocCheckbox')}
              </label>
              <button
                type="button"
                onClick={arreterScannerEan}
                style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 800, cursor: 'pointer' }}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Scanner Nom OCR ────────────────────────────────────────── */}
      {modalScannerNom && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{t('shop.scanProductNameModalTitle')}</h4>
              <button type="button" onClick={arreterScannerNom} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 600 }}>{statusScannerNom}</p>

            <div style={{ width: '100%', height: 260, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <video
                ref={videoNomRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Cadre de ciblage central (ROI) */}
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '7.5%',
                width: '85%',
                height: '60%',
                border: '2px dashed #38bdf8',
                borderRadius: 8,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                  {t('shop.frameNameCenterDoc')}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={ocrLoading}
              onClick={capturerNomOCR}
              style={{
                width: '100%',
                padding: '12px',
                background: ocrLoading ? '#94a3b8' : '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 14,
                cursor: ocrLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {ocrLoading ? t('shop.ocrAnalyzingDoc') : t('shop.extractNameDocBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

