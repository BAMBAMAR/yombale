'use client'

import { useState, useRef } from 'react'
import { Produit } from '../types'
import { fcfa } from '../utils'
import { CONFIG_SCANNER_EAN_PRO, capturerZoneViseurExacte, jouerBipEtVibrer } from '@/lib/scanner-helper'

interface UseComptaSaisieScannersProps {
  produits: Produit[]
  handleAjouterProduitCatalogue: (p: any, delta?: number) => void
  setLibelleCustomInput: (v: string) => void
  setModeSaisie: (s: 'catalogue' | 'libre') => void
}

export function useComptaSaisieScanners({
  produits,
  handleAjouterProduitCatalogue,
  setLibelleCustomInput,
  setModeSaisie,
}: UseComptaSaisieScannersProps) {
  // Scanner EAN Caméra
  const [modalScannerEan, setModalScannerEan] = useState(false)
  const [scannerEanStatus, setScannerEanStatus] = useState('Initialisation du scanner EAN…')
  const [scanContinu, setScanContinu] = useState(true)
  const html5ScannerRef = useRef<any>(null)

  // Scanner Nom OCR Caméra
  const [modalScannerNom, setModalScannerNom] = useState(false)
  const videoNomRef = useRef<HTMLVideoElement | null>(null)
  const streamNomRef = useRef<MediaStream | null>(null)
  const [ocrDetections, setOcrDetections] = useState<string[]>([])
  const [statusScannerNom, setStatusScannerNom] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)

  const [imageFligeeComptaNom, setImageFligeeComptaNom] = useState<string | null>(null)
  const dernierScanComptaRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })

  // ── Scanner EAN Caméra ──
  const demarrerScannerEan = async () => {
    setModalScannerEan(true)
    setScannerEanStatus('Scanner EAN prêt (Mode Continu)…')
    dernierScanComptaRef.current = { code: '', time: 0 }

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerRef.current) {
          try {
            await html5ScannerRef.current.stop()
            html5ScannerRef.current.clear()
          } catch (e) { console.warn('[Nopalou:ComptaSaisieExpress:EanScan]', e) }
          html5ScannerRef.current = null
        }

        const container = document.getElementById('compta-ean-scanner-reader')
        if (!container) return

        const scanner = new Html5Qrcode('compta-ean-scanner-reader')
        html5ScannerRef.current = scanner

        const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })

        const onScanSuccess = (decodedText: string) => {
          const code = decodedText.trim().toLowerCase()
          const now = Date.now()

          if (scanContinu && dernierScanComptaRef.current.code === code && (now - dernierScanComptaRef.current.time < 1200)) {
            return
          }
          dernierScanComptaRef.current = { code, time: now }

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
            setScannerEanStatus(`+1 "${prodTrouve.nom}" (${fcfa(prodTrouve.prix_promo || prodTrouve.prix || 0)})`)
            if (!scanContinu) {
              setTimeout(() => arreterScannerEan(), 600)
            }
          } else {
            jouerBipEtVibrer('alerte')
            setScannerEanStatus(`Code "${decodedText}" inconnu dans le catalogue.`)
            if (confirm(`Code-barres "${decodedText}" non trouvé. L'ajouter comme article libre ?`)) {
              setLibelleCustomInput(`Article EAN-${decodedText}`)
              setModeSaisie('libre')
              arreterScannerEan()
            }
          }
        }

        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatus('Caméra active ! Placez le code-barres dans le cadre.')
        } catch (errEnv) {
          try {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
            setScannerEanStatus('Caméra active ! Placez le code-barres dans le cadre.')
          } catch (errUser) {
            setScannerEanStatus('Impossible d’accéder à la caméra.')
          }
        }
      } catch (err) {
        setScannerEanStatus('Impossible d’accéder à la caméra.')
      }
    }, 200)
  }

  const arreterScannerEan = () => {
    if (html5ScannerRef.current) {
      try {
        html5ScannerRef.current.stop()
        html5ScannerRef.current.clear()
      } catch (e) { console.warn('[Nopalou:ComptaSaisieExpress:EanStop]', e) }
      html5ScannerRef.current = null
    }
    setModalScannerEan(false)
  }

  // ── Scanner Nom OCR Caméra ──
  const demarrerScannerNom = async () => {
    setModalScannerNom(true)
    setOcrDetections([])
    setImageFligeeComptaNom(null)
    setStatusScannerNom('Cadrez le nom sur l’emballage du produit…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamNomRef.current = stream
      if (videoNomRef.current) {
        videoNomRef.current.srcObject = stream
        await videoNomRef.current.play().catch(() => {})
      }
    } catch (e) {
      setStatusScannerNom('Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerNom = () => {
    setImageFligeeComptaNom(null)
    if (streamNomRef.current) {
      streamNomRef.current.getTracks().forEach(t => t.stop())
      streamNomRef.current = null
    }
    setModalScannerNom(false)
  }

  const capturerNomOCR = async () => {
    if (!videoNomRef.current) return
    setOcrLoading(true)
    setStatusScannerNom('Analyse OCR en cours…')

    const imageBase64 = capturerZoneViseurExacte(videoNomRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.90,
      boxHeightRatio: 0.70
    })

    if (!imageBase64) {
      setOcrLoading(false)
      setStatusScannerNom('Échec de la capture d’image.')
      return
    }

    setImageFligeeComptaNom(imageBase64)

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      const data = await res.json()
      setOcrLoading(false)

      if (data.ok && data.nom) {
        setLibelleCustomInput(data.nom)
        if (data.detections && data.detections.length > 0) {
          setOcrDetections(data.detections)
        }
        jouerBipEtVibrer('succes')
        setStatusScannerNom(`Nom capturé : "${data.nom}"`)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerNom(`${data.error || 'Aucun texte lisible détecté. Réessayez.'}`)
      }
    } catch (err) {
      setOcrLoading(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerNom('Erreur de lecture OCR. Réessayez.')
    }
  }

  return {
    modalScannerEan,
    scannerEanStatus,
    scanContinu,
    setScanContinu,
    demarrerScannerEan,
    arreterScannerEan,
    modalScannerNom,
    statusScannerNom,
    imageFligeeComptaNom,
    ocrLoading,
    ocrDetections,
    videoNomRef,
    demarrerScannerNom,
    arreterScannerNom,
    capturerNomOCR,
  }
}
