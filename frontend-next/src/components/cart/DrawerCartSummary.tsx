'use client'
import React from 'react'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'

interface DrawerCartSummaryProps {
  sousTotal: number
  reductionMontant: number
  fraisLivraison: number
  totalGlobal: number
  promoCode?: string
}

export default function DrawerCartSummary({
  sousTotal,
  reductionMontant,
  fraisLivraison,
  totalGlobal,
  promoCode,
}: DrawerCartSummaryProps) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          color: 'var(--text2, #6B5E52)',
        }}
      >
        <span>{t('common.subtotal')}</span>
        <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{fcfa(sousTotal)}</strong>
      </div>
      {reductionMontant > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#16a34a',
            fontWeight: 700,
          }}
        >
          <span>Code Promo ({promoCode})</span>
          <span>-{fcfa(reductionMontant)}</span>
        </div>
      )}
      {fraisLivraison > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            color: 'var(--text2, #6B5E52)',
          }}
        >
          <span>{t('shop.deliveryLabel')}</span>
          <span>{fcfa(fraisLivraison)}</span>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 16.5,
          fontWeight: 900,
          color: 'var(--accent, #C75B00)',
          borderTop: '1px solid var(--border, #E8DDD2)',
          paddingTop: 8,
          marginTop: 2,
        }}
      >
        <span>{t('common.total')}</span>
        <span>{fcfa(totalGlobal)}</span>
      </div>
    </div>
  )
}
