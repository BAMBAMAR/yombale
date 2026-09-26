'use client'

import { useState, useEffect, useRef } from 'react'
import type { ProduitCaisse, LignePanier } from '../components/PosCatalogueSection'
import type { ClientFidelite } from '../components/PosFideliteModal'
import { showToast } from '@/context/ToastContext'

export interface TicketEnAttente {
  id: string
  clientLabel: string
  heure: string
  panier: LignePanier[]
}

export function useCaissePanier({
  boutiqueActiveId,
  boutiqueActive,
  demanderValidationSuperviseur,
}: {
  boutiqueActiveId: string
  boutiqueActive: any
  demanderValidationSuperviseur: (titre: string, onValide: () => void) => void
}) {
  const [panier, setPanier] = useState<LignePanier[]>([])
  const [ticketsEnAttente, setTicketsEnAttente] = useState<TicketEnAttente[]>([])
  const [remisePourcentage, setRemisePourcentage] = useState<number>(0)
  const [remiseMotif, setRemiseMotif] = useState<string>('')
  const [clientFidelite, setClientFidelite] = useState<ClientFidelite | null>(null)
  const [cagnotteDeduite, setCagnotteDeduite] = useState<number>(0)
  const [montantRecu, setMontantRecu] = useState<string>('')
  const [montantEspecesMixte, setMontantEspecesMixte] = useState<string>('')
  const [encaissementEnCours, setEncaissementEnCours] = useState<boolean>(false)

  const cartLoadedRef = useRef<string | null>(null)

  // 1. Restauration automatique du panier sauvegardé & tickets en attente
  useEffect(() => {
    if (!boutiqueActiveId || typeof window === 'undefined') return
    if (cartLoadedRef.current === boutiqueActiveId) return
    cartLoadedRef.current = boutiqueActiveId
    try {
      const saved = localStorage.getItem(`nopalou_pos_cart_${boutiqueActiveId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPanier(parsed)
        }
      }
      const savedTickets = localStorage.getItem(`nopalou_pos_tickets_attente_${boutiqueActiveId}`)
      if (savedTickets) {
        const parsedTickets = JSON.parse(savedTickets)
        if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
          setTicketsEnAttente(parsedTickets)
        }
      }
    } catch (e) {
      console.warn('[POS CAISSE] Erreur restauration panier/tickets local:', e)
    }
  }, [boutiqueActiveId])

  // 2. Synchronisation temps réel du panier dans localStorage
  useEffect(() => {
    if (!boutiqueActiveId || typeof window === 'undefined') return
    if (cartLoadedRef.current !== boutiqueActiveId) return
    try {
      if (panier.length > 0) {
        localStorage.setItem(`nopalou_pos_cart_${boutiqueActiveId}`, JSON.stringify(panier))
      } else {
        localStorage.removeItem(`nopalou_pos_cart_${boutiqueActiveId}`)
      }
    } catch (e) {
      console.warn('[POS CAISSE] Erreur sync panier local:', e)
    }
  }, [panier, boutiqueActiveId])

  // 2b. Synchronisation des tickets en attente dans localStorage
  useEffect(() => {
    if (!boutiqueActiveId || typeof window === 'undefined') return
    if (cartLoadedRef.current !== boutiqueActiveId) return
    try {
      if (ticketsEnAttente.length > 0) {
        localStorage.setItem(`nopalou_pos_tickets_attente_${boutiqueActiveId}`, JSON.stringify(ticketsEnAttente))
      } else {
        localStorage.removeItem(`nopalou_pos_tickets_attente_${boutiqueActiveId}`)
      }
    } catch (e) {
      console.warn('[POS CAISSE] Erreur sync tickets en attente:', e)
    }
  }, [ticketsEnAttente, boutiqueActiveId])

  function genererLabelClientUnique(ticketsExistants: TicketEnAttente[]): string {
    const labelsOccupes = ticketsExistants.map((t) => t.clientLabel)
    let num = 1
    while (labelsOccupes.includes(`Client ${num}`)) {
      num++
    }
    return `Client ${num}`
  }

  function mettrePanierEnAttente() {
    if (panier.length === 0) return
    if (ticketsEnAttente.length >= 3) {
      showToast('Maximum 3 tickets en attente autorisés. Veuillez encaisser ou libérer un ticket en cours.', 'warning', 'Tickets en Attente')
      return
    }
    const uniqueId = `T-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    const nouveauTicket: TicketEnAttente = {
      id: uniqueId,
      clientLabel: genererLabelClientUnique(ticketsEnAttente),
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      panier: [...panier],
    }
    setTicketsEnAttente((prev) => [...prev, nouveauTicket])
    viderPanier()
  }

  function reprendreTicketEnAttente(ticketId: string) {
    const t = ticketsEnAttente.find((x) => x.id === ticketId)
    if (t) {
      if (panier.length > 0) {
        const ticketsRestants = ticketsEnAttente.filter((x) => x.id !== ticketId)
        const uniqueId = `T-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
        const nouveauLabel = genererLabelClientUnique(ticketsRestants)
        const ticketPanierActuel: TicketEnAttente = {
          id: uniqueId,
          clientLabel: nouveauLabel,
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          panier: [...panier],
        }
        setTicketsEnAttente([...ticketsRestants, ticketPanierActuel])
      } else {
        setTicketsEnAttente((prev) => prev.filter((x) => x.id !== ticketId))
      }
      setPanier(t.panier)
    }
  }

  function ajouterAuPanier(p: ProduitCaisse) {
    if (typeof p.stock === 'number' && !isNaN(p.stock)) {
      const itemExistant = panier.find((i) => i.produit.id === p.id)
      const qteActuelle = itemExistant ? itemExistant.quantite : 0
      if (qteActuelle >= p.stock) {
        demanderValidationSuperviseur(
          `Autoriser Vente Hors-Stock (${p.nom} : Stock disponible ${p.stock})`,
          () => {
            setPanier((prev) => {
              const ex = prev.find((i) => i.produit.id === p.id)
              if (ex) {
                return prev.map((i) => (i.produit.id === p.id ? { ...i, quantite: i.quantite + 1 } : i))
              }
              return [...prev, { produit: p, quantite: 1, prixUnitaire: p.prix }]
            })
          }
        )
        return
      }
    }

    setPanier((prev) => {
      const index = prev.findIndex((item) => item.produit.id === p.id)
      if (index >= 0) {
        const copi = [...prev]
        copi[index].quantite += 1
        return copi
      }
      return [...prev, { produit: p, quantite: 1, prixUnitaire: p.prix }]
    })
  }

  function modifierQuantite(id: string, delta: number) {
    const itemTarget = panier.find((i) => i.produit.id === id)
    if (!itemTarget) return

    if (delta > 0 && itemTarget.quantite >= itemTarget.produit.stock) {
      demanderValidationSuperviseur(
        `Autoriser Augmentation Hors-Stock (${itemTarget.produit.nom} : Max Stock ${itemTarget.produit.stock})`,
        () => {
          setPanier((prev) =>
            prev.map((item) => {
              if (item.produit.id === id) {
                return { ...item, quantite: item.quantite + delta }
              }
              return item
            })
          )
        }
      )
      return
    }

    setPanier((prev) =>
      prev
        .map((item) => {
          if (item.produit.id === id) {
            const nouvelleQte = item.quantite + delta
            return nouvelleQte > 0 ? { ...item, quantite: nouvelleQte } : null
          }
          return item
        })
        .filter(Boolean) as LignePanier[]
    )
  }

  function viderPanier() {
    setPanier([])
    setMontantRecu('')
    setMontantEspecesMixte('')
    setRemisePourcentage(0)
    setRemiseMotif('')
    setClientFidelite(null)
    setCagnotteDeduite(0)
    setEncaissementEnCours(false)
  }

  const sousTotalPanier = panier.reduce((acc, item) => acc + item.prixUnitaire * item.quantite, 0)
  const montantRemise = Math.round((sousTotalPanier * remisePourcentage) / 100)
  const netAPayer = Math.max(0, sousTotalPanier - montantRemise - cagnotteDeduite)

  return {
    panier,
    setPanier,
    ticketsEnAttente,
    setTicketsEnAttente,
    remisePourcentage,
    setRemisePourcentage,
    remiseMotif,
    setRemiseMotif,
    clientFidelite,
    setClientFidelite,
    cagnotteDeduite,
    setCagnotteDeduite,
    montantRecu,
    setMontantRecu,
    montantEspecesMixte,
    setMontantEspecesMixte,
    encaissementEnCours,
    setEncaissementEnCours,
    ajouterAuPanier,
    modifierQuantite,
    viderPanier,
    mettrePanierEnAttente,
    reprendreTicketEnAttente,
    sousTotalPanier,
    montantRemise,
    netAPayer,
  }
}
