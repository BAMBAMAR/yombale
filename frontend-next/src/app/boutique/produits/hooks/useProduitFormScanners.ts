'use client'

import { useState, useRef } from 'react'
import { fcfa } from '@/lib/format'
import {
  CONFIG_SCANNER_EAN_PRO,
  capturerZoneViseurExacte,
  jouerBipEtVibrer,
  rechercherInfosProduitEan,
} from '@/lib/scanner-helper'
import {
  createVoiceListener,
  parseAjoutProduitIntent,
  demanderPermissionMicrophone,
  getMessageErreurMicro,
} from '@/lib/voice-assistant'

interface UseProduitFormScannersProps {
  nomForm: string
  setNomForm: (nom: string) => void
  setPrixForm: (prix: string) => void
  setCodeBarreForm: (code: string) => void
}

export function useProduitFormScanners({
  nomForm,
  setNomForm,
  setPrixForm,
  setCodeBarreForm,
}: UseProduitFormScannersProps) {
  // Assistant Vocal Ajout Produit (Wolof & Français)
  const [isListeningNom, setIsListeningNom] = useState<boolean>(false)
  const [voiceNomFeedback, setVoiceNomFeedback] = useState<string | null>(null)
  const voiceNomRecognitionRef = useRef<any>(null)

  const demarrerEcouteVocaleNom = async () => {
    if (isListeningNom) {
      try {
        voiceNomRecognitionRef.current?.stop()
      } catch (err) {
        console.warn('[Nopalou:ProduitForm]', err)
      }
      setIsListeningNom(false)
      return
    }

    setVoiceNomFeedback(null)

    const perm = await demanderPermissionMicrophone()
    if (!perm.ok) {
      setIsListeningNom(false)
      setVoiceNomFeedback(getMessageErreurMicro(perm.error || 'not-allowed'))
      return
    }

    const rec = createVoiceListener({
      lang: 'fr-FR',
      onStart: () => setIsListeningNom(true),
      onEnd: () => setIsListeningNom(false),
      onError: err => {
        setIsListeningNom(false)
        setVoiceNomFeedback(getMessageErreurMicro(err))
      },
      onResult: transcript => {
        setIsListeningNom(false)
        const parsed = parseAjoutProduitIntent(transcript)
        if (parsed.nom) {
          setNomForm(parsed.nom)
        }
        if (parsed.prix !== null && parsed.prix > 0) {
          setPrixForm(String(parsed.prix))
          setVoiceNomFeedback(`Dictée réussie : "${parsed.nom}" · Prix : ${fcfa(parsed.prix)}`)
        } else {
          setVoiceNomFeedback(`Nom dicté : "${parsed.nom}"`)
        }
        jouerBipEtVibrer('succes')
      },
    })

    if (rec) {
      voiceNomRecognitionRef.current = rec
      try {
        rec.start()
      } catch (e: any) {
        setIsListeningNom(false)
        setVoiceNomFeedback(getMessageErreurMicro(e?.name || 'not-allowed'))
      }
    } else {
      setVoiceNomFeedback('Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome, Edge ou Safari.')
    }
  }

  // Scanner Caméra & OCR
  const [modalFormScanner, setModalFormScanner] = useState<boolean>(false)
  const [scannerTarget, setScannerTarget] = useState<'nom' | 'ean'>('nom')
  const [scannerStatus, setScannerStatus] = useState<string>('Initialisation de la caméra...')
  const [ocrDetections, setOcrDetections] = useState<string[]>([])
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)
  const [imageFligeeNom, setImageFligeeNom] = useState<string | null>(null)

  const videoFormRef = useRef<HTMLVideoElement | null>(null)
  const streamFormRef = useRef<MediaStream | null>(null)
  const html5ScannerFormRef = useRef<any>(null)

  function genererCodeBarreForm() {
    const prefixe = '200'
    const corps = Math.floor(100000000 + Math.random() * 900000000).toString()
    const base12 = prefixe + corps
    let somme = 0
    for (let i = 0; i < 12; i++) {
      const val = parseInt(base12[i], 10)
      somme += i % 2 === 0 ? val : val * 3
    }
    const check = (10 - (somme % 10)) % 10
    setCodeBarreForm(base12 + check)
  }

  function arreterFormScanner() {
    if (streamFormRef.current) {
      streamFormRef.current.getTracks().forEach(t => t.stop())
      streamFormRef.current = null
    }
    if (html5ScannerFormRef.current) {
      try {
        html5ScannerFormRef.current.stop()
        html5ScannerFormRef.current.clear()
      } catch (e) {
        console.warn('[Nopalou:ScannerStop]', e)
      }
      html5ScannerFormRef.current = null
    }
    setModalFormScanner(false)
    setImageFligeeNom(null)
  }

  async function demarrerFormScanner(target: 'nom' | 'ean' = 'nom') {
    setScannerTarget(target)
    setModalFormScanner(true)
    setOcrDetections([])
    setOcrLoading(false)
    setImageFligeeNom(null)
    setScannerStatus(
      target === 'nom' ? 'Cadrez le nom sur l’emballage puis cliquez sur Capturer' : 'Placez le code-barres dans le cadre...'
    )

    if (target === 'nom') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        })
        streamFormRef.current = stream
        if (videoFormRef.current) {
          videoFormRef.current.srcObject = stream
          await videoFormRef.current.play().catch(() => {})
        }
      } catch {
        setScannerStatus('Impossible d’accéder à la caméra. Vérifiez les permissions.')
      }
    } else {
      setTimeout(async () => {
        try {
          const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
          if (html5ScannerFormRef.current) {
            try {
              await html5ScannerFormRef.current.stop()
              html5ScannerFormRef.current.clear()
            } catch (e) {
              console.warn('[Nopalou:ScannerClear]', e)
            }
            html5ScannerFormRef.current = null
          }

          const container = document.getElementById('produit-form-scanner-reader')
          if (!container) return

          const scanner = new Html5Qrcode('produit-form-scanner-reader')
          html5ScannerFormRef.current = scanner

          const config = CONFIG_SCANNER_EAN_PRO(Html5QrcodeSupportedFormats, { fps: 24 })

          const onScanSuccess = async (decodedText: string) => {
            const cleanCode = decodedText.trim()
            setCodeBarreForm(cleanCode)
            jouerBipEtVibrer('succes')
            setScannerStatus(`Code scanné : ${cleanCode} — Recherche produit…`)

            const info = await rechercherInfosProduitEan(cleanCode)
            if (info && info.nom) {
              if (!nomForm || nomForm.trim() === '') {
                setNomForm(info.nom)
              }
              setScannerStatus(`Produit reconnu : "${info.nom}"`)
            } else {
              setScannerStatus(`Code validé : ${cleanCode}`)
            }

            setTimeout(() => {
              arreterFormScanner()
            }, 800)
          }

          try {
            await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {})
          } catch {
            try {
              await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {}).catch(() => {})
            } catch (e) {
              console.warn('[Nopalou:ScannerUserMode]', e)
            }
          }
        } catch {
          setScannerStatus('Erreur d’initialisation du scanner.')
        }
      }, 250)
    }
  }

  async function capturerEtLireNomTexte() {
    if (!videoFormRef.current) return
    setOcrLoading(true)
    setScannerStatus('Analyse OCR en cours…')

    try {
      const imageBase64 = capturerZoneViseurExacte(videoFormRef.current, {
        boxTopRatio: 0.15,
        boxLeftRatio: 0.05,
        boxWidthRatio: 0.9,
        boxHeightRatio: 0.7,
      })

      if (!imageBase64) {
        setOcrLoading(false)
        setScannerStatus('Impossible de capturer l\'image')
        return
      }

      setImageFligeeNom(imageBase64)

      const res = await fetch('/api/boutiques/scan-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      })

      const data = await res.json()
      const detectedNom = data.nom || data.texteNom
      if (res.ok && detectedNom) {
        setNomForm(detectedNom)
        const suggestions = data.detections || data.suggestions
        if (Array.isArray(suggestions)) {
          setOcrDetections(suggestions)
        }
        setScannerStatus(`Nom détecté : "${detectedNom}"`)
        jouerBipEtVibrer('succes')
      } else {
        setScannerStatus('Aucun texte lisible détecté. Rapprochez la caméra ou tapez manuellement.')
      }
    } catch {
      setScannerStatus('Erreur lors de l’analyse d’image.')
    } finally {
      setOcrLoading(false)
    }
  }

  return {
    isListeningNom,
    voiceNomFeedback,
    demarrerEcouteVocaleNom,
    modalFormScanner,
    scannerTarget,
    scannerStatus,
    ocrDetections,
    ocrLoading,
    imageFligeeNom,
    setImageFligeeNom,
    videoFormRef,
    genererCodeBarreForm,
    demarrerFormScanner,
    arreterFormScanner,
    capturerEtLireNomTexte,
  }
}
