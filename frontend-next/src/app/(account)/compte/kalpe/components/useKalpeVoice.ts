'use client'

import { useState, useRef, useEffect } from 'react'
import {
  createVoiceListener,
  demanderPermissionMicrophone,
  getMessageErreurMicro,
  parseSaisieExpressIntent,
  parseKalpeDetteIntent,
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
  setTiersTel: (val: string) => void
  setTiersType: (val: 'particulier' | 'entreprise') => void
  setDateEcheance: (val: string) => void
  setDetteSens: (val: 'a_recevoir' | 'a_payer') => void
  setContexte: (val: 'personnel' | 'activite') => void
  setDateOperation: (val: string) => void
  setMoyenPaiement: (val: string) => void
}

// AUD-207 : une seule session de reconnaissance à la fois, même si l'événement de démarrage arrive deux fois
// (le navigateur n'en tolère généralement qu'une).
let ecouteEnCours = false

export function useKalpeVoice({
  mode,
  isOpen,
  autoStartVoice = false,
  setMontant,
  setLibelle,
  setCategorie,
  setMode,
  setTiersNom,
  setTiersTel,
  setTiersType,
  setDateEcheance,
  setDetteSens,
  setContexte,
  setDateOperation,
  setMoyenPaiement,
}: UseKalpeVoiceParams) {
  const { toast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null)
  const listenerRef = useRef<{ start: () => void; stop: () => void; abort?: () => void } | null>(null)
  const possedeEcoute = useRef(false)

  const libererEcoute = () => {
    if (possedeEcoute.current) {
      possedeEcoute.current = false
      ecouteEnCours = false
    }
  }

  const traiterDette = (transcript: string, alts: string[]) => {
    const parsed = parseKalpeDetteIntent(transcript, alts)
    if (!parsed.montant && !parsed.nomClient) {
      const msg = `Phrase non comprise : « ${transcript} ». Dites par exemple : « Moussa me doit 10 000 » ou « Je dois 5 000 à Awa ».`
      setVoiceFeedback(msg)
      toast.warning(msg)
      return
    }
    // AUD-225 : un remboursement REÇU ou FAIT n'est pas une nouvelle dette. Pré-remplir le formulaire de dette conduisait à
    // « Valider » = dette inversée envers la personne (constaté : « Awa m'a remboursé 5000 » → dette de 5 000 envers Awa).
    // On ne remplit donc rien et on dit quoi faire.
    if (parsed.remboursement) {
      const qui = parsed.nomClient ? ` de ${parsed.nomClient}` : ''
      const combien = parsed.montant ? ` de ${parsed.montant.toLocaleString('fr-FR')} FCFA` : ''
      const msg = `Remboursement${combien}${qui} détecté : aucune dette n’a été créée. Ouvrez la dette concernée et touchez « Rembourser » pour l’enregistrer.`
      setVoiceFeedback(msg)
      toast.warning(msg)
      return
    }
    setVoiceFeedback(`Reconnu : "${transcript}"`)
    if (parsed.montant) setMontant(String(parsed.montant))
    if (parsed.nomClient) setTiersNom(parsed.nomClient)
    if (parsed.telephone) setTiersTel(parsed.telephone)
    if (parsed.dateEcheance) setDateEcheance(parsed.dateEcheance)
    setTiersType(parsed.tiersType)
    if (parsed.sens) setDetteSens(parsed.sens)

    if (!parsed.montant) {
      toast.warning('Montant non compris : saisissez-le.')
    } else if (!parsed.sens) {
      toast.info('Précisez le sens : « On me doit » ou « Je dois ».')
    } else if (!parsed.nomClient) {
      toast.warning('Nom non compris : saisissez-le.')
    } else {
      toast.success(`${parsed.sens === 'a_payer' ? 'Dette' : 'Créance'} détectée : ${parsed.montant.toLocaleString('fr-FR')} FCFA • ${parsed.nomClient}`)
    }
  }

  const traiterOperation = (transcript: string) => {
    const parsed = parseSaisieExpressIntent(transcript, mode === 'depense' ? 'depense' : 'vente')
    const desc = (parsed.libelleProduit || parsed.description || '').slice(0, 120) // AUD-209 : limite du champ
    setVoiceFeedback(`Reconnu : "${transcript}"`)
    if (parsed.montant && parsed.montant > 0) setMontant(String(parsed.montant))
    if (desc) setLibelle(desc)
    if (parsed.contexte) setContexte(parsed.contexte)
    if (parsed.dateOperation) setDateOperation(parsed.dateOperation)
    if (parsed.moyenPaiement) setMoyenPaiement(parsed.moyenPaiement)

    // Le sens (dépense / revenu) ne bascule que entre ces deux onglets : jamais depuis Épargne ou Vente express.
    let modeEffectif: SaisieMode = mode
    if (mode === 'depense' || mode === 'revenu') {
      modeEffectif = parsed.mode === 'depense' ? 'depense' : 'revenu'
      if (modeEffectif !== mode) setMode(modeEffectif)
      if (modeEffectif === 'depense' && parsed.categorieKalpe) setCategorie(parsed.categorieKalpe)
      else if (modeEffectif === 'revenu' && parsed.categorieRevenuKalpe) setCategorie(parsed.categorieRevenuKalpe)
    }

    if (!parsed.montant || parsed.montant <= 0) {
      toast.warning('Montant non compris : saisissez-le (ex. « 5000 », « dix mille »).')
      return
    }
    toast.success(`${modeEffectif === 'revenu' ? 'Revenu' : modeEffectif === 'depense' ? 'Dépense' : 'Opération'} : ${parsed.montant.toLocaleString('fr-FR')} FCFA${desc ? ' • ' + desc : ''}`)
  }

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
    if (ecouteEnCours) return

    ecouteEnCours = true
    possedeEcoute.current = true
    setVoiceFeedback(null)

    const perm = await demanderPermissionMicrophone()
    if (!perm.ok) {
      libererEcoute()
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
        setVoiceFeedback('Écoute en cours… Parlez maintenant')
      },
      onResult: (transcript, alts) => {
        setIsListening(false)
        const texte = (transcript || '').trim()
        if (!texte) {
          const msg = "Je n'ai rien compris. Réessayez en parlant plus près du micro."
          setVoiceFeedback(msg)
          toast.warning(msg)
          return
        }
        if (mode === 'dette') traiterDette(texte, alts || [])
        else traiterOperation(texte)
      },
      onError: (err) => {
        libererEcoute()
        setIsListening(false)
        const msg = getMessageErreurMicro(err)
        setVoiceFeedback(msg)
        console.warn('[KalpeVoice] recognition error:', err)
      },
      onEnd: () => {
        libererEcoute()
        setIsListening(false)
        // « Écoute en cours » ne doit pas rester affiché une fois l'écoute terminée sans résultat
        setVoiceFeedback((prev) => (prev && prev.startsWith('Écoute en cours') ? null : prev))
      },
    })

    if (rec) {
      listenerRef.current = rec
      try {
        rec.start()
        setIsListening(true)
        setVoiceFeedback('Écoute en cours… Parlez maintenant')
      } catch (e: any) {
        libererEcoute()
        setIsListening(false)
        const msg = getMessageErreurMicro(e?.name || 'not-allowed')
        setVoiceFeedback(msg)
        toast.error(msg)
      }
    } else {
      libererEcoute()
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
      libererEcoute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoStartVoice])

  return {
    isListening,
    voiceFeedback,
    setVoiceFeedback,
    toggleListening,
  }
}
