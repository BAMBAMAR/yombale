'use client'

import { useState, useRef, useCallback } from 'react'
import { CONFIG_SCANNER_EAN_PRO, capturerZoneViseurExacte, jouerBipEtVibrer } from '@/lib/scanner-helper'
import type { ProduitBoutique } from '../types'

interface UseCarnetScannersProps {
  produits: ProduitBoutique[]
  onAddProduitToPanier: (prodId: string) => void
  onAddCustomArticle: (libelle: string) => void
}

export function useCarnetScanners({
  produits,
  onAddProduitToPanier,
  onAddCustomArticle,
}: UseCarnetScannersProps) {
  const [modalScannerEanCredit, setModalScannerEanCredit] = useState(false)
  const [modalScannerNomCredit, setModalScannerNomCredit] = useState(false)
  const [scannerEanStatusCredit, setScannerEanStatusCredit] = useState('Prêt pour le scan')
  const [statusScannerNomCredit, setStatusScannerNomCredit] = useState('')
  const [ocrLoadingCredit, setOcrLoadingCredit] = useState(false)
  const [ocrDetectionsCredit, setOcrDetectionsCredit] = useState<string[]>([])
  const [imageFligeeCreditNom, setImageFligeeCreditNom] = useState<string | null>(null)
  const [scanContinuCredit, setScanContinuCredit] = useState(true)

  const html5ScannerCreditRef = useRef<any>(null)
  const dernierScanCreditRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })
  const videoNomCreditRef = useRef<HTMLVideoElement | null>(null)
  const streamNomCreditRef = useRef<MediaStream | null>(null)

  const arreterScannerEanCredit = useCallback(() => {
    if (html5ScannerCreditRef.current) {
      try {
        html5ScannerCreditRef.current.stop()
        html5ScannerCreditRef.current.clear()
      } catch (e) {
        console.warn('[Nopalou:useCarnetScanners:stopEan]', e)
      }
      html5ScannerCreditRef.current = null
    }
    setModalScannerEanCredit(false)
  }, [])

  const handleEanDetecteCredit = useCallback(
    (barcodeStr: string) => {
      const code = barcodeStr.trim().toLowerCase()
      const now = Date.now()

      if (
        scanContinuCredit &&
        dernierScanCreditRef.current.code === code &&
        now - dernierScanCreditRef.current.time < 1200
      ) {
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
        onAddProduitToPanier(prodTrouve.id)
        jouerBipEtVibrer('succes')
        setScannerEanStatusCredit(`+1 "${prodTrouve.nom}"`)
        if (!scanContinuCredit) {
          setTimeout(() => arreterScannerEanCredit(), 600)
        }
      } else {
        jouerBipEtVibrer('alerte')
        setScannerEanStatusCredit(`Code "${barcodeStr}" non répertorié.`)
        if (
          confirm(
            `Le code-barres "${barcodeStr}" n'existe pas dans le catalogue. L'ajouter en article libre ?`
          )
        ) {
          onAddCustomArticle(`Article EAN-${barcodeStr}`)
          arreterScannerEanCredit()
        }
      }
    },
    [arreterScannerEanCredit, onAddCustomArticle, onAddProduitToPanier, produits, scanContinuCredit]
  )

  const demarrerScannerEanCredit = useCallback(async () => {
    setModalScannerEanCredit(true)
    setScannerEanStatusCredit('Initialisation de la caméra...')
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('reader-ean-credit-carnet')
      html5ScannerCreditRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats) as any,
        (decodedText: string) => {
          handleEanDetecteCredit(decodedText)
        },
        () => {}
      )
      setScannerEanStatusCredit('Caméra active. Visez le code-barres.')
    } catch (err) {
      setScannerEanStatusCredit('Erreur accès caméra ou absence de permissions.')
    }
  }, [handleEanDetecteCredit])

  const demarrerScannerNomCredit = useCallback(async () => {
    setModalScannerNomCredit(true)
    setOcrDetectionsCredit([])
    setImageFligeeCreditNom(null)
    setStatusScannerNomCredit('Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamNomCreditRef.current = stream
      if (videoNomCreditRef.current) {
        videoNomCreditRef.current.srcObject = stream
        await videoNomCreditRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNomCredit('Impossible d’accéder à la caméra.')
    }
  }, [])

  const arreterScannerNomCredit = useCallback(() => {
    setImageFligeeCreditNom(null)
    if (streamNomCreditRef.current) {
      streamNomCreditRef.current.getTracks().forEach((t) => t.stop())
      streamNomCreditRef.current = null
    }
    setModalScannerNomCredit(false)
  }, [])

  const capturerNomOCRCredit = useCallback(async () => {
    if (!videoNomCreditRef.current) return
    setOcrLoadingCredit(true)
    setStatusScannerNomCredit('Analyse OCR en cours…')
    const imageBase64 = capturerZoneViseurExacte(videoNomCreditRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.9,
      boxHeightRatio: 0.7,
    })
    if (!imageBase64) {
      setOcrLoadingCredit(false)
      setStatusScannerNomCredit('Échec de la capture.')
      return
    }

    setImageFligeeCreditNom(imageBase64)

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      })
      const data = await res.json()
      setOcrLoadingCredit(false)
      if (data.ok && data.nom) {
        onAddCustomArticle(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetectionsCredit(data.detections)
        }
        jouerBipEtVibrer('succes')
        setStatusScannerNomCredit(`Nom capturé : "${data.nom}"`)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerNomCredit(`${data.error || 'Aucun nom lisible détecté.'}`)
      }
    } catch (err) {
      setOcrLoadingCredit(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerNomCredit('Erreur de lecture OCR. Réessayez.')
    }
  }, [onAddCustomArticle])

  return {
    modalScannerEanCredit,
    setModalScannerEanCredit,
    modalScannerNomCredit,
    setModalScannerNomCredit,
    scannerEanStatusCredit,
    statusScannerNomCredit,
    ocrLoadingCredit,
    ocrDetectionsCredit,
    imageFligeeCreditNom,
    scanContinuCredit,
    setScanContinuCredit,
    videoNomCreditRef,
    demarrerScannerEanCredit,
    arreterScannerEanCredit,
    demarrerScannerNomCredit,
    arreterScannerNomCredit,
    capturerNomOCRCredit,
  }
}
