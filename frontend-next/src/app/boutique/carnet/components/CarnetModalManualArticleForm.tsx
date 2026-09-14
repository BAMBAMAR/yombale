'use client'

import React from 'react'
import { fcfa } from '@/lib/format'

interface CarnetModalManualArticleFormProps {
  libelleCustomInput: string
  setLibelleCustomInput: (v: string) => void
  prixCustomInput: string
  setPrixCustomInput: (v: string) => void
  qteCustomInput: number
  setQteCustomInput: (v: number) => void
  ocrDetectionsCredit: string[]
  demarrerScannerNomCredit: () => void
  onAjouterArticleCustom: () => void
  itemsCustomPanier: Array<{ id: string; nom: string; prix: number; quantite: number }>
  setItemsCustomPanier: React.Dispatch<React.SetStateAction<Array<{ id: string; nom: string; prix: number; quantite: number }>>>
  t: (key: string) => string
}

export default function CarnetModalManualArticleForm({
  libelleCustomInput,
  setLibelleCustomInput,
  prixCustomInput,
  setPrixCustomInput,
  qteCustomInput,
  setQteCustomInput,
  ocrDetectionsCredit,
  demarrerScannerNomCredit,
  onAjouterArticleCustom,
  itemsCustomPanier,
  setItemsCustomPanier,
  t,
}: CarnetModalManualArticleFormProps) {
  return (
    <div
      style={{
        background: '#f8fafc',
        padding: 12,
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', margin: 0 }}>
          {t('shop.addCustomArticlePrompt')}
        </label>
        <button
          type="button"
          onClick={demarrerScannerNomCredit}
          style={{
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {t('shop.scanNameOcrBtn')}
        </button>
      </div>

      <div>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
          {t('shop.articleDesignationLabel')}
        </label>
        <input
          type="text"
          placeholder={t('shop.articleDesignationPlaceholder')}
          value={libelleCustomInput}
          onChange={(e) => setLibelleCustomInput(e.target.value)}
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

      {ocrDetectionsCredit.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>
            {t('shop.ocrDetectionsLabel')}
          </span>
          {ocrDetectionsCredit.map((txt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setLibelleCustomInput(txt)}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
            {t('shop.unitPriceLabel')}
          </label>
          <input
            type="number"
            min="0"
            placeholder={t('shop.unitPricePlaceholder')}
            value={prixCustomInput}
            onChange={(e) => setPrixCustomInput(e.target.value)}
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
            {t('shop.quantityLabel')}
          </label>
          <input
            type="number"
            min="1"
            value={qteCustomInput}
            onChange={(e) => setQteCustomInput(Number(e.target.value))}
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
      </div>

      <button
        type="button"
        onClick={onAjouterArticleCustom}
        style={{
          padding: '9px 14px',
          borderRadius: 8,
          border: 'none',
          background: '#0284c7',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: 12.5,
          cursor: 'pointer',
          alignSelf: 'flex-end',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {t('shop.addArticleToCartBtn')}
      </button>

      {/* Liste des articles custom ajoutés */}
      {itemsCustomPanier.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {itemsCustomPanier.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px dashed #0284c7',
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.nom}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#0284c7', fontWeight: 800 }}>
                  {item.quantite} × {fcfa(item.prix)} = {fcfa(item.prix * item.quantite)}
                </span>
                <button
                  type="button"
                  onClick={() => setItemsCustomPanier((prev) => prev.filter((_, i) => i !== idx))}
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    color: '#ef4444',
                    borderRadius: 4,
                    width: 18,
                    height: 18,
                    cursor: 'pointer',
                    fontWeight: 900,
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('shop.deleteItemTitle')}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
