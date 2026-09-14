'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { CONFIG_SCANNER_EAN_PRO, capturerZoneViseurExacte, jouerBipEtVibrer } from '@/lib/scanner-helper'
import { fcfa } from '@/lib/format'
import { creerBoutiqueDocument, modifierBoutiqueDocument } from '../actions'
import type { LigneDocument, DocumentBoutique } from './types'

export function useGestionDocumentsModal({
  boutiqueId,
  produits,
  chargerDonnees,
  afficherToast,
}: {
  boutiqueId: string
  produits: any[]
  chargerDonnees: () => Promise<void>
  afficherToast: (msg: string) => void
}) {
  const [modalOuvert, setModalOuvert] = useState<boolean>(false)
  const [documentEnEdition, setDocumentEnEdition] = useState<DocumentBoutique | null>(null)
  const [typeDoc, setTypeDoc] = useState<'facture' | 'devis' | 'proforma'>('facture')
  const [clientIdSelected, setClientIdSelected] = useState<string>('')
  const [statutDoc, setStatutDoc] = useState<'brouillon' | 'valide' | 'paye'>('brouillon')
  const [noteDoc, setNoteDoc] = useState<string>('')
  const [lignesSelectionnees, setLignesSelectionnees] = useState<LigneDocument[]>([])

  const [modeAjout, setModeAjout] = useState<'catalogue' | 'libre' | 'scan'>('catalogue')
  const [rechercheProduitModal, setRechercheProduitModal] = useState<string>('')
  const [categorieProduitModal, setCategorieProduitModal] = useState<string>('tous')

  const [libelleLibreInput, setLibelleLibreInput] = useState<string>('')
  const [prixLibreInput, setPrixLibreInput] = useState<string>('')
  const [qteLibreInput, setQteLibreInput] = useState<number>(1)
  const [ocrDetections, setOcrDetections] = useState<string[]>([])

  const [modalScannerEan, setModalScannerEan] = useState<boolean>(false)
  const [scannerEanStatus, setScannerEanStatus] = useState<string>('Initialisation du scanner EAN…')
  const [scanContinu, setScanContinu] = useState<boolean>(true)
  const html5ScannerRef = useRef<any>(null)
  const dernierScanDocRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })

  const [modalScannerNom, setModalScannerNom] = useState<boolean>(false)
  const [statusScannerNom, setStatusScannerNom] = useState<string>('')
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)
  const [imageFligeeDocNom, setImageFligeeDocNom] = useState<string | null>(null)
  const videoNomRef = useRef<HTMLVideoElement | null>(null)
  const streamNomRef = useRef<MediaStream | null>(null)

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const resetForm = useCallback(() => {
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
  }, [])

  const handleAjouterProduitCatalogue = useCallback(
    (prod: any, delta = 1) => {
      setLignesSelectionnees((prev) => {
        const existantIdx = prev.findIndex((l) => l.produitId === prod.id)
        const prixUnitaire = Number(prod.prix_promo || prod.prix || 0)

        if (existantIdx >= 0) {
          const copy = [...prev]
          const nouvelleQte = copy[existantIdx].quantite + delta
          if (nouvelleQte <= 0) {
            return copy.filter((_, i) => i !== existantIdx)
          }
          copy[existantIdx] = {
            ...copy[existantIdx],
            quantite: nouvelleQte,
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
              stock: prod.stock_quantite ?? prod.quantite_stock,
            },
          ]
        }
        return prev
      })
      jouerBipEtVibrer('succes')
      afficherToast(`${prod.nom} ajouté`)
    },
    [afficherToast]
  )

  const handleDiminuerProduitCatalogue = useCallback((prodId: string) => {
    setLignesSelectionnees((prev) => {
      const idx = prev.findIndex((l) => l.produitId === prodId)
      if (idx < 0) return prev
      const copy = [...prev]
      if (copy[idx].quantite > 1) {
        copy[idx] = { ...copy[idx], quantite: copy[idx].quantite - 1 }
        return copy
      } else {
        return copy.filter((_, i) => i !== idx)
      }
    })
  }, [])

  const handleAjouterLigneLibre = useCallback(() => {
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

    setLignesSelectionnees((prev) => [
      ...prev,
      {
        produitId: 'custom',
        nom: libelle,
        quantite: qte,
        prix: prix,
      },
    ])

    jouerBipEtVibrer('succes')
    afficherToast(`Article libre "${libelle}" ajouté`)
    setLibelleLibreInput('')
    setPrixLibreInput('')
    setQteLibreInput(1)
  }, [libelleLibreInput, prixLibreInput, qteLibreInput, afficherToast])

  const handleModifierLigne = useCallback((index: number, champ: keyof LigneDocument, valeur: any) => {
    setLignesSelectionnees((prev) =>
      prev.map((l, i) => {
        if (i === index) {
          return { ...l, [champ]: valeur }
        }
        return l
      })
    )
  }, [])

  const handleSupprimerLigne = useCallback((index: number) => {
    setLignesSelectionnees((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleViderPanier = useCallback(() => {
    if (lignesSelectionnees.length === 0) return
    if (confirm('Voulez-vous vraiment vider tous les articles du document ?')) {
      setLignesSelectionnees([])
    }
  }, [lignesSelectionnees.length])

  const arreterScannerEan = useCallback(() => {
    if (html5ScannerRef.current) {
      try {
        html5ScannerRef.current.stop()
        html5ScannerRef.current.clear()
      } catch (e) {
        console.warn('[Nopalou:GestionDocuments:L276]', e)
      }
      html5ScannerRef.current = null
    }
    setModalScannerEan(false)
  }, [])

  const handleEanDetecte = useCallback(
    (barcodeStr: string) => {
      const code = barcodeStr.trim().toLowerCase()
      const now = Date.now()

      if (scanContinu && dernierScanDocRef.current.code === code && now - dernierScanDocRef.current.time < 1200) {
        return
      }
      dernierScanDocRef.current = { code, time: now }

      const prodTrouve = produits.find(
        (p: any) =>
          p.barcode?.trim().toLowerCase() === code ||
          p.sku?.trim().toLowerCase() === code ||
          p.id?.trim().toLowerCase() === code ||
          p.code_barre?.trim().toLowerCase() === code
      )

      if (prodTrouve) {
        handleAjouterProduitCatalogue(prodTrouve, 1)
        jouerBipEtVibrer('succes')
        setScannerEanStatus(`+1 "${prodTrouve.nom}" (${fcfa(prodTrouve.prix_promo || prodTrouve.prix)})`)
        if (!scanContinu) {
          setTimeout(() => arreterScannerEan(), 600)
        }
      } else {
        jouerBipEtVibrer('alerte')
        setScannerEanStatus(`Code "${barcodeStr}" inconnu dans le catalogue.`)
        if (
          confirm(
            `Le code-barres "${barcodeStr}" n'existe pas dans votre catalogue. Voulez-vous l'ajouter comme article libre ?`
          )
        ) {
          setLibelleLibreInput(`Article EAN-${barcodeStr}`)
          setModeAjout('libre')
          arreterScannerEan()
        }
      }
    },
    [scanContinu, produits, handleAjouterProduitCatalogue, arreterScannerEan]
  )

  const demarrerScannerEan = useCallback(async () => {
    setModalScannerEan(true)
    setScannerEanStatus('Scanner EAN prêt (Mode Continu)…')
    dernierScanDocRef.current = { code: '', time: 0 }

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerRef.current) {
          try {
            await html5ScannerRef.current.stop()
            html5ScannerRef.current.clear()
          } catch (e) {
            console.warn('[Nopalou:GestionDocuments:L238]', e)
          }
          html5ScannerRef.current = null
        }

        const container = document.getElementById('doc-ean-scanner-reader')
        if (!container) return

        const scanner = new Html5Qrcode('doc-ean-scanner-reader')
        html5ScannerRef.current = scanner

        const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })

        const onScanSuccess = (decodedText: string) => {
          handleEanDetecte(decodedText)
        }

        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatus('Caméra active ! Placez le code-barres (EAN) dans le cadre.')
        } catch {
          try {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
            setScannerEanStatus('Caméra active ! Placez le code-barres dans le cadre.')
          } catch {
            setScannerEanStatus('Impossible d’accéder à la caméra.')
          }
        }
      } catch {
        setScannerEanStatus('Impossible d’accéder à la caméra.')
      }
    }, 200)
  }, [handleEanDetecte])

  const demarrerScannerNom = useCallback(async () => {
    setModalScannerNom(true)
    setOcrDetections([])
    setImageFligeeDocNom(null)
    setStatusScannerNom('Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamNomRef.current = stream
      if (videoNomRef.current) {
        videoNomRef.current.srcObject = stream
        await videoNomRef.current.play().catch(() => {})
      }
    } catch {
      setStatusScannerNom('Impossible d’accéder à la caméra.')
    }
  }, [])

  const arreterScannerNom = useCallback(() => {
    setImageFligeeDocNom(null)
    if (streamNomRef.current) {
      streamNomRef.current.getTracks().forEach((t) => t.stop())
      streamNomRef.current = null
    }
    setModalScannerNom(false)
  }, [])

  const capturerNomOCR = useCallback(async () => {
    if (!videoNomRef.current) return
    setOcrLoading(true)
    setStatusScannerNom('Analyse OCR en cours…')

    const imageBase64 = capturerZoneViseurExacte(videoNomRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.9,
      boxHeightRatio: 0.7,
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setStatusScannerNom('Échec de la capture d’image.')
      return
    }

    setImageFligeeDocNom(imageBase64)

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      })
      const data = await res.json()
      setOcrLoading(false)

      if (data.ok && data.nom) {
        setLibelleLibreInput(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetections(data.detections)
        }
        jouerBipEtVibrer('succes')
        setStatusScannerNom(`Nom capturé : "${data.nom}"`)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerNom(
          `${data.error || 'Aucun nom lisible détecté. Réessayez avec un meilleur éclairage.'}`
        )
      }
    } catch {
      setOcrLoading(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerNom('Erreur de lecture OCR. Réessayez.')
    }
  }, [])

  const handleOuvrirEdition = useCallback(
    (doc: DocumentBoutique) => {
      setDocumentEnEdition(doc)
      setTypeDoc(doc.type)
      setClientIdSelected(doc.client_id || '')
      setStatutDoc(doc.statut as any)
      setNoteDoc(doc.notes || '')

      const parsedItems = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items
      const lines: LigneDocument[] = (parsedItems || []).map((item: any) => {
        let pId = item.id || item.produit_id || item.produitId || ''
        let prodObj = produits.find((p) => p.id === pId)
        if (!prodObj && item.nom && produits.length > 0) {
          prodObj = produits.find((p) => p.nom?.toLowerCase() === item.nom?.toLowerCase())
          if (prodObj) pId = prodObj.id
          else pId = 'custom'
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
          stock: prodObj?.stock_quantite ?? prodObj?.quantite_stock,
        }
      })
      setLignesSelectionnees(lines)
      setModalOuvert(true)
    },
    [produits]
  )

  const handleSoumettreDocument = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (lignesSelectionnees.length === 0) {
        alert('Veuillez ajouter au moins un produit ou article au document.')
        return
      }

      try {
        setIsSubmitting(true)
        const itemsFormates = lignesSelectionnees.map((l) => {
          const prodObj = produits.find((p) => p.id === l.produitId)
          const nomFinal = l.nom?.trim() || (prodObj ? prodObj.nom : 'Article / Prestation')
          return {
            id: l.produitId && l.produitId !== 'custom' ? l.produitId : null,
            nom: nomFinal,
            quantite: Number(l.quantite || 1),
            prix: Number(l.prix || 0),
          }
        })

        const payload = {
          type: typeDoc,
          client_id: clientIdSelected || null,
          statut: statutDoc,
          notes: noteDoc,
          items: itemsFormates,
        }

        if (documentEnEdition) {
          const res = await modifierBoutiqueDocument(boutiqueId, documentEnEdition.id, payload)
          if (res.error) {
            alert(res.error)
          } else {
            alert(`Document ${documentEnEdition.reference} modifié avec succès !`)
            setModalOuvert(false)
            resetForm()
            await chargerDonnees()
          }
        } else {
          const res = await creerBoutiqueDocument(boutiqueId, payload)
          if (res.error) {
            alert(res.error)
          } else {
            alert(`Document ${res.reference} créé avec succès !`)
            setModalOuvert(false)
            resetForm()
            await chargerDonnees()
          }
        }
      } catch (err) {
        console.error('Erreur soumission document:', err)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      lignesSelectionnees,
      produits,
      typeDoc,
      clientIdSelected,
      statutDoc,
      noteDoc,
      documentEnEdition,
      boutiqueId,
      resetForm,
      chargerDonnees,
    ]
  )

  const categoriesCatalogue = useMemo(() => {
    return Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
  }, [produits])

  const produitsFiltresModal = useMemo(() => {
    const qModal = rechercheProduitModal.trim().toLowerCase()
    return produits.filter((p: any) => {
      const matchCat = categorieProduitModal === 'tous' || p.categorie === categorieProduitModal
      const matchText =
        !qModal ||
        p.nom?.toLowerCase().includes(qModal) ||
        p.categorie?.toLowerCase().includes(qModal) ||
        p.barcode?.toLowerCase().includes(qModal) ||
        p.sku?.toLowerCase().includes(qModal)
      return matchCat && matchText
    })
  }, [produits, rechercheProduitModal, categorieProduitModal])

  const totalArticles = useMemo(() => {
    return lignesSelectionnees.reduce((acc, l) => acc + (Number(l.quantite) || 0), 0)
  }, [lignesSelectionnees])

  const totalTTC = useMemo(() => {
    return lignesSelectionnees.reduce(
      (acc, l) => acc + (Number(l.quantite) || 0) * (Number(l.prix) || 0),
      0
    )
  }, [lignesSelectionnees])

  return {
    modalOuvert,
    setModalOuvert,
    documentEnEdition,
    setDocumentEnEdition,
    typeDoc,
    setTypeDoc,
    clientIdSelected,
    setClientIdSelected,
    statutDoc,
    setStatutDoc,
    noteDoc,
    setNoteDoc,
    lignesSelectionnees,
    modeAjout,
    setModeAjout,
    rechercheProduitModal,
    setRechercheProduitModal,
    categorieProduitModal,
    setCategorieProduitModal,
    categoriesCatalogue,
    produitsFiltresModal,
    libelleLibreInput,
    setLibelleLibreInput,
    prixLibreInput,
    setPrixLibreInput,
    qteLibreInput,
    setQteLibreInput,
    ocrDetections,
    isSubmitting,
    totalArticles,
    totalTTC,
    modalScannerEan,
    scannerEanStatus,
    scanContinu,
    setScanContinu,
    demarrerScannerEan,
    arreterScannerEan,
    modalScannerNom,
    statusScannerNom,
    ocrLoading,
    imageFligeeDocNom,
    videoNomRef,
    demarrerScannerNom,
    arreterScannerNom,
    capturerNomOCR,
    resetForm,
    handleOuvrirEdition,
    handleAjouterProduitCatalogue,
    handleDiminuerProduitCatalogue,
    handleAjouterLigneLibre,
    handleModifierLigne,
    handleSupprimerLigne,
    handleViderPanier,
    handleSoumettreDocument,
  }
}
