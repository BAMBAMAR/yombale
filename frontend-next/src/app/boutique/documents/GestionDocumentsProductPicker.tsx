'use client'

import React from 'react'
import { fcfa } from '@/lib/format'
import type { LigneDocument } from './types'

interface GestionDocumentsProductPickerProps {
  modeAjout: 'catalogue' | 'libre' | 'scan'
  setModeAjout: (mode: 'catalogue' | 'libre' | 'scan') => void
  produits: any[]
  rechercheProduitModal: string
  setRechercheProduitModal: (val: string) => void
  categorieProduitModal: string
  setCategorieProduitModal: (val: string) => void
  categoriesCatalogue: string[]
  produitsFiltresModal: any[]
  lignesSelectionnees: LigneDocument[]
  libelleLibreInput: string
  setLibelleLibreInput: (val: string) => void
  prixLibreInput: string
  setPrixLibreInput: (val: string) => void
  qteLibreInput: number
  setQteLibreInput: (val: number) => void
  ocrDetections: string[]
  onAjouterProduitCatalogue: (prod: any, delta?: number) => void
  onDiminuerProduitCatalogue: (prodId: string) => void
  onAjouterLigneLibre: () => void
  onDemarrerScannerEan: () => void
  onDemarrerScannerNom: () => void
  t: (key: string) => string
}

export default function GestionDocumentsProductPicker({
  modeAjout,
  setModeAjout,
  produits,
  rechercheProduitModal,
  setRechercheProduitModal,
  categorieProduitModal,
  setCategorieProduitModal,
  categoriesCatalogue,
  produitsFiltresModal,
  lignesSelectionnees,
  libelleLibreInput,
  setLibelleLibreInput,
  prixLibreInput,
  setPrixLibreInput,
  qteLibreInput,
  setQteLibreInput,
  ocrDetections,
  onAjouterProduitCatalogue,
  onDiminuerProduitCatalogue,
  onAjouterLigneLibre,
  onDemarrerScannerEan,
  onDemarrerScannerNom,
  t,
}: GestionDocumentsProductPickerProps) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#ffffff' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setModeAjout('catalogue')}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: 'none',
              background: modeAjout === 'catalogue' ? '#ffffff' : 'transparent',
              fontWeight: modeAjout === 'catalogue' ? 800 : 600,
              color: modeAjout === 'catalogue' ? '#0f172a' : '#64748b',
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: modeAjout === 'catalogue' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t('shop.catalogCountTab')} ({produits.length})
          </button>
          <button
            type="button"
            onClick={() => setModeAjout('libre')}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: 'none',
              background: modeAjout === 'libre' ? '#ffffff' : 'transparent',
              fontWeight: modeAjout === 'libre' ? 800 : 600,
              color: modeAjout === 'libre' ? '#0f172a' : '#64748b',
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: modeAjout === 'libre' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t('shop.manualServiceTab')}
          </button>
        </div>

        <button
          type="button"
          onClick={onDemarrerScannerEan}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '7px 12px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(2,132,199,0.25)',
          }}
        >
          {t('shop.scanEanBarcodeBtn')}
        </button>
      </div>

      {/* 1. Onglet Catalogue & Recherche */}
      {modeAjout === 'catalogue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={rechercheProduitModal}
              onChange={(e) => setRechercheProduitModal(e.target.value)}
              placeholder={t('shop.catalogSearchPlaceholder')}
              style={{
                width: '100%',
                padding: '9px 36px 9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {rechercheProduitModal && (
              <button
                type="button"
                onClick={() => setRechercheProduitModal('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {categoriesCatalogue.length > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setCategorieProduitModal('tous')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: categorieProduitModal === 'tous' ? '#0284c7' : '#f1f5f9',
                  color: categorieProduitModal === 'tous' ? '#ffffff' : '#475569',
                }}
              >
                {t('common.all')} ({produits.length})
              </button>
              {categoriesCatalogue.map((cat) => {
                const count = produits.filter((p: any) => p.categorie === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategorieProduitModal(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 11.5,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      background: categorieProduitModal === cat ? '#0284c7' : '#f1f5f9',
                      color: categorieProduitModal === cat ? '#ffffff' : '#475569',
                    }}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8,
              maxHeight: 220,
              overflowY: 'auto',
              padding: 2,
            }}
          >
            {produitsFiltresModal.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  fontSize: 12.5,
                  color: '#94a3b8',
                  textAlign: 'center',
                  padding: '24px 10px',
                }}
              >
                {produits.length === 0
                  ? t('shop.noProductsInDocCatalog')
                  : t('shop.noProductsMatchSearch')}
              </div>
            ) : (
              produitsFiltresModal.map((p: any) => {
                const ligneExistante = lignesSelectionnees.find((l) => l.produitId === p.id)
                const qte = ligneExistante ? ligneExistante.quantite : 0
                const prixAff = Number(p.prix_promo || p.prix || 0)
                const stock = p.stock_quantite ?? p.quantite_stock

                return (
                  <div
                    key={p.id}
                    style={{
                      background: qte > 0 ? '#f0f9ff' : '#f8fafc',
                      border: qte > 0 ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '8px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    <div onClick={() => onAjouterProduitCatalogue(p, 1)} style={{ cursor: 'pointer' }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={p.nom}
                      >
                        {p.nom}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 3,
                        }}
                      >
                        <span style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 900 }}>
                          {fcfa(prixAff)}
                        </span>
                        {stock !== undefined && stock !== null && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: stock > 0 ? '#10b981' : '#ef4444',
                            }}
                          >
                            {stock > 0 ? `${stock} ${t('shop.inStockLabel')}` : t('shop.outOfStockBadge')}
                          </span>
                        )}
                      </div>
                    </div>

                    {qte > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          marginTop: 6,
                          paddingTop: 4,
                          borderTop: '1px dashed #bae6fd',
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDiminuerProduitCatalogue(p.id)
                          }}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: 'none',
                            background: '#fee2e2',
                            color: '#ef4444',
                            fontWeight: 900,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Diminuer"
                        >
                          -
                        </button>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: '#0369a1',
                            minWidth: 16,
                            textAlign: 'center',
                          }}
                        >
                          {qte}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onAjouterProduitCatalogue(p, 1)
                          }}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: 'none',
                            background: '#e0f2fe',
                            color: '#0284c7',
                            fontWeight: 900,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Augmenter"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAjouterProduitCatalogue(p, 1)}
                        style={{
                          marginTop: 6,
                          padding: '3px 6px',
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          color: '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        {t('shop.addDocLineBtn')}
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 2. Onglet Saisie Libre / Prestation */}
      {modeAjout === 'libre' && (
        <div
          style={{
            background: '#f8fafc',
            padding: 12,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', margin: 0 }}>
              {t('shop.customArticlePrompt')}
            </label>
            <button
              type="button"
              onClick={onDemarrerScannerNom}
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {t('shop.scanNameOcrBtnAlt')}
            </button>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              {t('shop.designationLabel')}
            </label>
            <input
              type="text"
              placeholder={t('shop.designationPlaceholder')}
              value={libelleLibreInput}
              onChange={(e) => setLibelleLibreInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                fontWeight: 600,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {ocrDetections.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>
                {t('shop.ocrDetectionsLabel')}
              </span>
              {ocrDetections.map((txt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLibelleLibreInput(txt)}
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {txt}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8' }}>{t('shop.suggestionsPrefix')}</span>
            {[
              t('shop.serviceSuggestion'),
              t('shop.laborSuggestion'),
              t('shop.deliverySuggestion'),
              t('shop.customItemSuggestion'),
            ].map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLibelleLibreInput(sug)}
                style={{
                  background: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                {t('shop.unitPriceDocLabel')}
              </label>
              <input
                type="number"
                min="0"
                placeholder="Ex: 15000"
                value={prixLibreInput}
                onChange={(e) => setPrixLibreInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                {t('shop.quantityDocLabel')}
              </label>
              <input
                type="number"
                min="1"
                value={qteLibreInput}
                onChange={(e) => setQteLibreInput(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="button"
              onClick={onAjouterLigneLibre}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '9px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t('shop.addDocLineBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
