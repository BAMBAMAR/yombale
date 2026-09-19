'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/context/ToastContext'
import { ajouterDetteHorsLigne } from '@/lib/db-offline'
import type { ClientCredit } from '../types'

interface UseCarnetTransactionsParams {
  boutique: { id: string; nom: string }
  clients: ClientCredit[]
  setClients: React.Dispatch<React.SetStateAction<ClientCredit[]>>
  clientSelectionne: ClientCredit | null
  setClientSelectionne: React.Dispatch<React.SetStateAction<ClientCredit | null>>
  chargerDonnees: () => Promise<void>
  chargerHistoriqueClient: (clientId: string) => Promise<void>
  setShowModalNouveauClient: (show: boolean) => void
  rafraichirCompteurCarnet: () => void
}

export function useCarnetTransactions({
  boutique,
  clients,
  setClients,
  clientSelectionne,
  setClientSelectionne,
  chargerDonnees,
  chargerHistoriqueClient,
  setShowModalNouveauClient,
  rafraichirCompteurCarnet,
}: UseCarnetTransactionsParams) {
  const { toast } = useToast()
  const [showModalTransaction, setShowModalTransaction] = useState(false)
  const [typeTransaction, setTypeTransaction] = useState<'vente_credit' | 'remboursement'>('vente_credit')

  const ouvrirModalTransaction = useCallback(
    (type: 'vente_credit' | 'remboursement', client?: ClientCredit) => {
      if (client) {
        setClientSelectionne(client)
        chargerHistoriqueClient(client.id)
      } else if (clientSelectionne) {
        chargerHistoriqueClient(clientSelectionne.id)
      } else if (clients.length > 0) {
        setClientSelectionne(clients[0])
        chargerHistoriqueClient(clients[0].id)
      } else {
        setShowModalNouveauClient(true)
        return
      }
      setTypeTransaction(type)
      setShowModalTransaction(true)
    },
    [chargerHistoriqueClient, clientSelectionne, clients, setClientSelectionne, setShowModalNouveauClient]
  )

  const handleValiderTransaction = useCallback(
    async (params: {
      client: ClientCredit
      type: 'vente_credit' | 'remboursement'
      montant: number
      modePaiement: string
      note: string
      produits: any[]
      dateEcheance: string | null
      relanceAutoWa: boolean
    }) => {
      const txIdempotency = `DEBT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${params.client.id}/transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotency_key: txIdempotency,
            type: params.type,
            montant: params.montant,
            mode_paiement: params.modePaiement,
            note: params.note,
            produits: params.produits,
            date_echeance: params.dateEcheance,
            relance_auto_whatsapp: params.relanceAutoWa,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          setClientSelectionne((prev) => (prev ? { ...prev, solde: data.nouveauSolde } : null))
          await chargerDonnees()
          await chargerHistoriqueClient(params.client.id)
        } else {
          const err = await res.json()
          toast.error(err.error || 'Erreur lors de l’enregistrement de la transaction.')
        }
      } catch (e) {
        console.warn('[Carnet Dettes] Mode Hors-Ligne:', e)
        try {
          await ajouterDetteHorsLigne({
            id_temporaire: txIdempotency,
            boutique_id: boutique.id,
            user_id: 'commercant',
            client_id: params.client.id,
            type: params.type,
            montant: params.montant,
            mode_paiement: params.modePaiement,
            note: params.note,
            produits: params.produits,
            date_echeance: params.dateEcheance,
            relance_auto_whatsapp: params.relanceAutoWa,
            date: new Date().toISOString(),
          })
          rafraichirCompteurCarnet()
          const delta = params.type === 'vente_credit' ? params.montant : -params.montant
          const optSolde = Number(params.client.solde || 0) + delta
          setClientSelectionne((prev) => (prev ? { ...prev, solde: optSolde } : null))
          setClients((prev) => prev.map((c) => (c.id === params.client.id ? { ...c, solde: optSolde } : c)))
          toast.info(
            'Opération enregistrée localement sur votre appareil. Elle sera automatiquement synchronisée à la reconnexion.',
            'Mode Hors-Ligne'
          )
        } catch (errDb) {
          console.error('Erreur enregistrement local carnet:', errDb)
          toast.error('Erreur critique de sauvegarde locale.', 'Erreur IndexedDB')
        }
      }
    },
    [boutique.id, chargerDonnees, chargerHistoriqueClient, rafraichirCompteurCarnet, setClients, setClientSelectionne, toast]
  )

  return {
    showModalTransaction,
    setShowModalTransaction,
    typeTransaction,
    setTypeTransaction,
    ouvrirModalTransaction,
    handleValiderTransaction,
  }
}
