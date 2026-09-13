'use client'

import React from 'react'
import { fcfa } from '@/lib/format'

interface CarnetKpiCardsProps {
  isMobile: boolean
  totalDettesAEncaisser: number
  totalAvancesClients: number
  nbClientsDebiteurs: number
  totalClients: number
  t: (key: string) => string
}

export default function CarnetKpiCards({
  isMobile,
  totalDettesAEncaisser,
  totalAvancesClients,
  nbClientsDebiteurs,
  totalClients,
  t,
}: CarnetKpiCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(130px, 1fr))' : 'repeat(3, 1fr)',
        gap: isMobile ? 8 : 12,
        width: '100%',
      }}
    >
      {/* KPI 1 : Total Dettes */}
      <div
        className="npl-card-subtle"
        style={{
          borderLeft: '3px solid #dc2626',
          padding: isMobile ? '10px 12px' : '14px 16px',
          background: '#ffffff',
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          borderLeftWidth: 3,
        }}
      >
        <div
          className="npl-badge npl-badge-danger"
          style={{
            marginBottom: 6,
            fontSize: isMobile ? 10 : 11,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span className="npl-badge-dot" />
          <span>{t('shop.totalOwed').toUpperCase()}</span>
        </div>
        <div
          style={{
            fontSize: isMobile ? 16 : 20,
            fontWeight: 800,
            color: '#dc2626',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {fcfa(totalDettesAEncaisser)}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text2, #6B7280)',
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {nbClientsDebiteurs} {t('shop.debtorsCount')}
        </div>
      </div>

      {/* KPI 2 : Total Avances */}
      <div
        className="npl-card-subtle"
        style={{
          borderLeft: '3px solid #16a34a',
          padding: isMobile ? '10px 12px' : '14px 16px',
          background: '#ffffff',
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          borderLeftWidth: 3,
        }}
      >
        <div
          className="npl-badge npl-badge-success"
          style={{
            marginBottom: 6,
            fontSize: isMobile ? 10 : 11,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span className="npl-badge-dot" />
          <span>{t('shop.advancesCount').toUpperCase()}</span>
        </div>
        <div
          style={{
            fontSize: isMobile ? 16 : 20,
            fontWeight: 800,
            color: '#16a34a',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {fcfa(totalAvancesClients)}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text2, #6B7280)',
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t('shop.advancesCount')}
        </div>
      </div>

      {/* KPI 3 : Clients Registre (desktop) */}
      {!isMobile && (
        <div
          className="npl-card-subtle"
          style={{
            borderLeft: '3px solid var(--navy, #1C2B4A)',
            padding: '14px 16px',
            background: '#ffffff',
            minWidth: 0,
            overflow: 'hidden',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            borderLeftWidth: 3,
          }}
        >
          <div className="npl-badge npl-badge-neutral" style={{ marginBottom: 6, fontSize: 11 }}>
            <span className="npl-badge-dot" />
            <span>{t('shop.debts').toUpperCase()}</span>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalClients} {t('shop.clientLabel')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2, #6B7280)', marginTop: 4 }}>
            {t('shop.debtBookTitle')}
          </div>
        </div>
      )}
    </div>
  )
}
