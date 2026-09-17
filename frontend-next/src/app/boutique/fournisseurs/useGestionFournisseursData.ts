'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getFournisseurs,
  creerFournisseur,
  modifierFournisseur,
  supprimerFournisseur,
  getCommandesFournisseurs,
  creerCommandeFournisseur,
  modifierCommandeFournisseur,
  recevoirCommandeFournisseur,
  supprimerCommandeFournisseur,
  uploadJustificatifAchat,
  getBoutiqueProduits,
} from '../actions'
import { useToast } from '@/context/ToastContext'
import type { Fournisseur, CommandeFournisseur, LigneCommandeForm } from './types'

export function useGestionFournisseursData(boutiqueId: string, t: (key: string) => string) {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [commandes, setCommandes] = useState<CommandeFournisseur[]>([])
  const [produits, setProduits] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [uploadingFile, setUploadingFile] = useState<boolean>(false)
  const { toast } = useToast()

  const chargerDonnees = useCallback(async () => {
    const cacheKeyFous = `nopalou_offline_fournisseurs_${boutiqueId}`
    const cacheKeyCmds = `nopalou_offline_cmd_fournisseurs_${boutiqueId}`
    const cacheKeyProds = `nopalou_offline_prods_${boutiqueId}`

    const cFous = localStorage.getItem(cacheKeyFous)
    if (cFous) {
      try {
        setFournisseurs(JSON.parse(cFous))
      } catch (e) {
        console.warn('[Nopalou:useGestionFournisseursData]', e)
      }
    }
    const cCmds = localStorage.getItem(cacheKeyCmds)
    if (cCmds) {
      try {
        setCommandes(JSON.parse(cCmds))
      } catch (e) {
        console.warn('[Nopalou:useGestionFournisseursData]', e)
      }
    }
    const cProds = localStorage.getItem(cacheKeyProds)
    if (cProds) {
      try {
        setProduits(JSON.parse(cProds))
      } catch (e) {
        console.warn('[Nopalou:useGestionFournisseursData]', e)
      }
    }

    if (!cFous || !cCmds) setLoading(true)

    try {
      const [fous, cmds, prods] = await Promise.all([
        getFournisseurs(boutiqueId),
        getCommandesFournisseurs(boutiqueId),
        getBoutiqueProduits(boutiqueId),
      ])
      setFournisseurs(fous || [])
      setCommandes(cmds || [])
      setProduits(prods || [])
      localStorage.setItem(cacheKeyFous, JSON.stringify(fous || []))
      localStorage.setItem(cacheKeyCmds, JSON.stringify(cmds || []))
      localStorage.setItem(cacheKeyProds, JSON.stringify(prods || []))
    } catch (err) {
      console.error('Erreur chargement donnees fournisseurs:', err)
    } finally {
      setLoading(false)
    }
  }, [boutiqueId])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  const envoyerBonCommandeWhatsApp = (fournisseur: Fournisseur, articles: any[]) => {
    if (!fournisseur?.telephone) {
      toast.warning('Veuillez renseigner le numéro de téléphone de ce fournisseur.')
      return
    }
    const cleanTel = fournisseur.telephone.replace(/\D/g, '')
    const telNorm =
      cleanTel.length === 9 && ['77', '78', '76', '75', '70'].some((p) => cleanTel.startsWith(p))
        ? `221${cleanTel}`
        : cleanTel
    const lignes = articles
      .map(
        (a, i) =>
          `${i + 1}. *${a.nom}* — *Qté souhaitée : 20 pcs* (Stock restant : ${a.stock_quantite ?? 0} pcs)`
      )
      .join('\n')
    const message = `Bonjour ${fournisseur.nom},\n\nNous avons un besoin urgent de réapprovisionnement pour notre boutique :\n\n*Articles à réapprovisionner :*\n${lignes}\n\nMerci de nous confirmer la disponibilité, vos prix et le délai de livraison.\n_Envoyé via Nopalou Business_`
    const url = `https://wa.me/${telNorm}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleSoumettreFormFournisseur = async (
    fouEditId: string | null,
    payload: { nom: string; telephone?: string; email?: string; adresse?: string }
  ) => {
    try {
      setIsSubmitting(true)
      let res: any
      if (fouEditId) {
        res = await modifierFournisseur(boutiqueId, fouEditId, payload)
      } else {
        res = await creerFournisseur(boutiqueId, payload)
      }

      if (res?.error) {
        toast.error(res.error)
        return false
      } else {
        toast.success(fouEditId ? 'Fournisseur modifié avec succès !' : 'Fournisseur ajouté avec succès !')
        await chargerDonnees()
        return true
      }
    } catch (err) {
      console.error(err)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSupprimerFournisseur = async (fId: string, nom: string) => {
    if (!confirm(`${t('shop.deleteCustomerMenu')} (${nom}) ?`)) return
    try {
      const res = await supprimerFournisseur(boutiqueId, fId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(t('shop.docDeletedSuccess') || 'Fournisseur supprimé avec succès.')
        await chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreerCommande = async (
    cmdEditId: string | null,
    cmdFournisseurId: string,
    cmdLignes: LigneCommandeForm[],
    cmdJustificatifUrl: string
  ) => {
    if (!cmdFournisseurId) {
      toast.warning('Veuillez sélectionner un fournisseur.')
      return false
    }
    if (cmdLignes.length === 0) {
      toast.warning('Veuillez ajouter au moins un produit à la commande.')
      return false
    }

    try {
      setIsSubmitting(true)
      const itemsFormates = cmdLignes.map((l) => {
        const prod = produits.find((p) => p.id === l.produitId)
        return {
          id: l.produitId,
          nom: l.nomLibre || (prod ? prod.nom : 'Produit inconnu'),
          quantite: l.quantite,
          prix_achat: l.prixAchat,
        }
      })

      const payload = {
        fournisseur_id: cmdFournisseurId,
        items: itemsFormates,
        justificatif_url: cmdJustificatifUrl || null,
      }

      const res = cmdEditId
        ? await modifierCommandeFournisseur(boutiqueId, cmdEditId, payload)
        : await creerCommandeFournisseur(boutiqueId, payload)

      if (res?.error) {
        toast.error(res.error)
        return false
      } else {
        toast.success(cmdEditId ? 'Bon de commande modifié avec succès !' : 'Bon de commande créé avec succès !')
        await chargerDonnees()
        return true
      }
    } catch (err) {
      console.error(err)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmerReception = async (
    cmdId: string,
    receptionJustificatifUrl: string
  ) => {
    try {
      setIsSubmitting(true)
      const res = await recevoirCommandeFournisseur(boutiqueId, cmdId, {
        statut: 'recue',
        justificatif_url: receptionJustificatifUrl || null,
      })
      if (res?.error) {
        toast.error(res.error)
        return false
      } else {
        toast.success('Commande réceptionnée et stocks mis à jour !')
        await chargerDonnees()
        return true
      }
    } catch (err) {
      console.error(err)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadFileCommande = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true)
      const fd = new FormData()
      fd.append('justificatif', file)
      const res = await uploadJustificatifAchat(boutiqueId, fd)
      if (res?.error) {
        toast.error(res.error)
        return null
      } else if (res?.url) {
        return res.url
      }
      return null
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du téléchargement du fichier')
      return null
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSupprimerCommande = async (cmdId: string, ref: string) => {
    if (!confirm(`${t('shop.deleteDocConfirm')} (${ref})`)) return
    try {
      const res = await supprimerCommandeFournisseur(boutiqueId, cmdId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(t('shop.docDeletedSuccess') || 'Bon de commande supprimé avec succès.')
        await chargerDonnees()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return {
    fournisseurs,
    commandes,
    produits,
    loading,
    isSubmitting,
    uploadingFile,
    chargerDonnees,
    envoyerBonCommandeWhatsApp,
    handleSoumettreFormFournisseur,
    handleSupprimerFournisseur,
    handleCreerCommande,
    handleConfirmerReception,
    handleUploadFileCommande,
    handleSupprimerCommande,
  }
}
