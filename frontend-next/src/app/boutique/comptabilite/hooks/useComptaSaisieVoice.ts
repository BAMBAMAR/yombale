'use client'

import { useState, useRef } from 'react'
import { fcfa } from '@/lib/format'
import { jouerBipEtVibrer } from '@/lib/scanner-helper'
import { createVoiceListener, parseSaisieExpressIntent, demanderPermissionMicrophone, getMessageErreurMicro } from '@/lib/voice-assistant'

interface UseComptaSaisieVoiceProps {
  mode: 'vente' | 'depense'
  setMode: (m: 'vente' | 'depense') => void
  setModeSaisie: (s: 'catalogue' | 'libre') => void
  setMontantDepense: (v: string) => void
  setCatDepense: (v: string) => void
  setDescDepense: (v: string) => void
  setPrixCustomInput: (v: string) => void
  setLibelleCustomInput: (v: string) => void
}

export function useComptaSaisieVoice({
  mode,
  setMode,
  setModeSaisie,
  setMontantDepense,
  setCatDepense,
  setDescDepense,
  setPrixCustomInput,
  setLibelleCustomInput,
}: UseComptaSaisieVoiceProps) {
  const [isListeningVoice, setIsListeningVoice] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null)
  const voiceRecognitionRef = useRef<any>(null)

  const demarrerEcouteVocale = async () => {
    if (isListeningVoice) {
      try {
        voiceRecognitionRef.current?.stop()
      } catch (err) { console.warn('[Nopalou:ComptaSaisieExpress:Voice]', err) }
      setIsListeningVoice(false)
      return
    }

    setVoiceFeedback(null)

    const perm = await demanderPermissionMicrophone()
    if (!perm.ok) {
      setIsListeningVoice(false)
      setVoiceFeedback(getMessageErreurMicro(perm.error || 'not-allowed'))
      return
    }

    const rec = createVoiceListener({
      lang: 'fr-FR',
      onStart: () => setIsListeningVoice(true),
      onEnd: () => setIsListeningVoice(false),
      onError: (err) => {
        setIsListeningVoice(false)
        setVoiceFeedback(getMessageErreurMicro(err))
      },
      onResult: (transcript) => {
        setIsListeningVoice(false)
        const intent = parseSaisieExpressIntent(transcript, mode)
        if (intent.mode === 'depense') {
          setMode('depense')
          if (intent.montant && intent.montant > 0) setMontantDepense(String(intent.montant))
          if (intent.categorie) setCatDepense(intent.categorie)
          if (intent.description) setDescDepense(intent.description)
          setVoiceFeedback(`Dépense reconnue : ${intent.description || intent.categorie} (${intent.montant ? fcfa(intent.montant) : '0 FCFA'})`)
          jouerBipEtVibrer('succes')
        } else {
          setMode('vente')
          setModeSaisie('libre')
          if (intent.montant) setPrixCustomInput(String(intent.montant))
          if (intent.libelleProduit) {
            setLibelleCustomInput(intent.libelleProduit)
          } else {
            setLibelleCustomInput('Vente directe')
          }
          setVoiceFeedback(`Vente reconnue : ${intent.libelleProduit || 'Vente directe'} (${intent.montant ? fcfa(intent.montant) : '0 FCFA'})`)
          jouerBipEtVibrer('succes')
        }
      }
    })

    if (rec) {
      voiceRecognitionRef.current = rec
      try {
        rec.start()
      } catch (e: any) {
        setIsListeningVoice(false)
        setVoiceFeedback(getMessageErreurMicro(e?.name || 'not-allowed'))
      }
    } else {
      setVoiceFeedback("La reconnaissance vocale n'est pas supportée par ce navigateur. Utilisez Chrome, Edge ou Safari.")
    }
  }

  return {
    isListeningVoice,
    voiceFeedback,
    demarrerEcouteVocale,
  }
}
