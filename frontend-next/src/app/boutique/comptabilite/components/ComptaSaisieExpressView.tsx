'use client'

import React, { useState, useEffect } from 'react'
import { Produit } from '../types'
import { getBoutiqueProduits, addDepense } from '../../actions'
import { useTranslation } from '@/i18n/context'
import { useComptaSaisieVoice } from '../hooks/useComptaSaisieVoice'
import { useComptaSaisieScanners } from '../hooks/useComptaSaisieScanners'
import { ComptaSaisieExpressHeaderBar } from './ComptaSaisieExpressHeaderBar'
import { ComptaSaisieExpressVoiceBanner } from './ComptaSaisieExpressVoiceBanner'
import { ComptaSaisieExpressScanners } from './ComptaSaisieExpressScanners'
import { ComptaSaisieExpressVenteForm } from './ComptaSaisieExpressVenteForm'
import { ComptaSaisieExpressDepenseForm } from './ComptaSaisieExpressDepenseForm'
import { ComptaSaisieExpressQuickSheet } from './ComptaSaisieExpressQuickSheet'
import { showToast } from '@/context/ToastContext'

interface ComptaSaisieExpressViewProps {
  boutiqueId: string
}

export function ComptaSaisieExpressView({ boutiqueId }: ComptaSaisieExpressViewProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'vente' | 'depense'>('vente')
  const [produits, setProduits] = useState<Produit[]>([])
  const [showQuickSheet, setShowQuickSheet] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)

  // Modes d'ajout Vente Express
  const [modeSaisie, setModeSaisie] = useState<'catalogue' | 'libre'>('catalogue')

  // Panier Mixte Vente Express
  const [panierProduits, setPanierProduits] = useState<Record<string, number>>({})
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

  // Synchronisation avec barre de navigation basse et événements globaux
  useEffect(() => {
    const handleSwitchMode = (e: any) => {
      if (e.detail === 'vente' || e.detail === 'depense') setMode(e.detail)
    }
    const handleQuickAction = () => setShowQuickSheet(true)
    window.addEventListener('nopalou:express:mode', handleSwitchMode)
    window.addEventListener('nopalou:express:quick_action', handleQuickAction)
    return () => {
      window.removeEventListener('nopalou:express:mode', handleSwitchMode)
      window.removeEventListener('nopalou:express:quick_action', handleQuickAction)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nopalou:express:active_mode', { detail: mode }))
      window.dispatchEvent(new CustomEvent('nopalou:express:mounted', { detail: true }))
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nopalou:express:mounted', { detail: false }))
      }
    }
  }, [mode])

  // ── Actions Panier Catalogue ──
  const handleAjouterProduitCatalogue = (p: any, delta = 1) => {
    setPanierProduits(prev => {
      const next = (prev[p.id] || 0) + delta
      const copy = { ...prev }
      if (next <= 0) delete copy[p.id]
      else copy[p.id] = next
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
      { id: 'custom_' + Date.now(), nom: libelle, prix, quantite: qte }
    ])
    setLibelleCustomInput('')
    setPrixCustomInput('')
    setQteCustomInput(1)
  }

  const handleUpdateItemCustom = (idx: number, delta: number) => {
    setItemsCustomPanier(prev => {
      const copy = [...prev]
      const nextQte = copy[idx].quantite + delta
      if (nextQte <= 0) return copy.filter((_, i) => i !== idx)
      copy[idx] = { ...copy[idx], quantite: nextQte }
      return copy
    })
  }

  const handleViderPanier = () => {
    if (Object.keys(panierProduits).length === 0 && itemsCustomPanier.length === 0) return
    if (confirm(t('shop.confirmEmptyCart') || 'Voulez-vous vider tous les articles de cette vente ?')) {
      setPanierProduits({})
      setItemsCustomPanier([])
    }
  }

  // ── Hooks Déportés : Scanners & Assistant Vocal ──
  const { isListeningVoice, voiceFeedback, demarrerEcouteVocale } = useComptaSaisieVoice({
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
    return sum + (Number(p?.prix || 0) * qte)
  }, 0)

  const totalPanierCustom = itemsCustomPanier.reduce((sum, item) => sum + (item.prix * item.quantite), 0)
  const totalVente = totalPanierCatalogue + totalPanierCustom
  const nbArticlesTotal = Object.values(panierProduits).reduce((a, b) => a + b, 0) + itemsCustomPanier.reduce((a, b) => a + b.quantite, 0)

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
    <div
      id="express-view-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      }}
    >
      {/* ── Barre d'En-tête Identitaire Nopalou avec Sélecteur Intégré ── */}
      <ComptaSaisieExpressHeaderBar
        mode={mode}
        onSelectMode={(m) => setMode(m)}
        onOpenQuickSheet={() => setShowQuickSheet(true)}
        onDemarrerScannerEan={demarrerScannerEan}
        onDemarrerScannerNom={demarrerScannerNom}
        onDemarrerEcouteVocale={() => {
          setShowVoiceModal(true)
          demarrerEcouteVocale()
        }}
        isListeningVoice={isListeningVoice}
        nbArticlesPanier={nbArticlesTotal}
        totalVente={totalVente}
        onViderPanier={handleViderPanier}
        t={t}
      />

      {/* Assistant Vocal & Guide Interactif (Modale s'ouvrant au clic) */}
      <ComptaSaisieExpressVoiceBanner
        isOpen={showVoiceModal || isListeningVoice}
        onClose={() => setShowVoiceModal(false)}
        isListeningVoice={isListeningVoice}
        demarrerEcouteVocale={demarrerEcouteVocale}
        voiceFeedback={voiceFeedback}
      />

      {msgSuccess && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: 'var(--price, #0A5C36)', padding: '14px 18px', borderRadius: 14, fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(10, 92, 54, 0.12)' }}>
          {msgSuccess}
        </div>
      )}

      {mode === 'vente' ? (
        <ComptaSaisieExpressVenteForm
          boutiqueId={boutiqueId}
          produits={produits}
          panierProduits={panierProduits}
          setPanierProduits={setPanierProduits}
          itemsCustomPanier={itemsCustomPanier}
          setItemsCustomPanier={setItemsCustomPanier}
          modeSaisie={modeSaisie}
          setModeSaisie={setModeSaisie}
          libelleCustomInput={libelleCustomInput}
          setLibelleCustomInput={setLibelleCustomInput}
          prixCustomInput={prixCustomInput}
          setPrixCustomInput={setPrixCustomInput}
          qteCustomInput={qteCustomInput}
          setQteCustomInput={setQteCustomInput}
          ocrDetections={ocrDetections}
          demarrerScannerEan={demarrerScannerEan}
          demarrerScannerNom={demarrerScannerNom}
          handleAjouterProduitCatalogue={handleAjouterProduitCatalogue}
          handleAjouterItemLibre={handleAjouterItemLibre}
          handleUpdateItemCustom={handleUpdateItemCustom}
          handleRemoveItemCustom={(idx) => setItemsCustomPanier(prev => prev.filter((_, i) => i !== idx))}
          handleViderPanier={handleViderPanier}
          nbArticlesTotal={nbArticlesTotal}
          totalVente={totalVente}
          methodePaiement={methodePaiement}
          setMethodePaiement={setMethodePaiement}
          clientNom={clientNom}
          setClientNom={setClientNom}
          loading={loading}
          setLoading={setLoading}
          t={t}
        />
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

      {/* Action Sheet Contextuelle Saisie Express (Bouton PLUS) */}
      <ComptaSaisieExpressQuickSheet
        isOpen={showQuickSheet}
        onClose={() => setShowQuickSheet(false)}
        onSelectMode={(newMode, newModeSaisie) => {
          setMode(newMode)
          if (newModeSaisie) setModeSaisie(newModeSaisie)
        }}
        onDemarrerScannerEan={demarrerScannerEan}
        onDemarrerScannerNom={demarrerScannerNom}
        onDemarrerEcouteVocale={demarrerEcouteVocale}
      />

    </div>
  )
}
