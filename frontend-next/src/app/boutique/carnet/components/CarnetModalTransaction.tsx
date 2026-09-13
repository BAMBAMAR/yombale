'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import type { ClientCredit, ProduitBoutique } from '../types'
import CarnetModalCataloguePicker from './CarnetModalCataloguePicker'
import CarnetModalManualArticleForm from './CarnetModalManualArticleForm'
import CarnetModalDueDateSection from './CarnetModalDueDateSection'

interface CarnetModalTransactionProps {
  isOpen: boolean
  onClose: () => void
  clientSelectionne: ClientCredit | null
  clients: ClientCredit[]
  onSelectClient: (c: ClientCredit) => void
  typeTransaction: 'vente_credit' | 'remboursement'
  produits: ProduitBoutique[]
  isMobile: boolean
  onValiderTransaction: (params: {
    client: ClientCredit
    type: 'vente_credit' | 'remboursement'
    montant: number
    modePaiement: string
    note: string
    produits: any[]
    dateEcheance: string | null
    relanceAutoWa: boolean
  }) => Promise<void>
  demarrerScannerEanCredit: () => void
  demarrerScannerNomCredit: () => void
  ocrDetectionsCredit: string[]
}

export default function CarnetModalTransaction({
  isOpen,
  onClose,
  clientSelectionne,
  clients,
  onSelectClient,
  typeTransaction,
  produits,
  isMobile,
  onValiderTransaction,
  demarrerScannerEanCredit,
  demarrerScannerNomCredit,
  ocrDetectionsCredit,
}: CarnetModalTransactionProps) {
  const { t } = useTranslation() as { t: any }
  const [modeSaisie, setModeSaisie] = useState<'catalogue' | 'manuel'>('catalogue')
  const [panierProduits, setPanierProduits] = useState<Record<string, number>>({})
  const [itemsCustomPanier, setItemsCustomPanier] = useState<Array<{ id: string; nom: string; prix: number; quantite: number }>>([])
  const [libelleCustomInput, setLibelleCustomInput] = useState('')
  const [prixCustomInput, setPrixCustomInput] = useState('')
  const [qteCustomInput, setQteCustomInput] = useState(1)
  const [montantManuel, setMontantManuel] = useState('')
  const [descriptionManuelle, setDescriptionManuelle] = useState('')
  const [modePaiement, setModePaiement] = useState('especes')
  const [dateEcheance, setDateEcheance] = useState('')
  const [relanceAutoWa, setRelanceAutoWa] = useState(true)
  const [submittingTrans, setSubmittingTrans] = useState(false)

  if (!isOpen || !clientSelectionne) return null

  const totalPanierCatalogue = Object.entries(panierProduits).reduce((sum, [pId, qte]) => {
    const p = produits.find((item: any) => item.id === pId)
    return sum + (p ? Number(p.prix_promo || p.prix || 0) : 0) * qte
  }, 0)
  const totalPanierCustom = itemsCustomPanier.reduce((sum, item) => sum + item.prix * item.quantite, 0)
  const totalTransactionCourante = typeTransaction === 'vente_credit'
    ? totalPanierCatalogue + totalPanierCustom + (Number(montantManuel) || 0)
    : Number(montantManuel) || 0

  const handleAjouterArticleCustom = () => {
    if (!libelleCustomInput.trim()) return alert('Veuillez saisir le nom / la désignation de l\'article.')
    if (!prixCustomInput || Number(prixCustomInput) <= 0) return alert('Veuillez saisir un prix unitaire valide.')
    setItemsCustomPanier((prev) => [...prev, {
      id: 'custom_' + Date.now(),
      nom: libelleCustomInput.trim(),
      prix: Number(prixCustomInput),
      quantite: Number(qteCustomInput || 1),
    }])
    setLibelleCustomInput('')
    setPrixCustomInput('')
    setQteCustomInput(1)
  }

  const handleValider = async () => {
    const montantFinal = totalTransactionCourante
    if (!montantFinal || montantFinal <= 0) {
      alert('Veuillez ajouter au moins un produit ou saisir un montant valide.')
      return
    }

    let produitsListe: any[] = []
    if (typeTransaction === 'vente_credit') {
      const itemsCatalogue = Object.entries(panierProduits)
        .filter(([_, qte]) => qte > 0)
        .map(([pId, qte]) => {
          const p = produits.find((item: any) => item.id === pId)
          return {
            id: pId,
            nom: p?.nom || 'Article catalogue',
            quantite: qte,
            prix: Number(p?.prix_promo || p?.prix || 0),
          }
        })
      const itemsCustom = itemsCustomPanier.map((item) => ({
        id: item.id,
        nom: item.nom,
        quantite: item.quantite,
        prix: item.prix,
      }))
      if (Number(montantManuel) > 0) {
        itemsCustom.push({
          id: 'manuel_' + Date.now(),
          nom: descriptionManuelle.trim() || 'Achat à crédit',
          quantite: 1,
          prix: Number(montantManuel),
        })
      }
      produitsListe = [...itemsCatalogue, ...itemsCustom]
    } else {
      produitsListe = [
        { nom: descriptionManuelle.trim() || 'Remboursement', quantite: 1, prix: montantFinal },
      ]
    }

    const noteFinal =
      typeTransaction === 'vente_credit'
        ? `Vente à crédit (${produitsListe.length} article(s))`
        : descriptionManuelle.trim() || 'Remboursement client'

    setSubmittingTrans(true)
    try {
      await onValiderTransaction({
        client: clientSelectionne,
        type: typeTransaction,
        montant: montantFinal,
        modePaiement,
        note: noteFinal,
        produits: produitsListe,
        dateEcheance: dateEcheance || null,
        relanceAutoWa,
      })
      setPanierProduits({})
      setItemsCustomPanier([])
      setMontantManuel('')
      setDescriptionManuelle('')
      setDateEcheance('')
      onClose()
    } finally {
      setSubmittingTrans(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 640,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: isMobile ? 16 : 22,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: isMobile ? 15.5 : 18, fontWeight: 900, color: '#0f172a' }}>
              {typeTransaction === 'vente_credit'
                ? t('shop.newCreditSaleModalTitle')
                : t('shop.collectRepaymentModalTitle')}
            </h3>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 700 }}>Client :</span>
              <select
                value={clientSelectionne.id}
                onChange={(e) => {
                  const c = clients.find((cl) => cl.id === e.target.value)
                  if (c) onSelectClient(c)
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 12.5,
                  fontWeight: 800,
                  background: '#fff',
                  color: '#0f172a',
                  maxWidth: 280,
                }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({c.telephone}) —{' '}
                    {Number(c.solde) > 0
                      ? `Doit ${fcfa(c.solde)}`
                      : Number(c.solde) < 0
                      ? `Avance ${fcfa(Math.abs(c.solde))}`
                      : 'À jour (0 F)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: '#0f172a',
              borderRadius: '50%',
              width: 34,
              height: 34,
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>

        {typeTransaction === 'vente_credit' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 12, flex: 1 }}>
              <button
                type="button"
                onClick={() => setModeSaisie('catalogue')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: modeSaisie === 'catalogue' ? '#ffffff' : 'transparent',
                  fontWeight: modeSaisie === 'catalogue' ? 800 : 600,
                  color: modeSaisie === 'catalogue' ? '#0f172a' : '#64748b',
                  fontSize: 12.5,
                  cursor: 'pointer',
                  boxShadow: modeSaisie === 'catalogue' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                {t('shop.catalogModeTab')}
              </button>
              <button
                type="button"
                onClick={() => setModeSaisie('manuel')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: modeSaisie === 'manuel' ? '#ffffff' : 'transparent',
                  fontWeight: modeSaisie === 'manuel' ? 800 : 600,
                  color: modeSaisie === 'manuel' ? '#0f172a' : '#64748b',
                  fontSize: 12.5,
                  cursor: 'pointer',
                  boxShadow: modeSaisie === 'manuel' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                {t('shop.manualModeTab')}
              </button>
            </div>

            <button
              type="button"
              onClick={demarrerScannerEanCredit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t('shop.scanEanBtn')}
            </button>
          </div>
        )}

        {/* Mode Catalogue */}
        {typeTransaction === 'vente_credit' && modeSaisie === 'catalogue' && (
          <CarnetModalCataloguePicker
            produits={produits}
            panierProduits={panierProduits}
            setPanierProduits={setPanierProduits}
            itemsCustomPanier={itemsCustomPanier}
            setItemsCustomPanier={setItemsCustomPanier}
            isMobile={isMobile}
            t={t}
          />
        )}

        {/* Mode Saisie Libre (Vente à crédit) */}
        {typeTransaction === 'vente_credit' && modeSaisie === 'manuel' && (
          <CarnetModalManualArticleForm
            libelleCustomInput={libelleCustomInput}
            setLibelleCustomInput={setLibelleCustomInput}
            prixCustomInput={prixCustomInput}
            setPrixCustomInput={setPrixCustomInput}
            qteCustomInput={qteCustomInput}
            setQteCustomInput={setQteCustomInput}
            ocrDetectionsCredit={ocrDetectionsCredit}
            demarrerScannerNomCredit={demarrerScannerNomCredit}
            onAjouterArticleCustom={handleAjouterArticleCustom}
            itemsCustomPanier={itemsCustomPanier}
            setItemsCustomPanier={setItemsCustomPanier}
            t={t}
          />
        )}

        {/* Mode Remboursement */}
        {typeTransaction === 'remboursement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                {t('shop.repaymentAmountLabel')}
              </label>
              <input
                type="number"
                required
                placeholder={t('shop.repaymentAmountPlaceholder')}
                value={montantManuel}
                onChange={(e) => setMontantManuel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 16,
                  fontWeight: 800,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                {t('shop.paymentNoteLabel')}
              </label>
              <input
                type="text"
                placeholder={t('shop.paymentNotePlaceholder')}
                value={descriptionManuelle}
                onChange={(e) => setDescriptionManuelle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 16,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {/* Échéance & Relance WA */}
        {typeTransaction === 'vente_credit' && (
          <CarnetModalDueDateSection
            isMobile={isMobile}
            dateEcheance={dateEcheance}
            setDateEcheance={setDateEcheance}
            modePaiement={modePaiement}
            setModePaiement={setModePaiement}
            relanceAutoWa={relanceAutoWa}
            setRelanceAutoWa={setRelanceAutoWa}
            t={t}
          />
        )}

        {/* Total et Bouton de Validation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
          <div>
            <span style={{ fontSize: 11, color: '#64748b' }}>{t('shop.totalTransactionLabel')}</span>
            <div style={{ fontSize: 19, fontWeight: 900, color: typeTransaction === 'vente_credit' ? '#dc2626' : '#16a34a' }}>
              {fcfa(totalTransactionCourante)}
            </div>
          </div>

          <button
            disabled={submittingTrans}
            onClick={handleValider}
            style={{
              background: typeTransaction === 'vente_credit' ? '#dc2626' : '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              fontWeight: 900,
              fontSize: 13.5,
              cursor: submittingTrans ? 'not-allowed' : 'pointer',
              opacity: submittingTrans ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            {submittingTrans
              ? t('shop.savingProgress')
              : typeTransaction === 'vente_credit'
              ? t('shop.validateCreditSaleBtn')
              : t('shop.validateRepaymentBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
