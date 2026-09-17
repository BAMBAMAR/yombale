'use client'

import React, { useState, useEffect } from 'react'
import { Produit } from '../types'
import { getBoutiqueProduits, declarerVente, addDepense } from '../../actions'
import { fcfa } from '../utils'
import { useTranslation } from '@/i18n/context'
import { useComptaSaisieVoice } from '../hooks/useComptaSaisieVoice'
import { useComptaSaisieScanners } from '../hooks/useComptaSaisieScanners'
import { ComptaSaisieExpressVoiceBanner } from './ComptaSaisieExpressVoiceBanner'
import { ComptaSaisieExpressScanners } from './ComptaSaisieExpressScanners'
import { ComptaSaisieExpressCatalogue } from './ComptaSaisieExpressCatalogue'
import { ComptaSaisieExpressLibre } from './ComptaSaisieExpressLibre'
import { ComptaSaisieExpressPanier } from './ComptaSaisieExpressPanier'
import { ComptaSaisieExpressDepenseForm } from './ComptaSaisieExpressDepenseForm'
import { showToast } from '@/context/ToastContext'

interface ComptaSaisieExpressViewProps {
  boutiqueId: string
}

export function ComptaSaisieExpressView({ boutiqueId }: ComptaSaisieExpressViewProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'vente' | 'depense'>('vente')
  const [produits, setProduits] = useState<Produit[]>([])

  // Modes d'ajout Vente Express
  const [modeSaisie, setModeSaisie] = useState<'catalogue' | 'libre'>('catalogue')

  // Panier Mixte Vente Express
  const [panierProduits, setPanierProduits] = useState<Record<string, number>>({}) // produitId -> qte
  const [itemsCustomPanier, setItemsCustomPanier] = useState<Array<{ id: string; nom: string; prix: number; quantite: number }>>([])

  // Saisie Libre
  const [libelleCustomInput, setLibelleCustomInput] = useState('')
  const [prixCustomInput, setPrixCustomInput] = useState('')
  const [qteCustomInput, setQteCustomInput] = useState(1)

  // Paramètres Vente
  const [methodePaiement, setMethodePaiement] = useState('especes')
  const [clientNom, setClientNom] = useState('')

  // Dépense
  const [montantDepense, setMontantDepense] = useState('')
  const [catDepense, setCatDepense] = useState('stock')
  const [descDepense, setDescDepense] = useState('')

  const [loading, setLoading] = useState(false)
  const [msgSuccess, setMsgSuccess] = useState('')

  useEffect(() => {
    getBoutiqueProduits(boutiqueId).then(p => setProduits(p || [])).catch(() => {})
  }, [boutiqueId])

  // ── Actions Panier Catalogue ──
  const handleAjouterProduitCatalogue = (p: any, delta = 1) => {
    setPanierProduits(prev => {
      const current = prev[p.id] || 0
      const next = current + delta
      const copy = { ...prev }
      if (next <= 0) {
        delete copy[p.id]
      } else {
        copy[p.id] = next
      }
      return copy
    })
  }

  // ── Actions Panier Saisie Libre ──
  const handleAjouterItemLibre = () => {
    const libelle = libelleCustomInput.trim()
    const prix = Number(prixCustomInput)
    const qte = Number(qteCustomInput) || 1

    if (!libelle) {
      showToast('Veuillez saisir le nom ou libellé de l’article.', 'warning', 'Saisie Libre')
      return
    }
    if (isNaN(prix) || prix <= 0) {
      showToast('Veuillez saisir un prix unitaire valide (> 0).', 'warning', 'Saisie Libre')
      return
    }

    setItemsCustomPanier(prev => [
      ...prev,
      {
        id: 'custom_' + Date.now(),
        nom: libelle,
        prix: prix,
        quantite: qte
      }
    ])

    setLibelleCustomInput('')
    setPrixCustomInput('')
    setQteCustomInput(1)
  }

  const handleViderPanier = () => {
    if (Object.keys(panierProduits).length === 0 && itemsCustomPanier.length === 0) return
    if (confirm(t('shop.confirmEmptyCart') || 'Voulez-vous vider tous les articles de cette vente ?')) {
      setPanierProduits({})
      setItemsCustomPanier([])
    }
  }

  // ── Hooks Déportés : Scanners & Assistant Vocal ──
  const {
    isListeningVoice,
    voiceFeedback,
    demarrerEcouteVocale,
  } = useComptaSaisieVoice({
    mode,
    setMode,
    setModeSaisie,
    setMontantDepense,
    setCatDepense,
    setDescDepense,
    setPrixCustomInput,
    setLibelleCustomInput,
  })

  const {
    modalScannerEan,
    scannerEanStatus,
    scanContinu,
    setScanContinu,
    demarrerScannerEan,
    arreterScannerEan,
    modalScannerNom,
    statusScannerNom,
    imageFligeeComptaNom,
    ocrLoading,
    ocrDetections,
    videoNomRef,
    demarrerScannerNom,
    arreterScannerNom,
    capturerNomOCR,
  } = useComptaSaisieScanners({
    produits,
    handleAjouterProduitCatalogue,
    setLibelleCustomInput,
    setModeSaisie,
  })

  // ── Calculs Panier ──
  const totalPanierCatalogue = Object.entries(panierProduits).reduce((sum, [pId, qte]) => {
    const p = produits.find(item => item.id === pId)
    const prixU = p ? Number(p.prix || 0) : 0
    return sum + (prixU * qte)
  }, 0)

  const totalPanierCustom = itemsCustomPanier.reduce((sum, item) => sum + (item.prix * item.quantite), 0)
  const totalVente = totalPanierCatalogue + totalPanierCustom
  const nbArticlesTotal = Object.values(panierProduits).reduce((a, b) => a + b, 0) + itemsCustomPanier.reduce((a, b) => a + b.quantite, 0)

  // ── Soumission Vente Express ──
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
      setTimeout(() => setMsgSuccess(''), 3500)
    } else {
      showToast('Certaines lignes de vente n’ont pas pu être enregistrées.', 'error', 'Erreur Vente')
    }
  }

  // ── Soumission Dépense ──
  const handleValiderDepenseRapide = async (e: React.FormEvent) => {
    e.preventDefault()
    const mNum = Number(montantDepense) || 0
    if (mNum <= 0) {
      showToast('Veuillez saisir un montant valide.', 'warning', 'Dépense')
      return
    }

    setLoading(true)
    const res = await addDepense(boutiqueId, {
      montant: mNum,
      categorie: catDepense,
      description: descDepense.trim() || undefined,
    })

    setLoading(false)
    if (res.success) {
      showToast('Dépense enregistrée avec succès !', 'success', 'Dépense')
      setMsgSuccess('Dépense enregistrée avec succès !')
      setMontantDepense('')
      setDescDepense('')
      setTimeout(() => setMsgSuccess(''), 3000)
    } else {
      showToast(res.error || 'Erreur lors de l’enregistrement', 'error', 'Erreur Dépense')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Assistant Vocal */}
      <ComptaSaisieExpressVoiceBanner
        isListeningVoice={isListeningVoice}
        demarrerEcouteVocale={demarrerEcouteVocale}
        voiceFeedback={voiceFeedback}
      />

      {/* Selector Mode Vente / Dépense */}
      <div style={{ display: 'flex', gap: 10, background: '#f1f5f9', padding: 6, borderRadius: 16, border: '1px solid #cbd5e1' }}>
        <button
          type="button"
          onClick={() => setMode('vente')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none',
            background: mode === 'vente' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
            color: mode === 'vente' ? '#ffffff' : '#475569',
            fontWeight: 900, fontSize: 14.5, cursor: 'pointer',
            boxShadow: mode === 'vente' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          + {t('shop.quickSaleEncashment')}
        </button>

        <button
          type="button"
          onClick={() => setMode('depense')}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none',
            background: mode === 'depense' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
            color: mode === 'depense' ? '#ffffff' : '#475569',
            fontWeight: 900, fontSize: 14.5, cursor: 'pointer',
            boxShadow: mode === 'depense' ? '0 4px 14px rgba(239, 68, 68, 0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
        >
          - {t('shop.quickExpenseCashOut')}
        </button>
      </div>

      {msgSuccess && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', padding: '14px 18px', borderRadius: 14, fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
          {msgSuccess}
        </div>
      )}

      {mode === 'vente' ? (
        <form onSubmit={handleValiderVenteRapide} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                {t('shop.quickSaleTitle')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                {t('shop.quickSaleSubtitle')}
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              {t('shop.expressEntryTitle')}
            </span>
          </div>

          {/* Onglets Catalogue vs Saisie Libre */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 12, flex: 1 }}>
              <button
                type="button"
                onClick={() => setModeSaisie('catalogue')}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                  background: modeSaisie === 'catalogue' ? '#ffffff' : 'transparent',
                  fontWeight: modeSaisie === 'catalogue' ? 800 : 600,
                  color: modeSaisie === 'catalogue' ? '#0f172a' : '#64748b',
                  fontSize: 13, cursor: 'pointer',
                  boxShadow: modeSaisie === 'catalogue' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {t('shop.catalogModeTab')} ({produits.length})
              </button>
              <button
                type="button"
                onClick={() => setModeSaisie('libre')}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                  background: modeSaisie === 'libre' ? '#ffffff' : 'transparent',
                  fontWeight: modeSaisie === 'libre' ? 800 : 600,
                  color: modeSaisie === 'libre' ? '#0f172a' : '#64748b',
                  fontSize: 13, cursor: 'pointer',
                  boxShadow: modeSaisie === 'libre' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {t('shop.manualModeTab')}
              </button>
            </div>

            <button
              type="button"
              onClick={demarrerScannerEan}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#0284c7', color: '#ffffff', border: 'none',
                padding: '9px 14px', borderRadius: 10, fontSize: 12.5,
                fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2,132,199,0.25)', whiteSpace: 'nowrap'
              }}
            >
              {t('shop.scanEanBtn')}
            </button>
          </div>

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
            onRemoveItemCustom={(idx) => setItemsCustomPanier(prev => prev.filter((_, i) => i !== idx))}
            onViderPanier={handleViderPanier}
            loading={loading}
          />
        </form>
      ) : (
        <ComptaSaisieExpressDepenseForm
          montantDepense={montantDepense}
          setMontantDepense={setMontantDepense}
          catDepense={catDepense}
          setCatDepense={setCatDepense}
          descDepense={descDepense}
          setDescDepense={setDescDepense}
          ocrDetections={ocrDetections}
          onDemarrerScannerNom={demarrerScannerNom}
          onValiderDepenseRapide={handleValiderDepenseRapide}
          loading={loading}
        />
      )}

      {/* Scanners EAN et Nom OCR */}
      <ComptaSaisieExpressScanners
        modalScannerEan={modalScannerEan}
        scannerEanStatus={scannerEanStatus}
        scanContinu={scanContinu}
        onScanContinuChange={setScanContinu}
        onCloseScannerEan={arreterScannerEan}
        modalScannerNom={modalScannerNom}
        statusScannerNom={statusScannerNom}
        imageFligeeComptaNom={imageFligeeComptaNom}
        ocrLoading={ocrLoading}
        videoNomRef={videoNomRef}
        onCloseScannerNom={arreterScannerNom}
        onCapturerNomOCR={capturerNomOCR}
      />
    </div>
  )
}
