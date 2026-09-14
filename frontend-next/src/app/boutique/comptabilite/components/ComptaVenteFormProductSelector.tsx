'use client'

import React from 'react'
import { Produit } from '../types'
import { fcfa, inputStyle } from '../utils'
import { useTranslation } from '@/i18n/context'

interface ComptaVenteFormProductSelectorProps {
  modeSelection: 'catalogue' | 'libre'
  produits: Produit[]
  produitId: string
  onSelectProduit: (id: string) => void
  recherche: string
  setRecherche: (v: string) => void
  catFiltre: string
  setCatFiltre: (v: string) => void
  nomLibre: string
  setNomLibre: (v: string) => void
  ocrDetections: string[]
  onDemarrerScannerNom: () => void
}

export function ComptaVenteFormProductSelector({
  modeSelection,
  produits,
  produitId,
  onSelectProduit,
  recherche,
  setRecherche,
  catFiltre,
  setCatFiltre,
  nomLibre,
  setNomLibre,
  ocrDetections,
  onDemarrerScannerNom,
}: ComptaVenteFormProductSelectorProps) {
  const { t } = useTranslation()

  const categories = Array.from(new Set(produits.map((p: any) => p.categorie).filter(Boolean))) as string[]
  const qClean = recherche.trim().toLowerCase()
  const prodsFiltres = produits.filter((p: any) => {
    const matchCat = catFiltre === 'tous' || p.categorie === catFiltre
    const matchText = !qClean ||
      p.nom?.toLowerCase().includes(qClean) ||
      p.categorie?.toLowerCase().includes(qClean) ||
      p.barcode?.toLowerCase().includes(qClean) ||
      p.sku?.toLowerCase().includes(qClean)
    return matchCat && matchText
  })

  const stock = produits.find(p => p.id === produitId)?.stock_quantite

  if (modeSelection === 'catalogue') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder={t('shop.searchProductPrompt')}
          style={{ ...inputStyle, padding: 8, fontSize: 12.5 }}
        />

        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
            <button
              type="button"
              onClick={() => setCatFiltre('tous')}
              style={{
                padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: catFiltre === 'tous' ? '#0284c7' : '#e2e8f0',
                color: catFiltre === 'tous' ? '#ffffff' : '#475569'
              }}
            >
              {t('common.all')}
            </button>
            {categories.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCatFiltre(c)}
                style={{
                  padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: catFiltre === c ? '#0284c7' : '#e2e8f0',
                  color: catFiltre === c ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, background: '#ffffff', padding: 6, borderRadius: 8, border: '1px solid #cbd5e1' }}>
          {prodsFiltres.length === 0 ? (
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 12 }}>{t('common.noData')}</div>
          ) : (
            prodsFiltres.map((p: any) => {
              const isSelected = produitId === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProduit(p.id)}
                  style={{
                    padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                    background: isSelected ? '#e0f2fe' : 'transparent',
                    border: isSelected ? '1px solid #0284c7' : '1px solid transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5
                  }}
                >
                  <span style={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? '#0369a1' : '#0f172a' }}>
                    {p.nom} {p.stock_quantite !== null ? `(${t('shop.productStock')}: ${p.stock_quantite})` : ''}
                  </span>
                  <span style={{ fontWeight: 800, color: '#0284c7' }}>{fcfa(p.prix)}</span>
                </div>
              )
            })
          )}
        </div>
        {stock !== null && stock !== undefined && stock <= 3 && (
          <p style={{ fontSize: 11, color: '#b45309', margin: 0 }}>{t('shop.lowStockAlert')} : {stock} {t('shop.remainingLabel')}</p>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          value={nomLibre}
          onChange={e => setNomLibre(e.target.value)}
          style={{ ...inputStyle, flex: 1, padding: 9 }}
          placeholder="Ex: Réparation téléphone, Robe Wax, Prestation…"
        />
        <button
          type="button"
          onClick={onDemarrerScannerNom}
          style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {t('shop.scanNameOcrBtn')}
        </button>
      </div>
      {ocrDetections.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {ocrDetections.map((txt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setNomLibre(txt)}
              style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              {txt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
