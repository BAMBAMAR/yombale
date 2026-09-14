'use client'

import React, { useState, useTransition } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import type { Boutique, Produit } from './boutiqueTypes'
import ModalPartageProduit from '@/components/ModalPartageProduit'
import BatchImportModal from './BatchImportModal'
import ProduitForm from './ProduitForm'
import {
  duplicateProduit,
  deleteProduit,
  publierProduitAnnonce,
} from './actions'
import { useCatalogueProduitsData } from './catalogue/useCatalogueProduitsData'
import CataloguePlanGate from './catalogue/CataloguePlanGate'
import CatalogueToolbar from './catalogue/CatalogueToolbar'
import CatalogueBatchBar from './catalogue/CatalogueBatchBar'
import CatalogueProductCard from './catalogue/CatalogueProductCard'
import ModalDupliquerProduit from './catalogue/ModalDupliquerProduit'

function CatalogueProduits({
  boutique,
  planActif,
  prixPro,
  filtreInitial,
  userId: userIdProp,
}: {
  boutique: Boutique
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  prixPro: number
  filtreInitial?: 'jamais_partage'
  userId?: string
}) {
  const { t, formatNumber } = useTranslation()
  const userId = userIdProp || 'anonymous'
  const [mode, setMode] = useState<'list' | { creating: 'rapide' | 'detaille' } | { editing: Produit }>('list')
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [produitADupliquer, setProduitADupliquer] = useState<Produit | null>(null)
  const [partageModalData, setPartageModalData] = useState<{ produit: Produit; isNew?: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
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
  } = useCatalogueProduitsData({ boutique, userId, filtreInitial })

  if (!planActif && !boutique.is_trial) {
    return <CataloguePlanGate prixPro={prixPro} />
  }

  if (typeof mode === 'object' && ('creating' in mode || 'editing' in mode)) {
    const editing = 'editing' in mode ? mode.editing : undefined
    return (
      <div style={{ maxWidth: 560 }}>
        <ProduitForm
          boutiqueId={boutique.id}
          boutiqueCat={boutique.categorie}
          produit={editing}
          modeInitial={'creating' in mode ? mode.creating : 'detaille'}
          onCancel={() => setMode('list')}
          onSuccess={(produitCree) => {
            setMode('list')
            setSuccessMsg(editing ? 'Produit modifié !' : 'Produit ajouté au catalogue !')
            loadProduits()
            if (!editing && produitCree) {
              setPartageModalData({ produit: produitCree, isNew: true })
            }
          }}
        />
      </div>
    )
  }

  const countEnStock = produits.filter((p) => {
    const q = p.quantite_stock ?? p.stock_quantite
    return q != null ? q > 0 : p.en_stock !== false
  }).length

  const countRupture = produits.filter((p) => {
    const q = p.quantite_stock ?? p.stock_quantite
    return q != null ? q <= 0 : p.en_stock === false
  }).length

  const countWhatsApp = produits.filter(
    (p) => p.whatsapp_sync_statut === 'synchronise'
  ).length

  const handleDuplicateConfirm = async (nom: string, prix?: number, stock?: number) => {
    if (!produitADupliquer) return
    startTransition(async () => {
      const res = await duplicateProduit(boutique.id, produitADupliquer.id, {
        nom,
        prix,
        stock_quantite: stock,
      })
      if (res?.error) {
        alert(res.error)
      } else {
        setSuccessMsg('Produit dupliqué avec succès !')
        setProduitADupliquer(null)
        loadProduits()
      }
    })
  }

  const handleDeleteProduct = (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    setDeleteError(null)
    startTransition(async () => {
      const res = await deleteProduit(boutique.id, id)
      if (res?.error) {
        setDeleteError(res.error)
      } else {
        setSuccessMsg('Produit supprimé.')
        loadProduits()
      }
    })
  }

  const handlePublishAd = (id: string) => {
    if (!confirm('Publier ce produit comme annonce classifiée ?')) return
    startTransition(async () => {
      const res = await publierProduitAnnonce(boutique.id, id)
      if (res?.error) alert(res.error)
      else if (res?.besoin_paiement) alert(res.message)
      else {
        setSuccessMsg(res?.message || 'Publié avec succès en annonce !')
      }
    })
  }

  return (
    <div>
      {showBatchModal && (
        <BatchImportModal
          boutiqueId={boutique.id}
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => loadProduits()}
        />
      )}

      <ModalDupliquerProduit
        produit={produitADupliquer}
        onFermer={() => setProduitADupliquer(null)}
        onConfirmer={handleDuplicateConfirm}
        isPending={isPending}
      />

      <CatalogueToolbar
        totalCount={produits.length}
        filtreStock={filtreStock}
        setFiltreStock={setFiltreStock}
        filtreStatut={filtreStatut}
        setFiltreStatut={setFiltreStatut}
        rechercheTexte={rechercheTexte}
        setRechercheTexte={setRechercheTexte}
        triOption={triOption}
        setTriOption={setTriOption}
        categoriesDisponibles={categoriesDisponibles}
        filtreCategorie={filtreCategorie}
        setFiltreCategorie={setFiltreCategorie}
        selectedCount={selectedProdIds.size}
        filteredCount={produitsFiltres.length}
        onToggleSelectAll={() => toggleSelectAll(produitsFiltres)}
        onAjouterProduitRapide={() => setMode({ creating: 'rapide' })}
        onAjouterProduitDetaille={() => setMode({ creating: 'detaille' })}
        onImporterCSV={() => setShowBatchModal(true)}
        countEnStock={countEnStock}
        countRupture={countRupture}
        countWhatsApp={countWhatsApp}
      />

      {successMsg && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#16a34a',
            fontSize: 13.5,
            marginBottom: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {deleteError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#dc2626',
            fontSize: 13.5,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertTriangle size={16} />
          <span>{deleteError}</span>
        </div>
      )}

      <CatalogueBatchBar
        count={selectedProdIds.size}
        batchLoading={batchLoading}
        onShareWhatsApp={handleBatchShareWhatsApp}
        onBatchStock={handleBatchStock}
        onCopyList={handleBatchCopyList}
        onBatchDelete={handleBatchDelete}
        onClearSelection={() => setSelectedProdIds(new Set())}
      />

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : produits.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 20px',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px dashed #d1d5db',
          }}
        >
          <p style={{ color: '#6b7280', margin: '0 0 16px' }}>Aucun produit dans votre catalogue.</p>
          <button
            onClick={() => setMode({ creating: 'rapide' })}
            style={{
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Ajouter mon premier produit
          </button>
        </div>
      ) : produitsFiltres.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 20px',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px dashed #d1d5db',
          }}
        >
          <p style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 6px' }}>
            Aucun produit ne correspond à vos filtres
          </p>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 14px' }}>
            Essayez de modifier votre recherche ou réinitialisez les critères.
          </p>
          <button
            type="button"
            onClick={() => {
              setRechercheTexte('')
              setFiltreStock('tous')
              setFiltreStatut('tous')
              setFiltreCategorie('toutes')
            }}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {produitsFiltres.map((p) => (
            <CatalogueProductCard
              key={p.id}
              produit={p}
              boutique={boutique}
              isSelected={selectedProdIds.has(p.id)}
              onToggleSelect={(id) => {
                const next = new Set(selectedProdIds)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                setSelectedProdIds(next)
              }}
              editingStockId={editingStockId}
              stockInputVal={stockInputVal}
              onSetEditingStockId={setEditingStockId}
              onSetStockInputVal={setStockInputVal}
              onSaveStock={saveStock}
              onEdit={(prod) => setMode({ editing: prod })}
              onShare={(prod) => setPartageModalData({ produit: prod, isNew: false })}
              onDuplicate={(prod) => setProduitADupliquer(prod)}
              onDelete={handleDeleteProduct}
              onPublishAd={handlePublishAd}
              formatNumber={formatNumber}
            />
          ))}
        </div>
      )}

      {partageModalData && (
        <ModalPartageProduit
          isOpen={!!partageModalData}
          onClose={() => setPartageModalData(null)}
          produit={partageModalData.produit}
          boutique={boutique}
          isNewlyCreated={partageModalData.isNew}
        />
      )}
    </div>
  )
}

export default CatalogueProduits
export { CatalogueProduits }
