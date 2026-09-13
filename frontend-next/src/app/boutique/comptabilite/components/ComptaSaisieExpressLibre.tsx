'use client'

import React from 'react'
import { PenTool } from 'lucide-react'
import { inputStyle } from '../utils'
import { useTranslation } from '@/i18n/context'

interface ComptaSaisieExpressLibreProps {
  libelleCustomInput: string
  setLibelleCustomInput: (v: string) => void
  prixCustomInput: string
  setPrixCustomInput: (v: string) => void
  qteCustomInput: number
  setQteCustomInput: (v: number) => void
  ocrDetections: string[]
  onDemarrerScannerNom: () => void
  onAjouterItemLibre: () => void
}

export function ComptaSaisieExpressLibre({
  libelleCustomInput,
  setLibelleCustomInput,
  prixCustomInput,
  setPrixCustomInput,
  qteCustomInput,
  setQteCustomInput,
  ocrDetections,
  onDemarrerScannerNom,
  onAjouterItemLibre,
}: ComptaSaisieExpressLibreProps) {
  const { t } = useTranslation()

  return (
    <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <PenTool size={14} /> {t('shop.customServicePrompt')} :
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
            gap: 4
          }}
        >
          {t('shop.scanNameOcrBtn')}
        </button>
      </div>

      <div>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
          {t('shop.articleDesignationLabel')} *
        </label>
        <input
          type="text"
          placeholder={t('shop.articleDesignationPlaceholder')}
          value={libelleCustomInput}
          onChange={e => setLibelleCustomInput(e.target.value)}
          style={{ ...inputStyle, borderRadius: 8, padding: 10 }}
        />
      </div>

      {ocrDetections.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>{t('shop.ocrDetectionsLabel')}</span>
          {ocrDetections.map((txt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setLibelleCustomInput(txt)}
              style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              {txt}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
            {t('shop.unitPriceLabel')} *
          </label>
          <input
            type="number"
            min="1"
            placeholder={t('shop.unitPricePlaceholder')}
            value={prixCustomInput}
            onChange={e => setPrixCustomInput(e.target.value)}
            style={{ ...inputStyle, borderRadius: 8, padding: 10, fontWeight: 700 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
            {t('shop.quantityLabel')} *
          </label>
          <input
            type="number"
            min="1"
            value={qteCustomInput}
            onChange={e => setQteCustomInput(Number(e.target.value))}
            style={{ ...inputStyle, borderRadius: 8, padding: 10, fontWeight: 700 }}
          />
        </div>
        <button
          type="button"
          onClick={onAjouterItemLibre}
          style={{
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {t('common.add')}
        </button>
      </div>
    </div>
  )
}
