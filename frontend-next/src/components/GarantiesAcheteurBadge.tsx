'use client'

import React from 'react'
import { useTranslation } from '@/i18n/context'

export default function GarantiesAcheteurBadge() {
  const { t } = useTranslation()

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      padding: '12px 14px',
      marginTop: 16,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10,
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 18 }}>🛡️</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>{t('common.buyerGuarantee')}</span>
        <span style={{ fontSize: 10, color: '#64748b' }}>{t('common.satisfactionGuaranteed')}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>{t('common.securePayment')}</span>
        <span style={{ fontSize: 10, color: '#64748b' }}>{t('common.securePaymentMethods')}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 18 }}>🚚</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>{t('common.fastDelivery')}</span>
        <span style={{ fontSize: 10, color: '#64748b' }}>{t('common.deliveryRegions')}</span>
      </div>
    </div>
  )
}
