'use client'

import React from 'react'
import { AlertCircle, ArrowDownLeft, Users, TrendingDown, TrendingUp } from 'lucide-react'
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
  if (isMobile) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #253960 50%, #C75B00 100%)',
          borderRadius: 20,
          padding: '18px 18px',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(28, 43, 74, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* En-tête centré : TOTAL DETTES */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.82)',
              textTransform: 'uppercase',
            }}
          >
            TOTAL DETTES
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#FFFFFF',
              marginTop: 4,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fcfa(totalDettesAEncaisser)}
          </div>
        </div>

        {/* 2 Puces Translucides de Bilan Côte à Côte */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {/* Pilule 1 : À Recevoir */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 14,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.04em' }}>
                À RECEVOIR
              </span>
              <TrendingUp size={14} color="#86EFAC" />
            </div>
            <span style={{ fontSize: 15.5, fontWeight: 900, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
              {fcfa(totalDettesAEncaisser)}
            </span>
          </div>

          {/* Pilule 2 : Avances / Débiteurs */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 14,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.04em' }}>
                {totalAvancesClients > 0 ? 'AVANCES' : 'DÉBITEURS'}
              </span>
              <TrendingDown size={14} color="#FDBA74" />
            </div>
            <span style={{ fontSize: 15.5, fontWeight: 900, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
              {totalAvancesClients > 0
                ? fcfa(totalAvancesClients)
                : `${nbClientsDebiteurs} actif${nbClientsDebiteurs > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Version Desktop (3 colonnes statutaires épurées)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        width: '100%',
      }}
    >
      {/* KPI 1 : Total Dettes */}
      <div
        className="npl-card-subtle"
        style={{
          borderLeft: '3px solid #dc2626',
          padding: '14px 16px',
          background: '#ffffff',
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: 12,
          border: '1.5px solid var(--border, #E8DDD2)',
          borderLeftWidth: 3,
        }}
      >
        <div
          className="npl-badge npl-badge-danger"
          style={{
            marginBottom: 6,
            fontSize: 11,
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
            fontSize: 20,
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
          borderLeft: '3px solid var(--price, #0A5C36)',
          padding: '14px 16px',
          background: '#ffffff',
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: 12,
          border: '1.5px solid var(--border, #E8DDD2)',
          borderLeftWidth: 3,
        }}
      >
        <div
          className="npl-badge npl-badge-success"
          style={{
            marginBottom: 6,
            fontSize: 11,
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
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--price, #0A5C36)',
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

      {/* KPI 3 : Clients Registre */}
      <div
        className="npl-card-subtle"
        style={{
          borderLeft: '3px solid var(--navy, #1C2B4A)',
          padding: '14px 16px',
          background: '#ffffff',
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: 12,
          border: '1.5px solid var(--border, #E8DDD2)',
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
    </div>
  )
}
