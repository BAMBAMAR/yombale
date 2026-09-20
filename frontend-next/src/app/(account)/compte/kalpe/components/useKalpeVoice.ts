'use client'

import { useState, useRef, useEffect } from 'react'
import {
  createVoiceListener,
  demanderPermissionMicrophone,
  getMessageErreurMicro,
  parseSaisieExpressIntent,
  parseDetteIntent,
} from '@/lib/voice-assistant'
import { useToast } from '@/context/ToastContext'
import type { SaisieMode } from './KalpeSaisieModeTabs'

interface UseKalpeVoiceParams {
  mode: SaisieMode
  isOpen: boolean
  autoStartVoice?: boolean
  setMontant: (val: string) => void
  setLibelle: (val: string) => void
  setCategorie: (val: string) => void
  setMode: (val: SaisieMode) => void
  setTiersNom: (val: string) => void
  setDetteSens: (val: 'a_recevoir' | 'a_payer') => void
}

export function useKalpeVoice({
  mode,
  isOpen,
  autoStartVoice = false,
  setMontant,
  setLibelle,
  setCategorie,
  setMode,
  setTiersNom,
  setDetteSens,
}: UseKalpeVoiceParams) {
  const { toast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null)
  const listenerRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  const toggleListening = async () => {
    if (isListening) {
      if (listenerRef.current) {
        try {
          listenerRef.current.stop()
        } catch (err) {
          console.warn('[KalpeVoice] stop error:', err)
        }
      }
      setIsListening(false)
      return
    }

    setVoiceFeedback(null)

    const perm = await demanderPermissionMicrophone()
    if (!perm.ok) {
      setIsListening(false)
      const msg = getMessageErreurMicro(perm.error || 'not-allowed')
      setVoiceFeedback(msg)
      toast.error(msg)
      return
    }

    const rec = createVoiceListener({
      lang: 'fr-FR',
      onStart: () => {
        setIsListening(true)
        setVoiceFeedback('Écoute en cours (Wolof / Français)... Parlez maintenant')
      },
      onResult: (transcript, alts) => {
        setIsListening(false)
        setVoiceFeedback(`Reconnu : "${transcript}"`)

        if (mode === 'dette') {
          const parsed = parseDetteIntent(transcript, [], alts || [])
          if (parsed.montant) setMontant(String(parsed.montant))
          if (parsed.nomClient) setTiersNom(parsed.nomClient)
          if (parsed.type === 'vente_credit') setDetteSens('a_recevoir')
          else if (parsed.type === 'remboursement') setDetteSens('a_payer')
          toast.success(
            `Dette détectée : ${parsed.montant ? parsed.montant.toLocaleString('fr-FR') + ' FCFA' : ''} ${
              parsed.nomClient ? '• ' + parsed.nomClient : ''
            }`
          )
        } else {
          const parsed = parseSaisieExpressIntent(transcript, mode === 'depense' ? 'depense' : 'vente')
          if (parsed.montant && parsed.montant > 0) setMontant(String(parsed.montant))
          const desc = parsed.libelleProduit || parsed.description
          if (desc) setLibelle(desc)
          if (parsed.categorie) setCategorie(parsed.categorie)
          if (parsed.mode === 'depense') setMode('depense')
          else if (parsed.mode === 'vente') setMode('revenu')
          toast.success(
            `Opération reconnue : ${parsed.montant ? parsed.montant.toLocaleString('fr-FR') + ' FCFA' : ''} ${
              desc ? '• ' + desc : ''
            }`
          )
        }
      },
      onError: (err) => {
        setIsListening(false)
        const msg = getMessageErreurMicro(err)
        setVoiceFeedback(msg)
        console.warn('[KalpeVoice] recognition error:', err)
      },
      onEnd: () => {
        setIsListening(false)
      },
    })

    if (rec) {
      listenerRef.current = rec
      try {
        rec.start()
        setIsListening(true)
        setVoiceFeedback('Écoute en cours (Wolof / Français)... Parlez maintenant')
      } catch (e: any) {
        setIsListening(false)
        const msg = getMessageErreurMicro(e?.name || 'not-allowed')
        setVoiceFeedback(msg)
        toast.error(msg)
      }
    } else {
      setIsListening(false)
      const msg = "La reconnaissance vocale n'est pas supportée par ce navigateur. Utilisez Chrome, Edge ou Safari."
      setVoiceFeedback(msg)
      toast.info(msg)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setVoiceFeedback(null)
      if (autoStartVoice) {
        const timer = setTimeout(() => {
          toggleListening()
        }, 250)
        return () => clearTimeout(timer)
      }
    }
    return () => {
      if (listenerRef.current) {
        try {
          listenerRef.current.stop()
        } catch (err) {
          console.warn('[KalpeVoice] Cleanup error:', err)
        }
        listenerRef.current = null
      }
    }
  }, [isOpen, autoStartVoice])

  return {
    isListening,
    voiceFeedback,
    setVoiceFeedback,
    toggleListening,
  }
}
