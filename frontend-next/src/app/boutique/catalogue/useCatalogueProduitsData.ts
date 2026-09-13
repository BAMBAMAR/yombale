'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import {
  getBoutiqueProduits,
  deleteProduit,
  updateStock,
  duplicateProduit,
  publierProduitAnnonce,
} from '../actions'
import { fcfa } from '@/lib/format'
import { sauvegarderProduitsLocaux, obtenirProduitsLocaux } from '@/lib/db-offline'
import type { Boutique, Produit } from '../boutiqueTypes'

export function useCatalogueProduitsData({
  boutique,
  userId = 'anonymous',
  filtreInitial,
}: {
  boutique: Boutique
  userId?: string
  filtreInitial?: 'jamais_partage'
}) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [rechercheTexte, setRechercheTexte] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<
    'tous' | 'synchronise' | 'en_attente' | 'echec' | 'jamais_partage'
  >(filtreInitial ?? 'tous')
  const [filtreCategorie, setFiltreCategorie] = useState<string>('toutes')
  const [, startTransition] = useTransition()
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [stockInputVal, setStockInputVal] = useState<string>('')
  const [selectedProdIds, setSelectedProdIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)
  const [triOption, setTriOption] = useState<
    'recent' | 'ancien' | 'prix_asc' | 'prix_desc' | 'stock_rupture' | 'stock_dispo' | 'alpha'
  >('recent')
  const [filtreStock, setFiltreStock] = useState<'tous' | 'en_stock' | 'rupture'>('tous')

  const loadProduits = useCallback(async () => {
    setLoading(true)
    try {
      const prods = await getBoutiqueProduits(boutique.id)
      if (prods && Array.isArray(prods) && prods.length > 0) {
        setProduits(prods)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nopalou_pos_produits_${boutique.id}`, JSON.stringify(prods))
        }
        sauvegarderProduitsLocaux(prods, boutique.id, userId).catch(() => {})
      } else if (prods && Array.isArray(prods) && prods.length === 0 && typeof window !== 'undefined') {
        const pingOk = await fetch('/api/ping', { cache: 'no-store', signal: AbortSignal.timeout(3000) })
          .then((r) => r.ok)
          .catch(() => false)
        if (pingOk) {
          const cachedExistants = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
          if (!cachedExistants || cachedExistants.length === 0) {
            setProduits([])
          } else {
            setProduits(cachedExistants)
          }
        } else {
          const cached = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
          if (cached && cached.length > 0) {
            setProduits(cached)
          } else {
            const localProds = localStorage.getItem(`nopalou_pos_produits_${boutique.id}`)
            if (localProds) {
              try {
                const parsed = JSON.parse(localProds)
                if (Array.isArray(parsed)) setProduits(parsed)
              } catch (err) {
                console.warn('[Nopalou:useCatalogueProduitsData]', err)
              }
            }
          }
        }
      } else {
        const cached = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
        if (cached && cached.length > 0) {
          setProduits(cached)
        } else {
          const localProds = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) : null
          if (localProds) {
            try {
              const parsed = JSON.parse(localProds)
              if (Array.isArray(parsed) && parsed.length > 0) setProduits(parsed)
              else setProduits([])
            } catch {
              setProduits([])
            }
          } else {
            setProduits([])
          }
        }
      }
    } catch {
      const cached = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
      if (cached && cached.length > 0) {
        setProduits(cached)
      } else {
        const localProds = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) : null
        if (localProds) {
          try {
            const parsed = JSON.parse(localProds)
            if (Array.isArray(parsed) && parsed.length > 0) setProduits(parsed)
            else setProduits([])
          } catch {
            setProduits([])
          }
        } else {
          setProduits([])
        }
      }
    } finally {
      setLoading(false)
    }
  }, [boutique.id, userId])

  useEffect(() => {
    loadProduits()
  }, [loadProduits])

  const saveStock = async (produitId: string) => {
    const val = Number(stockInputVal)
    if (isNaN(val) || val < 0) return
    setProduits((prev) =>
      prev.map((item) =>
        item.id === produitId
          ? { ...item, stock_quantite: val, quantite_stock: val, en_stock: val > 0 }
          : item
      )
    )
    startTransition(async () => {
      const res = await updateStock(boutique.id, produitId, val)
      if (res?.error) {
        alert(res.error)
        loadProduits()
      } else {
        setEditingStockId(null)
        loadProduits()
      }
    })
  }

  const handleBatchStock = async (enStock: boolean) => {
    if (selectedProdIds.size === 0) return
    try {
      setBatchLoading(true)
      const ids = Array.from(selectedProdIds)
      const targetQty = enStock ? 10 : 0

      setProduits((prev) =>
        prev.map((p) => {
          if (!selectedProdIds.has(p.id)) return p
          return {
            ...p,
            en_stock: enStock,
            stock_quantite: targetQty,
            quantite_stock: targetQty,
          }
        })
      )

      await Promise.all(ids.map((id) => updateStock(boutique.id, id, targetQty)))

      setSuccessMsg(`${ids.length} produit(s) marqué(s) comme ${enStock ? 'en stock' : 'en rupture'}.`)
      setSelectedProdIds(new Set())
      loadProduits()
    } catch (err) {
      console.error(err)
      setDeleteError('Erreur lors de la mise à jour du stock par lot')
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedProdIds.size === 0) return
    if (!confirm(`Supprimer définitivement les ${selectedProdIds.size} produits sélectionnés ?`)) return
    try {
      setBatchLoading(true)
      setDeleteError(null)
      const ids = Array.from(selectedProdIds)

      await Promise.all(ids.map((id) => deleteProduit(boutique.id, id)))

      setProduits((prev) => prev.filter((p) => !selectedProdIds.has(p.id)))
      setSuccessMsg(`${ids.length} produit(s) supprimé(s) avec succès.`)
      setSelectedProdIds(new Set())
      loadProduits()
    } catch (err) {
      console.error(err)
      setDeleteError('Erreur lors de la suppression par lot')
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchShareWhatsApp = () => {
    const prods = produits.filter((p) => selectedProdIds.has(p.id))
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
    const contact = boutique.whatsapp || boutique.telephone || ''
    const msg =
      `*Découvrez notre sélection chez ${boutique.nom} !*\n\n` +
      prods
        .map(
          (p, i) =>
            `${i + 1}. *${p.nom}* — ${p.prix ? fcfa(p.prix) : 'Prix sur demande'}\n${siteUrl}/boutiques/${
              boutique.slug || boutique.id
            }/produits/${p.id}`
        )
        .join('\n\n') +
      `\n\nLivraison disponible à ${boutique.ville || 'Dakar'}\n${
        contact ? `Commandez directement au ${contact} !` : ''
      }`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleBatchCopyList = () => {
    const prods = produits.filter((p) => selectedProdIds.has(p.id))
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
    const msg =
      `*Sélection ${boutique.nom}* :\n\n` +
      prods
        .map(
          (p) =>
            `• ${p.nom} : ${p.prix ? fcfa(p.prix) : 'Prix sur demande'} (${siteUrl}/boutiques/${
              boutique.slug || boutique.id
            }/produits/${p.id})`
        )
        .join('\n')
    navigator.clipboard.writeText(msg)
    setSuccessMsg('Liste des produits copiée dans le presse-papier !')
  }

  const toggleSelectAll = (filteredProds: Produit[]) => {
    if (selectedProdIds.size === filteredProds.length && filteredProds.length > 0) {
      setSelectedProdIds(new Set())
    } else {
      setSelectedProdIds(new Set(filteredProds.map((p) => p.id)))
    }
  }

  const categoriesDisponibles = Array.from(
    new Set(produits.map((p) => p.categorie).filter(Boolean))
  ) as string[]

  const produitsFiltres = produits
    .filter((p) => {
      if (rechercheTexte.trim()) {
        const q = rechercheTexte.toLowerCase().trim()
        const matchNom = p.nom?.toLowerCase().includes(q) || false
        const matchDesc = p.description?.toLowerCase().includes(q) || false
        const matchCat = p.categorie?.toLowerCase().includes(q) || false
        const matchCode = (p as any).code_barre
          ? String((p as any).code_barre).toLowerCase().includes(q)
          : false
        const matchPrix = p.prix ? String(p.prix).includes(q) : false
        if (!matchNom && !matchDesc && !matchCat && !matchCode && !matchPrix) return false
      }

      if (filtreStatut === 'jamais_partage') {
        if (p.partage_le) return false
      } else if (filtreStatut !== 'tous' && (p.whatsapp_sync_statut || 'en_attente') !== filtreStatut) {
        return false
      }

      if (filtreCategorie !== 'toutes' && p.categorie !== filtreCategorie) return false

      if (filtreStock === 'en_stock') {
        const qty = p.quantite_stock ?? p.stock_quantite
        if (qty != null ? qty <= 0 : p.en_stock === false) return false
      } else if (filtreStock === 'rupture') {
        const qty = p.quantite_stock ?? p.stock_quantite
        if (qty != null ? qty > 0 : p.en_stock !== false) return false
      }

      return true
    })
    .sort((a, b) => {
      if (triOption === 'recent') {
        return (
          new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime()
        )
      }
      if (triOption === 'ancien') {
        return (
          new Date((a as any).created_at || 0).getTime() - new Date((b as any).created_at || 0).getTime()
        )
      }
      if (triOption === 'prix_asc') {
        return (a.prix || 0) - (b.prix || 0)
      }
      if (triOption === 'prix_desc') {
        return (b.prix || 0) - (a.prix || 0)
      }
      if (triOption === 'stock_rupture') {
        const aStock = a.quantite_stock ?? a.stock_quantite ?? (a.en_stock !== false ? 1 : 0)
        const bStock = b.quantite_stock ?? b.stock_quantite ?? (b.en_stock !== false ? 1 : 0)
        return aStock - bStock
      }
      if (triOption === 'stock_dispo') {
        const aStock = a.quantite_stock ?? a.stock_quantite ?? (a.en_stock !== false ? 1 : 0)
        const bStock = b.quantite_stock ?? b.stock_quantite ?? (b.en_stock !== false ? 1 : 0)
        return bStock - aStock
      }
      if (triOption === 'alpha') {
        return a.nom.localeCompare(b.nom)
      }
      return 0
    })

  return {
    produits,
    produitsFiltres,
    loading,
    rechercheTexte,
    setRechercheTexte,
    filtreStatut,
    setFiltreStatut,
    filtreCategorie,
    setFiltreCategorie,
    filtreStock,
    setFiltreStock,
    triOption,
    setTriOption,
    selectedProdIds,
    setSelectedProdIds,
    batchLoading,
    editingStockId,
    setEditingStockId,
    stockInputVal,
    setStockInputVal,
    successMsg,
    setSuccessMsg,
    deleteError,
    setDeleteError,
    categoriesDisponibles,
    loadProduits,
    saveStock,
    handleBatchStock,
    handleBatchDelete,
    handleBatchShareWhatsApp,
    handleBatchCopyList,
    toggleSelectAll,
  }
}
