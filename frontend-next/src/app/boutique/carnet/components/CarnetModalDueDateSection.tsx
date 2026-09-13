'use client'

import React from 'react'

interface CarnetModalDueDateSectionProps {
  isMobile: boolean
  dateEcheance: string
  setDateEcheance: (val: string) => void
  modePaiement: string
  setModePaiement: (val: string) => void
  relanceAutoWa: boolean
  setRelanceAutoWa: (val: boolean) => void
  t: (key: string) => string
}

export default function CarnetModalDueDateSection({
  isMobile,
  dateEcheance,
  setDateEcheance,
  modePaiement,
  setModePaiement,
  relanceAutoWa,
  setRelanceAutoWa,
  t,
}: CarnetModalDueDateSectionProps) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
            {t('shop.dueDatePrompt')}
          </label>
          <input
            type="date"
            value={dateEcheance}
            onChange={(e) => setDateEcheance(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
            {t('shop.paymentModePrompt')}
          </label>
          <select
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' }}
          >
            <option value="especes">{t('shop.cashCreditOption')}</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          id="relanceWaCheck"
          checked={relanceAutoWa}
          onChange={(e) => setRelanceAutoWa(e.target.checked)}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
        <label htmlFor="relanceWaCheck" style={{ fontSize: 11.5, color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}>
          {t('shop.autoWaReminderCheckbox')}
        </label>
      </div>
    </div>
  )
}
