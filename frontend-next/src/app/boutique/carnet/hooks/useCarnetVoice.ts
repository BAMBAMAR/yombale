'use client'

import { useState, useRef, useCallback } from 'react'
import {
  createVoiceListener,
  parseDetteIntent,
  demanderPermissionMicrophone,
  getMessageErreurMicro,
  normaliserTexteVocal,
} from '@/lib/voice-assistant'
import { jouerBipEtVibrer } from '@/lib/scanner-helper'
import { fcfa } from '@/lib/format'
import { useToast } from '@/context/ToastContext'
import type { ClientCredit, VoiceActionPending, BoutiqueCarnetInfo } from '../types'

interface UseCarnetVoiceProps {
  boutique: BoutiqueCarnetInfo
  clients: ClientCredit[]
  chargerDonnees: () => Promise<void>
  chargerHistoriqueClient: (clientId: string) => Promise<void>
  setClientSelectionne: (c: ClientCredit | null) => void
  ouvrirFicheClient: (c: ClientCredit) => void
  onOpenModalTransactionFromVoice?: (action: VoiceActionPending) => void
}

export function useCarnetVoice({
  boutique,
  clients,
  chargerDonnees,
  chargerHistoriqueClient,
  setClientSelectionne,
  ouvrirFicheClient,
  onOpenModalTransactionFromVoice,
}: UseCarnetVoiceProps) {
  const { toast } = useToast()
  const [voiceActionPending, setVoiceActionPending] = useState<VoiceActionPending | null>(null)
  const [voiceActionLoading, setVoiceActionLoading] = useState(false)
  const [isListeningVoice, setIsListeningVoice] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null)
  const voiceRecognitionRef = useRef<any>(null)

  const validerActionVocaleDirecte = useCallback(
    async (action: VoiceActionPending) => {
      if (!action.client) return
      setVoiceActionLoading(true)
      const txIdempotency = `VOICE-TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      try {
        const produitsListe =
          action.type === 'vente_credit'
            ? [{ nom: action.description || 'Achat à crédit', quantite: 1, prix: action.montant }]
            : [{ nom: 'Remboursement', quantite: 1, prix: action.montant }]

        const res = await fetch(
          `/api/boutiques/${boutique.id}/credits-clients/${action.client.id}/transaction`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idempotency_key: txIdempotency,
              type: action.type,
              montant: action.montant,
              mode_paiement: 'especes',
              note:
                action.type === 'vente_credit'
                  ? 'Vente à crédit (dictée vocale)'
                  : 'Remboursement (dicté vocal)',
              produits: produitsListe,
              date_echeance: null,
              relance_auto_whatsapp: true,
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          setVoiceActionPending(null)
          setVoiceFeedback(
            `${action.type === 'vente_credit' ? 'Dette' : 'Remboursement'} de ${fcfa(action.montant)} validé(e) pour ${action.client.nom} !`
          )
          jouerBipEtVibrer('succes')
          await chargerDonnees()
          if (data.client) {
            setClientSelectionne(data.client)
            await chargerHistoriqueClient(data.client.id)
          }
        } else {
          const err = await res.json()
          toast.error(err.error || 'Erreur lors de l’enregistrement vocal.')
        }
      } catch (e) {
        console.error('Erreur validation vocale carnet:', e)
        toast.error('Une erreur est survenue lors de l’enregistrement.')
      } finally {
        setVoiceActionLoading(false)
      }
    },
    [boutique.id, chargerDonnees, chargerHistoriqueClient, setClientSelectionne, toast]
  )

  const modifierDepuisVocal = useCallback(
    (action: VoiceActionPending) => {
      setVoiceActionPending(null)
      if (onOpenModalTransactionFromVoice) {
        onOpenModalTransactionFromVoice(action)
      }
    },
    [onOpenModalTransactionFromVoice]
  )

  const demarrerEcouteVocaleCarnet = useCallback(async () => {
    if (isListeningVoice) {
      try {
        voiceRecognitionRef.current?.stop()
      } catch (err) {
        console.warn('[Nopalou:useCarnetVoice:stop]', err)
      }
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
      onResult: (transcript, alternatives) => {
        setIsListeningVoice(false)
        const clientsNoms = clients.map((c) => c.nom)
        const intent = parseDetteIntent(transcript, clientsNoms, alternatives || [])

        let clientCible: ClientCredit | null = null
        if (intent.nomClient) {
          const q = normaliserTexteVocal(intent.nomClient)
          clientCible =
            clients.find((c) => normaliserTexteVocal(c.nom) === q) ||
            clients.find((c) => normaliserTexteVocal(c.nom).includes(q)) ||
            clients.find((c) => q.includes(normaliserTexteVocal(c.nom))) ||
            clients.find((c) => {
              const tokens = normaliserTexteVocal(c.nom)
                .split(/\s+/)
                .filter((t) => t.length >= 3)
              return tokens.some((t) => q.includes(t))
            }) ||
            null
        }

        if (intent.type === 'recherche' && (!intent.montant || intent.montant <= 0)) {
          if (clientCible) {
            ouvrirFicheClient(clientCible)
            setVoiceFeedback(`Fiche de ${clientCible.nom} ouverte`)
            jouerBipEtVibrer('succes')
          } else {
            setVoiceFeedback(`Aucun client trouvé pour « ${intent.nomClient || transcript} »`)
            jouerBipEtVibrer('alerte')
          }
          return
        }

        const typeFinal = intent.type === 'remboursement' ? 'remboursement' : 'vente_credit'
        const montantFinal = intent.montant || 0

        setVoiceActionPending({
          type: clientCible ? typeFinal : intent.nomClient ? 'nouveau_client' : typeFinal,
          client: clientCible || undefined,
          nomClientPropose: intent.nomClient || (clientCible ? clientCible.nom : ''),
          montant: montantFinal,
          transcriptRaw: transcript,
          description: typeFinal === 'remboursement' ? 'Remboursement' : 'Achat à crédit',
        })
        setVoiceFeedback(null)
        jouerBipEtVibrer('succes')
      },
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
      setVoiceFeedback(
        "La reconnaissance vocale n'est pas supportée par ce navigateur. Utilisez Chrome, Edge ou Safari."
      )
    }
  }, [clients, isListeningVoice, ouvrirFicheClient])

  return {
    voiceActionPending,
    setVoiceActionPending,
    voiceActionLoading,
    isListeningVoice,
    voiceFeedback,
    setVoiceFeedback,
    demarrerEcouteVocaleCarnet,
    validerActionVocaleDirecte,
    modifierDepuisVocal,
  }
}
