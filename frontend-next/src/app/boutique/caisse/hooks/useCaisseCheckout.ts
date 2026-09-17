'use client'

import { useState } from 'react'
import { creerPosVente, creerBoutiqueDocument } from '../../actions'
import { ajouterVenteHorsLigne, ajouterDetteHorsLigne } from '@/lib/db-offline'
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

  async function encaisserVente() {
    if (netAPayer === 0 || encaissementEnCours) return
    if (!session) {
      setModalSessionOuverture(true)
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

      setHistoriqueVentes((prev) => [nouvelleVenteHist, ...prev])

      if (modePaiement === 'credit_client') {
        if (!clientCreditIdPOS) {
          showToast('Veuillez sélectionner un client dans le carnet pour valider la vente à crédit.', 'warning', 'Client Requis')
          return
        }
        if (boutiqueActiveId) {
          const debtIdempotency = `DEBT-${Date.now().toString(36).toUpperCase()}-${Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase()}`
          const payloadCredit = {
            idempotency_key: debtIdempotency,
            type: 'vente_credit' as const,
            montant: netAPayer,
            produits: panier.map((i) => ({ nom: i.produit.nom, quantite: i.quantite, prix: i.prixUnitaire })),
            date_echeance: creditDateEcheancePOS || null,
            note: creditNotePOS || 'Vente caisse POS à crédit',
            mode_paiement: 'credit',
            relance_auto_whatsapp: true,
          }

          if (!isReallyOnline || offlineModeActive) {
            try {
              await ajouterDetteHorsLigne({
                id_temporaire: debtIdempotency,
                boutique_id: boutiqueActiveId,
                user_id: userId,
                client_id: clientCreditIdPOS,
                type: 'vente_credit',
                montant: netAPayer,
                mode_paiement: 'credit',
                note: creditNotePOS || 'Vente caisse POS à crédit',
                produits: payloadCredit.produits,
                date_echeance: creditDateEcheancePOS || null,
                relance_auto_whatsapp: true,
                date: new Date().toISOString(),
              })
              rafraichirCompteurOffline()
              setClientsCredits((prev) =>
                prev.map((c) => (c.id === clientCreditIdPOS ? { ...c, solde: Number(c.solde || 0) + netAPayer } : c))
              )
            } catch (eOffDebt) {
              console.error('[Caisse POS] Erreur sauvegarde dette offline:', eOffDebt)
            }
          } else {
            try {
              const resCredit = await fetch(`/api/boutiques/${boutiqueActiveId}/credits-clients/${clientCreditIdPOS}/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadCredit),
              })
              if (!resCredit.ok) {
                const dataErr = await resCredit.json().catch(() => ({}))
                showToast(dataErr.error || 'Erreur lors de l’enregistrement de la vente à crédit dans le carnet.', 'error', 'Carnet de Crédit')
                return
              }
              await chargerClientsCredits(boutiqueActiveId)
            } catch (e) {
              console.error('Erreur réseau vente crédit carnet, bascule secours offline:', e)
              try {
                await ajouterDetteHorsLigne({
                  id_temporaire: debtIdempotency,
                  boutique_id: boutiqueActiveId,
                  user_id: userId,
                  client_id: clientCreditIdPOS,
                  type: 'vente_credit',
                  montant: netAPayer,
                  mode_paiement: 'credit',
                  note: creditNotePOS || 'Vente caisse POS à crédit',
                  produits: payloadCredit.produits,
                  date_echeance: creditDateEcheancePOS || null,
                  relance_auto_whatsapp: true,
                  date: new Date().toISOString(),
                })
                rafraichirCompteurOffline()
                setClientsCredits((prev) =>
                  prev.map((c) => (c.id === clientCreditIdPOS ? { ...c, solde: Number(c.solde || 0) + netAPayer } : c))
                )
              } catch (eOffDebt2) {
                console.warn('[POS CHECKOUT] err dette fallback', eOffDebt2)
              }
            }
          }
        }
      }

      if (boutiqueActiveId) {
        const uniquePosRef = `POS-${Date.now().toString(36).toUpperCase()}-${Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase()}`
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
          session_id: session?.id || null,
          modePaiement,
          client_id: clientCreditIdPOS || null,
          fidelite_client_id: clientFidelite?.id || null,
          deduction_cagnotte_fcfa: cagnotteDeduite || 0,
          remise_pourcentage: remisePourcentage || 0,
          total: netAPayer,
          especes_mixte: modePaiement === 'mixte' ? especesMixteNum : undefined,
          second_mode_mixte: modePaiement === 'mixte' ? secondModeMixte : undefined,
          montant_mixte2: modePaiement === 'mixte' ? resteAPayerMixte : undefined,
        }

        if (!isReallyOnline || offlineModeActive) {
          try {
            await ajouterVenteHorsLigne({
              id_temporaire: payloadVente.idempotency_key,
              boutique_id: boutiqueActiveId,
              user_id: userId,
              session_id: session?.id || null,
              caissier_id: caissierSelectionneId || null,
              items: payloadVente.items,
              caissier: payloadVente.caissier,
              modePaiement: payloadVente.modePaiement,
              client_id: payloadVente.client_id,
              total: payloadVente.total,
              date: new Date().toISOString(),
            })
            rafraichirCompteurOffline()
          } catch (eOff) {
            console.error('[Caisse POS] Erreur stockage local vente:', eOff)
          }
        } else {
          try {
            const result = await creerPosVente(boutiqueActiveId, payloadVente)
            if (!result.success) {
              throw new Error(result.error || 'Impossible d\'enregistrer la vente')
            }
          } catch (e) {
            console.error('[Caisse POS] Secours IndexedDB vente locale:', e)
            try {
              await ajouterVenteHorsLigne({
                id_temporaire: payloadVente.idempotency_key,
                boutique_id: boutiqueActiveId,
                user_id: userId,
                session_id: session?.id || null,
                caissier_id: caissierSelectionneId || null,
                items: payloadVente.items,
                caissier: payloadVente.caissier,
                modePaiement: payloadVente.modePaiement,
                client_id: payloadVente.client_id,
                total: payloadVente.total,
                date: new Date().toISOString(),
              })
              rafraichirCompteurOffline()
            } catch (eOff2) {
              console.warn('[POS CHECKOUT] err fallback', eOff2)
            }
          }
        }

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
