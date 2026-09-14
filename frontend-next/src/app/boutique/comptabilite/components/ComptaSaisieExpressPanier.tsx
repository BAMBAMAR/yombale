'use client'

import React from 'react'
import { Produit } from '../types'
import { fcfa, inputStyle, labelStyle } from '../utils'
import { useTranslation } from '@/i18n/context'

interface ComptaSaisieExpressPanierProps {
  produits: Produit[]
  panierProduits: Record<string, number>
  itemsCustomPanier: Array<{ id: string; nom: string; prix: number; quantite: number }>
  nbArticlesTotal: number
  totalVente: number
  methodePaiement: string
  setMethodePaiement: (v: string) => void
  clientNom: string
  setClientNom: (v: string) => void
  onAjouterProduitCatalogue: (p: any, delta?: number) => void
  onRemoveItemCustom: (idx: number) => void
  onViderPanier: () => void
  loading: boolean
}

export function ComptaSaisieExpressPanier({
  produits,
  panierProduits,
  itemsCustomPanier,
  nbArticlesTotal,
  totalVente,
  methodePaiement,
  setMethodePaiement,
  clientNom,
  setClientNom,
  onAjouterProduitCatalogue,
  onRemoveItemCustom,
  onViderPanier,
  loading,
}: ComptaSaisieExpressPanierProps) {
  const { t } = useTranslation()

  return (
    <>
      {/* ── Résumé du Panier Mixte de la Vente Directe ── */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0369a1' }}>
            {t('shop.articlesInSale')} ({nbArticlesTotal} {t('shop.catalog').toLowerCase()} • {t('shop.totalCollectedLabel')} : {fcfa(totalVente)}) :
          </span>
          {nbArticlesTotal > 0 && (
            <button
              type="button"
              onClick={onViderPanier}
              style={{ fontSize: 11, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 800 }}
            >
              {t('shop.emptyCartBtn')}
            </button>
          )}
        </div>

        {nbArticlesTotal === 0 ? (
          <div style={{ padding: '16px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>
            {t('shop.addFirstCustomerPrompt')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
            {/* Articles Catalogue */}
            {Object.entries(panierProduits).filter(([_, qte]) => qte > 0).map(([pId, qte]) => {
              const prodObj = produits.find((p: any) => p.id === pId)
              if (!prodObj) return null
              const unitPrice = Number(prodObj.prix || 0)
              const subtotal = unitPrice * qte

              return (
                <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px solid #e0f2fe', fontSize: 12.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9.5, background: '#f0fdf4', color: '#16a34a', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>{t('shop.catalog')}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{prodObj.nom}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#0284c7', fontWeight: 800 }}>
                      {qte} × {fcfa(unitPrice)} = {fcfa(subtotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAjouterProduitCatalogue(prodObj, -qte)}
                      style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title={t('shop.deleteItemTitle')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Articles Libres */}
            {itemsCustomPanier.map((item, idx) => {
              const subtotal = item.prix * item.quantite
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px dashed #0284c7', fontSize: 12.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9.5, background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>{t('shop.freeItemBadge')}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.nom}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#0284c7', fontWeight: 800 }}>
                      {item.quantite} × {fcfa(item.prix)} = {fcfa(subtotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItemCustom(idx)}
                      style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title={t('shop.deleteItemTitle')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Mode de Paiement & Client */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end' }}>
        <div>
          <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6, display: 'block' }}>
            {t('shop.paymentModePrompt')}
          </label>
          <select
            value={methodePaiement}
            onChange={e => setMethodePaiement(e.target.value)}
            style={{ ...inputStyle, borderRadius: 12, padding: '10px 12px', height: 44 }}
          >
            <option value="especes">Espèces</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="carte">Carte bancaire</option>
            <option value="cheque">Chèque</option>
          </select>
        </div>

        <div>
          <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${t('shop.customerFullNameLabel')} (${t('common.optional')})`}>
            {t('shop.customerFullNameLabel')} <span style={{ fontWeight: 500, color: '#64748B' }}>({t('common.optional')})</span>
          </label>
          <input
            type="text"
            placeholder="Client comptoir"
            value={clientNom}
            onChange={e => setClientNom(e.target.value)}
            style={{ ...inputStyle, borderRadius: 12, padding: '10px 12px', height: 44 }}
          />
        </div>
      </div>

      {/* Total Calculé en Direct */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{t('shop.totalCollectedLabel')} ({nbArticlesTotal} {t('shop.catalog').toLowerCase()})</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{fcfa(totalVente)}</span>
      </div>

      <button
        type="submit"
        disabled={loading || nbArticlesTotal === 0}
        style={{
          background: nbArticlesTotal === 0 ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 14,
          padding: '14px 20px',
          fontWeight: 900,
          fontSize: 15,
          cursor: nbArticlesTotal === 0 ? 'not-allowed' : 'pointer',
          boxShadow: nbArticlesTotal === 0 ? 'none' : '0 6px 18px rgba(16, 185, 129, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? t('common.loading') : `${t('shop.validateCashInBtn')} (${fcfa(totalVente)})`}
      </button>
    </>
  )
}
