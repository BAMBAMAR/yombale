'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/context/ToastContext'
import ModalEntrepotForm from './entrepots/ModalEntrepotForm'
import ModalStockAjustement from './entrepots/ModalStockAjustement'
import EntrepotsGrid from './entrepots/EntrepotsGrid'
import StocksVentilationTable from './entrepots/StocksVentilationTable'
import EntrepotsHeader from './entrepots/EntrepotsHeader'

export interface Entrepot {
  id: string
  boutique_id: string
  nom: string
  adresse: string | null
  ville: string
  responsable: string | null
  telephone: string | null
  est_defaut: boolean
  actif: boolean
  created_at: string
}

export interface StockEntrepot {
  id: string
  produit_id: string
  produit_nom: string
  entrepot_id: string
  entrepot_nom: string
  quantite: number
  seuil_alerte: number
}

interface ProduitSimple {
  id: string
  nom: string
  stock_quantite: number
}

export default function GestionEntrepots({ boutiqueId }: { boutiqueId: string }) {
  const [entrepots, setEntrepots] = useState<Entrepot[]>([])
  const [stocks, setStocks] = useState<StockEntrepot[]>([])
  const [produits, setProduits] = useState<ProduitSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modale Ajout / Édition
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [adresse, setAdresse] = useState('')
  const [ville, setVille] = useState('Dakar')
  const [responsable, setResponsable] = useState('')
  const [telephone, setTelephone] = useState('')
  const [estDefaut, setEstDefaut] = useState(false)
  const [saving, setSaving] = useState(false)

  // Modale Transfert / Ajustement Stock
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProduitId, setSelectedProduitId] = useState('')
  const [selectedEntrepotId, setSelectedEntrepotId] = useState('')
  const [quantiteStock, setQuantiteStock] = useState<number>(0)
  const [savingStock, setSavingStock] = useState(false)
  const { toast } = useToast()

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token') || sessionStorage.getItem('token')
      : null

  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      const [resE, resS, resP] = await Promise.all([
        fetch(`/api/boutiques/${boutiqueId}/entrepots`, { headers }),
        fetch(`/api/boutiques/${boutiqueId}/entrepots/stocks`, { headers }),
        fetch(`/api/boutiques/${boutiqueId}/produits`, { headers }),
      ])

      if (resE.ok) {
        const dataE = await resE.json()
        setEntrepots(dataE.entrepots || [])
      }
      if (resS.ok) {
        const dataS = await resS.json()
        setStocks(dataS.stocks || [])
      }
      if (resP.ok) {
        const dataP = await resP.json()
        setProduits(dataP.produits || [])
      }
    } catch (err: any) {
      console.warn('[GestionEntrepots:chargerDonnees]', err)
      setError('Impossible de charger les données des entrepôts.')
    } finally {
      setLoading(false)
    }
  }, [boutiqueId, token])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  const ouvrirCreation = () => {
    setEditingId(null)
    setNom('')
    setAdresse('')
    setVille('Dakar')
    setResponsable('')
    setTelephone('')
    setEstDefaut(entrepots.length === 0)
    setShowModal(true)
  }

  const ouvrirEdition = (e: Entrepot) => {
    setEditingId(e.id)
    setNom(e.nom)
    setAdresse(e.adresse || '')
    setVille(e.ville || 'Dakar')
    setResponsable(e.responsable || '')
    setTelephone(e.telephone || '')
    setEstDefaut(e.est_defaut)
    setShowModal(true)
  }

  const handleEnregistrerEntrepot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) return
    setSaving(true)
    try {
      const url = editingId
        ? `/api/boutiques/${boutiqueId}/entrepots/${editingId}`
        : `/api/boutiques/${boutiqueId}/entrepots`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nom: nom.trim(),
          adresse: adresse.trim() || null,
          ville: ville.trim() || 'Dakar',
          responsable: responsable.trim() || null,
          telephone: telephone.trim() || null,
          est_defaut: estDefaut,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de l’enregistrement')

      toast.success(editingId ? 'Entrepôt mis à jour avec succès !' : 'Entrepôt créé avec succès !')
      setShowModal(false)
      chargerDonnees()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleEnregistrerStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduitId || !selectedEntrepotId) return
    setSavingStock(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/entrepots/stocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          produit_id: selectedProduitId,
          entrepot_id: selectedEntrepotId,
          quantite: Number(quantiteStock),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de la mise à jour du stock')

      toast.success('Stock de l’entrepôt mis à jour avec succès !')
      setShowStockModal(false)
      chargerDonnees()
    } catch (err: any) {
      toast.error(err.message || 'Erreur mise à jour stock')
    } finally {
      setSavingStock(false)
    }
  }

  const handleAjusterStock = (produitId: string, entrepotId: string, quantite: number) => {
    setSelectedProduitId(produitId)
    setSelectedEntrepotId(entrepotId)
    setQuantiteStock(quantite)
    setShowStockModal(true)
  }

  const totalUnites = stocks.reduce((sum, s) => sum + (Number(s.quantite) || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* En-tête avec statistiques & Boutons */}
      <EntrepotsHeader
        entrepots={entrepots}
        totalUnites={totalUnites}
        ouvrirCreation={ouvrirCreation}
        ouvrirAjustement={() => {
          if (entrepots.length > 0 && produits.length > 0) {
            setSelectedEntrepotId(entrepots[0].id)
            setSelectedProduitId(produits[0].id)
            setQuantiteStock(0)
            setShowStockModal(true)
          } else {
            toast.warning('Veuillez créer au moins un entrepôt et un produit au préalable.')
          }
        }}
      />

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            padding: 14,
            color: '#dc2626',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      {/* Grille des Entrepôts */}
      <EntrepotsGrid
        loading={loading}
        entrepots={entrepots}
        ouvrirCreation={ouvrirCreation}
        ouvrirEdition={ouvrirEdition}
      />

      {/* Tableau de Ventilation des Stocks par Entrepôt */}
      <StocksVentilationTable
        stocks={stocks}
        chargerDonnees={chargerDonnees}
        onAjusterStock={handleAjusterStock}
      />

      {/* Modal Création / Édition Entrepôt */}
      <ModalEntrepotForm
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingId={editingId}
        nom={nom}
        setNom={setNom}
        adresse={adresse}
        setAdresse={setAdresse}
        ville={ville}
        setVille={setVille}
        responsable={responsable}
        setResponsable={setResponsable}
        telephone={telephone}
        setTelephone={setTelephone}
        estDefaut={estDefaut}
        setEstDefaut={setEstDefaut}
        saving={saving}
        handleSubmit={handleEnregistrerEntrepot}
      />

      {/* Modal Ajustement de Stock */}
      <ModalStockAjustement
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        produits={produits}
        entrepots={entrepots}
        selectedProduitId={selectedProduitId}
        setSelectedProduitId={setSelectedProduitId}
        selectedEntrepotId={selectedEntrepotId}
        setSelectedEntrepotId={setSelectedEntrepotId}
        quantiteStock={quantiteStock}
        setQuantiteStock={setQuantiteStock}
        savingStock={savingStock}
        handleSubmit={handleEnregistrerStock}
      />
    </div>
  )
}
