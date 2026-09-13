'use client'

import React from 'react'
import { inputStyle, labelStyle } from '../utils'
import { useTranslation } from '@/i18n/context'

interface ComptaSaisieExpressDepenseFormProps {
  montantDepense: string
  setMontantDepense: (v: string) => void
  catDepense: string
  setCatDepense: (v: string) => void
  descDepense: string
  setDescDepense: (v: string) => void
  ocrDetections: string[]
  onDemarrerScannerNom: () => void
  onValiderDepenseRapide: (e: React.FormEvent) => void
  loading: boolean
}

export function ComptaSaisieExpressDepenseForm({
  montantDepense,
  setMontantDepense,
  catDepense,
  setCatDepense,
  descDepense,
  setDescDepense,
  ocrDetections,
  onDemarrerScannerNom,
  onValiderDepenseRapide,
  loading,
}: ComptaSaisieExpressDepenseFormProps) {
  const { t } = useTranslation()

  return (
    <form onSubmit={onValiderDepenseRapide} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          {t('shop.quickExpenseTitle')}
        </h3>
        <span style={{ fontSize: 11, fontWeight: 800, background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 12, border: '1px solid #fecaca' }}>
          {t('shop.expressExpenseTitle')}
        </span>
      </div>

      <div>
        <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569' }}>{t('shop.expenseAmountLabel')}</label>
        <input
          type="number"
          required
          min="1"
          placeholder="Ex: 5000"
          value={montantDepense}
          onChange={e => setMontantDepense(e.target.value)}
          style={{ ...inputStyle, borderRadius: 12, padding: 14, fontSize: 18, fontWeight: 900, color: '#dc2626' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end' }}>
        <div>
          <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6, display: 'block' }}>
            {t('shop.productCategory')}
          </label>
          <select
            value={catDepense}
            onChange={e => setCatDepense(e.target.value)}
            style={{ ...inputStyle, borderRadius: 12, padding: '10px 12px', height: 44 }}
          >
            <option value="stock">{t('shop.catStock')}</option>
            <option value="loyer">{t('shop.catRent')}</option>
            <option value="salaire">{t('shop.catSalaries')}</option>
            <option value="transport">{t('shop.catTransport')}</option>
            <option value="marketing">{t('shop.catMarketing')}</option>
            <option value="fournitures">{t('shop.catOfficeSupplies')}</option>
            <option value="taxes">{t('shop.catTaxes')}</option>
            <option value="autre">{t('shop.catOther')}</option>
          </select>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, minHeight: 20 }}>
            <label style={{ ...labelStyle, fontSize: 12, fontWeight: 800, color: '#475569', margin: 0 }}>
              {t('shop.expenseReasonLabel')}
            </label>
            <button
              type="button"
              onClick={onDemarrerScannerNom}
              style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {t('shop.scanReceiptOcrBtn')}
            </button>
          </div>
          <input
            type="text"
            placeholder="Facture, sacs, transport..."
            value={descDepense}
            onChange={e => setDescDepense(e.target.value)}
            style={{ ...inputStyle, borderRadius: 12, padding: '10px 12px', height: 44 }}
          />
          {ocrDetections.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {ocrDetections.map((txt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDescDepense(txt)}
                  style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  {txt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 14,
          padding: '14px 20px',
          fontWeight: 900,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(239, 68, 68, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? t('common.loading') : `${t('shop.validateExpenseBtn')}`}
      </button>
    </form>
  )
}
