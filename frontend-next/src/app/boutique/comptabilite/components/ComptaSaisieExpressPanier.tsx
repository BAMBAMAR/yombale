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
  onUpdateItemCustom?: (idx: number, delta: number) => void
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
  onUpdateItemCustom,
  onViderPanier,
  loading,
}: ComptaSaisieExpressPanierProps) {
  const { t } = useTranslation()

  return (
    <>
      {/* ── Résumé du Panier Mixte de la Vente Directe ── */}
      <div style={{ background: 'var(--bg, #F8F5F0)', border: '1.5px solid var(--border, #E8DDD2)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {t('shop.articlesInSale')} ({nbArticlesTotal} {t('shop.catalog').toLowerCase()} • {t('shop.totalCollectedLabel')} : {fcfa(totalVente)}) :
          </span>
          {nbArticlesTotal > 0 && (
            <button
              type="button"
              onClick={onViderPanier}
              style={{ fontSize: 11, color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 800 }}
            >
              {t('shop.emptyCartBtn')}
            </button>
          )}
        </div>

        {nbArticlesTotal === 0 ? (
          <div style={{ padding: '16px 10px', textAlign: 'center', color: 'var(--text3, #8C7E74)', fontSize: 12.5 }}>
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
                <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 12.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 9.5, background: '#E6F4EC', color: 'var(--price, #0A5C36)', fontWeight: 800, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{t('shop.catalog')}</span>
                    <span style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prodObj.nom}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ color: 'var(--price, #0A5C36)', fontWeight: 800 }}>
                      {fcfa(subtotal)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <button
                        type="button"
                        onClick={() => onAjouterProduitCatalogue(prodObj, -1)}
                        style={{ background: '#fee2e2', border: 'none', color: 'var(--red, #B91C1C)', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Diminuer (-)"
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 800, fontSize: 12, minWidth: 16, textAlign: 'center', color: 'var(--navy, #1C2B4A)' }}>{qte}</span>
                      <button
                        type="button"
                        onClick={() => onAjouterProduitCatalogue(prodObj, 1)}
                        style={{ background: '#E6F4EC', border: 'none', color: 'var(--price, #0A5C36)', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Augmenter (+)"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onAjouterProduitCatalogue(prodObj, -qte)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text3, #8C7E74)', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={t('shop.deleteItemTitle')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Articles Libres */}
            {itemsCustomPanier.map((item, idx) => {
              const subtotal = item.prix * item.quantite
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1.5px dashed var(--accent, #C75B00)', fontSize: 12.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 9.5, background: '#FFF3E8', color: 'var(--accent, #C75B00)', fontWeight: 800, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{t('shop.freeItemBadge')}</span>
                    <span style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nom}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ color: 'var(--price, #0A5C36)', fontWeight: 800 }}>
                      {fcfa(subtotal)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {onUpdateItemCustom && (
                        <>
                          <button
                            type="button"
                            onClick={() => onUpdateItemCustom(idx, -1)}
                            style={{ background: '#fee2e2', border: 'none', color: 'var(--red, #B91C1C)', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Diminuer (-)"
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 800, fontSize: 12, minWidth: 16, textAlign: 'center', color: 'var(--navy, #1C2B4A)' }}>{item.quantite}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateItemCustom(idx, 1)}
                            style={{ background: '#FFF3E8', border: 'none', color: 'var(--accent, #C75B00)', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Augmenter (+)"
                          >
                            +
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveItemCustom(idx)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text3, #8C7E74)', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={t('shop.deleteItemTitle')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {nbArticlesTotal > 0 && (
        <>
          {/* Mode de Paiement & Client */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, alignItems: 'end' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 11.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 4, display: 'block' }}>
                {t('shop.paymentModePrompt')}
              </label>
              <select
                value={methodePaiement}
                onChange={e => setMethodePaiement(e.target.value)}
                style={{ ...inputStyle, borderRadius: 10, padding: '7px 10px', height: 38, border: '1.5px solid var(--border, #E8DDD2)', background: '#ffffff', color: 'var(--navy, #1C2B4A)', fontSize: 13 }}
              >
                <option value="especes">Espèces</option>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="carte">Carte bancaire</option>
                <option value="cheque">Chèque</option>
              </select>
            </div>

            <div>
              <label style={{ ...labelStyle, fontSize: 11.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 4, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${t('shop.customerFullNameLabel')} (${t('common.optional')})`}>
                {t('shop.customerFullNameLabel')} <span style={{ fontWeight: 500, color: 'var(--text3, #8C7E74)' }}>({t('common.optional')})</span>
              </label>
              <input
                type="text"
                placeholder="Client comptoir"
                value={clientNom}
                onChange={e => setClientNom(e.target.value)}
                style={{ ...inputStyle, borderRadius: 10, padding: '7px 10px', height: 38, border: '1.5px solid var(--border, #E8DDD2)', background: '#ffffff', color: 'var(--navy, #1C2B4A)', fontSize: 13 }}
              />
            </div>
          </div>

          {/* Total Calculé en Direct */}
          <div style={{ background: '#ffffff', border: '1.5px solid var(--border, #E8DDD2)', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text2, #5A4E42)', textTransform: 'uppercase' }}>{t('shop.totalCollectedLabel')} ({nbArticlesTotal})</span>
            <span style={{ fontSize: 19, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>{fcfa(totalVente)}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, var(--price, #0A5C36) 0%, #15803D 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 16px',
              fontWeight: 900,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(10, 92, 54, 0.22)',
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
      )}
    </>
  )
}
