'use client'

import { useState, useRef } from 'react'
import { CONFIG_SCANNER_EAN_PRO, capturerZoneViseurExacte, jouerBipEtVibrer } from '@/lib/scanner-helper'
import type { LigneCommandeForm } from './types'

export function useFournisseursScanners({
  produits,
  cmdLignes,
  setCmdLignes,
}: {
  produits: any[]
  cmdLignes: LigneCommandeForm[]
  setCmdLignes: React.Dispatch<React.SetStateAction<LigneCommandeForm[]>>
}) {
  // EAN Scanner
  const [modalScannerEanCmd, setModalScannerEanCmd] = useState(false)
  const [scannerEanStatusCmd, setScannerEanStatusCmd] = useState('Initialisation...')
  const html5ScannerCmdRef = useRef<any>(null)
  const dernierScanFouRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })

  // OCR Name Scanner
  const [modalScannerNomCmd, setModalScannerNomCmd] = useState(false)
  const [statusScannerNomCmd, setStatusScannerNomCmd] = useState('')
  const [ocrLoadingCmd, setOcrLoadingCmd] = useState(false)
  const [idxLigneScanNom, setIdxLigneScanNom] = useState<number | null>(null)
  const [imageFligeeFournisseurNom, setImageFligeeFournisseurNom] = useState<string | null>(null)
  const videoNomCmdRef = useRef<HTMLVideoElement | null>(null)
  const streamNomCmdRef = useRef<MediaStream | null>(null)

  const arreterScannerEanCmd = () => {
    if (html5ScannerCmdRef.current) {
      try {
        html5ScannerCmdRef.current.stop()
        html5ScannerCmdRef.current.clear()
      } catch (e) {
        console.warn('[Nopalou:arreterScannerEanCmd]', e)
      }
      html5ScannerCmdRef.current = null
    }
    setModalScannerEanCmd(false)
  }

  const demarrerScannerEanCmd = async () => {
    setModalScannerEanCmd(true)
    setScannerEanStatusCmd('Scanner EAN prêt (Mode Continu)…')
    dernierScanFouRef.current = { code: '', time: 0 }

    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (html5ScannerCmdRef.current) {
          try {
            await html5ScannerCmdRef.current.stop()
            html5ScannerCmdRef.current.clear()
          } catch (e) {
            console.warn('[Nopalou:demarrerScannerEanCmd]', e)
          }
          html5ScannerCmdRef.current = null
        }
        const container = document.getElementById('fou-ean-scanner-reader')
        if (!container) return
        const scanner = new Html5Qrcode('fou-ean-scanner-reader')
        html5ScannerCmdRef.current = scanner
        const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })
        const onScanSuccess = (decodedText: string) => {
          const code = decodedText.trim().toLowerCase()
          const now = Date.now()

          if (dernierScanFouRef.current.code === code && now - dernierScanFouRef.current.time < 1200) {
            return
          }
          dernierScanFouRef.current = { code, time: now }

          const prodTrouve = produits.find(
            (p: any) =>
              p.barcode?.trim().toLowerCase() === code ||
              p.sku?.trim().toLowerCase() === code ||
              p.id?.trim().toLowerCase() === code ||
              p.code_barre?.trim().toLowerCase() === code
          )
          if (prodTrouve) {
            setCmdLignes((prev) => {
              const existIdx = prev.findIndex((l) => l.produitId === prodTrouve.id)
              if (existIdx >= 0) {
                const copy = [...prev]
                copy[existIdx].quantite += 1
                return copy
              }
              return [...prev, { produitId: prodTrouve.id, quantite: 1, prixAchat: Number(prodTrouve.prix || 0) }]
            })
            jouerBipEtVibrer('succes')
            setScannerEanStatusCmd(`+1 "${prodTrouve.nom}"`)
          } else {
            jouerBipEtVibrer('alerte')
            setScannerEanStatusCmd(`Code "${decodedText}" non trouvé.`)
            if (confirm(`Code "${decodedText}" inconnu dans le catalogue. Ajouter en article libre ?`)) {
              setCmdLignes((prev) => [
                ...prev,
                { produitId: 'custom', nomLibre: `Article EAN-${decodedText}`, quantite: 1, prixAchat: 0 },
              ])
              arreterScannerEanCmd()
            }
          }
        }
        try {
          await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          setScannerEanStatusCmd('Caméra active ! Placez le code-barres dans le cadre.')
        } catch {
          try {
            await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
            setScannerEanStatusCmd('Caméra active ! Placez le code-barres dans le cadre.')
          } catch {
            setScannerEanStatusCmd('Impossible d’accéder à la caméra.')
          }
        }
      } catch {
        setScannerEanStatusCmd('Impossible d’accéder à la caméra.')
      }
    }, 200)
  }

  const demarrerScannerNomCmd = async (ligneIdx: number) => {
    setIdxLigneScanNom(ligneIdx)
    setModalScannerNomCmd(true)
    setImageFligeeFournisseurNom(null)
    setStatusScannerNomCmd('Cadrez le nom sur l’emballage…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamNomCmdRef.current = stream
      if (videoNomCmdRef.current) {
        videoNomCmdRef.current.srcObject = stream
        await videoNomCmdRef.current.play().catch(() => {})
      }
    } catch {
      setStatusScannerNomCmd('Impossible d’accéder à la caméra.')
    }
  }

  const arreterScannerNomCmd = () => {
    setImageFligeeFournisseurNom(null)
    if (streamNomCmdRef.current) {
      streamNomCmdRef.current.getTracks().forEach((t) => t.stop())
      streamNomCmdRef.current = null
    }
    setModalScannerNomCmd(false)
  }

  const capturerNomOCRCmd = async () => {
    if (!videoNomCmdRef.current) return
    setOcrLoadingCmd(true)
    setStatusScannerNomCmd('Analyse OCR en cours…')
    const imageBase64 = capturerZoneViseurExacte(videoNomCmdRef.current, {
      boxTopRatio: 0.15,
      boxLeftRatio: 0.05,
      boxWidthRatio: 0.9,
      boxHeightRatio: 0.7,
    })
    if (!imageBase64) {
      setOcrLoadingCmd(false)
      setStatusScannerNomCmd('Échec de la capture.')
      return
    }

    setImageFligeeFournisseurNom(imageBase64)

    try {
      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      })
      const data = await res.json()
      setOcrLoadingCmd(false)
      if (data.ok && data.nom) {
        if (idxLigneScanNom !== null) {
          setCmdLignes((prev) =>
            prev.map((l, i) => (i === idxLigneScanNom ? { ...l, nomLibre: data.nom } : l))
          )
        }
        jouerBipEtVibrer('succes')
        setStatusScannerNomCmd(`Nom capturé : "${data.nom}"`)
      } else {
        jouerBipEtVibrer('alerte')
        setStatusScannerNomCmd(`${data.error || 'Aucun nom lisible détecté.'}`)
      }
    } catch {
      setOcrLoadingCmd(false)
      jouerBipEtVibrer('alerte')
      setStatusScannerNomCmd('Erreur de lecture OCR. Réessayez.')
    }
  }

  return {
    modalScannerEanCmd,
    scannerEanStatusCmd,
    demarrerScannerEanCmd,
    arreterScannerEanCmd,
    modalScannerNomCmd,
    statusScannerNomCmd,
    ocrLoadingCmd,
    imageFligeeFournisseurNom,
    videoNomCmdRef,
    demarrerScannerNomCmd,
    arreterScannerNomCmd,
    capturerNomOCRCmd,
  }
}
