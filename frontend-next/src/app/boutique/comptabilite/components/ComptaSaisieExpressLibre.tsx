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
    <div style={{ background: 'var(--bg, #F8F5F0)', padding: 16, borderRadius: 14, border: '1.5px solid var(--border, #E8DDD2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <PenTool size={15} color="var(--accent, #C75B00)" /> {t('shop.customServicePrompt')} :
        </label>
        <button
          type="button"
          onClick={onDemarrerScannerNom}
          style={{
            background: '#FFF3E8',
            color: 'var(--accent, #C75B00)',
            border: '1px solid #FED7AA',
            borderRadius: 8,
            padding: '5px 12px',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s ease'
          }}
        >
          {t('shop.scanNameOcrBtn')}
        </button>
      </div>

      <div>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
          {t('shop.articleDesignationLabel')} *
        </label>
        <input
          id="express-libre-nom"
          type="text"
          placeholder={t('shop.articleDesignationPlaceholder')}
          value={libelleCustomInput}
          onChange={e => setLibelleCustomInput(e.target.value)}
          style={{ ...inputStyle, borderRadius: 10, padding: '10px 12px', border: '1.5px solid var(--border, #E8DDD2)', background: '#ffffff', color: 'var(--navy, #1C2B4A)' }}
        />
      </div>

      {ocrDetections.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>{t('shop.ocrDetectionsLabel')}</span>
          {ocrDetections.map((txt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setLibelleCustomInput(txt)}
              style={{ background: '#FFF3E8', color: 'var(--accent, #C75B00)', border: '1px solid #FED7AA', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              {txt}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
            {t('shop.unitPriceLabel')} *
          </label>
          <input
            type="number"
            min="1"
            placeholder={t('shop.unitPricePlaceholder')}
            value={prixCustomInput}
            onChange={e => setPrixCustomInput(e.target.value)}
            style={{ ...inputStyle, borderRadius: 10, padding: '10px 12px', fontWeight: 800, border: '1.5px solid var(--border, #E8DDD2)', background: '#ffffff', color: 'var(--navy, #1C2B4A)' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
            {t('shop.quantityLabel')} *
          </label>
          <input
            type="number"
            min="1"
            value={qteCustomInput}
            onChange={e => setQteCustomInput(Number(e.target.value))}
            style={{ ...inputStyle, borderRadius: 10, padding: '10px 12px', fontWeight: 800, border: '1.5px solid var(--border, #E8DDD2)', background: '#ffffff', color: 'var(--navy, #1C2B4A)' }}
          />
        </div>
        <button
          type="button"
          onClick={onAjouterItemLibre}
          style={{
            background: 'var(--price, #0A5C36)',
            color: '#ffffff',
            border: 'none',
            padding: '11px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(10, 92, 54, 0.2)',
            transition: 'all 0.15s ease'
          }}
        >
          {t('common.add')}
        </button>
      </div>
    </div>
  )
}
