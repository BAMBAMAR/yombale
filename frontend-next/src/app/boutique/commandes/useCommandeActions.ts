'use client'

import { useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { creerBoutiqueDocument, updateStatutCommande } from '../actions'
import { fcfa } from '@/lib/format'
import type { Commande } from './types'

export function useCommandeActions(
  boutiqueId: string,
  commande: Commande,
  onUpdate: () => void,
  changeStatut: (statut: string) => void
) {
  const [loading, setLoading] = useState(false)
  const { toast, confirmModal } = useToast()

  const relancerWave = () => {
    let cleanTel = (commande.client_telephone || '').replace(/\D/g, '')
    if (
      cleanTel.length === 9 &&
      (cleanTel.startsWith('77') ||
        cleanTel.startsWith('78') ||
        cleanTel.startsWith('76') ||
        cleanTel.startsWith('75') ||
        cleanTel.startsWith('70'))
    ) {
      cleanTel = `221${cleanTel}`
    }
    const SITE = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
    const payUrl = `${SITE}/checkout-express?produit=${(commande as any).produit_id || ''}&boutique=${boutiqueId}&phone=${cleanTel}&pay=wave&ref=${commande.reference}&auto=1`
    const cleanNom = commande.client_nom?.trim()
    const salutation =
      cleanNom && cleanNom.toLowerCase() !== 'client whatsapp'
        ? `Bonjour ${cleanNom} !`
        : `Bonjour !`
    const msg =
      `${salutation}\n\n` +
      `Voici le rappel pour votre commande Nopalou :\n` +
      `*Produit :* ${commande.nom_produit} × ${commande.quantite}\n` +
      `*TOTAL :* ${fcfa(commande.montant_total)}\n` +
      `*Référence :* ${commande.reference}\n\n` +
      `*Pour régler directement en 1 clic par Wave sécurisé :*\n` +
      `${payUrl}\n\n` +
      `Merci pour votre confiance !`
    window.open(`https://wa.me/${cleanTel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const approuverCredit = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/boutiques/${boutiqueId}/credits-clients/approuver-commande`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commande_id: commande.id,
          client_nom: commande.client_nom,
          client_telephone: commande.client_telephone,
          montant: commande.montant_total,
          nom_produit: commande.nom_produit,
          quantite: commande.quantite,
          reference: commande.reference,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'approbation de la demande à crédit.")
        return
      }
      onUpdate()
      window.dispatchEvent(new Event('carnet_updated'))

      const cleanTel = (commande.client_telephone || '').replace(/\D/g, '')
      const msgWa = encodeURIComponent(
        `Bonjour ${commande.client_nom}, votre demande d'achat à crédit de ${fcfa(
          commande.montant_total
        )} (${commande.nom_produit}) a été approuvée par la boutique et ajoutée à votre Carnet !`
      )
      toast.success(`Demande de ${commande.client_nom} approuvée et ajoutée au Carnet client !`)
      window.open(`https://wa.me/${cleanTel}?text=${msgWa}`, '_blank')
    } catch {
      toast.error('Erreur lors du traitement de la demande.')
    } finally {
      setLoading(false)
    }
  }

  const rejeterCredit = async () => {
    const ok = await confirmModal({
      title: "Rejeter l'achat à crédit",
      message: `Souhaitez-vous vraiment rejeter la demande d'achat à crédit de ${commande.client_nom} ?`,
      confirmLabel: 'Rejeter la demande',
      isDanger: true,
    })
    if (!ok) return
    changeStatut('annulee')
  }

  const genererFacture = async () => {
    try {
      setLoading(true)
      const res = await creerBoutiqueDocument(boutiqueId, {
        type: 'facture',
        statut: 'valide',
        notes: `Facture issue de la commande Réf: ${commande.reference}`,
        items: [
          {
            nom: commande.nom_produit,
            quantite: commande.quantite,
            prix: commande.prix_unitaire,
          },
        ],
      })
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Facture ${res?.reference || ''} générée avec succès !`)
      }
    } catch {
      toast.error('Erreur lors de la création de la facture.')
    } finally {
      setLoading(false)
    }
  }

  const annulerCommande = async () => {
    const ok = await confirmModal({
      title: 'Annuler la commande',
      message: `Souhaitez-vous vraiment annuler la commande ${commande.reference} de ${commande.client_nom} ?`,
      confirmLabel: 'Oui, annuler',
      isDanger: true,
    })
    if (!ok) return
    changeStatut('annulee')
  }

  return {
    loading,
    setLoading,
    relancerWave,
    approuverCredit,
    rejeterCredit,
    genererFacture,
    annulerCommande,
  }
}
