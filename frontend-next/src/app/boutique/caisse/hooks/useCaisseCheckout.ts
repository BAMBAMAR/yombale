'use client'

import { useState } from 'react'
import { creerPosVente, creerBoutiqueDocument } from '../../actions'
import { ajouterVenteHorsLigne, ajouterDetteHorsLigne, ajusterStockProduitLocal, resoudreId } from '@/lib/db-offline'
import { showToast } from '@/context/ToastContext'

export function useCaisseCheckout({
  boutiqueActiveId,
  boutiqueActive,
  userId,
  caissierNom,
  caissierSelectionneId,
  session,
  setSession,
  isReallyOnline,
  offlineModeActive,
  rafraichirCompteurOffline,
  panier,
  netAPayer,
  modePaiement,
  montantRecu,
  montantEspecesMixte,
  secondModeMixte,
  resteAPayerMixte,
  clientCreditIdPOS,
  creditDateEcheancePOS,
  creditNotePOS,
  clientFidelite,
  cagnotteDeduite,
  remisePourcentage,
  encaissementEnCours,
  setEncaissementEnCours,
  viderPanier,
  setModalSessionOuverture,
  setClientsCredits,
  chargerClientsCredits,
  setHistoriqueVentes,
  imprimerTicketThermique,
}: {
  boutiqueActiveId: string
  boutiqueActive: any
  userId: string
  caissierNom: string
  caissierSelectionneId: string
  session: any
  setSession: React.Dispatch<React.SetStateAction<any>>
  isReallyOnline: boolean
  offlineModeActive: boolean
  rafraichirCompteurOffline: () => void
  panier: any[]
  netAPayer: number
  modePaiement: string
  montantRecu: string
  montantEspecesMixte: string
  secondModeMixte: string
  resteAPayerMixte: number
  clientCreditIdPOS: string
  creditDateEcheancePOS: string
  creditNotePOS: string
  clientFidelite: any
  cagnotteDeduite: number
  remisePourcentage: number
  encaissementEnCours: boolean
  setEncaissementEnCours: (v: boolean) => void
  viderPanier: () => void
  setModalSessionOuverture: (v: boolean) => void
  setClientsCredits: React.Dispatch<React.SetStateAction<any[]>>
  chargerClientsCredits: (bId: string) => Promise<void>
  setHistoriqueVentes: React.Dispatch<React.SetStateAction<any[]>>
  imprimerTicketThermique: (vente: any) => Promise<void>
}) {
  const [derniereVente, setDerniereVente] = useState<any | null>(null)

  async function enregistrerDocumentCaisse(typeDocument: 'devis' | 'proforma') {
    if (netAPayer === 0) return
    if (!session) {
      setModalSessionOuverture(true)
      return
    }

    try {
      const res = await creerBoutiqueDocument(boutiqueActiveId, {
        type: typeDocument,
        client_id: clientCreditIdPOS || null,
        caissier_id: caissierSelectionneId || null,
        statut: 'brouillon',
        items: panier.map((i) => ({
          id: i.produit.id,
          quantite: i.quantite,
          nom: i.produit.nom,
          prix: i.prixUnitaire,
        })),
        mode_paiement: modePaiement,
        date_echeance: creditDateEcheancePOS || null,
        notes: `${typeDocument.toUpperCase()} créé depuis la caisse POS`,
      })

      if (res.error) {
        showToast(res.error, 'error', 'Erreur Document')
        return
      }

      if (res.id) {
        window.open(`/api/boutiques/${boutiqueActiveId}/documents/${res.id}/pdf`, '_blank')
      }
      showToast(`${typeDocument.toUpperCase()} créé avec succès ! Réf : ${res.reference || res.id}`, 'success', 'Document POS')
      viderPanier()
    } catch (err) {
      console.error(`Erreur création ${typeDocument}:`, err)
      showToast(`Erreur lors de la création du ${typeDocument}`, 'error')
    }
  }

  /** Refus métier du serveur (abonnement expiré, validation…) : la vente ne doit PAS être présentée comme réussie. */
  function estRefusMetier(status?: number): boolean {
    return typeof status === 'number' && status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429
  }

  async function encaisserVente() {
    if (netAPayer === 0 || encaissementEnCours) return
    if (!session) {
      setModalSessionOuverture(true)
      return
    }
    if (modePaiement === 'credit_client' && !clientCreditIdPOS) {
      showToast('Veuillez sélectionner un client dans le carnet pour valider la vente à crédit.', 'warning', 'Client Requis')
      return
    }

    setEncaissementEnCours(true)

    try {
      const ticketId = `TICK-${Math.floor(10000 + Math.random() * 90000)}`
      const dateStr = new Date().toLocaleDateString('fr-FR')
      const heureStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      const especesMixteNum = Number(montantEspecesMixte) || 0

      const nouvelleVenteHist = {
        id: ticketId,
        date: dateStr,
        heure: heureStr,
        caissier: caissierNom,
        modePaiement,
        total: netAPayer,
        statut: 'validee' as const,
        detailPaiementMixte:
          modePaiement === 'mixte'
            ? {
                especes: especesMixteNum,
                autreMode: secondModeMixte.toUpperCase(),
                autreMontant: resteAPayerMixte,
              }
            : undefined,
        ticket: [...panier],
      }

      if (!boutiqueActiveId) return

      const uniquePosRef = `POS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      const payloadVente = {
        idempotency_key: uniquePosRef,
        items: panier.map((i) => ({
          id: i.produit.id,
          quantite: i.quantite,
          nom: i.produit.nom,
          prix: i.prixUnitaire,
        })),
        caissier: caissierNom,
        caissier_id: caissierSelectionneId || null,
        // AUD-093 : identifiant de session local (loc_…) remplacé par l'identifiant serveur dès qu'il est connu
        session_id: resoudreId(session?.id) || null,
        modePaiement,
        client_id: resoudreId(clientCreditIdPOS) || null,
        fidelite_client_id: clientFidelite?.id || null,
        deduction_cagnotte_fcfa: cagnotteDeduite || 0,
        remise_pourcentage: remisePourcentage || 0,
        total: netAPayer,
        especes_mixte: modePaiement === 'mixte' ? especesMixteNum : undefined,
        second_mode_mixte: modePaiement === 'mixte' ? secondModeMixte : undefined,
        montant_mixte2: modePaiement === 'mixte' ? resteAPayerMixte : undefined,
      }

      const mettreEnFile = () =>
        ajouterVenteHorsLigne({
          id_temporaire: payloadVente.idempotency_key,
          boutique_id: boutiqueActiveId,
          user_id: userId,
          session_id: session?.id || null,
          caissier_id: caissierSelectionneId || null,
          items: payloadVente.items,
          caissier: payloadVente.caissier,
          modePaiement: payloadVente.modePaiement,
          client_id: clientCreditIdPOS || null,
          total: payloadVente.total,
          date: new Date().toISOString(),
        })

      let enFile = false
      if (!isReallyOnline || offlineModeActive) {
        try {
          await mettreEnFile()
          enFile = true
        } catch (eOff) {
          console.error('[Caisse POS] Erreur stockage local vente:', eOff)
          showToast('Impossible d’enregistrer la vente sur cet appareil. Ne remettez pas la marchandise avant de réessayer.', 'error', 'Caisse POS')
          return
        }
      } else {
        let result: Awaited<ReturnType<typeof creerPosVente>>
        try {
          result = await creerPosVente(boutiqueActiveId, payloadVente)
        } catch {
          result = { error: 'Erreur de connexion au serveur' }
        }
        if (result.success) {
          if (result.conflits && result.conflits.length > 0) {
            showToast(`Écart de stock enregistré : ${result.conflits.map((c) => c.produit_nom).join(', ')}. À recompter.`, 'warning', 'Stock')
          }
        } else if (estRefusMetier(result.status)) {
          // AUD-089 : refus du serveur (ex. abonnement expiré) → message explicite, rien n'est marqué comme vendu
          showToast(result.error || 'Vente refusée par le serveur.', 'error', 'Vente non enregistrée')
          return
        } else {
          // Panne réseau, 5xx ou session expirée : la vente est conservée localement et renvoyée (idempotente)
          try {
            await mettreEnFile()
            enFile = true
            if (result.status === 401) showToast('Session expirée : reconnectez-vous pour envoyer cette vente. Elle est conservée sur l’appareil.', 'warning', 'Caisse POS')
          } catch (eOff2) {
            console.error('[POS CHECKOUT] err fallback', eOff2)
            showToast('Vente non enregistrée (serveur injoignable et stockage local impossible).', 'error', 'Caisse POS')
            return
          }
        }
      }

      // Vente à crédit : la dette est inscrite APRÈS la vente (jamais de dette sans vente) ; en cas d'échec elle est
      // mise en file, puis signalée si le serveur la refuse.
      if (modePaiement === 'credit_client') {
        const debtIdempotency = `DEBT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        const produitsDette = panier.map((i) => ({ nom: i.produit.nom, quantite: i.quantite, prix: i.prixUnitaire }))
        const payloadCredit = {
          idempotency_key: debtIdempotency,
          type: 'vente_credit' as const,
          montant: netAPayer,
          produits: produitsDette,
          date_echeance: creditDateEcheancePOS || null,
          note: creditNotePOS || 'Vente caisse POS à crédit',
          mode_paiement: 'credit',
          relance_auto_whatsapp: true,
        }
        const mettreDetteEnFile = async () => {
          await ajouterDetteHorsLigne({
            id_temporaire: debtIdempotency,
            boutique_id: boutiqueActiveId,
            user_id: userId,
            client_id: clientCreditIdPOS,
            type: 'vente_credit',
            montant: netAPayer,
            mode_paiement: 'credit',
            note: creditNotePOS || 'Vente caisse POS à crédit',
            produits: produitsDette,
            date_echeance: creditDateEcheancePOS || null,
            relance_auto_whatsapp: true,
            date: new Date().toISOString(),
          })
          rafraichirCompteurOffline()
          setClientsCredits((prev) => prev.map((c) => (c.id === clientCreditIdPOS ? { ...c, solde: Number(c.solde || 0) + netAPayer } : c)))
        }
        if (!isReallyOnline || offlineModeActive) {
          await mettreDetteEnFile().catch((e) => console.error('[Caisse POS] Erreur sauvegarde dette offline:', e))
        } else {
          try {
            const resCredit = await fetch(`/api/boutiques/${boutiqueActiveId}/credits-clients/${resoudreId(clientCreditIdPOS)}/transaction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payloadCredit),
            })
            if (resCredit.ok) await chargerClientsCredits(boutiqueActiveId)
            else await mettreDetteEnFile()
          } catch (e) {
            console.error('Erreur réseau vente crédit carnet, bascule secours offline:', e)
            await mettreDetteEnFile().catch((e2) => console.warn('[POS CHECKOUT] err dette fallback', e2))
          }
        }
      }

      // Vente confirmée (serveur) ou conservée localement : l'état de l'interface peut maintenant l'enregistrer
      setHistoriqueVentes((prev) => [nouvelleVenteHist, ...prev])
      if (enFile) rafraichirCompteurOffline()

      // Mise à jour de la session
      setSession((prev: any) => {
        if (!prev) return null
        const v = prev.ventes
        return {
          ...prev,
          ventes: {
            ...v,
            total: v.total + netAPayer,
            nbVentes: v.nbVentes + 1,
            especes: modePaiement === 'especes' ? v.especes + netAPayer : modePaiement === 'mixte' ? v.especes + especesMixteNum : v.especes,
            wave: modePaiement === 'wave' ? v.wave + netAPayer : modePaiement === 'mixte' && secondModeMixte === 'wave' ? v.wave + resteAPayerMixte : v.wave,
            orangeMoney: modePaiement === 'orange_money' ? v.orangeMoney + netAPayer : modePaiement === 'mixte' && secondModeMixte === 'orange_money' ? v.orangeMoney + resteAPayerMixte : v.orangeMoney,
            carte: modePaiement === 'carte' ? v.carte + netAPayer : modePaiement === 'mixte' && secondModeMixte === 'carte' ? v.carte + resteAPayerMixte : v.carte,
            mixte: modePaiement === 'mixte' ? v.mixte + netAPayer : v.mixte,
          },
        }
      })

      // Décrémentation instantanée du stock local (IndexedDB + localStorage)
      try {
        panier.forEach((i) => {
          if (i.produit?.id) {
            ajusterStockProduitLocal(boutiqueActiveId, userId, i.produit.id, i.quantite).catch(() => {})
          }
        })
        if (typeof window !== 'undefined') {
          const cachedProds = localStorage.getItem(`nopalou_pos_produits_${boutiqueActiveId}`)
          if (cachedProds) {
            const parsed = JSON.parse(cachedProds)
            if (Array.isArray(parsed)) {
              const updated = parsed.map((p: any) => {
                const cartItem = panier.find((i) => i.produit?.id === p.id)
                if (cartItem && typeof p.stock === 'number') {
                  return { ...p, stock: Math.max(0, p.stock - cartItem.quantite) }
                }
                return p
              })
              localStorage.setItem(`nopalou_pos_produits_${boutiqueActiveId}`, JSON.stringify(updated))
            }
          }
        }
      } catch (eStock) {
        console.warn('[POS CHECKOUT] Erreur décrémentation stock local:', eStock)
      }

      const venteFinale = {
        ...nouvelleVenteHist,
        recu: Number(montantRecu) || netAPayer,
        monnaie: Math.max(0, (Number(montantRecu) || netAPayer) - netAPayer),
      }
      setDerniereVente(venteFinale)
      viderPanier()

      // Impression automatique du ticket
      try {
        await imprimerTicketThermique(venteFinale)
      } catch (errPrint) {
        console.warn('[POS PRINT] Erreur print ticket automatique:', errPrint)
      }
    } catch (errVente) {
      console.error('[POS CHECKOUT] Erreur encaissement:', errVente)
      showToast('Erreur lors de l\'encaissement.', 'error', 'Caisse POS')
    } finally {
      setEncaissementEnCours(false)
    }
  }
  return {
    derniereVente,
    setDerniereVente,
    enregistrerDocumentCaisse,
    encaisserVente,
  }
}
