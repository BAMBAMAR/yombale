'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { listCommandes, updateStatutCommande } from '../../actions'
import { fcfa } from '@/lib/format'
import type { ClientCredit, TransactionCredit, ProduitBoutique, BoutiqueCarnetInfo } from '../types'

interface UseCarnetClientsProps {
  boutique: BoutiqueCarnetInfo
}

export function useCarnetClients({ boutique }: UseCarnetClientsProps) {
  const [clients, setClients] = useState<ClientCredit[]>([])
  const [produits, setProduits] = useState<ProduitBoutique[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreStatus, setFiltreStatus] = useState<'tous' | 'retard' | 'credits'>('tous')
  const [clientSelectionne, setClientSelectionne] = useState<ClientCredit | null>(null)
  const [historique, setHistorique] = useState<TransactionCredit[]>([])
  const [loadingHist, setLoadingHist] = useState(false)
  const [commandesCreditEnAttente, setCommandesCreditEnAttente] = useState<any[]>([])

  const chargerDonnees = useCallback(async () => {
    if (!boutique?.id) return
    setLoading(true)
    try {
      const resClients = await fetch(`/api/boutiques/${boutique.id}/credits-clients`)
      if (resClients.ok) {
        const dataC = await resClients.json()
        if (dataC.clients) setClients(dataC.clients)
      }

      const resProds = await fetch(`/api/boutiques/${boutique.id}/produits`)
      if (resProds.ok) {
        const dataP = await resProds.json()
        const prodsList = dataP.produits || dataP.data || (Array.isArray(dataP) ? dataP : [])
        setProduits(prodsList)
      }

      try {
        const dataCmd = await listCommandes(boutique.id)
        const listCmd = Array.isArray(dataCmd) ? dataCmd : dataCmd.commandes || []
        const enAttenteCredit = listCmd.filter(
          (c: any) =>
            c.statut === 'en_attente' &&
            (c.methode_paiement === 'credit' || c.note?.toLowerCase().includes('crédit'))
        )
        setCommandesCreditEnAttente(enAttenteCredit)
      } catch (eCmd) {
        console.warn('[Nopalou:useCarnetClients:cmdCredit]', eCmd)
      }
    } catch (err) {
      console.error('Erreur chargement carnet:', err)
    } finally {
      setLoading(false)
    }
  }, [boutique?.id])

  useEffect(() => {
    if (boutique?.id) {
      chargerDonnees()
    }
  }, [boutique?.id, chargerDonnees])

  const chargerHistoriqueClient = useCallback(
    async (clientId: string) => {
      if (!boutique?.id) return
      setLoadingHist(true)
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientId}/historique`)
        if (res.ok) {
          const data = await res.json()
          setHistorique(data.historique || [])
        }
      } catch (e) {
        console.error('Erreur chargement historique client:', e)
      } finally {
        setLoadingHist(false)
      }
    },
    [boutique?.id]
  )

  const ouvrirFicheClient = useCallback(
    (c: ClientCredit) => {
      setClientSelectionne(c)
      chargerHistoriqueClient(c.id)
    },
    [chargerHistoriqueClient]
  )

  const handleCreerClient = useCallback(
    async (clientData: { nom: string; telephone: string; adresse?: string; plafond_max?: number; note_client?: string }) => {
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData),
        })

        if (res.ok) {
          const data = await res.json()
          await chargerDonnees()
          if (data.client) {
            ouvrirFicheClient(data.client)
          }
          return { ok: true, client: data.client }
        } else {
          const err = await res.json()
          alert(err.error || 'Erreur lors de la création du profil client.')
          return { ok: false, error: err.error }
        }
      } catch (err) {
        console.error('Erreur création client carnet:', err)
        return { ok: false, error: 'Erreur réseau' }
      }
    },
    [boutique.id, chargerDonnees, ouvrirFicheClient]
  )

  const handleEnregistrerEditClient = useCallback(
    async (clientId: string, editData: { nom: string; telephone: string; adresse?: string; plafond_max?: number; note_client?: string }) => {
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editData),
        })

        if (res.ok) {
          const data = await res.json()
          await chargerDonnees()
          if (data.client && clientSelectionne?.id === data.client.id) {
            setClientSelectionne(data.client)
          }
          alert('Profil client mis à jour avec succès !')
          return { ok: true, client: data.client }
        } else {
          const err = await res.json()
          alert(err.error || 'Erreur lors de la modification du client.')
          return { ok: false, error: err.error }
        }
      } catch (err) {
        console.error('Erreur modification client carnet:', err)
        return { ok: false, error: 'Erreur réseau' }
      }
    },
    [boutique.id, chargerDonnees, clientSelectionne?.id]
  )

  const handleChangerStatutClient = useCallback(
    async (c: ClientCredit, nouveauStatut: 'actif' | 'bloque' | 'archive') => {
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${c.id}/statut`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statut: nouveauStatut }),
        })
        if (res.ok) {
          await chargerDonnees()
          if (clientSelectionne?.id === c.id) {
            setClientSelectionne((prev) => (prev ? { ...prev, statut: nouveauStatut } : null))
          }
          alert(
            nouveauStatut === 'bloque'
              ? `Le client ${c.nom} a été blacklisté.`
              : `Le client ${c.nom} a été réactivé.`
          )
        } else {
          const err = await res.json()
          alert(err.error || 'Erreur lors du changement de statut du client.')
        }
      } catch (e) {
        console.error('Erreur changement statut client:', e)
        alert('Impossible de joindre le serveur.')
      }
    },
    [boutique.id, chargerDonnees, clientSelectionne?.id]
  )

  const handleSupprimerClient = useCallback(
    async (c: ClientCredit) => {
      if (
        !confirm(
          `Êtes-vous sûr de vouloir supprimer définitivement le client "${c.nom}" du carnet ?\nCette action est irréversible.`
        )
      ) {
        return
      }
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${c.id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          if (clientSelectionne?.id === c.id) {
            setClientSelectionne(null)
          }
          await chargerDonnees()
          alert(`Client "${c.nom}" supprimé avec succès du carnet.`)
        } else {
          const err = await res.json()
          alert(err.error || 'Erreur lors de la suppression du client.')
        }
      } catch (e) {
        console.error('Erreur suppression client:', e)
        alert('Impossible de joindre le serveur.')
      }
    },
    [boutique.id, chargerDonnees, clientSelectionne?.id]
  )

  const handleRelancerWhatsApp = useCallback(
    async (c: ClientCredit) => {
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${c.id}/relance-whatsapp`, {
          method: 'POST',
        })
        if (res.ok) {
          const data = await res.json()
          if (data.lienWhatsapp) {
            window.open(data.lienWhatsapp, '_blank')
          } else {
            alert('Relance WhatsApp envoyée !')
          }
        } else {
          const err = await res.json()
          alert(err.error || 'Impossible d’envoyer la relance.')
        }
      } catch (e) {
        console.error('Erreur relance whatsapp:', e)
      }
    },
    [boutique.id]
  )

  const handleRelancerEcheances = useCallback(async () => {
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/relances-echeances`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message || 'Traitement des relances terminé !')
        await chargerDonnees()
        if (clientSelectionne) {
          await chargerHistoriqueClient(clientSelectionne.id)
        }
      } else {
        alert(data.error || 'Erreur lors du déclenchement des relances.')
      }
    } catch (e) {
      console.error('Erreur relance echeances:', e)
      alert('Erreur réseau lors de la relance des échéances.')
    }
  }, [boutique.id, chargerDonnees, chargerHistoriqueClient, clientSelectionne])

  const handleApprouverCommandeCredit = useCallback(
    async (cmd: any) => {
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/approuver-commande`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commande_id: cmd.id,
            client_nom: cmd.client_nom,
            client_telephone: cmd.client_telephone,
            montant: cmd.montant_total,
            nom_produit: cmd.nom_produit,
            quantite: cmd.quantite,
            reference: cmd.reference,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          alert(data.error || 'Erreur approbation')
          return
        }
        setCommandesCreditEnAttente((prev) => prev.filter((c) => c.id !== cmd.id))
        await chargerDonnees()
        window.dispatchEvent(new Event('carnet_updated'))
        const cleanTel = cmd.client_telephone.replace(/\D/g, '')
        const msgWa = encodeURIComponent(
          `Bonjour ${cmd.client_nom}, votre demande d'achat à crédit de ${fcfa(cmd.montant_total)} (${cmd.nom_produit}) a été approuvée par la boutique et enregistrée dans votre Carnet !`
        )
        if (
          confirm(
            `Demande d'achat à crédit de ${cmd.client_nom} approuvée avec succès !\n\nSouhaitez-vous lui envoyer un message sur WhatsApp ?`
          )
        ) {
          window.open(`https://wa.me/${cleanTel}?text=${msgWa}`, '_blank')
        }
      } catch (e) {
        alert('Erreur lors du traitement.')
      }
    },
    [boutique.id, chargerDonnees]
  )

  const handleRefuserCommandeCredit = useCallback(
    async (cmd: any) => {
      if (
        !confirm(
          `Souhaitez-vous vraiment rejeter la demande d'achat à crédit de ${cmd.client_nom} (${fcfa(cmd.montant_total)}) ?`
        )
      ) {
        return
      }
      try {
        const res = await updateStatutCommande(boutique.id, cmd.id, 'annulee')
        if (res.success) {
          setCommandesCreditEnAttente((prev) => prev.filter((c) => c.id !== cmd.id))
          await chargerDonnees()
        } else {
          alert(res.error || 'Erreur lors du rejet de la demande.')
        }
      } catch (e) {
        alert('Erreur lors du traitement.')
      }
    },
    [boutique.id, chargerDonnees]
  )

  const clientsFiltres = useMemo(() => {
    return clients.filter((c) => {
      const textMatch =
        !recherche.trim() ||
        c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        c.telephone.includes(recherche) ||
        (c.adresse && c.adresse.toLowerCase().includes(recherche.toLowerCase()))

      if (!textMatch) return false
      if (filtreStatus === 'retard') return Number(c.solde) > 0
      if (filtreStatus === 'credits') return Number(c.solde) < 0
      return true
    })
  }, [clients, recherche, filtreStatus])

  return {
    clients,
    setClients,
    produits,
    setProduits,
    loading,
    recherche,
    setRecherche,
    filtreStatus,
    setFiltreStatus,
    clientSelectionne,
    setClientSelectionne,
    historique,
    setHistorique,
    loadingHist,
    commandesCreditEnAttente,
    setCommandesCreditEnAttente,
    clientsFiltres,
    chargerDonnees,
    chargerHistoriqueClient,
    ouvrirFicheClient,
    handleCreerClient,
    handleEnregistrerEditClient,
    handleChangerStatutClient,
    handleSupprimerClient,
    handleRelancerWhatsApp,
    handleRelancerEcheances,
    handleApprouverCommandeCredit,
    handleRefuserCommandeCredit,
  }
}
