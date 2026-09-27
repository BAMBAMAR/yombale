'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { listCommandes, updateStatutCommande } from '../../actions'
import { fcfa } from '@/lib/format'
import { useToast } from '@/context/ToastContext'
import { sauvegarderClientsLocaux, obtenirClientsLocaux, ajouterNouveauClientHorsLigne } from '@/lib/db-offline'
import type { ClientCredit, TransactionCredit, ProduitBoutique, BoutiqueCarnetInfo } from '../types'

interface UseCarnetClientsProps {
  boutique: BoutiqueCarnetInfo
}

export function useCarnetClients({ boutique }: UseCarnetClientsProps) {
  const { toast, confirmModal } = useToast()
  const [clients, setClients] = useState<ClientCredit[]>(() => {
    if (typeof window !== 'undefined' && boutique?.id) {
      try {
        const cached = localStorage.getItem(`nopalou_offline_clients_${boutique.id}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch (_) {}
    }
    return []
  })
  const [produits, setProduits] = useState<ProduitBoutique[]>(() => {
    if (typeof window !== 'undefined' && boutique?.id) {
      try {
        const cached =
          localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) ||
          localStorage.getItem(`nopalou_offline_prods_${boutique.id}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch (_) {}
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && boutique?.id) {
      const cached = localStorage.getItem(`nopalou_offline_clients_${boutique.id}`)
      if (cached) return false
    }
    return true
  })
  const [recherche, setRecherche] = useState('')
  const [filtreStatus, setFiltreStatus] = useState<'tous' | 'retard' | 'credits'>('tous')
  const [clientSelectionne, setClientSelectionne] = useState<ClientCredit | null>(null)
  const [historique, setHistorique] = useState<TransactionCredit[]>([])
  const [loadingHist, setLoadingHist] = useState(false)
  const [commandesCreditEnAttente, setCommandesCreditEnAttente] = useState<any[]>([])

  const chargerDonnees = useCallback(async () => {
    if (!boutique?.id) return
    try {
      const clientToken = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('nopalou_token') || '') : ''
      const fetchHeaders: Record<string, string> = {}
      if (clientToken) fetchHeaders['Authorization'] = `Bearer ${clientToken}`

      const resClients = await fetch(`/api/boutiques/${boutique.id}/credits-clients`, { headers: fetchHeaders })
      if (resClients.ok) {
        const dataC = await resClients.json()
        if (dataC.clients && Array.isArray(dataC.clients)) {
          const cachedStr = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_offline_clients_${boutique.id}`) : null
          let localCount = 0
          if (cachedStr) try { localCount = JSON.parse(cachedStr)?.length || 0 } catch (_) {}
          if (dataC.clients.length > 0 || localCount === 0) {
            setClients(dataC.clients)
            if (typeof window !== 'undefined') {
              localStorage.setItem(`nopalou_offline_clients_${boutique.id}`, JSON.stringify(dataC.clients))
            }
            sauvegarderClientsLocaux(dataC.clients, boutique.id, (boutique as any)?.user_id || 'owner').catch(() => {})
          }
        }
      } else {
        // Fallback local
        const cached = localStorage.getItem(`nopalou_offline_clients_${boutique.id}`)
        if (cached) {
          try { setClients(JSON.parse(cached)) } catch (_) {}
        } else {
          obtenirClientsLocaux(boutique.id, (boutique as any)?.user_id || 'owner')
            .then((local) => { if (local && local.length > 0) setClients(local) })
            .catch(() => {})
        }
      }

      const resProds = await fetch(`/api/boutiques/${boutique.id}/produits`, { headers: fetchHeaders })
      if (resProds.ok) {
        const dataP = await resProds.json()
        const prodsList = dataP.produits || dataP.data || (Array.isArray(dataP) ? dataP : [])
        if (prodsList.length > 0) {
          setProduits(prodsList)
          if (typeof window !== 'undefined') {
            localStorage.setItem(`nopalou_pos_produits_${boutique.id}`, JSON.stringify(prodsList))
          }
        }
      } else {
        const cachedProds =
          localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) ||
          localStorage.getItem(`nopalou_offline_prods_${boutique.id}`)
        if (cachedProds) {
          try { setProduits(JSON.parse(cachedProds)) } catch (_) {}
        }
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
      console.warn('Erreur chargement carnet (mode hors-ligne):', err)
      const cached = localStorage.getItem(`nopalou_offline_clients_${boutique.id}`)
      if (cached) {
        try { setClients(JSON.parse(cached)) } catch (_) {}
      } else {
        obtenirClientsLocaux(boutique.id, (boutique as any)?.user_id || 'owner')
          .then((local) => { if (local && local.length > 0) setClients(local) })
          .catch(() => {})
      }
      const cachedProds =
        localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) ||
        localStorage.getItem(`nopalou_offline_prods_${boutique.id}`)
      if (cachedProds) {
        try { setProduits(JSON.parse(cachedProds)) } catch (_) {}
      }
    } finally {
      setLoading(false)
    }
  }, [boutique?.id, (boutique as any)?.user_id])

  useEffect(() => {
    if (boutique?.id) {
      chargerDonnees()
    }
  }, [boutique?.id, chargerDonnees])

  const chargerHistoriqueClient = useCallback(
    async (clientId: string) => {
      if (!boutique?.id) return
      setLoadingHist(true)
      const cacheKey = `nopalou_offline_carnet_hist_${boutique.id}_${clientId}`
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (Array.isArray(parsed)) setHistorique(parsed)
          } catch (_) {}
        }
      }
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${clientId}/historique`)
        if (res.ok) {
          const data = await res.json()
          const hist = data.historique || []
          setHistorique(hist)
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(hist))
            } catch (_) {}
          }
        }
      } catch (e) {
        console.warn('Mode hors-ligne: historique client chargé depuis le cache local:', e)
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
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
      let res: any = null

      if (!isOffline) {
        try {
          res = await fetch(`/api/boutiques/${boutique.id}/credits-clients`, {
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
            toast.success(`Client "${data.client.nom}" créé avec succès !`)
            return { ok: true, client: data.client }
          }
        } catch (errNet) {
          console.warn('[Carnet Dettes] Échec réseau création client, passage en mode hors-ligne:', errNet)
        }
      }

      // Mode Hors-ligne / Fallback
      const tempId = `cli_temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      const userId = (typeof window !== 'undefined' && localStorage.getItem('nopalou_user_id')) || (boutique as any)?.utilisateur_id || (boutique as any)?.user_id || 'commercant'

      const nouveauClientLocal: ClientCredit = {
        id: tempId,
        boutique_id: boutique.id,
        nom: clientData.nom.trim(),
        telephone: clientData.telephone.trim(),
        adresse: clientData.adresse?.trim() || null,
        plafond_max: Number(clientData.plafond_max || 200000),
        note_client: clientData.note_client?.trim() || null,
        solde: 0,
        statut: 'actif',
        created_at: new Date().toISOString(),
      } as any

      await ajouterNouveauClientHorsLigne({
        id_temporaire: tempId,
        boutique_id: boutique.id,
        user_id: userId,
        nom: clientData.nom.trim(),
        telephone: clientData.telephone.trim(),
        adresse: clientData.adresse?.trim() || null,
        plafond_max: Number(clientData.plafond_max || 200000),
        note_client: clientData.note_client?.trim() || null,
        date: new Date().toISOString(),
      }).catch((e) => console.warn('[Carnet] Erreur IDB nouveau client:', e))

      setClients((prev) => {
        const next = [nouveauClientLocal, ...prev]
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`nopalou_offline_clients_${boutique.id}`, JSON.stringify(next))
          } catch (_) {}
        }
        sauvegarderClientsLocaux(next, boutique.id, userId).catch(() => {})
        return next
      })

      ouvrirFicheClient(nouveauClientLocal)
      toast.info(`Client "${nouveauClientLocal.nom}" créé hors-ligne. Il sera synchronisé dès la reconnexion.`, 'Mode Hors-Ligne')
      return { ok: true, client: nouveauClientLocal }
    },
    [boutique.id, (boutique as any)?.utilisateur_id, (boutique as any)?.user_id, chargerDonnees, ouvrirFicheClient, toast]
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
          toast.success('Profil client mis à jour avec succès !')
          return { ok: true, client: data.client }
        } else {
          const err = await res.json()
          toast.error(err.error || 'Erreur lors de la modification du client.')
          return { ok: false, error: err.error }
        }
      } catch (err) {
        console.error('Erreur modification client carnet:', err)
        toast.error('Erreur réseau')
        return { ok: false, error: 'Erreur réseau' }
      }
    },
    [boutique.id, chargerDonnees, clientSelectionne?.id, toast]
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
          toast.success(
            nouveauStatut === 'bloque'
              ? `Le client ${c.nom} a été blacklisté.`
              : `Le client ${c.nom} a été réactivé.`
          )
        } else {
          const err = await res.json()
          toast.error(err.error || 'Erreur lors du changement de statut du client.')
        }
      } catch (e) {
        console.error('Erreur changement statut client:', e)
        toast.error('Impossible de joindre le serveur.')
      }
    },
    [boutique.id, chargerDonnees, clientSelectionne?.id, toast]
  )

  const handleSupprimerClient = useCallback(
    async (c: ClientCredit) => {
      const ok = await confirmModal({
        title: 'Supprimer ce client',
        message: `Êtes-vous sûr de vouloir supprimer définitivement le client "${c.nom}" du carnet ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
        isDanger: true,
      })
      if (!ok) return
      try {
        const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/${c.id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          if (clientSelectionne?.id === c.id) {
            setClientSelectionne(null)
          }
          await chargerDonnees()
          toast.success(`Client "${c.nom}" supprimé avec succès du carnet.`)
        } else {
          const err = await res.json()
          toast.error(err.error || 'Erreur lors de la suppression du client.')
        }
      } catch (e) {
        console.error('Erreur suppression client:', e)
        toast.error('Impossible de joindre le serveur.')
      }
    },
    [boutique.id, chargerDonnees, clientSelectionne?.id, toast]
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
            toast.success('Relance WhatsApp envoyée !')
          }
        } else {
          const err = await res.json()
          toast.error(err.error || 'Impossible d’envoyer la relance.')
        }
      } catch (e) {
        console.error('Erreur relance whatsapp:', e)
      }
    },
    [boutique.id, toast]
  )

  const handleRelancerEcheances = useCallback(async () => {
    try {
      const res = await fetch(`/api/boutiques/${boutique.id}/credits-clients/relances-echeances`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Traitement des relances terminé !')
        await chargerDonnees()
        if (clientSelectionne) {
          await chargerHistoriqueClient(clientSelectionne.id)
        }
      } else {
        toast.error(data.error || 'Erreur lors du déclenchement des relances.')
      }
    } catch (e) {
      console.error('Erreur relance echeances:', e)
      toast.error('Erreur réseau lors de la relance des échéances.')
    }
  }, [boutique.id, chargerDonnees, chargerHistoriqueClient, clientSelectionne, toast])

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
          toast.error(data.error || 'Erreur approbation')
          return
        }
        setCommandesCreditEnAttente((prev) => prev.filter((c) => c.id !== cmd.id))
        await chargerDonnees()
        window.dispatchEvent(new Event('carnet_updated'))
        toast.success(`Demande de crédit de ${cmd.client_nom} approuvée !`)
        const cleanTel = cmd.client_telephone.replace(/\D/g, '')
        const msgWa = encodeURIComponent(
          `Bonjour ${cmd.client_nom}, votre demande d'achat à crédit de ${fcfa(cmd.montant_total)} (${cmd.nom_produit}) a été approuvée par la boutique et enregistrée dans votre Carnet !`
        )
        toast.success(`Demande de ${cmd.client_nom} approuvée et ajoutée au carnet !`)
        window.open(`https://wa.me/${cleanTel}?text=${msgWa}`, '_blank')
      } catch (e) {
        toast.error('Erreur lors du traitement.')
      }
    },
    [boutique.id, chargerDonnees, toast]
  )

  const handleRefuserCommandeCredit = useCallback(
    async (cmd: any) => {
      const ok = await confirmModal({
        title: 'Refuser la demande',
        message: `Souhaitez-vous vraiment rejeter la demande d'achat à crédit de ${cmd.client_nom} (${fcfa(cmd.montant_total)}) ?`,
        confirmLabel: 'Rejeter',
        isDanger: true,
      })
      if (!ok) return
      try {
        const res = await updateStatutCommande(boutique.id, cmd.id, 'annulee')
        if (res.success) {
          setCommandesCreditEnAttente((prev) => prev.filter((c) => c.id !== cmd.id))
          await chargerDonnees()
          toast.success('Demande de crédit annulée.')
        } else {
          toast.error(res.error || 'Erreur lors du rejet de la demande.')
        }
      } catch (e) {
        toast.error('Erreur lors du traitement.')
      }
    },
    [boutique.id, chargerDonnees, toast]
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
