'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getBoutiqueDocuments,
  modifierBoutiqueDocument,
  supprimerBoutiqueDocument,
  getBoutiqueProduits,
} from '../actions'
import type { DocumentBoutique } from './types'
import { showToast } from '@/context/ToastContext'

export function useGestionDocumentsData(boutiqueId: string, t: (key: string) => string) {
  const [documents, setDocuments] = useState<DocumentBoutique[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [typeFiltre, setTypeFiltre] = useState<string>('tous')
  const [clients, setClients] = useState<any[]>([])
  const [produits, setProduits] = useState<any[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [rechercheDoc, setRechercheDoc] = useState<string>('')
  const [statutFiltreDoc, setStatutFiltreDoc] = useState<string>('tous')

  const afficherToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }, [])

  const chargerDonnees = useCallback(async () => {
    const cacheKeyDocs = `nopalou_offline_docs_${boutiqueId}`
    const cacheKeyClients = `nopalou_offline_clients_${boutiqueId}`
    const cacheKeyProds = `nopalou_offline_prods_${boutiqueId}`

    const cDocs = localStorage.getItem(cacheKeyDocs)
    if (cDocs) {
      try {
        setDocuments(JSON.parse(cDocs))
      } catch (e) {
        console.warn('[Nopalou:GestionDocuments:L82]', e)
      }
    }
    const cClients = localStorage.getItem(cacheKeyClients)
    if (cClients) {
      try {
        setClients(JSON.parse(cClients))
      } catch (e) {
        console.warn('[Nopalou:GestionDocuments:L84]', e)
      }
    }
    const cProds = localStorage.getItem(cacheKeyProds)
    if (cProds) {
      try {
        setProduits(JSON.parse(cProds))
      } catch (e) {
        console.warn('[Nopalou:GestionDocuments:L86]', e)
      }
    }

    if (!cDocs) setLoading(true)

    try {
      const docs = await getBoutiqueDocuments(boutiqueId)
      setDocuments(docs || [])
      localStorage.setItem(cacheKeyDocs, JSON.stringify(docs || []))

      // Charger clients
      const resClients = await fetch(`/api/boutiques/${boutiqueId}/credits-clients`)
      if (resClients.ok) {
        const dClients = await resClients.json()
        setClients(dClients.clients || [])
        localStorage.setItem(cacheKeyClients, JSON.stringify(dClients.clients || []))
      }

      // Charger catalogue
      const prods = await getBoutiqueProduits(boutiqueId)
      setProduits(prods || [])
      localStorage.setItem(cacheKeyProds, JSON.stringify(prods || []))
    } catch (err) {
      console.error('Erreur chargement documents:', err)
    } finally {
      setLoading(false)
    }
  }, [boutiqueId])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  const handleConvertirEnFacture = useCallback(
    async (docId: string, ref: string) => {
      try {
        const res = await modifierBoutiqueDocument(boutiqueId, docId, { type: 'facture', statut: 'valide' })
        if (res.error) {
          showToast(res.error, 'error', 'Conversion Facture')
        } else {
          showToast(`Document ${ref} converti en Facture avec succès !`, 'success', 'Facture')
          chargerDonnees()
        }
      } catch (err) {
        console.error('Erreur conversion document:', err)
        showToast('Erreur réseau lors de la conversion', 'error')
      }
    },
    [boutiqueId, chargerDonnees]
  )

  const handleSupprimerDocument = useCallback(
    async (docId: string, ref: string) => {
      try {
        const res = await supprimerBoutiqueDocument(boutiqueId, docId)
        if (res.error) {
          showToast(res.error, 'error', 'Suppression')
        } else {
          showToast(t('shop.docDeletedSuccess') || `Document ${ref} supprimé avec succès`, 'info', 'Suppression')
          chargerDonnees()
        }
      } catch (err) {
        console.error('Erreur suppression document:', err)
        showToast('Erreur lors de la suppression', 'error')
      }
    },
    [boutiqueId, chargerDonnees, t]
  )

  const documentsFiltres = useMemo(() => {
    const qDoc = rechercheDoc.trim().toLowerCase()
    return documents.filter((d) => {
      const matchType = typeFiltre === 'tous' || d.type === typeFiltre
      const matchStatut = statutFiltreDoc === 'tous' || d.statut === statutFiltreDoc
      const matchSearch =
        !qDoc ||
        d.reference?.toLowerCase().includes(qDoc) ||
        d.client_nom?.toLowerCase().includes(qDoc) ||
        d.client_ninea?.toLowerCase().includes(qDoc)
      return matchType && matchStatut && matchSearch
    })
  }, [documents, rechercheDoc, typeFiltre, statutFiltreDoc])

  return {
    documents,
    documentsFiltres,
    clients,
    produits,
    loading,
    typeFiltre,
    setTypeFiltre,
    rechercheDoc,
    setRechercheDoc,
    statutFiltreDoc,
    setStatutFiltreDoc,
    toastMessage,
    afficherToast,
    chargerDonnees,
    handleConvertirEnFacture,
    handleSupprimerDocument,
  }
}
