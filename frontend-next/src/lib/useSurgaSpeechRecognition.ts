'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  interpreterCommandeVocale,
  estReconnaissanceVocaleSupportee,
  type ActionVocaleDetectee,
} from '@/lib/surga-voice'

interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

export function useSurgaSpeechRecognition(isOpen: boolean) {
  const [estSupporte, setEstSupporte] = useState(true)
  const [enEcoute, setEnEcoute] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [actionDetectee, setActionDetectee] = useState<ActionVocaleDetectee | null>(null)
  const [messageErreur, setMessageErreur] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const demarrerEcoute = useCallback(() => {
    setMessageErreur(null)
    setActionDetectee(null)
    setTranscription('')

    if (typeof window === 'undefined') return
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance
    }

    const SpeechRecClass = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!SpeechRecClass) {
      setEstSupporte(false)
      return
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }

      const instance = new SpeechRecClass()
      instance.continuous = false
      instance.interimResults = true
      instance.lang = 'fr-FR'

      instance.onstart = () => {
        setEnEcoute(true)
      }

      instance.onresult = (event: SpeechRecognitionEvent) => {
        let texteComplet = ''
        for (let i = 0; i < event.results.length; i++) {
          texteComplet += event.results[i][0].transcript
        }
        setTranscription(texteComplet)

        const dernierResultat = event.results[event.results.length - 1]
        if (dernierResultat.isFinal) {
          const action = interpreterCommandeVocale(texteComplet)
          setActionDetectee(action)
        }
      }

      instance.onerror = (err: SpeechRecognitionErrorEvent) => {
        setEnEcoute(false)
        if (err.error === 'not-allowed') {
          setMessageErreur("L'accès au microphone a été refusé. Veuillez l'autoriser ou saisir votre consigne au clavier.")
        } else if (err.error !== 'no-speech') {
          setMessageErreur(`Erreur de reconnaissance (${err.error}). Vous pouvez réessayer.`)
        }
      }

      instance.onend = () => {
        setEnEcoute(false)
      }

      recognitionRef.current = instance
      instance.start()
    } catch {
      setEnEcoute(false)
      setEstSupporte(false)
    }
  }, [])

  const arreterEcoute = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    setEnEcoute(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      const supporte = estReconnaissanceVocaleSupportee()
      setEstSupporte(supporte)
      if (supporte) {
        demarrerEcoute()
      }
    } else {
      arreterEcoute()
      setActionDetectee(null)
      setTranscription('')
      setMessageErreur(null)
    }
  }, [isOpen, demarrerEcoute, arreterEcoute])

  return {
    estSupporte,
    enEcoute,
    transcription,
    setTranscription,
    actionDetectee,
    setActionDetectee,
    messageErreur,
    setMessageErreur,
    demarrerEcoute,
    arreterEcoute,
  }
}
