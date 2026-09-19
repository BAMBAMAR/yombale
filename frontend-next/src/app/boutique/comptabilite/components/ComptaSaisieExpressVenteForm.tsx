'use client'

import React from 'react'
import { ScanBarcode } from 'lucide-react'
import { Produit } from '../types'
import { declarerVente } from '../../actions'
import { fcfa } from '../utils'
import { showToast } from '@/context/ToastContext'
import { ComptaSaisieExpressCatalogue } from './ComptaSaisieExpressCatalogue'
import { ComptaSaisieExpressLibre } from './ComptaSaisieExpressLibre'
import { ComptaSaisieExpressPanier } from './ComptaSaisieExpressPanier'

interface ComptaSaisieExpressVenteFormProps {
  boutiqueId: string
  produits: Produit[]
  panierProduits: Record<string, number>
  setPanierProduits: React.Dispatch<React.SetStateAction<Record<string, number>>>
  itemsCustomPanier: Array<{ id: string; nom: string; prix: number; quantite: number }>
  setItemsCustomPanier: React.Dispatch<React.SetStateAction<Array<{ id: string; nom: string; prix: number; quantite: number }>>>
  modeSaisie: 'catalogue' | 'libre'
  setModeSaisie: (m: 'catalogue' | 'libre') => void
  libelleCustomInput: string
  setLibelleCustomInput: (v: string) => void
  prixCustomInput: string
  setPrixCustomInput: (v: string) => void
  qteCustomInput: number
  setQteCustomInput: (v: number) => void
  ocrDetections: string[]
  demarrerScannerEan: () => void
  demarrerScannerNom: () => void
  handleAjouterProduitCatalogue: (p: any, delta?: number) => void
  handleAjouterItemLibre: () => void
  handleUpdateItemCustom: (idx: number, delta: number) => void
  handleRemoveItemCustom: (idx: number) => void
  handleViderPanier: () => void
  nbArticlesTotal: number
  totalVente: number
  methodePaiement: string
  setMethodePaiement: (v: string) => void
  clientNom: string
  setClientNom: (v: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
  t: (key: string) => string
}

export function ComptaSaisieExpressVenteForm({
  boutiqueId,
  produits,
  panierProduits,
  setPanierProduits,
  itemsCustomPanier,
  setItemsCustomPanier,
  modeSaisie,
  setModeSaisie,
  libelleCustomInput,
  setLibelleCustomInput,
  prixCustomInput,
  setPrixCustomInput,
  qteCustomInput,
  setQteCustomInput,
  ocrDetections,
  demarrerScannerEan,
  demarrerScannerNom,
  handleAjouterProduitCatalogue,
  handleAjouterItemLibre,
  handleUpdateItemCustom,
  handleRemoveItemCustom,
  handleViderPanier,
  nbArticlesTotal,
  totalVente,
  methodePaiement,
  setMethodePaiement,
  clientNom,
  setClientNom,
  loading,
  setLoading,
  t,
}: ComptaSaisieExpressVenteFormProps) {
  const handleValiderVenteRapide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nbArticlesTotal === 0) {
      showToast('Veuillez ajouter au moins un produit du catalogue ou un article libre au panier.', 'warning', 'Vente Express')
      return
    }

    setLoading(true)
    let erreurs = 0

    for (const [pId, qte] of Object.entries(panierProduits)) {
      if (qte <= 0) continue
      const prod = produits.find(p => p.id === pId)
      const res = await declarerVente(boutiqueId, {
        produit_id: pId,
        quantite: qte,
        prix_unitaire: Number(prod?.prix || 0),
        methode_paiement: methodePaiement,
        client_nom: clientNom.trim() || undefined,
      })
      if (!res.success) erreurs++
    }

    for (const item of itemsCustomPanier) {
      const res = await declarerVente(boutiqueId, {
        nom_produit: item.nom,
        quantite: item.quantite,
        prix_unitaire: item.prix,
        methode_paiement: methodePaiement,
        client_nom: clientNom.trim() || undefined,
      })
      if (!res.success) erreurs++
    }

    setLoading(false)
    if (erreurs === 0) {
      showToast(`Vente de ${nbArticlesTotal} article(s) (${fcfa(totalVente)}) enregistrée avec succès !`, 'success', 'Vente Réussie')
      setPanierProduits({})
      setItemsCustomPanier([])
      setClientNom('')
    } else {
      showToast('Certaines lignes de vente n’ont pas pu être enregistrées.', 'error', 'Erreur Vente')
    }
  }

  return (
    <form
      onSubmit={handleValiderVenteRapide}
      style={{
        background: '#ffffff',
        border: '1.5px solid var(--border, #E8DDD2)',
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 4px 16px rgba(28, 43, 74, 0.04)',
      }}
    >

      {/* Onglets Catalogue vs Saisie Libre + Scanner EAN STRICTEMENT sur la même ligne */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'nowrap',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'var(--bg, #F8F5F0)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--border, #E8DDD2)',
            flex: 1,
            minWidth: 0,
          }}
        >
          {(['catalogue', 'libre'] as const).map((sMode) => (
            <button
              key={sMode}
              type="button"
              onClick={() => setModeSaisie(sMode)}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: 8,
                border: 'none',
                background: modeSaisie === sMode ? '#ffffff' : 'transparent',
                fontWeight: modeSaisie === sMode ? 800 : 600,
                color: modeSaisie === sMode ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: modeSaisie === sMode ? '0 2px 4px rgba(28, 43, 74, 0.06)' : 'none',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{sMode === 'catalogue' ? t('shop.catalogModeTab') : t('shop.manualModeTab')}</span>
              {sMode === 'catalogue' && (
                <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.9 }}>
                  ({produits.length})
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={demarrerScannerEan}
          title={t('shop.scanEanBtn') || 'Scan EAN'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            border: 'none',
            padding: '7px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(28, 43, 74, 0.18)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            height: 36,
            transition: 'all 0.15s ease',
          }}
        >
          <ScanBarcode size={15} />
          <span>{t('shop.scanEanBtn')}</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: nbArticlesTotal > 0 ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
          gap: 14,
          alignItems: 'start',
        }}
      >
        {/* Colonne 1 : Sélection Articles (Catalogue ou Saisie Libre) */}
        <div>
          {modeSaisie === 'catalogue' ? (
            <ComptaSaisieExpressCatalogue
              produits={produits}
              panierProduits={panierProduits}
              onAjouterProduitCatalogue={handleAjouterProduitCatalogue}
            />
          ) : (
            <ComptaSaisieExpressLibre
              libelleCustomInput={libelleCustomInput}
              setLibelleCustomInput={setLibelleCustomInput}
              prixCustomInput={prixCustomInput}
              setPrixCustomInput={setPrixCustomInput}
              qteCustomInput={qteCustomInput}
              setQteCustomInput={setQteCustomInput}
              ocrDetections={ocrDetections}
              onDemarrerScannerNom={demarrerScannerNom}
              onAjouterItemLibre={handleAjouterItemLibre}
            />
          )}
        </div>

        {/* Colonne 2 : Panier & Encaissement Direct (s'affiche dès qu'au moins 1 article est sélectionné) */}
        {nbArticlesTotal > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ComptaSaisieExpressPanier
              produits={produits}
              panierProduits={panierProduits}
              itemsCustomPanier={itemsCustomPanier}
              nbArticlesTotal={nbArticlesTotal}
              totalVente={totalVente}
              methodePaiement={methodePaiement}
              setMethodePaiement={setMethodePaiement}
              clientNom={clientNom}
              setClientNom={setClientNom}
              onAjouterProduitCatalogue={handleAjouterProduitCatalogue}
              onRemoveItemCustom={handleRemoveItemCustom}
              onUpdateItemCustom={handleUpdateItemCustom}
              onViderPanier={handleViderPanier}
              loading={loading}
            />
          </div>
        )}
      </div>
    </form>
  )
}
